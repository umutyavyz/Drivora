import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./detail/detail.page').then(m => m.DetailPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'sifre-degistir',
    loadComponent: () => import('./sifre-degistir/sifre-degistir.page').then(m => m.SifreDegistirPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'odemelerim',
    loadComponent: () => import('./odemelerim/odemelerim.page').then(m => m.OdemelerimPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'favorilerim',
    loadComponent: () => import('./favorilerim/favorilerim.page').then(m => m.FavorilerimPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'email-dogrula',
    loadComponent: () => import('./email-dogrula/email-dogrula.page').then(m => m.EmailDogrulaPage)
  },
  {
    path: 'sifremi-unuttum',
    loadComponent: () => import('./sifremi-unuttum/sifremi-unuttum.page').then(m => m.SifremiUnuttumPage)
  },
  {
    path: 'sifre-sifirla',
    loadComponent: () => import('./sifre-sifirla/sifre-sifirla.page').then(m => m.SifreSifirlaPage)
  }
];