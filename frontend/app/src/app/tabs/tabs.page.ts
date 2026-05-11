import { Component, EnvironmentInjector, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline, keyOutline, personOutline, mapOutline, settingsOutline } from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  isAdmin = false;

  constructor() {
    addIcons({ carOutline, keyOutline, personOutline, mapOutline, settingsOutline });
    this.rolKontrol();
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
