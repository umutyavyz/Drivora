import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline } from 'ionicons/icons';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class DetailPage implements OnInit {
  arac: any = null;
  yukleniyor = true;
  aktifKiralama: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    addIcons({ carOutline });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.aracGetir(id);
    this.aktifKiralamayiKontrolEt();
  }

  aracGetir(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:3000/araclar', { headers }).subscribe({
      next: (data) => {
        this.arac = data.find(a => a.id === id) || null;
        this.yukleniyor = false;
      },
      error: () => {
        this.yukleniyor = false;
      }
    });
  }

  aktifKiralamayiKontrolEt() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>('http://localhost:3000/kiralamalar', { headers }).subscribe({
      next: (data) => {
        this.aktifKiralama = data.find(k => k.durum === 'aktif') || null;
      }
    });
  }

  geri() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/tabs/tab1']);
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

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post('http://localhost:3000/kiralamalar', { arac_id: this.arac.id }, { headers })
      .subscribe({
        next: async () => {
          const toast = await this.toastCtrl.create({
            message: `${this.arac.marka} ${this.arac.model} kiralandı! 🚗`,
            duration: 2500,
            color: 'success',
            position: 'top'
          });
          await toast.present();
          this.router.navigate(['/tabs/tab2']);
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({
            message: err.error?.hata || 'Kiralama başarısız',
            duration: 2500,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
        }
      });
  }
}
