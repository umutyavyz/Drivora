import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonIcon, AlertController, IonSegment, IonSegmentButton, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import {
  mailOutline, shieldOutline, timeOutline,
  logOutOutline, person, personOutline, shieldCheckmark,
  moonOutline, sunnyOutline, desktopOutline, lockClosedOutline
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
  adSoyad = '';
  email = '';
  rol = '';
  seciliTema: 'light' | 'dark' | 'system' = 'system';

  mevcutSifre = '';
  yeniSifre = '';
  yeniSifreTekrar = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private themeService: ThemeService
  ) {
    addIcons({
      mailOutline, shieldOutline, timeOutline,
      logOutOutline, person, personOutline, shieldCheckmark,
      moonOutline, sunnyOutline, desktopOutline, lockClosedOutline
    });
    this.seciliTema = this.themeService.getTheme();
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.adSoyad = decoded.ad_soyad || '';
      this.email = decoded.email;
      this.rol = decoded.rol;
    }
  }

  private async toastGoster(mesaj: string, renk: string) {
    const toast = await this.toastCtrl.create({
      message: mesaj,
      duration: 2500,
      color: renk,
      position: 'top'
    });
    await toast.present();
  }

  async sifreDegistir() {
    if (!this.mevcutSifre) {
      this.toastGoster('Mevcut şifre zorunludur', 'warning');
      return;
    }
    if (!this.yeniSifre) {
      this.toastGoster('Yeni şifre zorunludur', 'warning');
      return;
    }
    if (this.yeniSifre.length < 6) {
      this.toastGoster('Yeni şifre en az 6 karakter olmalıdır', 'warning');
      return;
    }
    if (!this.yeniSifreTekrar) {
      this.toastGoster('Yeni şifre tekrar zorunludur', 'warning');
      return;
    }
    if (this.yeniSifre !== this.yeniSifreTekrar) {
      this.toastGoster('Yeni şifreler eşleşmiyor', 'danger');
      return;
    }
    if (this.mevcutSifre === this.yeniSifre) {
      this.toastGoster('Yeni şifre mevcut şifreyle aynı olamaz', 'warning');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.put('http://localhost:3000/kullanicilar/sifre-degistir',
      { mevcutSifre: this.mevcutSifre, yeniSifre: this.yeniSifre },
      { headers }
    ).subscribe({
      next: () => {
        this.mevcutSifre = '';
        this.yeniSifre = '';
        this.yeniSifreTekrar = '';
        this.toastGoster('Şifre başarıyla güncellendi', 'success');
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Şifre güncellenemedi', 'danger');
      }
    });
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