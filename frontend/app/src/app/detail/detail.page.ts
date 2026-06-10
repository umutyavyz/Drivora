import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline, cogOutline, checkmarkCircleOutline, closeCircleOutline, heartOutline, heart, star, starOutline, starHalf, createOutline, trashOutline } from 'ionicons/icons';
import { PaymentModalComponent, OdemeBilgisi } from '../payment-modal/payment-modal.component';
import { RentalChecklistComponent, ChecklistAdimi } from '../rental-checklist/rental-checklist.component';
import { AgreementModalComponent } from '../agreement-modal/agreement-modal.component';
import { RentalSummaryModalComponent } from '../rental-summary-modal/rental-summary-modal.component';
import { Arac } from '../models';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner, PaymentModalComponent, RentalChecklistComponent, AgreementModalComponent, RentalSummaryModalComponent],
})
export class DetailPage implements OnInit {
  arac: any = null;
  yukleniyor = true;
  aktifKiralama: any = null;

  favori = false;

  // Değerlendirmeler
  degerlendirmeOzet: { ortalama: number; adet: number; degerlendirebilir: boolean; liste: any[] } =
    { ortalama: 0, adet: 0, degerlendirebilir: false, liste: [] };
  benimDegerlendirme: { puan: number; yorum: string | null } | null = null;
  degerlendirmeFormAcik = false;
  yeniPuan = 0;
  yeniYorum = '';
  degerlendirmeGonderiliyor = false;
  readonly yildizlar = [1, 2, 3, 4, 5];
  private degerlendirIstegi = false; // ?degerlendir=1 ile gelindiğinde formu aç

  kiralamaModuSure: 'saatlik' | 'gunluk' = 'saatlik';
  seciliSaatSayisi = 1;
  seciliGunSayisi = 1;
  benzerAraclar: Arac[] = [];
  aktifResimIndex = 0;

  agreementModalOpen = false;
  agreementModalRentalId: number | null = null;

  onayModalAcik = false;
  kiralamaSecimi: 'saatlik' | 'gunluk' | null = null;

  odemeAcik = false;
  odemeDurum: 'form' | 'isleniyor' | 'basarili' | 'hata' = 'form';
  odemeHataMesaji = '';
  private odemeSonrasiKiralamaId: number | null = null;
  private odemeSonrasiIlkKiralama = false;

  baslangicChecklistAcik = false;
  baslangicChecklistAdimlari: ChecklistAdimi[] = [
    {
      ikon: 'konum', renk: 'mavi',
      baslik: 'Araca Yakın Olun',
      aciklama: 'Sürüşe başlamadan önce aracın yanında olduğunuzdan emin olun.'
    },
    {
      ikon: 'arama', renk: 'turuncu',
      baslik: 'Aracı Kontrol Edin',
      aciklama: 'Aracı dışarıdan inceleyin. Hasar veya eksiklik varsa mutlaka bildirin.'
    },
    {
      ikon: 'roket', renk: 'yesil',
      baslik: 'İyi Yolculuklar!',
      aciklama: 'Her şey hazır. Güvenli sürüşler dileriz.'
    },
  ];

  get saatlikToplamFiyat(): number {
    return (this.arac?.saatlik_fiyat || 0) * this.seciliSaatSayisi;
  }

  get gunlukToplamFiyat(): number {
    return (this.arac?.gunluk_fiyat || 0) * this.seciliGunSayisi;
  }

  get toplamFiyat(): number {
    return this.kiralamaModuSure === 'saatlik' ? this.saatlikToplamFiyat : this.gunlukToplamFiyat;
  }

  get resimler(): string[] {
    const liste: string[] = [];
    if (this.arac?.resim_url) liste.push(this.arac.resim_url);
    if (Array.isArray(this.arac?.resim_urls)) {
      liste.push(...this.arac.resim_urls.filter((u: string) => u?.trim()));
    }
    return liste;
  }

  onKaruselKaydirma(event: Event) {
    const el = event.target as HTMLElement;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    this.aktifResimIndex = index;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    addIcons({ carOutline, cogOutline, checkmarkCircleOutline, closeCircleOutline, heartOutline, heart, star, starOutline, starHalf, createOutline, trashOutline });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.degerlendirIstegi = this.route.snapshot.queryParamMap.get('degerlendir') === '1';
    this.aracGetir(id);
    this.aktifKiralamayiKontrolEt();
  }

  aracGetir(id: number) {
    this.http.get<any[]>(`${environment.API_BASE}/araclar`).subscribe({
      next: (data) => {
        this.arac = data.find((a: any) => a.id === id) || null;
        this.yukleniyor = false;
        if (this.arac) {
          if (!this.arac.saatlik_fiyat) this.kiralamaModuSure = 'gunluk';
          this.favoriKontrol();
          this.degerlendirmeleriYukle(this.arac.id);
          this.benzerAraclar = data
            .filter((a: any) => a.id !== id && a.kategori === this.arac.kategori)
            .slice(0, 8);
        }
      },
      error: () => {
        this.yukleniyor = false;
      }
    });
  }

  aktifKiralamayiKontrolEt() {
    this.http.get<any[]>(`${environment.API_BASE}/kiralamalar`).subscribe({
      next: (data) => {
        this.aktifKiralama = data.find(k => k.durum === 'aktif') || null;
      }
    });
  }

  toggleFavori() {
    if (!this.arac) return;
    const id = this.arac.id;
    const oncekiDurum = this.favori;
    // İyimser güncelleme
    this.favori = !oncekiDurum;

    const istek = oncekiDurum
      ? this.http.delete(`${environment.API_BASE}/favoriler/${id}`)
      : this.http.post(`${environment.API_BASE}/favoriler`, { arac_id: id });

    istek.subscribe({
      error: async () => {
        this.favori = oncekiDurum; // geri al
        const toast = await this.toastCtrl.create({
          message: 'Favori güncellenemedi.',
          duration: 2000, color: 'danger', position: 'top'
        });
        await toast.present();
      }
    });
  }

  favoriKontrol() {
    if (!this.arac) return;
    this.http.get<any[]>(`${environment.API_BASE}/favoriler`).subscribe({
      next: (liste) => {
        this.favori = liste.some(a => a.id === this.arac.id);
      },
      error: () => { this.favori = false; }
    });
  }

  // ─── Değerlendirmeler ──────────────────────────────────────
  degerlendirmeleriYukle(aracId: number) {
    this.http.get<any>(`${environment.API_BASE}/degerlendirmeler/arac/${aracId}`).subscribe({
      next: (veri) => {
        this.degerlendirmeOzet = {
          ortalama: veri.ortalama ?? 0,
          adet: veri.adet ?? 0,
          degerlendirebilir: !!veri.degerlendirebilir,
          liste: veri.liste ?? [],
        };
        this.benimDegerlendirme = veri.benim ?? null;
        // Form alanlarını mevcut değerlendirmeye göre hazırla
        this.yeniPuan = this.benimDegerlendirme?.puan ?? 0;
        this.yeniYorum = this.benimDegerlendirme?.yorum ?? '';
        // Kiralama bitişinden "Değerlendir" ile gelindiyse formu otomatik aç
        if (this.degerlendirIstegi && this.degerlendirmeOzet.degerlendirebilir) {
          this.degerlendirIstegi = false;
          this.degerlendirmeFormAc();
        }
      },
      error: () => {
        this.degerlendirmeOzet = { ortalama: 0, adet: 0, degerlendirebilir: false, liste: [] };
        this.benimDegerlendirme = null;
      }
    });
  }

  degerlendirmeFormAc() {
    this.yeniPuan = this.benimDegerlendirme?.puan ?? 0;
    this.yeniYorum = this.benimDegerlendirme?.yorum ?? '';
    this.degerlendirmeFormAcik = true;
  }

  degerlendirmeFormKapat() {
    this.degerlendirmeFormAcik = false;
  }

  puanSec(n: number) {
    this.yeniPuan = n;
  }

  async degerlendirmeGonder() {
    if (!this.arac) return;
    if (this.yeniPuan < 1 || this.yeniPuan > 5) {
      const toast = await this.toastCtrl.create({
        message: 'Lütfen 1-5 arası bir puan seç.',
        duration: 2000, color: 'warning', position: 'top'
      });
      await toast.present();
      return;
    }
    this.degerlendirmeGonderiliyor = true;
    this.http.post(`${environment.API_BASE}/degerlendirmeler`, {
      arac_id: this.arac.id,
      puan: this.yeniPuan,
      yorum: this.yeniYorum?.trim() || null,
    }).subscribe({
      next: async () => {
        this.degerlendirmeGonderiliyor = false;
        this.degerlendirmeFormAcik = false;
        this.degerlendirmeleriYukle(this.arac.id);
        const toast = await this.toastCtrl.create({
          message: 'Değerlendirmen kaydedildi. Teşekkürler!',
          duration: 2200, color: 'success', position: 'top'
        });
        await toast.present();
      },
      error: async (err) => {
        this.degerlendirmeGonderiliyor = false;
        const toast = await this.toastCtrl.create({
          message: err.error?.hata || 'Değerlendirme kaydedilemedi.',
          duration: 2800, color: 'danger', position: 'top'
        });
        await toast.present();
      }
    });
  }

  async degerlendirmeSilOnay() {
    if (!this.arac) return;
    this.http.delete(`${environment.API_BASE}/degerlendirmeler/arac/${this.arac.id}`).subscribe({
      next: async () => {
        this.degerlendirmeFormAcik = false;
        this.degerlendirmeleriYukle(this.arac.id);
        const toast = await this.toastCtrl.create({
          message: 'Değerlendirmen silindi.',
          duration: 2000, color: 'warning', position: 'top'
        });
        await toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Silme işlemi başarısız.',
          duration: 2000, color: 'danger', position: 'top'
        });
        await toast.present();
      }
    });
  }

  saatAzalt() { if (this.seciliSaatSayisi > 1) this.seciliSaatSayisi--; }
  saatArtir() { if (this.seciliSaatSayisi < 24) this.seciliSaatSayisi++; }
  gunAzalt() { if (this.seciliGunSayisi > 1) this.seciliGunSayisi--; }
  gunArtir() { if (this.seciliGunSayisi < 30) this.seciliGunSayisi++; }

  benzerAracaGit(id: number) {
    this.router.navigate(['/detail', id]);
  }

  geri() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/tabs/araclar']);
    }
  }

  async kirala() {
    if (!this.arac || !this.arac.musait) return;
    if (this.aktifKiralama) {
      const toast = await this.toastCtrl.create({
        message: 'Zaten aktif bir kiralaman var. Önce onu bitir.',
        duration: 2500,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }
    this.kiralamaSecimi = this.kiralamaModuSure;
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
    if (!this.arac) return '';
    return `${this.arac.marka} ${this.arac.model}`;
  }

  get odemeOzetMetni(): string {
    if (this.kiralamaSecimi === 'saatlik') return `${this.seciliSaatSayisi} saat`;
    if (this.kiralamaSecimi === 'gunluk') return `${this.seciliGunSayisi} gün`;
    return '';
  }

  get odemeToplamTutar(): number {
    if (this.kiralamaSecimi === 'saatlik') return this.saatlikToplamFiyat;
    if (this.kiralamaSecimi === 'gunluk') return this.gunlukToplamFiyat;
    return 0;
  }

  odemeKapat() {
    if (this.odemeDurum === 'isleniyor') return;
    this.odemeAcik = false;
    this.odemeDurum = 'form';
  }

  odemeOnayla(odeme: OdemeBilgisi) {
    if (!this.arac || !this.kiralamaSecimi) return;
    this.odemeDurum = 'isleniyor';
    this.odemeHataMesaji = '';

    const sure = this.kiralamaSecimi === 'saatlik' ? this.seciliSaatSayisi : this.seciliGunSayisi;

    const govde = {
      arac_id: this.arac.id,
      kiralama_tipi: this.kiralamaSecimi,
      sure,
      ...odeme,
    };

    setTimeout(() => {
      this.http.post<any>(`${environment.API_BASE}/kiralamalar`, govde)
        .subscribe({
          next: (response) => {
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
      this.showAgreement(this.odemeSonrasiKiralamaId);
    } else {
      this.baslangicChecklistAcik = true;
    }
  }

  baslangicChecklistKapat() {
    this.baslangicChecklistAcik = false;
  }

  async baslangicChecklistTamam() {
    this.baslangicChecklistAcik = false;
    const aracMetin = this.arac ? `${this.arac.marka} ${this.arac.model}` : 'Araç';
    const toast = await this.toastCtrl.create({
      message: `${aracMetin} kiralandı! İyi yolculuklar.`,
      duration: 2500,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    this.odemeSonrasiKiralamaId = null;
    this.odemeSonrasiIlkKiralama = false;
    this.router.navigate(['/tabs/kiralamalarim']);
  }

  showAgreement(kiralama_id: number) {
    this.agreementModalRentalId = kiralama_id;
    this.agreementModalOpen = true;
  }

  private kiralamayıIptal(kiralama_id: number) {
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

  acceptAgreement() {
    if (!this.agreementModalRentalId) return;

    const kiralama_id = this.agreementModalRentalId;
    this.http.post(`${environment.API_BASE}/kiralamalar/confirm-agreement`,
      { kiralama_id }
    ).subscribe({
      next: () => {
        this.agreementModalOpen = false;
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
    this.kiralamayıIptal(this.agreementModalRentalId);
    this.agreementModalOpen = false;
  }
}
