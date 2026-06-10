import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

/**
 * Kiralama sözleşmesi modalı. detail ve map sayfalarında ortak kullanılır.
 * Tek dinamik veri günlük fiyattır; kabul/red olayları dışarı yayınlanır.
 */
@Component({
  selector: 'app-agreement-modal',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './agreement-modal.component.html',
  styleUrls: ['./agreement-modal.component.scss'],
})
export class AgreementModalComponent {
  @Input() acik = false;
  @Input() gunlukFiyat: number | null = null;

  @Output() kabul = new EventEmitter<void>();
  @Output() reddet = new EventEmitter<void>();

  constructor() {
    addIcons({ closeCircleOutline, checkmarkCircleOutline });
  }
}
