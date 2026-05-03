import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon,
  IonAvatar, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, shieldOutline } from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonIcon,
    IonAvatar, IonButton
  ],
})
export class Tab3Page implements OnInit {
  email = '';
  rol = '';

  constructor(private router: Router) {
    addIcons({ mailOutline, shieldOutline });
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.email = decoded.email;
      this.rol = decoded.rol;
    }
  }

  cikisYap() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}