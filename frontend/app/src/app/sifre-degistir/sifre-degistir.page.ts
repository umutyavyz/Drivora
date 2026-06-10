import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import { arrowBackOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-sifre-degistir',
  templateUrl: 'sifre-degistir.page.html',
  styleUrls: ['sifre-degistir.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class SifreDegistirPage {
  mevcutSifre = '';
  yeniSifre = '';
  yeniSifreTekrar = '';
  yukleniyor = false;

  mevcutSifreGoster = false;
  yeniSifreGoster = false;
  yeniSifreTekrarGoster = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    addIcons({ arrowBackOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
  }

  geriDon() {
    this.router.navigate(['/tabs/profil']);
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

    this.yukleniyor = true;
    this.http.put(`${environment.API_BASE}/kullanicilar/sifre-degistir`,
      { mevcutSifre: this.mevcutSifre, yeniSifre: this.yeniSifre }
    ).subscribe({
      next: () => {
        this.yukleniyor = false;
        this.mevcutSifre = '';
        this.yeniSifre = '';
        this.yeniSifreTekrar = '';
        this.toastGoster('Şifre başarıyla güncellendi', 'success');
        setTimeout(() => this.router.navigate(['/tabs/profil']), 1500);
      },
      error: (err) => {
        this.yukleniyor = false;
        this.toastGoster(err.error?.hata || 'Şifre güncellenemedi', 'danger');
      }
    });
  }
}
