import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AdminApiService, AdminAppointment } from '../../infraestructure/admin-api.service';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

@Component({ selector: 'app-admin-appointments', imports: [DatePipe], templateUrl: './appointments.component.html' })
export class AppointmentsComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  citas: AdminAppointment[] = [];
  loading = true;
  errorMessage = '';
  updatingId = '';
  showAll = false;
  searchTerm = '';

  get visibleCitas(): AdminAppointment[] {
    const term = normalize(this.searchTerm.trim());
    return this.citas.filter((cita) => (this.showAll || cita.estado === 'PENDIENTE')
      && (!term || [cita.clienteNombre, cita.servicio, cita.trabajadora].some((value) => normalize(value).includes(term))));
  }
  get attendedCount(): number { return this.citas.filter((cita) => cita.estado !== 'PENDIENTE').length; }

  ngOnInit(): void {
    this.api.citas().subscribe({
      next: (citas) => { this.citas = citas; this.loading = false; this.changeDetector.markForCheck(); },
      error: (error: { error?: { message?: string } }) => { this.errorMessage = error.error?.message ?? 'No fue posible cargar las reservas.'; this.loading = false; this.changeDetector.markForCheck(); },
    });
  }

  actualizarEstado(cita: AdminAppointment, estado: 'COMPLETADA' | 'CANCELADA'): void {
    this.updatingId = cita.id;
    this.errorMessage = '';
    this.changeDetector.markForCheck();
    this.api.actualizarEstadoCita(cita.id, estado).subscribe({
      next: (respuesta) => {
        this.citas = this.citas.map((item) => item.id === respuesta.id ? { ...item, estado: respuesta.estado } : item);
        this.updatingId = '';
        this.changeDetector.markForCheck();
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'No fue posible actualizar el estado de la cita.';
        this.updatingId = '';
        this.changeDetector.markForCheck();
      },
    });
  }
}