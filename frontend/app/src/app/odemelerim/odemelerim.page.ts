import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cardOutline, chevronBackOutline, receiptOutline,
  checkmarkCircle, calendarOutline, carOutline, copyOutline
} from 'ionicons/icons';

import { Odeme } from '../models';

const TR_AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

@Component({
  selector: 'app-odemelerim',
  templateUrl: './odemelerim.page.html',
  styleUrls: ['./odemelerim.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class OdemelerimPage implements OnInit {
  odemeler: Odeme[] = [];
  yukleniyor = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ cardOutline, chevronBackOutline, receiptOutline, checkmarkCircle, calendarOutline, carOutline, copyOutline });
  }

  ngOnInit() {
    this.odemeleriGetir();
  }

  ionViewWillEnter() {
    this.odemeleriGetir();
  }

  odemeleriGetir() {
    this.yukleniyor = true;
    this.http.get<any[]>(`${environment.API_BASE}/odemeler`).subscribe({
      next: (data) => {
        this.odemeler = data;
        this.yukleniyor = false;
      },
      error: async () => {
        this.yukleniyor = false;
        const toast = await this.toastCtrl.create({
          message: 'Ödemeler yüklenemedi.',
          duration: 2500,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  get toplamTutar(): number {
    return this.odemeler
      .filter(o => o.durum === 'basarili')
      .reduce((acc, o) => acc + (Number(o.tutar) || 0), 0);
  }

  trTarih(d: string): string {
    if (!d) return '';
    const t = new Date(d);
    return `${t.getDate()} ${TR_AYLAR[t.getMonth()]} ${t.getFullYear()}, ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }

  durumMetin(durum: string): string {
    if (durum === 'basarili') return 'Başarılı';
    if (durum === 'iade') return 'İade';
    if (durum === 'basarisiz') return 'Başarısız';
    return durum;
  }

  async islemNoKopyala(islemNo: string) {
    try {
      await navigator.clipboard.writeText(islemNo);
      const toast = await this.toastCtrl.create({
        message: 'İşlem no kopyalandı',
        duration: 1500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch {}
  }

  geri() {
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/tabs/profil']);
  }
}
