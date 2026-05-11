import { Component } from '@angular/core';
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
  email = '';
  sifre = '';
  sifreTekrar = '';

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
    if (!this.email || !this.sifre) {
      this.toastGoster('Tüm alanları doldurun', 'warning');
      return;
    }

    if (this.sifre !== this.sifreTekrar) {
      this.toastGoster('Şifreler eşleşmiyor', 'danger');
      return;
    }

    this.http.post<any>('http://localhost:3000/kullanicilar/kayit', {
      email: this.email,
      sifre: this.sifre
    }).subscribe({
      next: () => {
        this.otomatikGirisYap();
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Kayıt başarısız', 'danger');
      }
    });
  }

  private otomatikGirisYap() {
    this.http.post<any>('http://localhost:3000/kullanicilar/giris', {
      email: this.email,
      sifre: this.sifre
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.toastGoster('Hoş geldin! 🎉', 'success');
        this.router.navigate(['/tabs/map'], { replaceUrl: true });
      },
      error: () => {
        this.toastGoster('Kayıt başarılı, lütfen giriş yap', 'warning');
        this.router.navigate(['/login']);
      }
    });
  }

  girisYap() {
    this.router.navigate(['/login']);
  }
}