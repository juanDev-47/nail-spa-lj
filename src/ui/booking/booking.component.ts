import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { SessionService } from '../../infraestructure/admin-api.service';
import { BookingApiService, Servicio, Trabajador } from '../../infraestructure/booking-api.service';

@Component({
  selector: 'app-booking',
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './booking.component.html',
})
export class BookingComponent implements OnInit {
  private readonly api = inject(BookingApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly session = inject(SessionService);
  private availabilityRequest = 0;
  step = 1;
  servicios: Servicio[] = [];
  trabajadores: Trabajador[] = [];
  selectedServicio?: Servicio;
  selectedTrabajador?: Trabajador;
  readonly minDate = new Date().toISOString().slice(0, 10);
  selectedDate = this.minDate;
  selectedTime?: string;
  horarios: string[] = [];
  loading = true;
  loadingSlots = false;
  submitting = false;
  errorMessage = '';
  reservationId = '';
  readonly customerForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, Validators.minLength(7)]],
    correo: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void { this.loadCatalog(); }

  @HostListener('window:focus')
  refreshCatalogOnReturn(): void { if (this.step === 1) this.loadCatalog(); }

  resetBooking(): void {
    this.step = 1;
    this.selectedServicio = undefined;
    this.selectedTrabajador = undefined;
    this.selectedTime = undefined;
    this.horarios = [];
    this.reservationId = '';
    this.customerForm.reset();
    this.loadCatalog();
  }

  chooseService(servicio: Servicio): void {
    this.selectedServicio = servicio;
    this.selectedTime = undefined;
    this.errorMessage = '';
    this.changeDetector.detectChanges();
  }

  chooseWorker(trabajador: Trabajador): void {
    this.selectedTrabajador = trabajador;
    this.selectedTime = undefined;
    this.loadAvailability();
    this.changeDetector.detectChanges();
  }

  changeDate(date: string): void {
    this.selectedDate = date;
    this.selectedTime = undefined;
    this.loadAvailability();
    this.changeDetector.detectChanges();
  }

  chooseTime(horario: string): void {
    this.selectedTime = horario;
    this.errorMessage = '';
    this.changeDetector.detectChanges();
  }

  continueToSchedule(): void { if (this.selectedServicio) this.step = 2; }
  continueToDetails(): void { if (this.selectedTrabajador && this.selectedTime) this.step = 3; }

  submit(): void {
    if (this.customerForm.invalid || !this.selectedServicio || !this.selectedTrabajador || !this.selectedTime) {
      this.customerForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    const customer = this.customerForm.getRawValue();
    this.api.crearReserva({
      servicioId: this.selectedServicio.id,
      trabajadorId: this.selectedTrabajador.id,
      fechaHoraInicio: `${this.selectedDate}T${this.selectedTime}:00.000Z`,
      clienteNombreAnonimo: customer.nombre,
      clienteTelefonoAnonimo: customer.telefono,
      clienteCorreoAnonimo: customer.correo,
    }).pipe(
      timeout(15_000),
      finalize(() => { this.submitting = false; this.changeDetector.detectChanges(); }),
    ).subscribe({
      next: ({ id }) => { this.reservationId = id; this.step = 4; this.changeDetector.detectChanges(); },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'No pudimos confirmar la reserva. Intenta con otro horario.';
        this.changeDetector.detectChanges();
      },
    });
  }

  private loadCatalog(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.catalogo().pipe(
      timeout(10_000),
      finalize(() => { this.loading = false; this.changeDetector.detectChanges(); }),
    ).subscribe({
      next: ({ servicios, trabajadores }) => {
        this.servicios = servicios;
        this.trabajadores = trabajadores;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los servicios. Confirma que el servidor este disponible.';
        this.changeDetector.detectChanges();
      },
    });
  }

  private loadAvailability(): void {
    if (!this.selectedServicio || !this.selectedTrabajador) return;
    const request = ++this.availabilityRequest;
    this.loadingSlots = true;
    this.horarios = [];
    this.errorMessage = '';
    this.api.disponibilidad(this.selectedServicio.id, this.selectedTrabajador.id, this.selectedDate).pipe(
      timeout(10_000),
      finalize(() => {
        if (request === this.availabilityRequest) {
          this.loadingSlots = false;
          this.changeDetector.detectChanges();
        }
      }),
    ).subscribe({
      next: ({ horarios }) => {
        if (request === this.availabilityRequest) {
          this.horarios = horarios;
          this.changeDetector.detectChanges();
        }
      },
      error: (error: { error?: { message?: string } }) => {
        if (request === this.availabilityRequest) {
          this.errorMessage = error.error?.message ?? 'No fue posible consultar los horarios disponibles.';
          this.changeDetector.detectChanges();
        }
      },
    });
  }
}
