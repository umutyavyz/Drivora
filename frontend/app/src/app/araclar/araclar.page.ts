import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline, searchOutline } from 'ionicons/icons';
import { Arac, Kiralama } from '../models';

@Component({
  selector: 'app-araclar',
  templateUrl: 'araclar.page.html',
  styleUrls: ['araclar.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class AraclarPage implements OnInit {
  araclar: Arac[] = [];
  kasaTipleri: string[] = [];
  seciliKasaTipi: string | null = null;
  seciliFiyatSinifi: string | null = null;
  aramaMetni = '';
  aktifKiralamaAracId: number | null = null;
  aktifKiralama: Kiralama | null = null;
  yukleniyor = true;

  private readonly KASA_SIRASI = ['Hatchback', 'Sedan', 'SUV', 'Spor'];
  private readonly FİYAT_SIRASI = ['Ekonomik', 'Orta Sınıf', 'Lüks', 'Spor', 'Elektrikli', 'Manuel', 'Otomatik'];

  constructor(private http: HttpClient, private router: Router, private toastCtrl: ToastController) {
    addIcons({ carOutline, searchOutline });
  }

  detayaGit(arac: any) {
    this.router.navigate(['/detail', arac.id]);
  }

  ionViewWillEnter() {
    this.araclariGetir();
    this.aktifKiralamayiGetir();
  }

  ngOnInit() {
    this.araclariGetir();
    this.aktifKiralamayiGetir();
  }

  araclariGetir() {
    this.yukleniyor = true;
    this.http.get<any[]>(`${environment.API_BASE}/araclar`).subscribe({
      next: (data) => {
        this.araclar = data;
        const kasaSet = new Set<string>(data.map((a: any) => a.kasa_tipi).filter(Boolean));
        this.kasaTipleri = [
          ...this.KASA_SIRASI.filter(k => kasaSet.has(k)),
          ...Array.from(kasaSet).filter(k => !this.KASA_SIRASI.includes(k))
        ];
        this.yukleniyor = false;
      },
      error: async () => {
        this.yukleniyor = false;
        const toast = await this.toastCtrl.create({
          message: 'Araçlar yüklenemedi. Backend çalışıyor mu?',
          duration: 3000, color: 'danger', position: 'top'
        });
        await toast.present();
      }
    });
  }

  aktifKiralamayiGetir() {
    this.http.get<any[]>(`${environment.API_BASE}/kiralamalar`).subscribe({
      next: (data) => {
        const aktif = data.find(k => k.durum === 'aktif');
        this.aktifKiralama = aktif || null;
        this.aktifKiralamaAracId = aktif ? aktif.arac_id : null;
      }
    });
  }

  kasaTipiSec(tip: string) {
    if (this.seciliKasaTipi === tip) {
      this.seciliKasaTipi = null;
      this.seciliFiyatSinifi = null;
    } else {
      this.seciliKasaTipi = tip;
      this.seciliFiyatSinifi = null;
    }
  }

  get mevcutFiyatSiniflari(): string[] {
    if (!this.seciliKasaTipi) return [];
    const araçlarFiltrelenmis = this.araclar.filter(a => a.kasa_tipi === this.seciliKasaTipi);
    const sinifSet = new Set<string>(araçlarFiltrelenmis.map(a => a.kategori).filter((k): k is string => !!k));
    return this.FİYAT_SIRASI.filter(k => sinifSet.has(k));
  }

  fiyatSinifinSec(sinif: string) {
    this.seciliFiyatSinifi = this.seciliFiyatSinifi === sinif ? null : sinif;
  }

  filtrelenmisAraclar() {
    let sonuc = this.araclar;

    if (this.seciliKasaTipi) {
      sonuc = sonuc.filter(a => a.kasa_tipi === this.seciliKasaTipi);
    }

    if (this.seciliFiyatSinifi) {
      sonuc = sonuc.filter(a => a.kategori === this.seciliFiyatSinifi);
    }

    if (this.aramaMetni.trim()) {
      const arama = this.aramaMetni.toLowerCase();
      sonuc = sonuc.filter(a =>
        a.marka?.toLowerCase().includes(arama) ||
        a.model?.toLowerCase().includes(arama)
      );
    }

    return sonuc;
  }
}
