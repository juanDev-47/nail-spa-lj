import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  it('opens the public privacy route and provides the contact and return link', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/politica-de-privacidad', PrivacyComponent);

    const element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Política de privacidad');
    expect(element.textContent).toContain('Linda Karina Orellana Estrada');
    expect(element.querySelector('a[href="https://wa.me/573013470075"]')).toBeTruthy();
    expect(element.querySelector('a[href="/reservar"]')).toBeTruthy();
  });
});
