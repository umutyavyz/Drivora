import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule],
})
export class LoginPage {
  email = '';
  sifre = '';

  constructor(private http: HttpClient, private router: Router) {}

  girisYap() {
    this.http.post<any>('http://localhost:3000/kullanicilar/giris', {
      email: this.email,
      sifre: this.sifre
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        console.log('Giriş başarılı, token kaydedildi');
        this.router.navigate(['/tabs/tab1']);
      },
      error: (err) => {
        console.log('Giriş hatası:', err);
      }
    });
  }
}