import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBadge,
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonBadge,
    IonRefresher, IonRefresherContent
  ],
})
export class Tab1Page implements OnInit {
  araclar: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.araclariGetir();
  }

  araclariGetir() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:3000/araclar', { headers }).subscribe({
      next: (data) => {
        this.araclar = data;
      },
      error: (err) => {
        console.log('Hata:', err);
      }
    });
  }
}