import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, IonContent],
})
export class WelcomePage {
  constructor(private router: Router) {}

  basla() {
    this.router.navigate(['/login']);
  }

  girisYap() {
    this.router.navigate(['/login']);
  }
}