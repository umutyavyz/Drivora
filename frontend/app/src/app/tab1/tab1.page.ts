import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonIcon, IonSpinner
  ],
})
export class Tab1Page implements OnInit {
  araclar: any[] = [];
  kategoriler = ['Tümü', 'Spor', 'Sedan', 'Ekonomik'];
  seciliKategori = 'Tümü';
  aramaMetni = '';
  aktifKiralamaAracId: number | null = null;
  yukleniyor = true;

  constructor(private http: HttpClient, private router: Router, private toastCtrl: ToastController) {
    addIcons({ carOutline, searchOutline });
  }

  detayaGit(arac: any) {
    this.router.navigate(['/detail', arac.id]);
  }

  ionViewWillEnter() {
    this.aktifKiralamayiGetir();
  }

  ngOnInit() {
    this.araclariGetir();
    this.aktifKiralamayiGetir();
  }

  araclariGetir() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.yukleniyor = true;
    this.http.get<any[]>('http://localhost:3000/araclar', { headers }).subscribe({
      next: (data) => {
        this.araclar = data;
        this.yukleniyor = false;
      },
      error: async () => {
        this.yukleniyor = false;
        const toast = await this.toastCtrl.create({
          message: 'Araçlar yüklenemedi. Backend çalışıyor mu?',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  aktifKiralamayiGetir() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>('http://localhost:3000/kiralamalar', { headers }).subscribe({
      next: (data) => {
        const aktif = data.find(k => k.durum === 'aktif');
        this.aktifKiralamaAracId = aktif ? aktif.arac_id : null;
      }
    });
  }

  kategoriSec(kategori: string) {
    this.seciliKategori = kategori;
  }

  filtrelenmisAraclar() {
    let sonuc = this.araclar;

    if (this.seciliKategori !== 'Tümü') {
      sonuc = sonuc.filter(a => a.kategori === this.seciliKategori);
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