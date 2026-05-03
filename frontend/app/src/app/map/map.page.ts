import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, ToastController } from '@ionic/angular/standalone';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class MapPage implements AfterViewInit {
  map: any;
  araclar: any[] = [];
  yakindakiAraclar: any[] = [];
  seciliArac: any = null;
  kullaniciKonumu: { lat: number; lng: number } = { lat: 41.0082, lng: 28.9784 };
  sadeceMusait = true;
  enYakinArac: any = null;
  markerlar: any[] = [];

  constructor(private http: HttpClient, private toastCtrl: ToastController) {}

  ngAfterViewInit() {
    this.konumAl();
  }

  konumAl() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.kullaniciKonumu = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          this.haritayiBaslat();
          this.araclariGetir();
        },
        () => {
          this.haritayiBaslat();
          this.araclariGetir();
        }
      );
    } else {
      this.haritayiBaslat();
      this.araclariGetir();
    }
  }

  haritayiBaslat() {
    this.map = L.map('map', {
      center: [this.kullaniciKonumu.lat, this.kullaniciKonumu.lng],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(this.map);

    const userIcon = L.divIcon({
      html: '<div style="width:20px;height:20px;background:#4a9eff;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(74,158,255,0.3);"></div>',
      iconSize: [20, 20],
      className: ''
    });

    L.marker([this.kullaniciKonumu.lat, this.kullaniciKonumu.lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('Konumunuz');
  }

  // İki nokta arası mesafe (metre cinsinden)
  mesafeHesapla(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  araclariGetir() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:3000/araclar', { headers }).subscribe({
      next: (data) => {
        this.araclar = data.map(arac => {
          const lat = this.kullaniciKonumu.lat + (Math.random() - 0.5) * 0.04;
          const lng = this.kullaniciKonumu.lng + (Math.random() - 0.5) * 0.04;
          return {
            ...arac,
            latitude: lat,
            longitude: lng,
            mesafe: this.mesafeHesapla(this.kullaniciKonumu.lat, this.kullaniciKonumu.lng, lat, lng)
          };
        });

        // Mesafeye göre sırala
        this.araclar.sort((a, b) => a.mesafe - b.mesafe);

        // En yakın müsait aracı bul
        this.enYakinArac = this.araclar.find(a => a.musait);

        this.filtreUygula();
      },
      error: (err) => console.log('Hata:', err)
    });
  }

  filtreUygula() {
    this.yakindakiAraclar = this.sadeceMusait
      ? this.araclar.filter(a => a.musait)
      : this.araclar;
    this.araclariHaritayaEkle();
  }

  filtreyiDegistir() {
    this.sadeceMusait = !this.sadeceMusait;
    this.filtreUygula();
  }

  araclariHaritayaEkle() {
  this.markerlar.forEach(m => this.map.removeLayer(m));
  this.markerlar = [];

  this.yakindakiAraclar.forEach(arac => {
    const opacity = arac.musait ? 1 : 0.5;

    const carSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11L6.5 6.5C6.78 5.61 7.61 5 8.55 5H15.45C16.39 5 17.22 5.61 17.5 6.5L19 11M5 11H19M5 11V17C5 17.55 5.45 18 6 18H7C7.55 18 8 17.55 8 17V16H16V17C16 17.55 16.45 18 17 18H18C18.55 18 19 17.55 19 17V11M7.5 14C8.05 14 8.5 13.55 8.5 13C8.5 12.45 8.05 12 7.5 12C6.95 12 6.5 12.45 6.5 13C6.5 13.55 6.95 14 7.5 14ZM16.5 14C17.05 14 17.5 13.55 17.5 13C17.5 12.45 17.05 12 16.5 12C15.95 12 15.5 12.45 15.5 13C15.5 13.55 15.95 14 16.5 14Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const aracIcon = L.divIcon({
      html: `<div style="width:40px;height:40px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);opacity:${opacity};">${carSvg}</div>`,
      iconSize: [40, 40],
      className: ''
    });

    const marker = L.marker([arac.latitude, arac.longitude], { icon: aracIcon })
      .addTo(this.map);

    marker.on('click', () => {
      this.seciliArac = arac;
      this.map.setView([arac.latitude, arac.longitude], 16, { animate: true });
    });

    this.markerlar.push(marker);
  });
}

  kullaniciKonumunaGit() {
    if (this.map) {
      this.map.setView([this.kullaniciKonumu.lat, this.kullaniciKonumu.lng], 14, { animate: true });
      this.araclariGetir();
    }
  }

  async kirala() {
    if (!this.seciliArac) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post('http://localhost:3000/kiralamalar', { arac_id: this.seciliArac.id }, { headers })
      .subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({
            message: `${this.seciliArac.marka} ${this.seciliArac.model} kiralandı! 🚗`,
            duration: 2500,
            color: 'success',
            position: 'top'
          });
          await toast.present();
          this.seciliArac = null;
          this.araclariGetir();
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({
            message: err.error?.hata || 'Kiralama başarısız',
            duration: 2500,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
        }
      });
  }
}