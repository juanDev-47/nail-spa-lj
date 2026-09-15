import { Routes } from '@angular/router';
import { adminGuard } from './ui/admin/admin.guard';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'reservar' },
	{ path: 'reservar', loadComponent: () => import('./ui/booking/booking.component').then((module) => module.BookingComponent) },
	{ path: 'admin/login', loadComponent: () => import('./ui/admin/login.component').then((module) => module.LoginComponent) },
	{ path: 'admin/dashboard', canActivate: [adminGuard], loadComponent: () => import('./ui/admin/dashboard.component').then((module) => module.DashboardComponent) },
	{ path: 'admin/reservas', canActivate: [adminGuard], loadComponent: () => import('./ui/admin/appointments.component').then((module) => module.AppointmentsComponent) },
	{ path: '**', redirectTo: 'reservar' },
];
