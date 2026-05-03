import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
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

  constructor(private http: HttpClient) {
    addIcons({ calendarOutline, flagOutline, carOutline });
  }

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