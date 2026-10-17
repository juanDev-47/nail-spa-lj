import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../../infraestructure/admin-api.service';

export const adminGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  return session.isAdmin() || inject(Router).createUrlTree(['/admin/login']);
};