import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService, SessionService } from '../../infraestructure/admin-api.service';

@Component({ selector: 'app-admin-login', imports: [ReactiveFormsModule, RouterLink], templateUrl: './login.component.html' })
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  errorMessage = '';
  submitting = false;
  readonly form = this.formBuilder.nonNullable.group({ correo: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.errorMessage = '';
    const { correo, password } = this.form.getRawValue();
    this.api.login(correo, password).subscribe({
      next: ({ token, usuario }) => {
        if (usuario.rol !== 'ADMIN') { this.errorMessage = 'Esta cuenta no tiene permisos de administracion.'; this.submitting = false; return; }
        this.session.save(token, usuario);
        this.router.navigateByUrl('/admin/dashboard');
      },
      error: (error: { error?: { message?: string } }) => { this.errorMessage = error.error?.message ?? 'No fue posible iniciar sesion.'; this.submitting = false; },
    });
  }
}