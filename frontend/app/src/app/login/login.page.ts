import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { IonContent, IonIcon, ToastController, NavController } from '@ionic/angular/standalone';
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
    private toastCtrl: ToastController,
    private navCtrl: NavController
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
    this.http.post<any>(`${environment.API_BASE}/kullanicilar/giris`, {
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
        // navigateRoot, önceki oturumdan kalan ion-router-outlet view stack'ini
        // temizleyerek yeni oturumu sıfırdan başlatır (örn. kullanıcı çıkışından
        // sonra admin girişinde eski sayfaların cache'lenip hata vermesini önler).
        this.navCtrl.navigateRoot([isAdmin ? '/tabs/admin' : '/tabs/map']);
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Giriş başarısız', 'danger');
      }
    });
  }
  kayitOl() {
    this.router.navigate(['/register']);
  }

  sifremiUnuttum() {
    this.router.navigate(['/sifremi-unuttum']);
  }
}