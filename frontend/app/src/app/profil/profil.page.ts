import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, AlertController, IonSegment, IonSegmentButton, ToastController, NavController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import {
  mailOutline, shieldOutline, timeOutline,
  logOutOutline, person, personOutline, shieldCheckmark,
  moonOutline, sunnyOutline, desktopOutline, lockClosedOutline,
  chevronForwardOutline, callOutline, calendarOutline, createOutline, checkmarkOutline, closeOutline,
  cardOutline, alertCircleOutline, checkmarkCircle, refreshOutline, heartOutline
} from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-profil',
  templateUrl: 'profil.page.html',
  styleUrls: ['profil.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSegment, IonSegmentButton],
})
export class ProfilPage implements OnInit {
  adSoyad = '';
  email = '';
  rol = '';
  telefon = '';
  dogumTarihi = '';
  emailDogrulandi = true;
  dogrulamaGonderiliyor = false;
  seciliTema: 'light' | 'dark' | 'system' = 'system';

  duzenleModu = false;
  editAdSoyad = '';
  editTelefon = '';
  editDogumTarihi = '';
  bugun = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })();
  kayitYukleniyor = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private themeService: ThemeService,
    private navCtrl: NavController
  ) {
    addIcons({
      mailOutline, shieldOutline, timeOutline,
      logOutOutline, person, personOutline, shieldCheckmark,
      moonOutline, sunnyOutline, desktopOutline, lockClosedOutline,
      chevronForwardOutline, callOutline, calendarOutline, createOutline, checkmarkOutline, closeOutline,
      cardOutline, alertCircleOutline, checkmarkCircle, refreshOutline, heartOutline
    });
    this.seciliTema = this.themeService.getTheme();
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.adSoyad = decoded.ad_soyad || '';
      this.email = decoded.email;
      this.rol = decoded.rol;
    }
    this.profilGetir();
  }

  profilGetir() {
    if (!localStorage.getItem('token')) return;
    this.http.get<any>(`${environment.API_BASE}/kullanicilar/profil`).subscribe({
      next: (data) => {
        this.adSoyad = data.ad_soyad || '';
        this.email = data.email;
        this.rol = data.rol;
        this.telefon = data.telefon || '';
        this.dogumTarihi = data.dogum_tarihi ? data.dogum_tarihi.split('T')[0] : '';
        this.emailDogrulandi = !!data.email_dogrulandi;
      }
    });
  }

  ionViewWillEnter() {
    this.profilGetir();
  }

  dogrulamaMailiGonder() {
    if (this.dogrulamaGonderiliyor) return;
    this.dogrulamaGonderiliyor = true;
    this.http.post<any>(`${environment.API_BASE}/kullanicilar/dogrulama-yeniden-gonder`, {})
      .subscribe({
        next: async () => {
          this.dogrulamaGonderiliyor = false;
          const toast = await this.toastCtrl.create({
            message: `Doğrulama maili ${this.email} adresine gönderildi`,
            duration: 2800, color: 'success', position: 'top'
          });
          await toast.present();
        },
        error: async (err) => {
          this.dogrulamaGonderiliyor = false;
          const toast = await this.toastCtrl.create({
            message: err.error?.hata || 'Mail gönderilemedi',
            duration: 2400, color: 'danger', position: 'top'
          });
          await toast.present();
        }
      });
  }

  duzenlemeyiAc() {
    this.editAdSoyad = this.adSoyad;
    this.editTelefon = this.telefon;
    this.editDogumTarihi = this.dogumTarihi;
    this.duzenleModu = true;
  }

  duzenlemeyiKapat() {
    this.duzenleModu = false;
  }

  async profilKaydet() {
    this.kayitYukleniyor = true;
    this.http.put<any>(`${environment.API_BASE}/kullanicilar/profil`, {
      ad_soyad: this.editAdSoyad.trim() || null,
      telefon: this.editTelefon.trim() || null,
      dogum_tarihi: this.editDogumTarihi || null
    }).subscribe({
      next: async (res) => {
        this.kayitYukleniyor = false;
        this.duzenleModu = false;
        this.adSoyad = res.kullanici.ad_soyad || '';
        this.telefon = res.kullanici.telefon || '';
        this.dogumTarihi = res.kullanici.dogum_tarihi ? res.kullanici.dogum_tarihi.split('T')[0] : '';
        const toast = await this.toastCtrl.create({ message: 'Profil güncellendi', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
      },
      error: async () => {
        this.kayitYukleniyor = false;
        const toast = await this.toastCtrl.create({ message: 'Güncelleme başarısız', duration: 2000, color: 'danger', position: 'top' });
        await toast.present();
      }
    });
  }

  dogumTarihiFormatla(tarih: string): string {
    if (!tarih) return '';
    const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const d = new Date(tarih);
    return `${d.getDate()} ${aylar[d.getMonth()]} ${d.getFullYear()}`;
  }

  sifreSayfasinaGit() {
    this.router.navigate(['/sifre-degistir']);
  }

  odemelerSayfasinaGit() {
    this.router.navigate(['/odemelerim']);
  }

  favorilerSayfasinaGit() {
    this.router.navigate(['/favorilerim']);
  }

  async cikisYap() {
    const alert = await this.alertCtrl.create({
      header: 'Çıkış Yap',
      message: 'Hesabından çıkmak istediğine emin misin?',
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Çıkış Yap',
          role: 'destructive',
          handler: () => {
            localStorage.removeItem('token');
            // navigateRoot, tüm sekme/sayfa view stack'ini temizler; böylece
            // sonraki giriş (özellikle farklı rol ile) eski cache'lenmiş
            // sayfaları devralmaz.
            this.navCtrl.navigateRoot(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  temaDegistir(event: any) {
    const yeniTema = event.detail.value;
    this.seciliTema = yeniTema;
    this.themeService.setTheme(yeniTema);
  }
}
