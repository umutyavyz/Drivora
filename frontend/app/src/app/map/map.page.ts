import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController, AlertController } from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';
import { addIcons } from 'ionicons';
import { cogOutline } from 'ionicons/icons';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class MapPage implements AfterViewInit, OnDestroy {
  map: any;
  araclar: any[] = [];
  yakindakiAraclar: any[] = [];
  seciliArac: any = null;
  kullaniciKonumu: { lat: number; lng: number } = { lat: 41.0082, lng: 28.9784 };
  sadeceMusait = true;
  enYakinArac: any = null;
  markerlar: any[] = [];
  aktifKiralamaAracId: number | null = null;
  aktifKiralamaId: number | null = null;
  yukleniyor = true;
  userMarker: any = null;
  rotaCizgisi: any = null;
  yuruyusDakika: number | null = null;

  private tileKatmani: any = null;
  private temaGozlemcisi: MutationObserver | null = null;

  // Simülasyon değişkenleri
  private simInterval: any = null;
  private simMarker: any = null;
  private simHedef: { lat: number; lng: number } | null = null;
  private simMevcutKonum: { lat: number; lng: number } | null = null;
  simAktif = false;
  simTakipModu = false;
  private simRotaCizgisi: any = null;
  private simIzCizgisi: any = null;
  private simIzNoktalar: [number, number][] = [];

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router
  ) {
    addIcons({ cogOutline });
  }

  detayaGit() {
    if (!this.seciliArac) return;
    this.router.navigate(['/detail', this.seciliArac.id]);
  }

  ngAfterViewInit() {
    this.konumAl();
  }

  ngOnDestroy() {
    if (this.temaGozlemcisi) {
      this.temaGozlemcisi.disconnect();
      this.temaGozlemcisi = null;
    }
    this.simulasyonDurdur();
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

    this.tileDegistir();

    this.temaGozlemcisi = new MutationObserver(() => {
      if (this.map) this.tileDegistir();
    });
    this.temaGozlemcisi.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const userIcon = L.divIcon({
      html: '<div style="width:20px;height:20px;background:var(--app-primary);border-radius:50%;border:3px solid var(--app-card-bg);box-shadow:0 0 0 4px rgba(74,158,255,0.3);"></div>',
      iconSize: [20, 20],
      className: ''
    });

    this.userMarker = L.marker([this.kullaniciKonumu.lat, this.kullaniciKonumu.lng], { icon: userIcon })
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

  // Kullanıcının çevresinde maxMetre yarıçapında rastgele bir nokta üretir
  yakinKonumUret(merkezLat: number, merkezLng: number, maxMetre: number): { lat: number; lng: number } {
    const r = maxMetre * Math.sqrt(Math.random());
    const teta = 2 * Math.PI * Math.random();
    const dLat = (r * Math.cos(teta)) / 111000;
    const dLng = (r * Math.sin(teta)) / (111000 * Math.cos(merkezLat * Math.PI / 180));
    return { lat: merkezLat + dLat, lng: merkezLng + dLng };
  }

  araclariGetir() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.yukleniyor = true;

    forkJoin({
      kiralamalar: this.http.get<any[]>('http://localhost:3000/kiralamalar', { headers }),
      araclar: this.http.get<any[]>('http://localhost:3000/araclar', { headers })
    }).subscribe({
      next: (sonuclar) => {
        const kiralamalar = sonuclar.kiralamalar;
        const data = sonuclar.araclar;

        const aktif = kiralamalar.find(k => k.durum === 'aktif');
        this.aktifKiralamaAracId = aktif ? aktif.arac_id : null;
        this.aktifKiralamaId = aktif ? aktif.id : null;

        // Aktif kiralama yoksa simülasyonu durdur
        if (!this.aktifKiralamaAracId) {
          this.simulasyonDurdur();
        }

        this.araclar = data.map(arac => {
          const eskiArac = this.araclar.find(a => a.id === arac.id);
          const konum = eskiArac ? { lat: eskiArac.latitude, lng: eskiArac.longitude } : this.yakinKonumUret(
            this.kullaniciKonumu.lat,
            this.kullaniciKonumu.lng,
            1500
          );
          return {
            ...arac,
            latitude: konum.lat,
            longitude: konum.lng,
            mesafe: this.mesafeHesapla(
              this.kullaniciKonumu.lat,
              this.kullaniciKonumu.lng,
              konum.lat,
              konum.lng
            )
          };
        });

        // Aktif kiralama önce, sonra müsait, sonra mesafe
        this.araclar.sort((a, b) => {
          const aBenim = a.id === this.aktifKiralamaAracId ? 0 : 1;
          const bBenim = b.id === this.aktifKiralamaAracId ? 0 : 1;
          if (aBenim !== bBenim) return aBenim - bBenim;
          const aMusait = a.musait ? 0 : 1;
          const bMusait = b.musait ? 0 : 1;
          if (aMusait !== bMusait) return aMusait - bMusait;
          return a.mesafe - b.mesafe;
        });

        // En yakın müsait aracı bul
        this.enYakinArac = this.araclar.find(a => a.musait);

        this.filtreUygula();
        this.yukleniyor = false;

        // Aktif kiralama varsa simülasyonu başlat
        if (this.aktifKiralamaAracId) {
          this.simulasyonBaslat();
        }
      },
      error: async () => {
        this.yukleniyor = false;
        const toast = await this.toastCtrl.create({
          message: 'Veriler yüklenemedi. Backend çalışıyor mu?',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  filtreUygula() {
    this.yakindakiAraclar = this.aktifKiralamaAracId
      ? this.araclar.filter(a => a.id === this.aktifKiralamaAracId)
      : (this.sadeceMusait ? this.araclar.filter(a => a.musait) : this.araclar);
    this.araclariHaritayaEkle();

    if (this.userMarker) {
      if (this.aktifKiralamaAracId) {
        if (this.map.hasLayer(this.userMarker)) {
          this.map.removeLayer(this.userMarker);
        }
      } else {
        if (!this.map.hasLayer(this.userMarker)) {
          this.userMarker.addTo(this.map);
        }
      }
    }
  }

  filtreyiDegistir() {
    this.sadeceMusait = !this.sadeceMusait;
    this.filtreUygula();
  }

  araclariHaritayaEkle() {
    this.markerlar.forEach(m => this.map.removeLayer(m));
    this.markerlar = [];

    this.yakindakiAraclar.forEach(arac => {
      // Simülasyondaki aracı atla — onu ayrı yönetiyoruz
      if (this.simAktif && arac.id === this.aktifKiralamaAracId) return;

      const benimAracim = this.aktifKiralamaAracId === arac.id;
      const opacity = benimAracim ? 1 : (arac.musait ? 1 : 0.5);

      const strokeColor = benimAracim ? '#ffffff' : '#1a1a1a';
      const bgColor = benimAracim
        ? 'var(--app-primary)'
        : '#ffffff';
      const ringStyle = benimAracim
        ? 'box-shadow:0 0 0 4px rgba(74,158,255,0.35),0 4px 12px rgba(0,0,0,0.4);'
        : 'box-shadow:0 4px 12px rgba(0,0,0,0.4);';

      const carSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11L6.5 6.5C6.78 5.61 7.61 5 8.55 5H15.45C16.39 5 17.22 5.61 17.5 6.5L19 11M5 11H19M5 11V17C5 17.55 5.45 18 6 18H7C7.55 18 8 17.55 8 17V16H16V17C16 17.55 16.45 18 17 18H18C18.55 18 19 17.55 19 17V11M7.5 14C8.05 14 8.5 13.55 8.5 13C8.5 12.45 8.05 12 7.5 12C6.95 12 6.5 12.45 6.5 13C6.5 13.55 6.95 14 7.5 14ZM16.5 14C17.05 14 17.5 13.55 17.5 13C17.5 12.45 17.05 12 16.5 12C15.95 12 15.5 12.45 15.5 13C15.5 13.55 15.95 14 16.5 14Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

      const aracIcon = L.divIcon({
        html: `<div style="width:40px;height:40px;background:${bgColor};border-radius:50%;display:flex;align-items:center;justify-content:center;${ringStyle}opacity:${opacity};">${carSvg}</div>`,
        iconSize: [40, 40],
        className: ''
      });

      const marker = L.marker([arac.latitude, arac.longitude], { icon: aracIcon })
        .addTo(this.map);

      marker.on('click', () => {
        this.aracSec(arac);
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

  aracSec(arac: any) {
    this.seciliArac = arac;
    // Yürüyüş süresi ~ 80 m/dk (5 km/sa)
    this.yuruyusDakika = Math.max(1, Math.ceil(arac.mesafe / 80));
    this.rotayiCiz(arac);
    // Hem kullanıcı hem aracın görüneceği şekilde harita ortalanır
    const bounds = L.latLngBounds([
      [this.kullaniciKonumu.lat, this.kullaniciKonumu.lng],
      [arac.latitude, arac.longitude]
    ]);
    this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
  }

  rotayiCiz(arac: any) {
    if (this.rotaCizgisi) {
      this.map.removeLayer(this.rotaCizgisi);
      this.rotaCizgisi = null;
    }
    if (this.aktifKiralamaAracId === arac.id) return;
    this.rotaCizgisi = L.polyline(
      [
        [this.kullaniciKonumu.lat, this.kullaniciKonumu.lng],
        [arac.latitude, arac.longitude]
      ],
      {
        color: 'var(--app-primary)',
        weight: 4,
        opacity: 0.85,
        dashArray: '8 10',
        lineCap: 'round'
      }
    ).addTo(this.map);
  }

  seciliyiKapat() {
    this.seciliArac = null;
    this.yuruyusDakika = null;
    if (this.rotaCizgisi) {
      this.map.removeLayer(this.rotaCizgisi);
      this.rotaCizgisi = null;
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
            message: `${this.seciliArac.marka} ${this.seciliArac.model} kiralaması başlatıldı!`,
            duration: 2500,
            color: 'success',
            position: 'top'
          });
          await toast.present();
          this.seciliyiKapat();
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

  async kiralamayiBitir() {
    if (!this.aktifKiralamaId || !this.seciliArac) return;

    const alert = await this.alertCtrl.create({
      header: 'Kiralamayı Bitir',
      message: `${this.seciliArac.marka} ${this.seciliArac.model} kiralamasını bitirmek istediğine emin misin?`,
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Bitir',
          role: 'destructive',
          handler: () => {
            const token = localStorage.getItem('token');
            const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

            this.http.put(`http://localhost:3000/kiralamalar/${this.aktifKiralamaId}/bitir`, {}, { headers })
              .subscribe({
                next: async () => {
                  const toast = await this.toastCtrl.create({
                    message: 'Kiralama bitirildi',
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                  });
                  await toast.present();
                  this.seciliyiKapat();
                  this.araclariGetir();
                },
                error: async () => {
                  const toast = await this.toastCtrl.create({
                    message: 'Bir hata oluştu',
                    duration: 2000,
                    color: 'danger',
                    position: 'top'
                  });
                  await toast.present();
                }
              });
          }
        }
      ]
    });
    await alert.present();
  }

  tileDegistir() {
    const isDark = document.documentElement.classList.contains('ion-palette-dark');
    const url = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    if (this.tileKatmani) {
      this.map.removeLayer(this.tileKatmani);
    }
    this.tileKatmani = L.tileLayer(url, {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(this.map);
  }

  // ─── Araç Simülasyonu ───────────────────────────────────

  simulasyonBaslat() {
    if (this.simAktif || !this.aktifKiralamaAracId) return;

    const arac = this.araclar.find(a => a.id === this.aktifKiralamaAracId);
    if (!arac) return;

    this.simAktif = true;
    this.araclariHaritayaEkle(); // Remove the static marker
    this.simMevcutKonum = { lat: arac.latitude, lng: arac.longitude };
    this.simIzNoktalar = [[arac.latitude, arac.longitude]];

    // Simülasyon marker'ı oluştur — animasyonlu gradient marker
    this.simMarkerOlustur();

    // İlk hedefi belirle
    this.yeniHedefBelirle();

    // Her 2 saniyede aracı ilerlet
    this.simInterval = setInterval(() => {
      this.simAdimAt();
    }, 2000);
  }

  simulasyonDurdur() {
    this.simAktif = false;
    this.simTakipModu = false;
    this.araclariHaritayaEkle(); // Restore the static marker

    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    if (this.simMarker && this.map) {
      this.map.removeLayer(this.simMarker);
      this.simMarker = null;
    }
    if (this.simRotaCizgisi && this.map) {
      this.map.removeLayer(this.simRotaCizgisi);
      this.simRotaCizgisi = null;
    }
    if (this.simIzCizgisi && this.map) {
      this.map.removeLayer(this.simIzCizgisi);
      this.simIzCizgisi = null;
    }
    this.simHedef = null;
    this.simMevcutKonum = null;
    this.simIzNoktalar = [];
  }

  private simMarkerOlustur() {
    if (this.simMarker && this.map) {
      this.map.removeLayer(this.simMarker);
    }
    if (!this.simMevcutKonum) return;

    const carSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11L6.5 6.5C6.78 5.61 7.61 5 8.55 5H15.45C16.39 5 17.22 5.61 17.5 6.5L19 11M5 11H19M5 11V17C5 17.55 5.45 18 6 18H7C7.55 18 8 17.55 8 17V16H16V17C16 17.55 16.45 18 17 18H18C18.55 18 19 17.55 19 17V11M7.5 14C8.05 14 8.5 13.55 8.5 13C8.5 12.45 8.05 12 7.5 12C6.95 12 6.5 12.45 6.5 13C6.5 13.55 6.95 14 7.5 14ZM16.5 14C17.05 14 17.5 13.55 17.5 13C17.5 12.45 17.05 12 16.5 12C15.95 12 15.5 12.45 15.5 13C15.5 13.55 15.95 14 16.5 14Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const simIcon = L.divIcon({
      html: `<div class="sim-marker-container">
        <div class="sim-pulse-ring"></div>
        <div class="sim-marker">${carSvg}</div>
      </div>`,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
      className: ''
    });

    this.simMarker = L.marker(
      [this.simMevcutKonum.lat, this.simMevcutKonum.lng],
      { icon: simIcon, zIndexOffset: 1000 }
    ).addTo(this.map);

    this.simMarker.on('click', () => {
      const arac = this.araclar.find(a => a.id === this.aktifKiralamaAracId);
      if (arac && this.simMevcutKonum) {
        arac.latitude = this.simMevcutKonum.lat;
        arac.longitude = this.simMevcutKonum.lng;
        arac.mesafe = this.mesafeHesapla(
          this.kullaniciKonumu.lat, this.kullaniciKonumu.lng,
          this.simMevcutKonum.lat, this.simMevcutKonum.lng
        );
        this.aracSec(arac);
      }
    });
  }

  private yeniHedefBelirle() {
    if (!this.simMevcutKonum) return;
    // Mevcut konumdan 200-600m rastgele bir yöne hedef belirle
    this.simHedef = this.yakinKonumUret(
      this.simMevcutKonum.lat,
      this.simMevcutKonum.lng,
      300 + Math.random() * 300 // 300-600m arası
    );

    // Hedef çizgisini temizle
    if (this.simRotaCizgisi && this.map) {
      this.map.removeLayer(this.simRotaCizgisi);
      this.simRotaCizgisi = null;
    }
  }

  private simAdimAt() {
    if (!this.simMevcutKonum || !this.simHedef) return;

    const mesafe = this.mesafeHesapla(
      this.simMevcutKonum.lat, this.simMevcutKonum.lng,
      this.simHedef.lat, this.simHedef.lng
    );

    // Hedefe ulaştıysa yeni hedef belirle
    if (mesafe < 50) {
      this.yeniHedefBelirle();
      return;
    }

    // ~30m ilerle (her 2 saniyede ~54 km/sa → şehir içi hız hissi)
    const adimMetre = 25 + Math.random() * 15; // 25-40m arası
    const oran = adimMetre / mesafe;

    const yeniLat = this.simMevcutKonum.lat + (this.simHedef.lat - this.simMevcutKonum.lat) * oran;
    const yeniLng = this.simMevcutKonum.lng + (this.simHedef.lng - this.simMevcutKonum.lng) * oran;

    this.simMevcutKonum = { lat: yeniLat, lng: yeniLng };

    // Marker'ı güncelle
    if (this.simMarker) {
      this.simMarker.setLatLng([yeniLat, yeniLng]);
    }

    // İz noktalarını güncelle
    this.simIzNoktalar.push([yeniLat, yeniLng]);
    // Max 50 nokta tut
    if (this.simIzNoktalar.length > 50) {
      this.simIzNoktalar = this.simIzNoktalar.slice(-50);
    }

    // İz çizgisini güncelle
    if (this.simIzCizgisi && this.map) {
      this.map.removeLayer(this.simIzCizgisi);
    }
    this.simIzCizgisi = L.polyline(this.simIzNoktalar, {
      color: '#22c55e',
      weight: 3,
      opacity: 0.4,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    // Hedef çizgisini temizle
    if (this.simRotaCizgisi && this.map) {
      this.map.removeLayer(this.simRotaCizgisi);
      this.simRotaCizgisi = null;
    }

    // Takip modundaysa haritayı kaydır
    if (this.simTakipModu) {
      this.map.panTo([yeniLat, yeniLng], { animate: true, duration: 1.5 });
    }

    // Seçili araç güncelle (bottom sheet açıksa)
    if (this.seciliArac && this.seciliArac.id === this.aktifKiralamaAracId) {
      this.seciliArac.latitude = yeniLat;
      this.seciliArac.longitude = yeniLng;
      this.seciliArac.mesafe = this.mesafeHesapla(
        this.kullaniciKonumu.lat, this.kullaniciKonumu.lng,
        yeniLat, yeniLng
      );
      this.yuruyusDakika = Math.max(1, Math.ceil(this.seciliArac.mesafe / 80));
    }
  }

  takipModunuDegistir() {
    this.simTakipModu = !this.simTakipModu;
    if (this.simTakipModu && this.simMevcutKonum) {
      this.map.setView([this.simMevcutKonum.lat, this.simMevcutKonum.lng], 16, { animate: true });
    }
  }
}