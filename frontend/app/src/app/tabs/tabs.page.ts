import { Component, EnvironmentInjector, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline, keyOutline, personOutline, mapOutline, settingsOutline } from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  isAdmin = false;
  isAdminRoute = false;

  constructor(private router: Router) {
    addIcons({ carOutline, keyOutline, personOutline, mapOutline, settingsOutline });
    this.rolKontrol();
    this.isAdminRoute = this.router.url?.includes('/admin') ?? false;

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.isAdminRoute = (e.urlAfterRedirects || e.url).includes('/admin');
    });
  }

  ionViewWillEnter() {
    this.rolKontrol();
  }

  rolKontrol() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.isAdmin = decoded.rol === 'admin';
      } catch {
        this.isAdmin = false;
      }
      return;
    }
    this.isAdmin = false;
  }
}
