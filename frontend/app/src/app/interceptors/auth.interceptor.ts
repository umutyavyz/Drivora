import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        localStorage.removeItem('token');
        const aktifUrl = router.url || '';
        if (!aktifUrl.startsWith('/login') && !aktifUrl.startsWith('/register') && !aktifUrl.startsWith('/welcome')) {
          router.navigate(['/login'], { replaceUrl: true });
        }
      }
      return throwError(() => err);
    })
  );
};
