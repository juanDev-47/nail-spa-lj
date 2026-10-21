import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AdminApiService, AdminAppointment } from '../../infraestructure/admin-api.service';

interface RankingItem { label: string; detail?: string; count: number; revenue: number; }
interface RankingSection { title: string; subtitle: string; items: RankingItem[]; }
interface MonthRevenue { label: string; total: number; count: number; }

const BOGOTA_OFFSET_MS = -5 * 3_600_000;
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

@Component({ selector: 'app-admin-metrics', imports: [CurrencyPipe], templateUrl: './metrics.component.html' })
export class MetricsComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  loading = true;
  errorMessage = '';
  completedCount = 0;
  pendingCount = 0;
  cancelledRate = 0;
  totalRevenue = 0;
  averageMonthlyRevenue = 0;
  months: MonthRevenue[] = [];
  maxMonthRevenue = 0;
  sections: RankingSection[] = [];

  ngOnInit(): void {
    this.api.citas().subscribe({
      next: (citas) => { this.compute(citas); this.loading = false; this.changeDetector.markForCheck(); },
      error: (error: { error?: { message?: string } }) => { this.errorMessage = error.error?.message ?? 'No fue posible cargar las metricas.'; this.loading = false; this.changeDetector.markForCheck(); },
    });
  }

  percent(value: number, max: number): number { return max > 0 ? Math.round((value / max) * 100) : 0; }
  maxCount(items: RankingItem[]): number { return Math.max(0, ...items.map((item) => item.count)); }

  private compute(citas: AdminAppointment[]): void {
    const completed = citas.filter((cita) => cita.estado === 'COMPLETADA');
    const cancelled = citas.filter((cita) => cita.estado === 'CANCELADA');
    const active = citas.filter((cita) => cita.estado !== 'CANCELADA');
    this.completedCount = completed.length;
    this.pendingCount = citas.filter((cita) => cita.estado === 'PENDIENTE').length;
    this.cancelledRate = citas.length ? Math.round((cancelled.length / citas.length) * 100) : 0;
    this.totalRevenue = completed.reduce((sum, cita) => sum + cita.precio, 0);

    const byMonth = new Map<string, MonthRevenue>();
    for (const cita of completed) {
      const local = new Date(new Date(cita.inicio).getTime() + BOGOTA_OFFSET_MS);
      const key = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`;
      const entry = byMonth.get(key) ?? { label: `${MESES[local.getUTCMonth()]} ${local.getUTCFullYear()}`, total: 0, count: 0 };
      entry.total += cita.precio;
      entry.count += 1;
      byMonth.set(key, entry);
    }
    const ordered = [...byMonth.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value);
    this.averageMonthlyRevenue = ordered.length ? this.totalRevenue / ordered.length : 0;
    this.months = ordered.slice(-12);
    this.maxMonthRevenue = Math.max(0, ...this.months.map((month) => month.total));

    const weekdays = DIAS.map((label) => ({ label, count: 0, revenue: 0 }));
    for (const cita of active) {
      const local = new Date(new Date(cita.inicio).getTime() + BOGOTA_OFFSET_MS);
      weekdays[local.getUTCDay()].count += 1;
    }

    this.sections = [
      { title: 'Servicios mas agendados', subtitle: 'Reservas realizadas por servicio', items: this.rank(completed, (cita) => ({ key: cita.servicio, label: cita.servicio })) },
      { title: 'Frecuencia por persona', subtitle: 'Reservas realizadas por cliente', items: this.rank(completed, (cita) => ({ key: (cita.clienteTelefono ?? cita.clienteNombre).trim().toLowerCase(), label: cita.clienteNombre, detail: cita.clienteTelefono ?? undefined })) },
      { title: 'Rendimiento por profesional', subtitle: 'Reservas realizadas e ingresos por profesional', items: this.rank(completed, (cita) => ({ key: cita.trabajadora, label: cita.trabajadora })) },
      { title: 'Dias mas concurridos', subtitle: 'Reservas pendientes y realizadas por dia de la semana', items: weekdays.filter((day) => day.count > 0).sort((left, right) => right.count - left.count) },
    ];
  }

  private rank(citas: AdminAppointment[], identify: (cita: AdminAppointment) => { key: string; label: string; detail?: string }): RankingItem[] {
    const groups = new Map<string, RankingItem>();
    for (const cita of citas) {
      const { key, label, detail } = identify(cita);
      const entry = groups.get(key) ?? { label, detail, count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += cita.precio;
      groups.set(key, entry);
    }
    return [...groups.values()].sort((left, right) => right.count - left.count || right.revenue - left.revenue).slice(0, 10);
  }
}
