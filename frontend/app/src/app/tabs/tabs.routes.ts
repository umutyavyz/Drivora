import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { adminAuthGuard } from '../guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'araclar',
        loadComponent: () => import('../araclar/araclar.page').then((m) => m.AraclarPage),
      },
      {
        path: 'map',
        loadComponent: () => import('../map/map.page').then((m) => m.MapPage),
      },
      {
        path: 'kiralamalarim',
        loadComponent: () => import('../kiralamalarim/kiralamalarim.page').then((m) => m.KiralamalarimPage),
      },
      {
        path: 'profil',
        loadComponent: () => import('../profil/profil.page').then((m) => m.ProfilPage),
      },
      {
        path: 'admin',
        loadComponent: () => import('../admin/admin.page').then((m) => m.AdminPage),
        canActivate: [adminAuthGuard],
      },
      {
        path: '',
        redirectTo: 'map',
        pathMatch: 'full',
      },
    ],
  },
];