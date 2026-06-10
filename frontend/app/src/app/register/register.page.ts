import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { IonContent, ToastController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule],
})
export class RegisterPage {
  adSoyad = '';
  email = '';
  sifre = '';
  sifreTekrar = '';
  telefon = '';
  dogumTarihi = '';
  maxDogumTarihi = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async toastGoster(mesaj: string, renk: string) {
    const toast = await this.toastCtrl.create({
      message: mesaj,
      duration: 2500,
      color: renk,
      position: 'top'
    });
    await toast.present();
  }

  kayitOl() {
    if (!this.adSoyad.trim()) {
      this.toastGoster('Ad soyad zorunludur', 'warning');
      return;
    }

    if (!this.email.trim()) {
      this.toastGoster('Email adresi zorunludur', 'warning');
      return;
    }

    if (!this.email.includes('@')) {
      this.toastGoster('Geçerli bir email adresi girin', 'warning');
      return;
    }

    if (!this.sifre) {
      this.toastGoster('Şifre zorunludur', 'warning');
      return;
    }

    if (this.sifre.length < 6) {
      this.toastGoster('Şifre en az 6 karakter olmalıdır', 'warning');
      return;
    }

    if (!this.sifreTekrar) {
      this.toastGoster('Şifre tekrar zorunludur', 'warning');
      return;
    }

    if (this.sifre !== this.sifreTekrar) {
      this.toastGoster('Şifreler eşleşmiyor', 'danger');
      return;
    }

    this.http.post<any>(`${environment.API_BASE}/kullanicilar/kayit`, {
      email: this.email.trim(),
      sifre: this.sifre,
      ad_soyad: this.adSoyad.trim(),
      telefon: this.telefon.trim() || null,
      dogum_tarihi: this.dogumTarihi || null
    }).subscribe({
      next: async (res) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
        }
        const mesaj = res.dogrulama_maili_gonderildi
          ? 'Hoş geldin! Email adresine doğrulama maili gönderildi.'
          : 'Hoş geldin! Hesabını profil sayfasından doğrulayabilirsin.';
        this.toastGoster(mesaj, 'success');
        this.router.navigate(['/tabs/araclar'], { replaceUrl: true });
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Kayıt başarısız', 'danger');
      }
    });
  }

  girisYap() {
    this.router.navigate(['/login']);
  }
}