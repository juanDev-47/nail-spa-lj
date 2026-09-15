import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminCustomer } from '../../infraestructure/admin-api.service';

@Component({ selector: 'app-admin-customers', imports: [ReactiveFormsModule, RouterLink], templateUrl: './customers.component.html' })
export class CustomersComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);
  clientes: AdminCustomer[] = [];
  selected?: AdminCustomer;
  loading = true;
  errorMessage = '';
  message = '';
  readonly form = this.formBuilder.nonNullable.group({ nombre: ['', Validators.required], correo: ['', [Validators.required, Validators.email]], telefono: [''], fechaNacimiento: [''] });

  ngOnInit(): void {
    this.api.clientes().subscribe({
      next: (clientes) => { this.clientes = clientes; this.loading = false; this.changeDetector.detectChanges(); },
      error: () => { this.errorMessage = 'No fue posible cargar los clientes.'; this.loading = false; this.changeDetector.detectChanges(); },
    });
  }

  select(cliente: AdminCustomer): void {
    this.selected = cliente;
    this.form.setValue({ nombre: cliente.nombre, correo: cliente.correo, telefono: cliente.telefono ?? '', fechaNacimiento: cliente.fechaNacimiento ?? '' });
    this.message = '';
    this.changeDetector.detectChanges();
  }

  save(): void {
    if (!this.selected || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.errorMessage = '';
    const values = this.form.getRawValue();
    this.api.actualizarCliente(this.selected.id, { ...values, fechaNacimiento: values.fechaNacimiento || null }).subscribe({
      next: (cliente) => {
        this.clientes = this.clientes.map((item) => item.id === cliente.id ? cliente : item);
        this.selected = cliente;
        this.message = 'Cliente actualizado.';
        this.changeDetector.detectChanges();
      },
      error: (error: { error?: { message?: string } }) => { this.errorMessage = error.error?.message ?? 'No fue posible actualizar el cliente.'; this.changeDetector.detectChanges(); },
    });
  }
}