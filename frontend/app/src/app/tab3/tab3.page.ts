import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, AlertController, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import {
  mailOutline, shieldOutline, timeOutline,
  logOutOutline, person, shieldCheckmark,
  moonOutline, sunnyOutline, desktopOutline
} from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSegment, IonSegmentButton],
})
export class Tab3Page implements OnInit {
  email = '';
  rol = '';
  seciliTema: 'light' | 'dark' | 'system' = 'system';

  constructor(
    private router: Router, 
    private alertCtrl: AlertController,
    private themeService: ThemeService
  ) {
    addIcons({
      mailOutline, shieldOutline, timeOutline,
      logOutOutline, person, shieldCheckmark,
      moonOutline, sunnyOutline, desktopOutline
    });
    this.seciliTema = this.themeService.getTheme();
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.email = decoded.email;
      this.rol = decoded.rol;
    }
  }

  async cikisYap() {
    const alert = await this.alertCtrl.create({
      header: 'Çıkış Yap',
      message: 'Hesabından çıkmak istediğine emin misin?',
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Çıkış Yap',
          role: 'destructive',
          handler: () => {
            localStorage.removeItem('token');
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }

  temaDegistir(event: any) {
    const yeniTema = event.detail.value;
    this.seciliTema = yeniTema;
    this.themeService.setTheme(yeniTema);
  }
}