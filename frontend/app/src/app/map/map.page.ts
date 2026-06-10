import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController, AlertController } from '@ionic/angular/standalone';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { forkJoin, timeout } from 'rxjs';
import { addIcons } from 'ionicons';
import { cogOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { PaymentModalComponent, OdemeBilgisi } from '../payment-modal/payment-modal.component';
import { RentalChecklistComponent, ChecklistAdimi } from '../rental-checklist/rental-checklist.component';
import { AgreementModalComponent } from '../agreement-modal/agreement-modal.component';
import { RentalSummaryModalComponent } from '../rental-summary-modal/rental-summary-modal.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, PaymentModalComponent, RentalChecklistComponent, AgreementModalComponent, RentalSummaryModalComponent],
})
export class MapPage implements AfterViewInit, OnDestroy {
  map: any;
  araclar: any[] = [];
  yakindakiAraclar: any[] = [];
  seciliArac: any = null;
  kullaniciKonumu: { lat: number; lng: number } = { lat: 41.0082, lng: 28.9784 };
  sadeceMusait = true;
  kasaTipleri: string[] = [];
  seciliKasaTipi: string | null = null;
  seciliFiyatSinifi: string | null = null;
  private readonly KASA_SIRASI = ['Hatchback', 'Sedan', 'SUV', 'Spor'];
  private readonly FİYAT_SIRASI = ['Ekonomik', 'Orta Sınıf', 'Lüks', 'Spor', 'Elektrikli', 'Manuel', 'Otomatik'];
  enYakinArac: any = null;
  markerlar: any[] = [];
  private clusterGroup: any = null;
  aktifKiralamaAracId: number | null = null;
  aktifKiralamaId: number | null = null;
  aktifKiralamaBaslangici: string | null = null;
  aktifKiralamaTipi: 'saatlik' | 'gunluk' | null = null;
  aktifKiralamaSure: number | null = null;
  kalanSure = '';
  sureDoldu = false;
  private otomatikBitisTetiklendi = false;
  yukleniyor = true;
  userMarker: any = null;
  rotaCizgisi: any = null;
  yuruyusDakika: number | null = null;

  // Bottom-sheet aşağı sürükleyerek kapatma
  sheetKaydirma = 0;            // anlık translateY (px)
  sheetSurukleniyor = false;    // parmak basılıyken transition kapalı
  private sheetBaslangicY = 0;

  private tileKatmani: any = null;
  private temaGozlemcisi: MutationObserver | null = null;
  private sureSayaci: any = null;

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

  // Sözleşme modalı
  agreementModalOpen = false;
  agreementModalRentalId: number | null = null;
  agreementModalArac: any = null;

  // Kiralama tipi & onay
  kiralamaSecimi: 'saatlik' | 'gunluk' = 'gunluk';
  onayModalAcik = false;

  // Ödeme modal durumu
  odemeAcik = false;
  odemeDurum: 'form' | 'isleniyor' | 'basarili' | 'hata' = 'form';
  odemeHataMesaji = '';
  private odemeSonrasiKiralamaId: number | null = null;
  private odemeSonrasiIlkKiralama = false;
  private odemeSonrasiArac: any = null;

  // Başlangıç checklist'i
  baslangicChecklistAcik = false;
  baslangicChecklistAdimlari: ChecklistAdimi[] = [
    { ikon: 'konum',  renk: 'mavi',    baslik: 'Araca Yakın Olun',     aciklama: 'Sürüşe başlamadan önce aracın yanında olduğunuzdan emin olun.' },
    { ikon: 'arama',  renk: 'turuncu', baslik: 'Aracı Kontrol Edin',   aciklama: 'Aracı dışarıdan inceleyin. Hasar veya eksiklik varsa mutlaka bildirin.' },
    { ikon: 'roket',  renk: 'yesil',   baslik: 'İyi Yolculuklar!',     aciklama: 'Her şey hazır. Güvenli sürüşler dileriz.' },
  ];

  // Bitiş checklist'i
  bitisChecklistAcik = false;
  bitisChecklistYukleniyor = false;
  bitisChecklistAdimlari: ChecklistAdimi[] = [
    { ikon: 'kilit', renk: 'turuncu', baslik: 'Aracı Güvenli Park Edin',   aciklama: 'Kapıları kilitlediğinizden, farların ve müziğin kapalı olduğundan emin olun.' },
    { ikon: 'canta', renk: 'mavi',    baslik: 'Eşyalarınızı Unutmayın',     aciklama: 'Çantanızı, telefonunuzu ve değerli eşyalarınızı araçta bırakmayın.' },
    { ikon: 'el',    renk: 'yesil',   baslik: 'Tekrar Görüşmek Üzere',      aciklama: 'Bizi tercih ettiğiniz için teşekkürler. Yine bekleriz!' },
  ];

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ cogOutline, checkmarkCircleOutline, closeCircleOutline });
  }

  // Kiralama bittikten sonra kullanıcıya aracı değerlendirmek isteyip istemediğini sorar
  private async degerlendirmeSorusu(aracId: number | null, aracAdi: string) {
    if (!aracId) return;
    const alert = await this.alertCtrl.create({
      header: 'Nasıldı?',
      message: `${aracAdi} aracını değerlendirmek ister misin?`,
      buttons: [
        { text: 'Şimdi değil', role: 'cancel' },
        {
          text: 'Değerlendir',
          handler: () => this.router.navigate(['/detail', aracId], { queryParams: { degerlendir: 1 } }),
        },
      ],
    });
    await alert.present();
  }

  detayaGit() {
    if (!this.seciliArac) return;
    this.router.navigate(['/detail', this.seciliArac.id]);
  }

  yolTarifiAc() {
    if (!this.seciliArac) return;
    const { latitude, longitude } = this.seciliArac;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_system');
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
    this.sureSayaciniDurdur();
  }

  async konumAl() {
    try {
      await Geolocation.requestPermissions();
      const pos = await Promise.race([
        Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 6000 }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000))
      ]);
      this.kullaniciKonumu = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      // izin verilmedi veya timeout — varsayılan konumla devam
    }
    this.haritayiBaslat();
    this.araclariGetir();
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

  private yuklemToast: any = null;

  async araclariGetir() {
    this.yukleniyor = true;

    this.yuklemToast = await this.toastCtrl.create({
      message: 'Araçlar yükleniyor...',
      position: 'top',
      color: 'dark',
      cssClass: 'yukleme-toast',
    });
    await this.yuklemToast.present();

    forkJoin({
      kiralamalar: this.http.get<any[]>(`${environment.API_BASE}/kiralamalar`),
      araclar: this.http.get<any[]>(`${environment.API_BASE}/araclar`)
    }).pipe(timeout(20000)).subscribe({
      next: async (sonuclar) => {
        await this.yuklemToast?.dismiss();
        const kiralamalar = sonuclar.kiralamalar;
        const data = sonuclar.araclar;

        const aktif = kiralamalar.find(k => k.durum === 'aktif');
        this.aktifKiralamaAracId = aktif ? aktif.arac_id : null;
        this.aktifKiralamaId = aktif ? aktif.id : null;
        this.aktifKiralamaBaslangici = aktif ? aktif.baslangic_tarihi : null;
        this.aktifKiralamaTipi = aktif ? aktif.kiralama_tipi : null;
        this.aktifKiralamaSure = aktif ? Number(aktif.sure) : null;

        if (this.aktifKiralamaBaslangici && !this.sureSayaci) {
          this.sureSayaciniBaslat();
        } else if (!this.aktifKiralamaBaslangici) {
          this.sureSayaciniDurdur();
        }

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

        // Kasa tipi listesini güncelle
        const kasaSet = new Set<string>(this.araclar.map(a => a.kasa_tipi).filter(Boolean));
        this.kasaTipleri = [
          ...this.KASA_SIRASI.filter(k => kasaSet.has(k)),
          ...Array.from(kasaSet).filter(k => !this.KASA_SIRASI.includes(k))
        ];

        this.filtreUygula();
        this.yukleniyor = false;

        // Aktif kiralama varsa simülasyonu başlat
        if (this.aktifKiralamaAracId) {
          this.simulasyonBaslat();
        }
      },
      error: async () => {
        await this.yuklemToast?.dismiss();
        this.yukleniyor = false;
        const toast = await this.toastCtrl.create({
          message: 'Veriler yüklenemedi. Bağlantını kontrol et.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
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
    this.filtreUygula();
  }

  get mevcutFiyatSiniflari(): string[] {
    if (!this.seciliKasaTipi) return [];
    const araçlar = this.araclar.filter(a => a.kasa_tipi === this.seciliKasaTipi);
    const sinifSet = new Set<string>(araçlar.map(a => a.kategori).filter(Boolean));
    return this.FİYAT_SIRASI.filter(k => sinifSet.has(k));
  }

  fiyatSinifinSec(sinif: string) {
    this.seciliFiyatSinifi = this.seciliFiyatSinifi === sinif ? null : sinif;
    this.filtreUygula();
  }

  filtreUygula() {
    let liste = this.aktifKiralamaAracId
      ? this.araclar.filter(a => a.id === this.aktifKiralamaAracId)
      : (this.sadeceMusait ? this.araclar.filter(a => a.musait) : this.araclar);

    if (!this.aktifKiralamaAracId) {
      if (this.seciliKasaTipi) liste = liste.filter(a => a.kasa_tipi === this.seciliKasaTipi);
      if (this.seciliFiyatSinifi) liste = liste.filter(a => a.kategori === this.seciliFiyatSinifi);
    }

    this.yakindakiAraclar = liste;
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
    // Eski cluster group'u kaldır
    if (this.clusterGroup && this.map) {
      this.map.removeLayer(this.clusterGroup);
    }
    // Doğrudan haritaya eklenmiş marker'ları (ör. benim aracım) kaldır —
    // yoksa kiralama bitince eski konumda öksüz mavi marker kalır.
    if (this.map) {
      this.markerlar.forEach(m => {
        if (this.map.hasLayer(m)) this.map.removeLayer(m);
      });
    }
    this.markerlar = [];

    const carSvgFn = (strokeColor: string) =>
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11L6.5 6.5C6.78 5.61 7.61 5 8.55 5H15.45C16.39 5 17.22 5.61 17.5 6.5L19 11M5 11H19M5 11V17C5 17.55 5.45 18 6 18H7C7.55 18 8 17.55 8 17V16H16V17C16 17.55 16.45 18 17 18H18C18.55 18 19 17.55 19 17V11M7.5 14C8.05 14 8.5 13.55 8.5 13C8.5 12.45 8.05 12 7.5 12C6.95 12 6.5 12.45 6.5 13C6.5 13.55 6.95 14 7.5 14ZM16.5 14C17.05 14 17.5 13.55 17.5 13C17.5 12.45 17.05 12 16.5 12C15.95 12 15.5 12.45 15.5 13C15.5 13.55 15.95 14 16.5 14Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

    // Cluster group: benim aracım için devre dışı, diğerleri cluster'lanır
    this.clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 55,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="drv-cluster"><span>${count}</span></div>`,
          className: '',
          iconSize: [44, 44]
        });
      }
    });

    this.yakindakiAraclar.forEach(arac => {
      if (this.simAktif && arac.id === this.aktifKiralamaAracId) return;

      const benimAracim = this.aktifKiralamaAracId === arac.id;
      const opacity = benimAracim ? 1 : (arac.musait ? 1 : 0.5);
      const strokeColor = benimAracim ? '#ffffff' : '#1a1a1a';
      const bgColor = benimAracim ? 'var(--app-primary)' : '#ffffff';
      const ringStyle = benimAracim
        ? 'box-shadow:0 0 0 4px rgba(74,158,255,0.35),0 4px 12px rgba(0,0,0,0.4);'
        : 'box-shadow:0 4px 12px rgba(0,0,0,0.4);';

      const aracIcon = L.divIcon({
        html: `<div style="width:40px;height:40px;background:${bgColor};border-radius:50%;display:flex;align-items:center;justify-content:center;${ringStyle}opacity:${opacity};">${carSvgFn(strokeColor)}</div>`,
        iconSize: [40, 40],
        className: ''
      });

      const marker = L.marker([arac.latitude, arac.longitude], { icon: aracIcon });
      marker.on('click', () => this.aracSec(arac));

      if (benimAracim) {
        marker.addTo(this.map); // Benim aracım direkt haritaya (cluster dışı)
      } else {
        this.clusterGroup.addLayer(marker);
      }

      this.markerlar.push(marker);
    });

    this.map.addLayer(this.clusterGroup);
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
    this.sheetKaydirma = 0;
    this.sheetSurukleniyor = false;
    if (this.rotaCizgisi) {
      this.map.removeLayer(this.rotaCizgisi);
      this.rotaCizgisi = null;
    }
  }

  // ─── Bottom-sheet aşağı sürükleyerek kapatma ───────────────
  sheetSurukleBaslat(ev: PointerEvent) {
    this.sheetBaslangicY = ev.clientY;
    this.sheetSurukleniyor = true;
  }

  sheetSurukleHareket(ev: PointerEvent) {
    if (!this.sheetSurukleniyor) return;
    // sadece aşağı yönde harekete izin ver
    this.sheetKaydirma = Math.max(0, ev.clientY - this.sheetBaslangicY);
  }

  sheetSurukleBitir() {
    if (!this.sheetSurukleniyor) return;
    this.sheetSurukleniyor = false;
    // ~110px'den fazla çekildiyse kapat, değilse geri otur
    if (this.sheetKaydirma > 110) {
      this.sheetKaydirma = window.innerHeight; // tamamen aşağı kaydır
      setTimeout(() => this.seciliyiKapat(), 240);
    } else {
      this.sheetKaydirma = 0;
    }
  }

  kirala() {
    if (!this.seciliArac) return;
    this.onayModalAcik = true;
  }

  onayOnayla() {
    this.onayModalAcik = false;
    this.odemeDurum = 'form';
    this.odemeHataMesaji = '';
    this.odemeAcik = true;
  }

  onayVazgec() {
    this.onayModalAcik = false;
  }

  get odemeAracMetni(): string {
    if (!this.seciliArac) return '';
    return `${this.seciliArac.marka} ${this.seciliArac.model}`;
  }

  get odemeOzetMetni(): string {
    if (this.kiralamaSecimi === 'saatlik') return '1 saat';
    if (this.kiralamaSecimi === 'gunluk') return '1 gün';
    return '';
  }

  get odemeToplamTutar(): number {
    if (!this.seciliArac) return 0;
    if (this.kiralamaSecimi === 'saatlik') return Number(this.seciliArac.saatlik_fiyat) || 0;
    if (this.kiralamaSecimi === 'gunluk') return Number(this.seciliArac.gunluk_fiyat) || 0;
    return 0;
  }

  odemeKapat() {
    if (this.odemeDurum === 'isleniyor') return;
    this.odemeAcik = false;
    this.odemeDurum = 'form';
  }

  odemeOnayla(odeme: OdemeBilgisi) {
    if (!this.seciliArac || !this.kiralamaSecimi) return;
    this.odemeDurum = 'isleniyor';
    this.odemeHataMesaji = '';
    const arac = this.seciliArac;

    const govde = {
      arac_id: arac.id,
      kiralama_tipi: this.kiralamaSecimi,
      sure: 1,
      ...odeme,
    };

    setTimeout(() => {
      this.http.post<any>(`${environment.API_BASE}/kiralamalar`, govde)
        .subscribe({
          next: (response) => {
            this.odemeSonrasiArac = arac;
            this.odemeSonrasiKiralamaId = response.kiralama?.id ?? null;
            this.odemeSonrasiIlkKiralama = !!response.is_first_rental;
            this.odemeDurum = 'basarili';
          },
          error: async (err) => {
            if (err.error?.kod === 'EMAIL_DOGRULANMADI') {
              this.odemeAcik = false;
              this.odemeDurum = 'form';
              const toast = await this.toastCtrl.create({
                message: err.error.hata,
                duration: 3500,
                color: 'warning',
                position: 'top',
                buttons: [{
                  text: 'Profil',
                  handler: () => this.router.navigate(['/tabs/profil'])
                }]
              });
              await toast.present();
              return;
            }
            this.odemeDurum = 'hata';
            this.odemeHataMesaji = err.error?.hata || 'Ödeme alınırken bir hata oluştu';
          }
        });
    }, 1400);
  }

  odemeTamamlandi() {
    this.odemeAcik = false;
    this.odemeDurum = 'form';

    if (this.odemeSonrasiIlkKiralama && this.odemeSonrasiKiralamaId) {
      this.agreementModalArac = this.odemeSonrasiArac;
      this.agreementModalRentalId = this.odemeSonrasiKiralamaId;
      this.agreementModalOpen = true;
    } else {
      this.baslangicChecklistAcik = true;
    }
  }

  baslangicChecklistKapat() {
    this.baslangicChecklistAcik = false;
  }

  async baslangicChecklistTamam() {
    this.baslangicChecklistAcik = false;
    const arac = this.odemeSonrasiArac || this.seciliArac;
    const aracMetin = arac ? `${arac.marka} ${arac.model}` : 'Araç';
    const toast = await this.toastCtrl.create({
      message: `${aracMetin} kiralandı! İyi yolculuklar.`,
      duration: 2500,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    this.odemeSonrasiKiralamaId = null;
    this.odemeSonrasiIlkKiralama = false;
    this.odemeSonrasiArac = null;
    this.seciliyiKapat();
    this.araclariGetir();
  }

  acceptAgreement() {
    if (!this.agreementModalRentalId) return;

    const kiralama_id = this.agreementModalRentalId;
    this.http.post(`${environment.API_BASE}/kiralamalar/confirm-agreement`,
      { kiralama_id }
    ).subscribe({
      next: () => {
        this.agreementModalOpen = false;
        this.agreementModalRentalId = null;
        this.agreementModalArac = null;
        this.baslangicChecklistAcik = true;
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: err.error?.hata || 'Sözleşme onaylanırken hata oluştu',
          duration: 2500,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  rejectAgreement() {
    if (!this.agreementModalRentalId) return;
    const kiralama_id = this.agreementModalRentalId;
    this.agreementModalOpen = false;
    this.agreementModalRentalId = null;
    this.agreementModalArac = null;
    this.kiralamayiIptal(kiralama_id);
  }

  private kiralamayiIptal(kiralama_id: number) {
    this.http.put(`${environment.API_BASE}/kiralamalar/${kiralama_id}/bitir`, {})
      .subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({
            message: 'Kiralama iptal edildi.',
            duration: 2500,
            color: 'warning',
            position: 'top'
          });
          await toast.present();
          this.araclariGetir();
        },
        error: async () => {
          const toast = await this.toastCtrl.create({
            message: 'Hata oluştu.',
            duration: 2500,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
        }
      });
  }

  kiralamayiBitir() {
    if (!this.aktifKiralamaId) return;
    this.bitisChecklistYukleniyor = false;
    this.bitisChecklistAcik = true;
  }

  // Süre dolunca kiralamayı checklist olmadan otomatik sonlandır
  private otomatikBitir() {
    if (this.otomatikBitisTetiklendi || !this.aktifKiralamaId) return;
    this.otomatikBitisTetiklendi = true;
    const id = this.aktifKiralamaId;
    const aracId = this.aktifKiralamaAracId;
    const bitenArac = this.araclar.find(a => a.id === aracId);
    const aracAdi = bitenArac ? `${bitenArac.marka} ${bitenArac.model}` : 'Araç';

    this.http.put(`${environment.API_BASE}/kiralamalar/${id}/bitir`, {})
      .subscribe({
        next: async () => {
          // Açık olabilecek bitiş checklist'i / bottom sheet kapansın
          this.bitisChecklistAcik = false;
          this.seciliyiKapat();
          const toast = await this.toastCtrl.create({
            message: 'Kiralama süresi doldu, otomatik olarak sonlandırıldı.',
            duration: 3500, color: 'warning', position: 'top'
          });
          await toast.present();
          this.araclariGetir();
          await this.degerlendirmeSorusu(aracId, aracAdi);
        },
        error: async () => {
          const toast = await this.toastCtrl.create({
            message: 'Kiralama otomatik sonlandırılamadı, tekrar denenecek.',
            duration: 3000, color: 'danger', position: 'top'
          });
          await toast.present();
          // Her saniye yeniden denemesin diye 15 sn sonra tekrar dene
          setTimeout(() => { this.otomatikBitisTetiklendi = false; }, 15000);
        }
      });
  }

  bitisChecklistKapat() {
    if (this.bitisChecklistYukleniyor) return;
    this.bitisChecklistAcik = false;
  }

  bitisChecklistTamam() {
    if (!this.aktifKiralamaId) return;
    const id = this.aktifKiralamaId;
    const aracId = this.aktifKiralamaAracId;
    const bitenArac = this.araclar.find(a => a.id === aracId);
    const aracAdi = bitenArac ? `${bitenArac.marka} ${bitenArac.model}` : 'Araç';

    this.bitisChecklistYukleniyor = true;
    this.http.put(`${environment.API_BASE}/kiralamalar/${id}/bitir`, {})
      .subscribe({
        next: async () => {
          this.bitisChecklistYukleniyor = false;
          this.bitisChecklistAcik = false;
          const toast = await this.toastCtrl.create({
            message: 'Kiralama bitirildi. Tekrar görüşmek üzere!',
            duration: 2400, color: 'success', position: 'top'
          });
          await toast.present();
          this.seciliyiKapat();
          this.araclariGetir();
          await this.degerlendirmeSorusu(aracId, aracAdi);
        },
        error: async (err) => {
          this.bitisChecklistYukleniyor = false;
          const toast = await this.toastCtrl.create({
            message: err.error?.hata || 'Bir hata oluştu',
            duration: 2400, color: 'danger', position: 'top'
          });
          await toast.present();
        }
      });
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

  private sureSayaciniBaslat() {
    this.otomatikBitisTetiklendi = false;
    this.kalanSureHesapla();
    this.sureSayaci = setInterval(() => this.kalanSureHesapla(), 1000);
  }

  private sureSayaciniDurdur() {
    if (this.sureSayaci) {
      clearInterval(this.sureSayaci);
      this.sureSayaci = null;
    }
    this.kalanSure = '';
    this.sureDoldu = false;
  }

  // Kiralamanın bitiş zamanı (ms) = başlangıç + sure × birim
  private kiralamaBitisZamani(): number | null {
    if (!this.aktifKiralamaBaslangici || !this.aktifKiralamaSure) return null;
    const baslangic = new Date(this.aktifKiralamaBaslangici).getTime();
    const birimMs = this.aktifKiralamaTipi === 'saatlik' ? 3_600_000 : 86_400_000;
    return baslangic + this.aktifKiralamaSure * birimMs;
  }

  // Belirlenen süreden itibaren geri sayım
  private kalanSureHesapla() {
    const bitis = this.kiralamaBitisZamani();
    if (bitis === null) { this.kalanSure = ''; this.sureDoldu = false; return; }

    let farkSn = Math.floor((bitis - Date.now()) / 1000);
    if (farkSn <= 0) {
      this.kalanSure = 'Süre doldu';
      this.sureDoldu = true;
      this.otomatikBitir();
      return;
    }
    this.sureDoldu = false;

    const gun = Math.floor(farkSn / 86400);
    const saat = Math.floor((farkSn % 86400) / 3600);
    const dakika = Math.floor((farkSn % 3600) / 60);
    const saniye = farkSn % 60;

    if (gun > 0) {
      this.kalanSure = `${gun} g ${saat} sa ${String(dakika).padStart(2, '0')} dk`;
    } else if (saat > 0) {
      this.kalanSure = `${saat} sa ${String(dakika).padStart(2, '0')} dk`;
    } else {
      this.kalanSure = `${dakika} dk ${String(saniye).padStart(2, '0')} sn`;
    }
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