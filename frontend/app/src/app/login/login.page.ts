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
    this.http.post<any>('http://localhost:3000/kullanicilar/giris', {
      email: this.email,
      sifre: this.sifre
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        let isim = '';
        try {
          const decoded: any = jwtDecode(res.token);
          isim = decoded?.email ? decoded.email.split('@')[0] : '';
        } catch {}
        this.toastGoster(isim ? `Hoş geldin, ${isim}!` : 'Hoş geldin!', 'success');
        this.router.navigate(['/tabs/map'], { replaceUrl: true });
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