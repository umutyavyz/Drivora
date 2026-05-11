import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent],
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
    this.router.navigate(['/register']);
  }

  girisYap() {
    this.router.navigate(['/login']);
  }
}