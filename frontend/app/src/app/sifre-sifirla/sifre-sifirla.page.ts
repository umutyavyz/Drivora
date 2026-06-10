import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, eyeOutline, eyeOffOutline, checkmarkCircle, alertCircle } from 'ionicons/icons';

@Component({
  selector: 'app-sifre-sifirla',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
  templateUrl: './sifre-sifirla.page.html',
  styleUrls: ['./sifre-sifirla.page.scss'],
})
export class SifreSifirlaPage implements OnInit {
  token = '';
  yeniSifre = '';
  sifreTekrar = '';
  sifreGoster = false;
  yukleniyor = false;
  durum: 'form' | 'basarili' | 'hata' = 'form';
  hataMesaji = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastCtrl: ToastController,
  ) {
    addIcons({ lockClosedOutline, eyeOutline, eyeOffOutline, checkmarkCircle, alertCircle });
  }

  ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.durum = 'hata';
      this.hataMesaji = 'Sıfırlama linki geçersiz.';
      return;
    }
    this.token = t;
  }

  private async toast(mesaj: string, renk: string) {
    const t = await this.toastCtrl.create({ message: mesaj, duration: 2500, color: renk, position: 'top' });
    await t.present();
  }

  sifireleyiToggle() {
    this.sifreGoster = !this.sifreGoster;
  }

  kaydet() {
    if (this.yeniSifre.length < 6) {
      this.toast('Şifre en az 6 karakter olmalı', 'warning');
      return;
    }
    if (this.yeniSifre !== this.sifreTekrar) {
      this.toast('Şifreler eşleşmiyor', 'warning');
      return;
    }
    this.yukleniyor = true;
    this.http.post<any>(`${environment.API_BASE}/kullanicilar/sifre-sifirla`, {
      token: this.token,
      yeniSifre: this.yeniSifre,
    }).subscribe({
      next: () => {
        this.yukleniyor = false;
        this.durum = 'basarili';
      },
      error: (err) => {
        this.yukleniyor = false;
        this.durum = 'hata';
        this.hataMesaji = err.error?.hata || 'Şifre güncellenemedi.';
      }
    });
  }

  girisYap() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
