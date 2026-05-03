import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonIcon, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, flagOutline, carOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class Tab2Page implements OnInit {
  kiralamalar: any[] = [];

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ calendarOutline, flagOutline, carOutline });
  }

  ngOnInit() {
    this.kiralamalariGetir();
  }

  ionViewWillEnter() {
    this.kiralamalariGetir();
  }

  kiralamalariGetir() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:3000/kiralamalar', { headers }).subscribe({
      next: (data) => {
        this.kiralamalar = data;
      },
      error: (err) => {
        console.log('Hata:', err);
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
        next: async () => {
          const toast = await this.toastCtrl.create({
            message: 'Kiralama bitirildi',
            duration: 2000,
            color: 'success',
            position: 'top'
          });
          await toast.present();
          this.kiralamalariGetir();
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