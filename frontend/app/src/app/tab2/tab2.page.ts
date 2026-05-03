import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBadge
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonBadge
  ],
})
export class Tab2Page implements OnInit {
  kiralamalar: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
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
}