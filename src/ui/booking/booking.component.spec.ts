import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SessionService } from '../../infraestructure/admin-api.service';
import { BookingApiService } from '../../infraestructure/booking-api.service';
import { BookingComponent } from './booking.component';

describe('BookingComponent', () => {
  const crearReserva = vi.fn();

  beforeEach(async () => {
    crearReserva.mockReset();
    await TestBed.configureTestingModule({
      imports: [BookingComponent],
      providers: [
        provideRouter([]),
        { provide: BookingApiService, useValue: { catalogo: () => of({ servicios: [{ id: 1, nombre: 'Manicure', descripcion: null, duracionMinutos: 30, precio: 10000 }], trabajadores: [] }), crearReserva } },
        { provide: SessionService, useValue: { isAdmin: () => false } },
      ],
    }).compileComponents();
  });

  it('shows the banner and social links before the service selection only', () => {
    const fixture = TestBed.createComponent(BookingComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const banner = element.querySelector<HTMLImageElement>('img[src="/assets/LOGO_SPA.jpeg"]');
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Redes sociales"] a'));

    expect(banner?.alt).toContain('Siempre Lindas LJ');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.instagram.com/siemprelindaslj/',
      'https://www.facebook.com/p/SiempreLindas-LJ-61594896627224/',
      'https://www.tiktok.com/@siemprelindaslj',
    ]);
    expect(links.every((link) => link.target === '_blank' && link.rel.includes('noopener'))).toBe(true);
    expect(banner!.compareDocumentPosition(element.querySelector('h1')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const continueButton = Array.from(element.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Continuar');
    expect(continueButton).toBeTruthy();
    continueButton!.click();
    fixture.detectChanges();
    expect(element.querySelector('nav[aria-label="Redes sociales"]')).toBeNull();
    expect(element.querySelector('img[src="/assets/LOGO_SPA.jpeg"]')).toBeNull();
  });

  it('requires consent and a Colombian mobile number before sending a reservation', () => {
    const fixture = TestBed.createComponent(BookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectedServicio = component.servicios[0];
    component.selectedTrabajador = { id: '1', nombre: 'Profesional' };
    component.selectedTime = '10:00';
    component.customerForm.setValue({ nombre: 'Ana', telefono: '123', consentimientoWhatsapp: false });
    component.submit();
    expect(crearReserva).not.toHaveBeenCalled();

    component.customerForm.setValue({ nombre: 'Ana', telefono: '+57 300 123 4567', consentimientoWhatsapp: true });
    crearReserva.mockReturnValue(of({ id: 'cita-1', confirmacionWhatsapp: 'no_confirmada' }));
    component.submit();
    expect(crearReserva).toHaveBeenCalledWith(expect.objectContaining({
      clienteNombreAnonimo: 'Ana',
      clienteTelefonoAnonimo: '+57 300 123 4567',
      consentimientoWhatsapp: true,
    }));
    expect(component.step).toBe(4);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('no pudimos confirmar el envio por WhatsApp');
  });

  it('links to the privacy policy without leaving the reservation form', () => {
    const fixture = TestBed.createComponent(BookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.continueWithService(component.servicios[0]);
    component.selectedTrabajador = { id: '1', nombre: 'Profesional' };
    component.selectedTime = '10:00';
    component.continueToDetails();
    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('a[href="/politica-de-privacidad"]'));

    expect(links).toHaveLength(2);
    expect(links.every((link) => link.target === '_blank' && link.rel.includes('noopener'))).toBe(true);
    expect(element.querySelector('form')?.contains(links[0])).toBe(true);
  });
});
