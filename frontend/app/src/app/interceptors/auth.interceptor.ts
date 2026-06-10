import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Token varsa ve istekte zaten bir Authorization header'ı yoksa otomatik ekle.
  // Böylece bileşenlerin tek tek header kurmasına gerek kalmaz.
  const token = localStorage.getItem('token');
  const istek = (token && !req.headers.has('Authorization'))
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(istek).pipe(
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
