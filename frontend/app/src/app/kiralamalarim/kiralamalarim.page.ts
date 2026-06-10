import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, flagOutline, carOutline, timeOutline, cashOutline, receiptOutline } from 'ionicons/icons';
import { RentalChecklistComponent, ChecklistAdimi } from '../rental-checklist/rental-checklist.component';

const TR_AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

@Component({
  selector: 'app-kiralamalarim',
  templateUrl: 'kiralamalarim.page.html',
  styleUrls: ['kiralamalarim.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, RentalChecklistComponent],
})
export class KiralamalarimPage implements OnInit, OnDestroy {
  kiralamalar: any[] = [];
  simdi = Date.now();
  yukleniyor = true;
  aktifFiltre: 'hepsi' | 'aktif' | 'tamamlandi' = 'hepsi';
  private timerId: any = null;

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ calendarOutline, flagOutline, carOutline, timeOutline, cashOutline, receiptOutline });
  }

  // Kiralama bittikten sonra aracı değerlendirmek isteyip istemediğini sorar
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

  bitisChecklistAcik = false;
  bitisChecklistYukleniyor = false;
  bitisHedefKiralama: any = null;

  bitisChecklistAdimlari: ChecklistAdimi[] = [
    {
      ikon: 'kilit', renk: 'turuncu',
      baslik: 'Aracı Güvenli Park Edin',
      aciklama: 'Kapıları kilitlediğinizden, farların ve müziğin kapalı olduğundan emin olun.'
    },
    {
      ikon: 'canta', renk: 'mavi',
      baslik: 'Eşyalarınızı Unutmayın',
      aciklama: 'Çantanızı, telefonunuzu ve değerli eşyalarınızı araçta bırakmayın.'
    },
    {
      ikon: 'el', renk: 'yesil',
      baslik: 'Tekrar Görüşmek Üzere',
      aciklama: 'Bizi tercih ettiğiniz için teşekkürler. Yine bekleriz!'
    },
  ];

  ngOnInit() {
    this.kiralamalariGetir();
    this.timerId = setInterval(() => {
      this.simdi = Date.now();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }

  ionViewWillEnter() {
    this.kiralamalariGetir();
  }

  get filtrelenmisKiralamalar(): any[] {
    if (this.aktifFiltre === 'aktif') return this.kiralamalar.filter(k => k.durum === 'aktif');
    if (this.aktifFiltre === 'tamamlandi') return this.kiralamalar.filter(k => k.durum === 'tamamlandi');
    return this.kiralamalar;
  }

  get aktifSayisi(): number {
    return this.kiralamalar.filter(k => k.durum === 'aktif').length;
  }

  get toplamHarcama(): number {
    return this.kiralamalar
      .reduce((acc, k) => acc + this.maliyetHesapla(k), 0);
  }

  get toplamSureMetni(): string {
    const toplamSn = this.kiralamalar.reduce((acc, k) => {
      const baslangicMs = new Date(k.baslangic_tarihi).getTime();
      const bitisMs = k.bitis_tarihi ? new Date(k.bitis_tarihi).getTime() : this.simdi;
      return acc + Math.max(0, Math.floor((bitisMs - baslangicMs) / 1000));
    }, 0);
    const gun = Math.floor(toplamSn / 86400);
    const saat = Math.floor((toplamSn % 86400) / 3600);
    if (gun > 0) return `${gun}g ${saat}s`;
    return `${saat}s`;
  }

  maliyetHesapla(kiralama: any): number {
    if (kiralama.toplam_tutar != null) return Number(kiralama.toplam_tutar) || 0;
    if (!kiralama.bitis_tarihi) return 0;
    const farkSn = Math.max(0, Math.floor((new Date(kiralama.bitis_tarihi).getTime() - new Date(kiralama.baslangic_tarihi).getTime()) / 1000));
    if (kiralama.kiralama_tipi === 'saatlik' && kiralama.saatlik_fiyat) {
      const saat = Math.ceil(farkSn / 3600);
      return saat * kiralama.saatlik_fiyat;
    }
    const gun = Math.max(1, Math.ceil(farkSn / 86400));
    return gun * (kiralama.gunluk_fiyat || 0);
  }

  trTarih(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()} ${TR_AYLAR[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  sureMetni(baslangic: string, bitis?: string): string {
    const baslangicMs = new Date(baslangic).getTime();
    const bitisMs = bitis ? new Date(bitis).getTime() : this.simdi;
    let toplamSaniye = Math.max(0, Math.floor((bitisMs - baslangicMs) / 1000));

    const gun = Math.floor(toplamSaniye / 86400);
    toplamSaniye -= gun * 86400;
    const saat = Math.floor(toplamSaniye / 3600);
    toplamSaniye -= saat * 3600;
    const dakika = Math.floor(toplamSaniye / 60);
    const saniye = toplamSaniye - dakika * 60;

    if (gun > 0) return `${gun} gün ${saat} saat`;
    if (saat > 0) return `${saat} saat ${dakika} dk`;
    if (dakika > 0) return `${dakika} dk ${saniye} sn`;
    return `${saniye} sn`;
  }

  filtreSec(f: 'hepsi' | 'aktif' | 'tamamlandi') {
    this.aktifFiltre = f;
  }

  detayaGit(aracId: number) {
    if (aracId) this.router.navigate(['/detail', aracId]);
  }

  araclaragozat() {
    this.router.navigate(['/tabs/araclar']);
  }

  kiralamalariGetir() {
    this.yukleniyor = true;
    this.http.get<any[]>(`${environment.API_BASE}/kiralamalar`).subscribe({
      next: (data) => {
        this.kiralamalar = data;
        this.yukleniyor = false;
      },
      error: async () => {
        this.yukleniyor = false;
        const toast = await this.toastCtrl.create({
          message: 'Kiralamalar yüklenemedi. Backend çalışıyor mu?',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  kiralamayiBitir(kiralama: any) {
    this.bitisHedefKiralama = kiralama;
    this.bitisChecklistYukleniyor = false;
    this.bitisChecklistAcik = true;
  }

  bitisChecklistKapat() {
    if (this.bitisChecklistYukleniyor) return;
    this.bitisChecklistAcik = false;
    this.bitisHedefKiralama = null;
  }

  bitisChecklistTamam() {
    if (!this.bitisHedefKiralama) return;
    const id = this.bitisHedefKiralama.id;
    const aracId = this.bitisHedefKiralama.arac_id ?? null;
    const aracAdi = `${this.bitisHedefKiralama.marka ?? ''} ${this.bitisHedefKiralama.model ?? ''}`.trim() || 'Araç';

    this.bitisChecklistYukleniyor = true;
    this.http.put(`${environment.API_BASE}/kiralamalar/${id}/bitir`, {})
      .subscribe({
        next: async () => {
          this.bitisChecklistYukleniyor = false;
          this.bitisChecklistAcik = false;
          this.bitisHedefKiralama = null;
          this.kiralamalariGetir();
          const toast = await this.toastCtrl.create({
            message: 'Kiralama bitirildi. Tekrar görüşmek üzere!',
            duration: 2400, color: 'success', position: 'top'
          });
          await toast.present();
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
}
