import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, createOutline, trashOutline,
  carOutline, closeOutline, checkmarkOutline,
  searchOutline
} from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class AdminPage implements OnInit {
  araclar: any[] = [];
  yukleniyor = true;
  isAdmin = false;
  aramaMetni = '';

  // Form state
  formAcik = false;
  duzenleModu = false;
  formVerisi: any = {
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

  kategoriler = ['Spor', 'Sedan', 'Ekonomik'];
  yakitlar = ['Benzin', 'Dizel', 'Hibrit', 'Elektrik'];
  vitesler = ['Manuel', 'Otomatik'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      addOutline, createOutline, trashOutline,
      carOutline, closeOutline, checkmarkOutline,
      searchOutline
    });
  }

  ngOnInit() {
    this.rolKontrol();
  }

  ionViewWillEnter() {
    this.rolKontrol();
    if (this.isAdmin) {
      this.araclariGetir();
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
    }
    if (!this.isAdmin) {
      this.router.navigate(['/tabs/map']);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  araclariGetir() {
    this.yukleniyor = true;
    this.http.get<any[]>('http://localhost:3000/araclar', { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.araclar = data;
        this.yukleniyor = false;
      },
      error: () => {
        this.yukleniyor = false;
      }
    });
  }

  filtrelenmisAraclar() {
    if (!this.aramaMetni.trim()) return this.araclar;
    const arama = this.aramaMetni.toLowerCase();
    return this.araclar.filter(a =>
      a.marka?.toLowerCase().includes(arama) ||
      a.model?.toLowerCase().includes(arama) ||
      a.kategori?.toLowerCase().includes(arama)
    );
  }

  // Form işlemleri
  yeniAracFormu() {
    this.duzenleModu = false;
    this.formVerisi = {
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
    this.formAcik = true;
  }

  duzenleFormu(arac: any) {
    this.duzenleModu = true;
    this.formVerisi = {
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
    this.formAcik = true;
  }

  formuKapat() {
    this.formAcik = false;
  }

  async formuKaydet() {
    if (!this.formVerisi.marka.trim() || !this.formVerisi.model.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'Marka ve model zorunludur',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    const body = {
      marka: this.formVerisi.marka.trim(),
      model: this.formVerisi.model.trim(),
      gunluk_fiyat: this.formVerisi.gunluk_fiyat,
      kategori: this.formVerisi.kategori,
      yakit: this.formVerisi.yakit,
      vites: this.formVerisi.vites,
      resim_url: this.formVerisi.resim_url.trim() || null,
      musait: this.formVerisi.musait
    };

    if (this.duzenleModu) {
      this.http.put(`http://localhost:3000/araclar/${this.formVerisi.id}`, body, { headers: this.getHeaders() })
        .subscribe({
          next: async () => {
            const toast = await this.toastCtrl.create({
              message: 'Araç güncellendi',
              duration: 2000,
              color: 'success',
              position: 'top'
            });
            await toast.present();
            this.formAcik = false;
            this.araclariGetir();
          },
          error: async (err) => {
            const toast = await this.toastCtrl.create({
              message: err.error?.hata || 'Güncelleme başarısız',
              duration: 2500,
              color: 'danger',
              position: 'top'
            });
            await toast.present();
          }
        });
    } else {
      this.http.post('http://localhost:3000/araclar', body, { headers: this.getHeaders() })
        .subscribe({
          next: async () => {
            const toast = await this.toastCtrl.create({
              message: 'Araç eklendi',
              duration: 2000,
              color: 'success',
              position: 'top'
            });
            await toast.present();
            this.formAcik = false;
            this.araclariGetir();
          },
          error: async (err) => {
            const toast = await this.toastCtrl.create({
              message: err.error?.hata || 'Ekleme başarısız',
              duration: 2500,
              color: 'danger',
              position: 'top'
            });
            await toast.present();
          }
        });
    }
  }

  async aracSil(arac: any) {
    const alert = await this.alertCtrl.create({
      header: 'Aracı Sil',
      message: `${arac.marka} ${arac.model} aracını silmek istediğine emin misin?`,
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Sil',
          role: 'destructive',
          handler: () => this.silIstegiGonder(arac.id)
        }
      ]
    });
    await alert.present();
  }

  silIstegiGonder(id: number) {
    this.http.delete(`http://localhost:3000/araclar/${id}`, { headers: this.getHeaders() })
      .subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({
            message: 'Araç silindi',
            duration: 2000,
            color: 'success',
            position: 'top'
          });
          await toast.present();
          this.araclariGetir();
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({
            message: err.error?.hata || 'Silme başarısız',
            duration: 2500,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
        }
      });
  }

  musaitlikDegistir(arac: any) {
    const body = { musait: !arac.musait };
    this.http.put(`http://localhost:3000/araclar/${arac.id}`, body, { headers: this.getHeaders() })
      .subscribe({
        next: async () => {
          arac.musait = !arac.musait;
          const toast = await this.toastCtrl.create({
            message: `${arac.marka} ${arac.model} — ${arac.musait ? 'Müsait' : 'Dolu'} olarak güncellendi`,
            duration: 1500,
            color: 'success',
            position: 'top'
          });
          await toast.present();
        }
      });
  }
}
