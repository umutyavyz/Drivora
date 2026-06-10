import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  addOutline,
  barChartOutline,
  carOutline,
  cashOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  homeOutline,
  keyOutline,
  logOutOutline,
  mailOutline,
  peopleOutline,
  personOutline,
  searchOutline,
  settingsOutline,
  shieldOutline,
  timeOutline,
  trashOutline,
  trophyOutline
} from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

type AdminSekme = 'araclar' | 'kullanicilar' | 'kiralamalar' | 'istatistikler';
type AltSekme = 'panel' | 'istatistik' | 'profil';
type KiralamaSekmesi = 'aktif' | 'tamamlandi';
type KullaniciRol = 'kullanici' | 'admin';

interface Arac {
  id: number;
  marka: string;
  model: string;
  musait: boolean;
  gunluk_fiyat: number;
  saatlik_fiyat?: number | null;
  resim_url?: string | null;
  resim_urls?: string[] | null;
  kategori?: string | null;
  kasa_tipi?: string | null;
  yakit?: string | null;
  vites?: string | null;
}

interface Kullanici {
  id: number;
  email: string;
  rol: KullaniciRol;
  ad_soyad?: string | null;
  telefon?: string | null;
  dogum_tarihi?: string | null;
}

interface KiralamaKaydi {
  id: number;
  kullanici_id: number;
  arac_id: number;
  kullanici_email: string;
  marka: string;
  model: string;
  gunluk_fiyat: number;
  durum: KiralamaSekmesi;
  baslangic_tarihi: string;
  bitis_tarihi?: string | null;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class AdminPage implements OnInit, OnDestroy {
  private readonly API_BASE = environment.API_BASE;
  private destroy$ = new Subject<void>();

  isAdmin = false;
  aktifSekme: AdminSekme = 'araclar';
  aktifKiralamaSekmesi: KiralamaSekmesi = 'aktif';
  altSekme: AltSekme = 'panel';
  adminEmail = '';
  adminAd = '';
  adminTokenExp: Date | null = null;

  araclar: Arac[] = [];
  kullanicilar: Kullanici[] = [];
  kiralamalar: KiralamaKaydi[] = [];

  yukleniyorAraclar = false;
  yukleniyorKullanicilar = false;
  yukleniyorKiralamalar = false;
  araclarYuklendi = false;
  kullanicilarYuklendi = false;
  kiralamalarYuklendi = false;

  aramaMetniArac = '';
  aramaMetniKullanici = '';
  aramaMetniKiralama = '';
  aracDurumFiltresi: 'hepsi' | 'musait' | 'dolu' = 'hepsi';

  aracFormAcik = false;
  aracDuzenleModu = false;
  aracFormVerisi: any = {
    id: null,
    marka: '',
    model: '',
    gunluk_fiyat: 1000,
    saatlik_fiyat: null,
    kategori: 'Ekonomik',
    kasa_tipi: 'Sedan',
    yakit: 'Benzin',
    vites: 'Otomatik',
    resim_url: '',
    resim_urls_metin: '',
    musait: true
  };

  kullaniciFormAcik = false;
  kullaniciDuzenleModu = false;
  kullaniciFormVerisi: any = {
    id: null,
    ad_soyad: '',
    email: '',
    sifre: '',
    rol: 'kullanici',
    telefon: '',
    dogum_tarihi: ''
  };
  bugun = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })();

  kategoriler = ['Ekonomik', 'Orta Sınıf', 'Lüks', 'Spor', 'Elektrikli', 'Manuel', 'Otomatik'];
  kasaTipleri = ['Hatchback', 'Sedan', 'SUV', 'Spor'];
  yakitlar = ['Benzin', 'Dizel', 'Hibrit', 'Elektrik'];
  vitesler = ['Manuel', 'Otomatik'];
  roller: KullaniciRol[] = ['kullanici', 'admin'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      addOutline, barChartOutline, carOutline, cashOutline, checkmarkOutline,
      closeOutline, createOutline, homeOutline, keyOutline, logOutOutline,
      mailOutline, peopleOutline, personOutline, searchOutline, settingsOutline,
      shieldOutline, timeOutline, trashOutline, trophyOutline
    });
  }

  ngOnInit() {
    this.rolKontrol();
    if (this.isAdmin) {
      this.tumVerileriYukle();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    this.rolKontrol();
    if (!this.isAdmin) return;
    if (!this.araclarYuklendi && !this.kullanicilarYuklendi && !this.kiralamalarYuklendi) {
      this.tumVerileriYukle();
    }
  }

  private tumVerileriYukle() {
    this.sekmeVerisiniYukle('araclar');
    this.sekmeVerisiniYukle('kullanicilar');
    this.sekmeVerisiniYukle('kiralamalar');
  }

  get headerBasligi(): string {
    if (this.altSekme === 'istatistik') return 'İstatistikler';
    if (this.altSekme === 'profil') return 'Profil';
    return 'Admin Paneli';
  }

  get panelAltBaslik(): string {
    if (this.altSekme === 'istatistik') return 'Genel istatistikler';
    if (this.altSekme === 'profil') return 'Hesap bilgileri';
    if (this.aktifSekme === 'araclar') return `${this.araclar.length} araç kayıtlı`;
    if (this.aktifSekme === 'kullanicilar') return `${this.kullanicilar.length} kullanıcı kayıtlı`;
    return `${this.filtrelenmisKiralamalar().length} kiralama gösteriliyor`;
  }

  sekmeDegistir(sekme: AdminSekme) {
    this.aktifSekme = sekme;
    if (sekme === 'istatistikler') {
      if (!this.araclarYuklendi) this.araclariGetir();
      if (!this.kullanicilarYuklendi) this.kullanicilariGetir();
      if (!this.kiralamalarYuklendi) this.kiralamalariGetir();
      return;
    }
    this.sekmeVerisiniYukle(sekme);
  }

  kiralamaSekmesiDegistir(sekme: KiralamaSekmesi) {
    this.aktifKiralamaSekmesi = sekme;
  }

  hizliEkleTikla() {
    if (this.aktifSekme === 'araclar') {
      this.yeniAracFormu();
      return;
    }
    if (this.aktifSekme === 'kullanicilar') {
      this.yeniKullaniciFormu();
    }
  }

  rolKontrol() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.isAdmin = decoded.rol === 'admin';
        this.adminEmail = decoded.email || '';
        this.adminAd = decoded.ad_soyad || '';
        this.adminTokenExp = decoded.exp ? new Date(decoded.exp * 1000) : null;
      } catch {
        this.isAdmin = false;
      }
    } else {
      this.isAdmin = false;
    }

    if (!this.isAdmin) {
      this.router.navigate(['/tabs/map']);
    }
  }

  altSekmeDegistir(sekme: AltSekme) {
    this.altSekme = sekme;
    if (sekme === 'istatistik') {
      if (!this.araclarYuklendi) this.araclariGetir();
      if (!this.kullanicilarYuklendi) this.kullanicilariGetir();
      if (!this.kiralamalarYuklendi) this.kiralamalariGetir();
    }
  }

  uygulamayaDon() {
    this.router.navigate(['/tabs/map']);
  }

  cikisYap() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  private async toastGoster(message: string, color: 'success' | 'danger' | 'warning', duration = 2200) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'top'
    });
    await toast.present();
  }

  private sekmeVerisiniYukle(sekme: AdminSekme, force = false) {
    if (sekme === 'istatistikler') return;
    if (sekme === 'araclar') {
      if (this.yukleniyorAraclar) return;
      if (!force && this.araclarYuklendi) return;
      this.araclariGetir();
      return;
    }

    if (sekme === 'kullanicilar') {
      if (this.yukleniyorKullanicilar) return;
      if (!force && this.kullanicilarYuklendi) return;
      this.kullanicilariGetir();
      return;
    }

    if (this.yukleniyorKiralamalar) return;
    if (!force && this.kiralamalarYuklendi) return;
    this.kiralamalariGetir();
  }

  // Araçlar
  araclariGetir() {
    this.yukleniyorAraclar = true;
    this.http.get<Arac[]>(`${this.API_BASE}/araclar`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.araclar = data;
        this.araclarYuklendi = true;
        this.yukleniyorAraclar = false;
      },
      error: async () => {
        this.yukleniyorAraclar = false;
        await this.toastGoster('Araçlar alınamadı', 'danger');
      }
    });
  }

  filtrelenmisAraclar() {
    let liste = this.araclar;
    if (this.aracDurumFiltresi === 'musait') {
      liste = liste.filter(a => a.musait);
    } else if (this.aracDurumFiltresi === 'dolu') {
      liste = liste.filter(a => !a.musait);
    }
    if (!this.aramaMetniArac.trim()) return liste;
    const arama = this.aramaMetniArac.toLowerCase();
    return liste.filter((a) =>
      a.marka?.toLowerCase().includes(arama) ||
      a.model?.toLowerCase().includes(arama) ||
      a.kategori?.toLowerCase().includes(arama)
    );
  }

  yeniAracFormu() {
    this.aracDuzenleModu = false;
    this.aracFormVerisi = {
      id: null,
      marka: '',
      model: '',
      gunluk_fiyat: 1000,
      saatlik_fiyat: null,
      kategori: 'Ekonomik',
      kasa_tipi: 'Sedan',
      yakit: 'Benzin',
      vites: 'Otomatik',
      resim_url: '',
      resim_urls_metin: '',
      musait: true
    };
    this.aracFormAcik = true;
  }

  aracDuzenleFormu(arac: Arac) {
    this.aracDuzenleModu = true;
    this.aracFormVerisi = {
      id: arac.id,
      marka: arac.marka,
      model: arac.model,
      gunluk_fiyat: arac.gunluk_fiyat,
      saatlik_fiyat: arac.saatlik_fiyat || null,
      kategori: arac.kategori || 'Ekonomik',
      kasa_tipi: arac.kasa_tipi || 'Sedan',
      yakit: arac.yakit || 'Benzin',
      vites: arac.vites || 'Otomatik',
      resim_url: arac.resim_url || '',
      resim_urls_metin: (arac.resim_urls || []).join('\n'),
      musait: arac.musait
    };
    this.aracFormAcik = true;
  }

  private resimUrlsParseEt(): string[] | null {
    const metin: string = this.aracFormVerisi.resim_urls_metin || '';
    const liste = metin.split('\n').map((u: string) => u.trim()).filter((u: string) => u.length > 0);
    return liste.length > 0 ? liste : null;
  }

  aracFormuKapat() {
    this.aracFormAcik = false;
  }

  toggleMusaitlikFormda() {
    // Sadece toggle yap, kontrol güncelle butonunda yapılacak
    this.aracFormVerisi.musait = !this.aracFormVerisi.musait;
  }

  async aracFormuKaydet() {
    if (!this.aracFormVerisi.marka.trim() || !this.aracFormVerisi.model.trim()) {
      await this.toastGoster('Marka ve model zorunludur', 'warning');
      return;
    }

    const body = {
      marka: this.aracFormVerisi.marka.trim(),
      model: this.aracFormVerisi.model.trim(),
      gunluk_fiyat: this.aracFormVerisi.gunluk_fiyat,
      saatlik_fiyat: this.aracFormVerisi.saatlik_fiyat || null,
      kategori: this.aracFormVerisi.kategori,
      kasa_tipi: this.aracFormVerisi.kasa_tipi,
      yakit: this.aracFormVerisi.yakit,
      vites: this.aracFormVerisi.vites,
      resim_url: this.aracFormVerisi.resim_url.trim() || null,
      resim_urls: this.resimUrlsParseEt(),
      musait: this.aracFormVerisi.musait
    };

    if (this.aracDuzenleModu) {
      // Eski aracı bul
      const eskiArac = this.araclar.find(a => a.id === this.aracFormVerisi.id);
      
      // Dolu→müsait geçişi kontrol et
      if (eskiArac && !eskiArac.musait && this.aracFormVerisi.musait) {
        // Dolu idi, müsait yapılıyor → kiralama kontrol et
        const aktifKiralama = this.kiralamalar.find(
          k => k.arac_id === this.aracFormVerisi.id && k.durum === 'aktif'
        );

        if (aktifKiralama) {
          const alert = await this.alertCtrl.create({
            header: 'Araç Müsaitlik Değiştirme',
            message: `Bu araç şuan "${aktifKiralama.kullanici_email}" kişisi tarafından kiralandı. Müsaitlik durumunu değiştirmek ister misiniz?\n\nEvet derse kiralama otomatik olarak sonlandırılacaktır.`,
            buttons: [
              { text: 'Vazgeç', role: 'cancel' },
              {
                text: 'Evet, değiştir',
                role: 'destructive',
                handler: () => {
                  this.aracGuncelleVeKiralamaBitir(body, aktifKiralama);
                }
              }
            ]
          });
          await alert.present();
          return;
        }
      }

      // Alert çıkmadı, direkt güncelle
      this.aracGuncelleYap(body);
      return;
    }

    this.http.post(`${this.API_BASE}/araclar`, body).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.aracFormAcik = false;
        this.araclariGetir();
        this.toastGoster('Araç eklendi', 'success');
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Araç eklenemedi', 'danger');
      }
    });
  }

  async aracSil(arac: Arac) {
    const aktifKiralama = this.kiralamalar.find(k => k.arac_id === arac.id && k.durum === 'aktif');

    let mesaj: string;
    if (aktifKiralama) {
      mesaj = `Bu araç şu an "${aktifKiralama.kullanici_email}" kullanıcısında. Yine de silmek istediğinizden emin misiniz?`;
    } else if (!arac.musait) {
      mesaj = `Bu araç dolu gözüküyor ancak aktif kiralaması yok. Yine de silmek ister misiniz?`;
    } else {
      mesaj = `${arac.marka} ${arac.model} aracını silmek istediğine emin misin?`;
    }

    const alert = await this.alertCtrl.create({
      header: 'Aracı Sil',
      message: mesaj,
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Sil',
          role: 'destructive',
          handler: () => this.aracSilIstegiGonder(arac.id)
        }
      ]
    });
    await alert.present();
  }

  aracSilIstegiGonder(id: number) {
    this.http.delete(`${this.API_BASE}/araclar/${id}`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.araclar = this.araclar.filter(a => a.id !== id);
        this.toastGoster('Araç silindi', 'success');
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Araç silinemedi', 'danger');
      }
    });
  }

  private aracGuncelleYap(body: any) {
    this.http.put(`${this.API_BASE}/araclar/${this.aracFormVerisi.id}`, body).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.aracFormAcik = false;
        this.araclariGetir();
        this.toastGoster('Araç güncellendi', 'success');
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Araç güncellenemedi', 'danger');
      }
    });
  }

  private aracGuncelleVeKiralamaBitir(body: any, kiralama: KiralamaKaydi) {
    // Admin endpoint'ini kullan: /kiralamalar/admin/:id/bitir
    this.http.put(`${this.API_BASE}/kiralamalar/admin/${kiralama.id}/bitir`, {}).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Kiralama bitti, şimdi araç güncelle
        this.aracGuncelleYap(body);
        this.toastGoster('Kiralama sonlandırıldı', 'success');
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Kiralama sonlandırılamadı', 'danger');
      }
    });
  }

  async musaitlikDegistir(arac: Arac): Promise<void> {
    // Dolu olan araç (musait=false) varsa ve değiştirilmek isteniyorsa kontrol et
    if (!arac.musait) {
      // Kiralamalar listesini güncel al, sonra kontrol et
      return new Promise<void>((resolve) => {
        this.http.get<KiralamaKaydi[]>(`${this.API_BASE}/kiralamalar/admin`).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: async (kiralamalar) => {
            const aktifKiralama = kiralamalar.find(k => k.arac_id === arac.id && k.durum === 'aktif');
            
            if (aktifKiralama) {
              const alert = await this.alertCtrl.create({
                header: 'Araç Müsaitlik Değiştirme',
                message: `Bu araç şuan "${aktifKiralama.kullanici_email}" kişisi tarafından kiralandı. Aracın müsaitlik durumunu değiştirmek ister misiniz?\n\nEvet derse kiralama otomatik olarak sonlandırılacaktır.`,
                buttons: [
                  { text: 'Vazgeç', role: 'cancel' },
                  {
                    text: 'Evet, değiştir',
                    role: 'destructive',
                    handler: () => {
                      this.musaitlikDegistirVeKiralamaBitir(arac, aktifKiralama);
                      resolve();
                    }
                  }
                ]
              });
              await alert.present();
              resolve();
            } else {
              // Alert çıkmadı, direkt değiştir
              this.musaitlikDegistirDirekt(arac);
              resolve();
            }
          },
          error: async () => {
            await this.toastGoster('Kiralamalar alınamadı', 'danger');
            resolve();
          }
        });
      });
    }

    // Müsait araç ise direkt değiştir
    this.musaitlikDegistirDirekt(arac);
    return;
  }

  private musaitlikDegistirDirekt(arac: Arac) {
    const body = { musait: !arac.musait, resim_urls: arac.resim_urls || null };
    this.http.put(`${this.API_BASE}/araclar/${arac.id}`, body).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        arac.musait = !arac.musait;
      }
    });
  }

  private musaitlikDegistirVeKiralamaBitir(arac: Arac, kiralama: KiralamaKaydi) {
    // Admin endpoint'ini kullan: /kiralamalar/admin/:id/bitir (kullanıcı kontrolü yok)
    this.http.put(`${this.API_BASE}/kiralamalar/admin/${kiralama.id}/bitir`, {}).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Kiralama bitti, şimdi aracın müsaitliğini değiştir
        const body = { musait: !arac.musait, resim_urls: arac.resim_urls || null };
        this.http.put(`${this.API_BASE}/araclar/${arac.id}`, body).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            arac.musait = !arac.musait;
            this.kiralamalariGetir(); // Kiralamalar listesini yenile
            this.toastGoster('Kiralama sonlandırıldı ve araç müsaitliği güncellendi', 'success');
          },
          error: (err) => {
            this.toastGoster(err.error?.hata || 'Araç müsaitliği güncellenemedi', 'danger');
          }
        });
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Kiralama sonlandırılamadı', 'danger');
      }
    });
  }

  // Kullanıcılar
  kullanicilariGetir() {
    this.yukleniyorKullanicilar = true;
    this.http.get<Kullanici[]>(`${this.API_BASE}/kullanicilar`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.kullanicilar = data;
        this.kullanicilarYuklendi = true;
        this.yukleniyorKullanicilar = false;
      },
      error: async () => {
        this.yukleniyorKullanicilar = false;
        await this.toastGoster('Kullanıcılar alınamadı', 'danger');
      }
    });
  }

  filtrelenmisKullanicilar() {
    if (!this.aramaMetniKullanici.trim()) return this.kullanicilar;
    const arama = this.aramaMetniKullanici.toLowerCase();
    return this.kullanicilar.filter((k) =>
      k.email?.toLowerCase().includes(arama) ||
      k.rol?.toLowerCase().includes(arama)
    );
  }

  yeniKullaniciFormu() {
    this.kullaniciDuzenleModu = false;
    this.kullaniciFormVerisi = {
      id: null,
      ad_soyad: '',
      email: '',
      sifre: '',
      rol: 'kullanici',
      telefon: '',
      dogum_tarihi: ''
    };
    this.kullaniciFormAcik = true;
  }

  kullaniciDuzenleFormu(kullanici: Kullanici) {
    this.kullaniciDuzenleModu = true;
    this.kullaniciFormVerisi = {
      id: kullanici.id,
      ad_soyad: kullanici.ad_soyad || '',
      email: kullanici.email,
      sifre: '',
      rol: kullanici.rol,
      telefon: kullanici.telefon || '',
      dogum_tarihi: kullanici.dogum_tarihi ? kullanici.dogum_tarihi.split('T')[0] : ''
    };
    this.kullaniciFormAcik = true;
  }

  kullaniciFormuKapat() {
    this.kullaniciFormAcik = false;
  }

  async kullaniciFormuKaydet() {
    const email = this.kullaniciFormVerisi.email?.trim();
    const sifre = this.kullaniciFormVerisi.sifre?.trim();
    const rol = this.kullaniciFormVerisi.rol;

    if (!email) {
      await this.toastGoster('Email zorunludur', 'warning');
      return;
    }

    if (!this.kullaniciDuzenleModu && !sifre) {
      await this.toastGoster('Yeni kullanıcı için şifre zorunludur', 'warning');
      return;
    }

    const ad_soyad = this.kullaniciFormVerisi.ad_soyad?.trim() || null;

    if (this.kullaniciDuzenleModu) {
      const body: any = {
        email, rol, ad_soyad,
        telefon: this.kullaniciFormVerisi.telefon?.trim() || null,
        dogum_tarihi: this.kullaniciFormVerisi.dogum_tarihi || null
      };
      if (sifre) body.sifre = sifre;

      this.http.put(`${this.API_BASE}/kullanicilar/${this.kullaniciFormVerisi.id}`, body).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.kullaniciFormAcik = false;
          this.kullanicilariGetir();
          this.toastGoster('Kullanıcı güncellendi', 'success');
        },
        error: (err) => {
          this.toastGoster(err.error?.hata || 'Kullanıcı güncellenemedi', 'danger');
        }
      });
      return;
    }

    this.http.post(`${this.API_BASE}/kullanicilar`, { email, sifre, rol, ad_soyad }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.kullaniciFormAcik = false;
        this.kullanicilariGetir();
        this.toastGoster('Kullanıcı eklendi', 'success');
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Kullanıcı eklenemedi', 'danger');
      }
    });
  }

  async kullaniciSil(kullanici: Kullanici) {
    const alert = await this.alertCtrl.create({
      header: 'Kullanıcıyı Sil',
      message: `${kullanici.email} hesabını silmek istediğine emin misin?`,
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Sil',
          role: 'destructive',
          handler: () => this.kullaniciSilIstegiGonder(kullanici.id)
        }
      ]
    });
    await alert.present();
  }

  kullaniciSilIstegiGonder(id: number) {
    this.http.delete(`${this.API_BASE}/kullanicilar/${id}`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.kullanicilar = this.kullanicilar.filter(k => k.id !== id);
        this.toastGoster('Kullanıcı silindi', 'success');
      },
      error: (err) => {
        this.toastGoster(err.error?.hata || 'Kullanıcı silinemedi', 'danger');
      }
    });
  }

  // Kiralamalar
  kiralamalariGetir() {
    this.yukleniyorKiralamalar = true;
    this.http.get<KiralamaKaydi[]>(`${this.API_BASE}/kiralamalar/admin`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.kiralamalar = data;
        this.kiralamalarYuklendi = true;
        this.yukleniyorKiralamalar = false;
      },
      error: async () => {
        this.yukleniyorKiralamalar = false;
        await this.toastGoster('Kiralamalar alınamadı', 'danger');
      }
    });
  }

  filtrelenmisKiralamalar() {
    const durumFiltreli = this.kiralamalar.filter((k) => k.durum === this.aktifKiralamaSekmesi);
    if (!this.aramaMetniKiralama.trim()) {
      return durumFiltreli;
    }

    const arama = this.aramaMetniKiralama.toLowerCase();
    return durumFiltreli.filter((k) =>
      k.kullanici_email?.toLowerCase().includes(arama) ||
      k.marka?.toLowerCase().includes(arama) ||
      k.model?.toLowerCase().includes(arama)
    );
  }

  // Profil getters
  get aktifKiralamaSayisi(): number {
    return this.kiralamalar.filter(k => k.durum === 'aktif').length;
  }

  oturumSuresiFormatla(): string {
    if (!this.adminTokenExp) return 'Bilinmiyor';
    const simdi = new Date();
    const fark = this.adminTokenExp.getTime() - simdi.getTime();
    if (fark <= 0) return 'Süresi dolmuş';
    const gun = Math.floor(fark / 86400000);
    const saat = Math.floor((fark % 86400000) / 3600000);
    if (gun > 0) return `${gun} gün ${saat} saat kaldı`;
    const dakika = Math.floor((fark % 3600000) / 60000);
    return `${saat} saat ${dakika} dk kaldı`;
  }

  // İstatistik getters
  get musaitAracSayisi(): number {
    return this.araclar.filter(a => a.musait).length;
  }

  get toplamGelir(): number {
    return this.kiralamalar
      .filter(k => k.durum === 'tamamlandi' && !!k.bitis_tarihi)
      .reduce((sum, k) => {
        const gun = Math.max(1, Math.ceil(
          (new Date(k.bitis_tarihi as string).getTime() - new Date(k.baslangic_tarihi).getTime()) / 86400000
        ));
        return sum + gun * k.gunluk_fiyat;
      }, 0);
  }

  get enCokKiralananAraclar(): { marka: string; model: string; sayi: number }[] {
    const sayac: Record<number, { marka: string; model: string; sayi: number }> = {};
    this.kiralamalar.forEach(k => {
      if (!sayac[k.arac_id]) sayac[k.arac_id] = { marka: k.marka, model: k.model, sayi: 0 };
      sayac[k.arac_id].sayi++;
    });
    return Object.values(sayac).sort((a, b) => b.sayi - a.sayi).slice(0, 5);
  }

  get enAktifKullanicilar(): { email: string; sayi: number }[] {
    const sayac: Record<string, { email: string; sayi: number }> = {};
    this.kiralamalar.forEach(k => {
      if (!sayac[k.kullanici_email]) sayac[k.kullanici_email] = { email: k.kullanici_email, sayi: 0 };
      sayac[k.kullanici_email].sayi++;
    });
    return Object.values(sayac).sort((a, b) => b.sayi - a.sayi).slice(0, 5);
  }

  get gelirTablosu(): { marka: string; model: string; kullanici_email: string; gun: number; gelir: number; tarih: string }[] {
    return this.kiralamalar
      .filter(k => k.durum === 'tamamlandi' && !!k.bitis_tarihi)
      .map(k => {
        const gun = Math.max(1, Math.ceil(
          (new Date(k.bitis_tarihi as string).getTime() - new Date(k.baslangic_tarihi).getTime()) / 86400000
        ));
        return { marka: k.marka, model: k.model, kullanici_email: k.kullanici_email, gun, gelir: gun * k.gunluk_fiyat, tarih: k.bitis_tarihi as string };
      })
      .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
      .slice(0, 10);
  }

  tarihFormatla(tarih?: string | null) {
    if (!tarih) return '-';
    const d = new Date(tarih);
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
