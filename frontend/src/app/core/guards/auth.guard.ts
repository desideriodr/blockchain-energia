import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const token = auth.getToken();

    if (token) {
        return true;
    }

    router.navigateByUrl('/login');
    return false;
};
