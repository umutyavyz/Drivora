import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const simdiSaniye = Math.floor(Date.now() / 1000);
      if (decoded?.exp && decoded.exp < simdiSaniye) {
        localStorage.removeItem('token');
        this.router.navigate(['/login'], { replaceUrl: true });
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem('token');
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }
  }
}