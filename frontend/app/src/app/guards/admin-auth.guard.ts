import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

/**
 * Admin route koruması. Token'daki rol 'admin' değilse kullanıcıyı haritaya
 * (giriş yapmamışsa AuthGuard zaten login'e) yönlendirir. Backend endpoint'leri
 * de adminKontrol ile korunduğu için bu, istemci tarafı savunma katmanıdır.
 */
export const adminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    if (decoded?.rol === 'admin') {
      return true;
    }
  } catch {
    // geçersiz token — aşağıda yönlendirilecek
  }

  router.navigate(['/tabs/map'], { replaceUrl: true });
  return false;
};
