import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  carOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  keyOutline,
  mailOutline,
  peopleOutline,
  searchOutline,
  settingsOutline,
  shieldOutline,
  timeOutline,
  trashOutline
} from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

type AdminSekme = 'araclar' | 'kullanicilar' | 'kiralamalar';
type KiralamaSekmesi = 'aktif' | 'tamamlandi';
type KullaniciRol = 'kullanici' | 'admin';

interface Arac {
  id: number;
  marka: string;
  model: string;
  musait: boolean;
  gunluk_fiyat: number;
  resim_url?: string | null;
  kategori?: string | null;
  yakit?: string | null;
  vites?: string | null;
}

interface Kullanici {
  id: number;
  email: string;
  rol: KullaniciRol;
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
export class AdminPage implements OnInit {
  private readonly API_BASE = 'http://localhost:3000';

  isAdmin = false;
  aktifSekme: AdminSekme = 'araclar';
  aktifKiralamaSekmesi: KiralamaSekmesi = 'aktif';

  araclar: Arac[] = [];
  kullanicilar: Kullanici[] = [];
  kiralamalar: KiralamaKaydi[] = [];

  yukleniyorAraclar = false;
  yukleniyorKullanicilar = false;
  yukleniyorKiralamalar = false;

  aramaMetniArac = '';
  aramaMetniKullanici = '';
  aramaMetniKiralama = '';

  aracFormAcik = false;
  aracDuzenleModu = false;
  aracFormVerisi: any = {
    id: null,
    marka: '',
    model: '',
    gunluk_fiyat: 1000,
    kategori: 'Sedan',
    yakit: 'Benzin',
    vites: 'Otomatik',
    resim_url: '',
    musait: true
  };

  kullaniciFormAcik = false;
  kullaniciDuzenleModu = false;
  kullaniciFormVerisi: any = {
    id: null,
    email: '',
    sifre: '',
    rol: 'kullanici'
  };

  kategoriler = ['Spor', 'Sedan', 'Ekonomik'];
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
      addOutline,
      createOutline,
      trashOutline,
      carOutline,
      closeOutline,
      checkmarkOutline,
      searchOutline,
      peopleOutline,
      keyOutline,
      settingsOutline,
      mailOutline,
      shieldOutline,
      timeOutline
    });
  }

  ngOnInit() {
    this.rolKontrol();
  }

  ionViewWillEnter() {
    this.rolKontrol();
    if (this.isAdmin) {
      this.verileriYukle();
    }
  }

  get panelAltBaslik(): string {
    if (this.aktifSekme === 'araclar') {
      return `${this.araclar.length} araç kayıtlı`;
    }
    if (this.aktifSekme === 'kullanicilar') {
      return `${this.kullanicilar.length} kullanıcı kayıtlı`;
    }
    return `${this.filtrelenmisKiralamalar().length} kiralama gösteriliyor`;
  }

  sekmeDegistir(sekme: AdminSekme) {
    this.aktifSekme = sekme;
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

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
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

  verileriYukle() {
    this.araclariGetir();
    this.kullanicilariGetir();
    this.kiralamalariGetir();
  }

  // Araçlar
  araclariGetir() {
    this.yukleniyorAraclar = true;
    this.http.get<Arac[]>(`${this.API_BASE}/araclar`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.araclar = data;
        this.yukleniyorAraclar = false;
      },
      error: async () => {
        this.yukleniyorAraclar = false;
        await this.toastGoster('Araçlar alınamadı', 'danger');
      }
    });
  }

  filtrelenmisAraclar() {
    if (!this.aramaMetniArac.trim()) return this.araclar;
    const arama = this.aramaMetniArac.toLowerCase();
    return this.araclar.filter((a) =>
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
      kategori: 'Sedan',
      yakit: 'Benzin',
      vites: 'Otomatik',
      resim_url: '',
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
      kategori: arac.kategori || 'Sedan',
      yakit: arac.yakit || 'Benzin',
      vites: arac.vites || 'Otomatik',
      resim_url: arac.resim_url || '',
      musait: arac.musait
    };
    this.aracFormAcik = true;
  }

  aracFormuKapat() {
    this.aracFormAcik = false;
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
      kategori: this.aracFormVerisi.kategori,
      yakit: this.aracFormVerisi.yakit,
      vites: this.aracFormVerisi.vites,
      resim_url: this.aracFormVerisi.resim_url.trim() || null,
      musait: this.aracFormVerisi.musait
    };

    if (this.aracDuzenleModu) {
      this.http.put(`${this.API_BASE}/araclar/${this.aracFormVerisi.id}`, body, { headers: this.getHeaders() }).subscribe({
        next: async () => {
          await this.toastGoster('Araç güncellendi', 'success');
          this.aracFormAcik = false;
          this.araclariGetir();
        },
        error: async (err) => {
          await this.toastGoster(err.error?.hata || 'Araç güncellenemedi', 'danger');
        }
      });
      return;
    }

    this.http.post(`${this.API_BASE}/araclar`, body, { headers: this.getHeaders() }).subscribe({
      next: async () => {
        await this.toastGoster('Araç eklendi', 'success');
        this.aracFormAcik = false;
        this.araclariGetir();
      },
      error: async (err) => {
        await this.toastGoster(err.error?.hata || 'Araç eklenemedi', 'danger');
      }
    });
  }

  async aracSil(arac: Arac) {
    const alert = await this.alertCtrl.create({
      header: 'Aracı Sil',
      message: `${arac.marka} ${arac.model} aracını silmek istediğine emin misin?`,
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
    this.http.delete(`${this.API_BASE}/araclar/${id}`, { headers: this.getHeaders() }).subscribe({
      next: async () => {
        await this.toastGoster('Araç silindi', 'success');
        this.araclariGetir();
      },
      error: async (err) => {
        await this.toastGoster(err.error?.hata || 'Araç silinemedi', 'danger');
      }
    });
  }

  musaitlikDegistir(arac: Arac) {
    const body = { musait: !arac.musait };
    this.http.put(`${this.API_BASE}/araclar/${arac.id}`, body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        arac.musait = !arac.musait;
      }
    });
  }

  // Kullanıcılar
  kullanicilariGetir() {
    this.yukleniyorKullanicilar = true;
    this.http.get<Kullanici[]>(`${this.API_BASE}/kullanicilar`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.kullanicilar = data;
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
      email: '',
      sifre: '',
      rol: 'kullanici'
    };
    this.kullaniciFormAcik = true;
  }

  kullaniciDuzenleFormu(kullanici: Kullanici) {
    this.kullaniciDuzenleModu = true;
    this.kullaniciFormVerisi = {
      id: kullanici.id,
      email: kullanici.email,
      sifre: '',
      rol: kullanici.rol
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

    if (this.kullaniciDuzenleModu) {
      const body: any = { email, rol };
      if (sifre) body.sifre = sifre;

      this.http.put(`${this.API_BASE}/kullanicilar/${this.kullaniciFormVerisi.id}`, body, { headers: this.getHeaders() }).subscribe({
        next: async () => {
          await this.toastGoster('Kullanıcı güncellendi', 'success');
          this.kullaniciFormAcik = false;
          this.kullanicilariGetir();
        },
        error: async (err) => {
          await this.toastGoster(err.error?.hata || 'Kullanıcı güncellenemedi', 'danger');
        }
      });
      return;
    }

    this.http.post(`${this.API_BASE}/kullanicilar`, { email, sifre, rol }, { headers: this.getHeaders() }).subscribe({
      next: async () => {
        await this.toastGoster('Kullanıcı eklendi', 'success');
        this.kullaniciFormAcik = false;
        this.kullanicilariGetir();
      },
      error: async (err) => {
        await this.toastGoster(err.error?.hata || 'Kullanıcı eklenemedi', 'danger');
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
    this.http.delete(`${this.API_BASE}/kullanicilar/${id}`, { headers: this.getHeaders() }).subscribe({
      next: async () => {
        await this.toastGoster('Kullanıcı silindi', 'success');
        this.kullanicilariGetir();
      },
      error: async (err) => {
        await this.toastGoster(err.error?.hata || 'Kullanıcı silinemedi', 'danger');
      }
    });
  }

  // Kiralamalar
  kiralamalariGetir() {
    this.yukleniyorKiralamalar = true;
    this.http.get<KiralamaKaydi[]>(`${this.API_BASE}/kiralamalar/admin`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.kiralamalar = data;
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
