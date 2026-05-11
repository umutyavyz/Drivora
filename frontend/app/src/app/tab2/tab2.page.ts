import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, flagOutline, carOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class Tab2Page implements OnInit, OnDestroy {
  kiralamalar: any[] = [];
  simdi = Date.now();
  yukleniyor = true;
  private timerId: any = null;

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ calendarOutline, flagOutline, carOutline, timeOutline });
  }

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

  private async toastGoster(mesaj: string, renk: string) {
    const toast = await this.toastCtrl.create({
      message: mesaj,
      duration: 2200,
      color: renk,
      position: 'top'
    });
    await toast.present();
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
    if (saat > 0) return `${saat} saat ${dakika} dakika`;
    if (dakika > 0) return `${dakika} dakika ${saniye} sn`;
    return `${saniye} sn`;
  }

  kiralamalariGetir() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.yukleniyor = true;
    this.http.get<any[]>('http://localhost:3000/kiralamalar', { headers }).subscribe({
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

  async kiralamayiBitir(kiralama: any) {
    const alert = await this.alertCtrl.create({
      header: 'Kiralamayı Bitir',
      message: `${kiralama.marka} ${kiralama.model} kiralamasını bitirmek istediğine emin misin?`,
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Bitir',
          role: 'destructive',
          handler: () => this.bitirIstegiGonder(kiralama.id)
        }
      ]
    });
    await alert.present();
  }

  bitirIstegiGonder(kiralamaId: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.put(`http://localhost:3000/kiralamalar/${kiralamaId}/bitir`, {}, { headers })
      .subscribe({
        next: () => {
          this.kiralamalariGetir();
          this.toastGoster('Kiralama bitirildi', 'success');
        },
        error: () => {
          this.toastGoster('Bir hata oluştu', 'danger');
        }
      });
  }
}