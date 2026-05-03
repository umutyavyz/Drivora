import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonHeader, IonToolbar, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonContent
  ],
})
export class Tab1Page implements OnInit {
  araclar: any[] = [];
  kategoriler = ['Tümü', 'Spor', 'Sedan', 'Ekonomik'];
  seciliKategori = 'Tümü';
  aramaMetni = '';

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

  kategoriSec(kategori: string) {
    this.seciliKategori = kategori;
  }

  filtrelenmisAraclar() {
    let sonuc = this.araclar;

    if (this.seciliKategori !== 'Tümü') {
      sonuc = sonuc.filter(a => a.kategori === this.seciliKategori);
    }

    if (this.aramaMetni.trim()) {
      const arama = this.aramaMetni.toLowerCase();
      sonuc = sonuc.filter(a =>
        a.marka?.toLowerCase().includes(arama) ||
        a.model?.toLowerCase().includes(arama)
      );
    }

    return sonuc;
  }
}