import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, chevronBackOutline, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-sifremi-unuttum',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
  templateUrl: './sifremi-unuttum.page.html',
  styleUrls: ['./sifremi-unuttum.page.scss'],
})
export class SifremiUnuttumPage {
  email = '';
  yukleniyor = false;
  gonderildi = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ mailOutline, chevronBackOutline, checkmarkCircle });
  }

  private async toast(mesaj: string, renk: string) {
    const t = await this.toastCtrl.create({ message: mesaj, duration: 2500, color: renk, position: 'top' });
    await t.present();
  }

  gonder() {
    const email = this.email.trim();
    if (!email || !email.includes('@')) {
      this.toast('Geçerli bir email girin', 'warning');
      return;
    }
    this.yukleniyor = true;
    this.http.post<any>(`${environment.API_BASE}/kullanicilar/sifre-sifirlama-istek`, { email })
      .subscribe({
        next: () => {
          this.yukleniyor = false;
          this.gonderildi = true;
        },
        error: () => {
          this.yukleniyor = false;
          this.toast('Bir hata oluştu, tekrar dene', 'danger');
        }
      });
  }

  geri() {
    this.router.navigate(['/login']);
  }
}
