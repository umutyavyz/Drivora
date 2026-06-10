import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, heart, heartOutline, carOutline, star } from 'ionicons/icons';

@Component({
  selector: 'app-favorilerim',
  templateUrl: './favorilerim.page.html',
  styleUrls: ['./favorilerim.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class FavorilerimPage {
  favoriler: any[] = [];
  yukleniyor = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ chevronBackOutline, heart, heartOutline, carOutline, star });
  }

  ionViewWillEnter() {
    this.favorileriGetir();
  }

  favorileriGetir() {
    this.yukleniyor = true;
    this.http.get<any[]>(`${environment.API_BASE}/favoriler`).subscribe({
      next: (data) => {
        this.favoriler = data;
        this.yukleniyor = false;
      },
      error: async () => {
        this.yukleniyor = false;
        const toast = await this.toastCtrl.create({
          message: 'Favoriler yüklenemedi.',
          duration: 2500, color: 'danger', position: 'top'
        });
        await toast.present();
      }
    });
  }

  detaya(arac: any) {
    this.router.navigate(['/detail', arac.id]);
  }

  favoridenCikar(arac: any, ev: Event) {
    ev.stopPropagation();
    const oncekiListe = this.favoriler;
    this.favoriler = this.favoriler.filter(f => f.id !== arac.id); // iyimser
    this.http.delete(`${environment.API_BASE}/favoriler/${arac.id}`).subscribe({
      error: async () => {
        this.favoriler = oncekiListe; // geri al
        const toast = await this.toastCtrl.create({
          message: 'Favoriden çıkarılamadı.',
          duration: 2000, color: 'danger', position: 'top'
        });
        await toast.present();
      }
    });
  }

  geri() {
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/tabs/profil']);
  }
}
