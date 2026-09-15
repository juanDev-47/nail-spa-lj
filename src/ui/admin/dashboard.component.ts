import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AdminApiService, AdminService, AdminWorker, SessionService } from '../../infraestructure/admin-api.service';

type Tab = 'servicios' | 'trabajadoras';
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

@Component({ selector: 'app-admin-dashboard', imports: [ReactiveFormsModule, CurrencyPipe, RouterLink], templateUrl: './dashboard.component.html' })
export class DashboardComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly dias = DIAS;
  tab: Tab = 'servicios';
  servicios: AdminService[] = [];
  trabajadoras: AdminWorker[] = [];
  editingService?: AdminService;
  selectedWorker?: AdminWorker;
  message = '';
  errorMessage = '';
  loading = true;
  readonly serviceForm = this.formBuilder.nonNullable.group({ nombre: ['', Validators.required], descripcion: [''], duracionMinutos: [60, [Validators.required, Validators.min(1)]], precio: [0, [Validators.required, Validators.min(0)]], activo: [true] });
  readonly workerForm = this.formBuilder.nonNullable.group({ nombre: ['', Validators.required], correo: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]], telefono: [''] });
  readonly workerEditForm = this.formBuilder.nonNullable.group({ nombre: ['', Validators.required], correo: ['', [Validators.required, Validators.email]], telefono: [''], password: [''] });
  readonly scheduleForm = this.formBuilder.nonNullable.group({ horarios: this.formBuilder.nonNullable.array(DIAS.map((_day, day) => this.formBuilder.nonNullable.group({ activo: [day >= 1 && day <= 5], horaInicio: ['09:00'], horaFin: ['18:00'] }))) });

  ngOnInit(): void { this.refresh(); }
  refresh(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.servicios().pipe(timeout(10_000)).subscribe({ next: (servicios) => {
      this.servicios = servicios;
      this.changeDetector.markForCheck();
      this.api.trabajadores().pipe(
        timeout(10_000),
        finalize(() => { this.loading = false; this.changeDetector.markForCheck(); }),
      ).subscribe({ next: (trabajadoras) => { this.trabajadoras = trabajadoras; this.changeDetector.markForCheck(); }, error: (error) => this.failure(error) });
    }, error: (error) => this.failure(error) });
  }
  editService(service: AdminService): void { this.editingService = service; this.serviceForm.setValue({ nombre: service.nombre, descripcion: service.descripcion ?? '', duracionMinutos: service.duracion_minutos, precio: service.precio, activo: service.activo }); }
  cancelServiceEdit(): void { this.editingService = undefined; this.serviceForm.reset({ nombre: '', descripcion: '', duracionMinutos: 60, precio: 0, activo: true }); }
  saveService(): void {
    if (this.serviceForm.invalid) { this.serviceForm.markAllAsTouched(); return; }
    const { activo, ...body } = this.serviceForm.getRawValue();
    const request = this.editingService ? this.api.actualizarServicio(this.editingService.id, { ...body, activo }) : this.api.crearServicio(body);
    const editingId = this.editingService?.id;
    request.subscribe({
      next: (servicio) => {
        this.servicios = editingId
          ? this.servicios.map((item) => item.id === editingId ? servicio : item)
          : [...this.servicios, servicio].sort((left, right) => left.nombre.localeCompare(right.nombre));
        this.success(editingId ? 'Servicio actualizado.' : 'Servicio creado.');
        this.cancelServiceEdit();
        this.changeDetector.markForCheck();
      },
      error: (error) => this.failure(error),
    });
  }
  createWorker(): void {
    if (this.workerForm.invalid) { this.workerForm.markAllAsTouched(); return; }
    this.api.crearTrabajador(this.workerForm.getRawValue()).subscribe({ next: () => { this.workerForm.reset(); this.success('Trabajadora creada. Configura su horario.'); this.refresh(); }, error: (error) => this.failure(error) });
  }
  selectWorker(worker: AdminWorker): void {
    this.selectedWorker = worker;
    this.workerEditForm.setValue({ nombre: worker.nombre, correo: worker.correo, telefono: worker.telefono ?? '', password: '' });
    const byDay = new Map(worker.disponibilidad.map((schedule) => [schedule.dia_semana, schedule]));
    this.scheduleForm.controls.horarios.controls.forEach((control, day) => {
      const schedule = byDay.get(day);
      control.setValue({ activo: !!schedule, horaInicio: schedule ? schedule.hora_inicio.slice(11, 16) : '09:00', horaFin: schedule ? schedule.hora_fin.slice(11, 16) : '18:00' });
    });
  }
  saveWorker(): void {
    if (!this.selectedWorker || this.workerEditForm.invalid) { this.workerEditForm.markAllAsTouched(); return; }
    const { password, ...details } = this.workerEditForm.getRawValue();
    this.api.actualizarTrabajador(this.selectedWorker.id, { ...details, ...(password ? { password } : {}) }).subscribe({ next: () => { this.success('Datos de trabajadora actualizados.'); this.refresh(); }, error: (error) => this.failure(error) });
  }
  saveSchedule(): void {
    if (!this.selectedWorker) return;
    const horarios = this.scheduleForm.getRawValue().horarios.flatMap((schedule, diaSemana) => schedule.activo ? [{ diaSemana, horaInicio: schedule.horaInicio, horaFin: schedule.horaFin }] : []);
    this.api.guardarDisponibilidad(this.selectedWorker.id, horarios).subscribe({ next: () => { this.success('Horario guardado.'); this.refresh(); }, error: (error) => this.failure(error) });
  }
  logout(): void { this.session.clear(); this.router.navigateByUrl('/admin/login'); }
  private success(message: string): void { this.message = message; this.errorMessage = ''; this.changeDetector.markForCheck(); }
  private failure(error?: { error?: { message?: string } }): void { this.errorMessage = error?.error?.message ?? 'No fue posible cargar o guardar la informacion.'; this.loading = false; this.changeDetector.markForCheck(); }
}
