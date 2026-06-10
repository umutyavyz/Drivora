import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, cardOutline, lockClosedOutline, checkmarkCircle, alertCircle, informationCircleOutline, trashOutline, addOutline, chevronBackOutline, checkmarkOutline } from 'ionicons/icons';

export interface OdemeBilgisi {
  kayitli_kart_id?: number;
  kart_no?: string;
  kart_sahibi?: string;
  kart_son_kullanma?: string;
  kart_cvv?: string;
  kart_kaydet?: boolean;
}

export interface KayitliKart {
  id: number;
  kart_sahibi: string;
  kart_son_4: string;
  son_kullanma: string;
  kart_marka: string;
  varsayilan: boolean;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, IonSpinner],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss'],
})
export class PaymentModalComponent implements OnChanges {
  @Input() acik = false;
  @Input() aracMetin = '';
  @Input() ozetMetin = '';
  @Input() toplamTutar = 0;
  @Input() durum: 'form' | 'isleniyor' | 'basarili' | 'hata' = 'form';
  @Input() hataMesaji = '';

  @Output() kapat = new EventEmitter<void>();
  @Output() onayla = new EventEmitter<OdemeBilgisi>();
  @Output() tamamlandi = new EventEmitter<void>();

  kartNo = '';
  kartSahibi = '';
  kartSonKullanma = '';
  kartCvv = '';

  kartHatalari: { kartNo?: string; kartSahibi?: string; kartSonKullanma?: string; kartCvv?: string } = {};

  // Kayıtlı kartlar
  kayitliKartlar: KayitliKart[] = [];
  seciliKartId: number | null = null;
  gorunum: 'liste' | 'form' = 'liste';
  kartlarYukleniyor = false;
  kartKaydet = false;

  constructor(private http: HttpClient) {
    addIcons({ closeOutline, cardOutline, lockClosedOutline, checkmarkCircle, alertCircle, informationCircleOutline, trashOutline, addOutline, chevronBackOutline, checkmarkOutline });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['acik'] && changes['acik'].currentValue === true && !changes['acik'].previousValue) {
      this.formuSifirla();
      this.kartKaydet = false;
      this.kartlariYukle();
    }
    if (changes['durum'] && changes['durum'].currentValue === 'basarili') {
      setTimeout(() => this.tamamlandi.emit(), 1800);
    }
  }

  kartlariYukle() {
    this.kartlarYukleniyor = true;
    this.http.get<KayitliKart[]>(`${environment.API_BASE}/kartlar`).subscribe({
      next: (kartlar) => {
        this.kayitliKartlar = kartlar || [];
        this.kartlarYukleniyor = false;
        if (this.kayitliKartlar.length > 0) {
          this.gorunum = 'liste';
          const varsayilan = this.kayitliKartlar.find(k => k.varsayilan);
          this.seciliKartId = (varsayilan || this.kayitliKartlar[0]).id;
        } else {
          this.gorunum = 'form';
          this.seciliKartId = null;
        }
      },
      error: () => {
        this.kartlarYukleniyor = false;
        this.kayitliKartlar = [];
        this.gorunum = 'form';
        this.seciliKartId = null;
      }
    });
  }

  kartSec(id: number) {
    this.seciliKartId = id;
  }

  yeniKartEkraniAc() {
    this.formuSifirla();
    this.kartKaydet = false;
    this.gorunum = 'form';
  }

  listeyeDon() {
    if (this.kayitliKartlar.length > 0) this.gorunum = 'liste';
  }

  kayitliKartSil(kart: KayitliKart, event: Event) {
    event.stopPropagation();
    this.http.delete(`${environment.API_BASE}/kartlar/${kart.id}`).subscribe({
      next: () => {
        this.kayitliKartlar = this.kayitliKartlar.filter(k => k.id !== kart.id);
        if (this.seciliKartId === kart.id) {
          this.seciliKartId = this.kayitliKartlar[0]?.id ?? null;
        }
        if (this.kayitliKartlar.length === 0) this.gorunum = 'form';
      }
    });
  }

  formuSifirla() {
    this.kartNo = '';
    this.kartSahibi = '';
    this.kartSonKullanma = '';
    this.kartCvv = '';
    this.kartHatalari = {};
  }

  testKartiDoldur() {
    this.kartNo = '4242 4242 4242 4242';
    this.kartSahibi = 'TEST KULLANICI';
    this.kartSonKullanma = '12/28';
    this.kartCvv = '123';
    this.kartHatalari = {};
  }

  kartNoFormatla() {
    const sadeceSayi = this.kartNo.replace(/\D/g, '').slice(0, 19);
    this.kartNo = sadeceSayi.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  sonKullanmaFormatla() {
    let v = this.kartSonKullanma.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) {
      v = v.slice(0, 2) + '/' + v.slice(2);
    }
    this.kartSonKullanma = v;
  }

  cvvFormatla() {
    this.kartCvv = this.kartCvv.replace(/\D/g, '').slice(0, 4);
  }

  get kartMarkasi(): string {
    const n = this.kartNo.replace(/\s/g, '');
    if (n.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'MASTERCARD';
    if (/^3[47]/.test(n)) return 'AMEX';
    if (/^9792/.test(n) || /^65/.test(n)) return 'TROY';
    return '';
  }

  get kartSon4Goster(): string {
    if (this.gorunum === 'liste' && this.seciliKartId) {
      const k = this.kayitliKartlar.find(c => c.id === this.seciliKartId);
      if (k) return k.kart_son_4;
    }
    const n = this.kartNo.replace(/\s/g, '');
    return n.length >= 4 ? n.slice(-4) : '••••';
  }

  private luhnGecerli(num: string): boolean {
    if (!num || num.length < 13) return false;
    let toplam = 0;
    let ciftMi = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let basamak = parseInt(num.charAt(i), 10);
      if (isNaN(basamak)) return false;
      if (ciftMi) {
        basamak *= 2;
        if (basamak > 9) basamak -= 9;
      }
      toplam += basamak;
      ciftMi = !ciftMi;
    }
    return toplam % 10 === 0;
  }

  private formDogrula(): boolean {
    this.kartHatalari = {};
    const sadeKart = this.kartNo.replace(/\s/g, '');

    if (!sadeKart) {
      this.kartHatalari.kartNo = 'Kart numarası zorunlu';
    } else if (sadeKart.length < 13) {
      this.kartHatalari.kartNo = 'Kart numarası eksik';
    } else if (!this.luhnGecerli(sadeKart)) {
      this.kartHatalari.kartNo = 'Geçersiz kart numarası';
    }

    const sahip = this.kartSahibi.trim();
    if (!sahip) {
      this.kartHatalari.kartSahibi = 'Kart sahibi zorunlu';
    } else if (sahip.length < 3) {
      this.kartHatalari.kartSahibi = 'En az 3 karakter olmalı';
    }

    const sk = this.kartSonKullanma;
    if (!sk || sk.length !== 5) {
      this.kartHatalari.kartSonKullanma = 'AA/YY formatında olmalı';
    } else {
      const [ayStr, yilStr] = sk.split('/');
      const ay = parseInt(ayStr, 10);
      const yil = parseInt(yilStr, 10);
      if (isNaN(ay) || ay < 1 || ay > 12) {
        this.kartHatalari.kartSonKullanma = 'Geçersiz ay';
      } else {
        const simdi = new Date();
        const buYil = simdi.getFullYear() % 100;
        const buAy = simdi.getMonth() + 1;
        if (yil < buYil || (yil === buYil && ay < buAy)) {
          this.kartHatalari.kartSonKullanma = 'Kart süresi dolmuş';
        }
      }
    }

    if (!this.kartCvv || this.kartCvv.length < 3) {
      this.kartHatalari.kartCvv = 'CVV eksik';
    }

    return Object.keys(this.kartHatalari).length === 0;
  }

  odeBasla() {
    if (this.gorunum === 'liste') {
      if (!this.seciliKartId) return;
      this.onayla.emit({ kayitli_kart_id: this.seciliKartId });
      return;
    }
    if (!this.formDogrula()) return;
    this.onayla.emit({
      kart_no: this.kartNo.replace(/\s/g, ''),
      kart_sahibi: this.kartSahibi.trim(),
      kart_son_kullanma: this.kartSonKullanma,
      kart_cvv: this.kartCvv,
      kart_kaydet: this.kartKaydet,
    });
  }

  vazgec() {
    if (this.durum === 'isleniyor') return;
    this.kapat.emit();
  }
}
