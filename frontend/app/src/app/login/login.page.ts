import { Component } from '@angular/core';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logoGoogle, logoApple } from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

addIcons({ logoGoogle, logoApple });

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule],
})
export class LoginPage {
  email = '';
  sifre = '';


  constructor(
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async toastGoster(mesaj: string, renk: string) {
    const toast = await this.toastCtrl.create({
      message: mesaj,
      duration: 2200,
      color: renk,
      position: 'top'
    });
    await toast.present();
  }

  girisYap() {
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
    this.http.post<any>('http://localhost:3000/kullanicilar/giris', {
      email: this.email.trim(),
      sifre: this.sifre
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        let isim = '';
        let isAdmin = false;
        try {
          const decoded: any = jwtDecode(res.token);
          isim = decoded?.email ? decoded.email.split('@')[0] : '';
          isAdmin = decoded?.rol === 'admin';
        } catch {}
        this.toastGoster(isim ? `Hoş geldin, ${isim}!` : 'Hoş geldin!', 'success');
        this.router.navigate([isAdmin ? '/tabs/admin' : '/tabs/map'], { replaceUrl: true });
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Giriş başarısız', 'danger');
      }
    });
  }
  kayitOl() {
  this.router.navigate(['/register']);
}
}