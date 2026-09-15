import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface Servicio { id: number; nombre: string; descripcion: string | null; duracionMinutos: number; precio: number; }
export interface Trabajador { id: string; nombre: string; }
export interface Disponibilidad { fecha: string; horarios: string[]; }
export interface ReservaPayload {
  servicioId: number;
  trabajadorId: string;
  fechaHoraInicio: string;
  clienteNombreAnonimo: string;
  clienteTelefonoAnonimo: string;
  clienteCorreoAnonimo: string;
}

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/citas';

  catalogo() {
    return this.http.get<{ servicios: Servicio[]; trabajadores: Trabajador[] }>(`${this.apiUrl}/catalogo`, {
      params: new HttpParams().set('_', Date.now()),
    });
  }

  disponibilidad(servicioId: number, trabajadorId: string, fecha: string) {
    const params = new HttpParams().set('servicioId', servicioId).set('trabajadorId', trabajadorId).set('fecha', fecha).set('_', Date.now());
    return this.http.get<Disponibilidad>(`${this.apiUrl}/disponibilidad`, { params });
  }

  crearReserva(payload: ReservaPayload) { return this.http.post<{ id: string }>(this.apiUrl, payload); }
}