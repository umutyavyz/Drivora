import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, IonContent],
})
export class WelcomePage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/tabs/map'], { replaceUrl: true });
    }
  }

  basla() {
    this.router.navigate(['/login']);
  }

  girisYap() {
    this.router.navigate(['/login']);
  }
}