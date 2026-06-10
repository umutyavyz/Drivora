import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, alertCircle, mailOutline } from 'ionicons/icons';

@Component({
  selector: 'app-email-dogrula',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
  templateUrl: './email-dogrula.page.html',
  styleUrls: ['./email-dogrula.page.scss'],
})
export class EmailDogrulaPage implements OnInit {
  durum: 'isleniyor' | 'basarili' | 'hata' | 'zaten' = 'isleniyor';
  mesaj = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {
    addIcons({ checkmarkCircle, alertCircle, mailOutline });
  }

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.durum = 'hata';
      this.mesaj = 'Doğrulama linki geçersiz.';
      return;
    }
    this.http.post<any>(`${environment.API_BASE}/kullanicilar/email-dogrula`, { token })
      .subscribe({
        next: (res) => {
          if (res.zaten_dogrulu) {
            this.durum = 'zaten';
            this.mesaj = res.mesaj;
          } else {
            this.durum = 'basarili';
            this.mesaj = res.mesaj;
            if (res.token) {
              localStorage.setItem('token', res.token);
            }
          }
        },
        error: (err) => {
          this.durum = 'hata';
          this.mesaj = err.error?.hata || 'Doğrulama yapılamadı.';
        }
      });
  }

  girisYap() {
    this.router.navigate(['/login']);
  }

  uygulamayaGec() {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/tabs/araclar'], { replaceUrl: true });
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
