import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface AdminUser { id: string; nombre: string; correo: string; rol: 'ADMIN' | 'TRABAJADOR'; }
export interface AdminService { id: number; nombre: string; descripcion: string | null; duracion_minutos: number; precio: number; activo: boolean; }
export interface Schedule { dia_semana: number; hora_inicio: string; hora_fin: string; }
export interface AdminWorker { id: string; nombre: string; correo: string; telefono: string | null; disponibilidad: Schedule[]; }
export interface AdminAppointment { id: string; clienteNombre: string; clienteTelefono: string | null; servicio: string; trabajadora: string; inicio: string; fin: string; estado: string; }

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenKey = 'lj-nail-spa-token';
  private readonly userKey = 'lj-nail-spa-user';

  user(): AdminUser | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) as AdminUser : null;
  }

  token(): string | null { return localStorage.getItem(this.tokenKey); }
  isAdmin(): boolean { return this.user()?.rol === 'ADMIN'; }
  save(token: string, user: AdminUser): void { localStorage.setItem(this.tokenKey, token); localStorage.setItem(this.userKey, JSON.stringify(user)); }
  clear(): void { localStorage.removeItem(this.tokenKey); localStorage.removeItem(this.userKey); }
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly authUrl = 'http://localhost:3000/api/auth';
  private readonly adminUrl = 'http://localhost:3000/api/admin';

  login(correo: string, password: string) { return this.http.post<{ token: string; usuario: AdminUser }>(`${this.authUrl}/login`, { correo, password }); }
  servicios() { return this.http.get<AdminService[]>(`${this.adminUrl}/servicios`, this.options()); }
  crearServicio(body: { nombre: string; descripcion: string; duracionMinutos: number; precio: number }) { return this.http.post<AdminService>(`${this.adminUrl}/servicios`, body, this.options()); }
  actualizarServicio(id: number, body: { nombre: string; descripcion: string; duracionMinutos: number; precio: number; activo: boolean }) { return this.http.put<AdminService>(`${this.adminUrl}/servicios/${id}`, body, this.options()); }
  trabajadores() { return this.http.get<AdminWorker[]>(`${this.adminUrl}/trabajadores`, this.options()); }
  crearTrabajador(body: { nombre: string; correo: string; password: string; telefono: string }) { return this.http.post<AdminWorker>(`${this.adminUrl}/trabajadores`, body, this.options()); }
  actualizarTrabajador(id: string, body: { nombre: string; correo: string; telefono: string; password?: string }) { return this.http.put<AdminWorker>(`${this.adminUrl}/trabajadores/${id}`, body, this.options()); }
  guardarDisponibilidad(id: string, horarios: { diaSemana: number; horaInicio: string; horaFin: string }[]) { return this.http.put<void>(`${this.adminUrl}/trabajadores/${id}/disponibilidad`, { horarios }, this.options()); }
  citas() { return this.http.get<AdminAppointment[]>(`${this.adminUrl}/citas`, this.options()); }
  actualizarEstadoCita(id: string, estado: 'COMPLETADA' | 'CANCELADA') { return this.http.put<{ id: string; estado: string }>(`${this.adminUrl}/citas/${id}/estado`, { estado }, this.options()); }

  private options() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.session.token() ?? ''}` }) }; }
}