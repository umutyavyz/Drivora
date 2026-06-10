import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Kiralama özeti / onay modalı (ödemeye geçmeden önce). detail ve map'te ortak.
 */
@Component({
  selector: 'app-rental-summary-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rental-summary-modal.component.html',
  styleUrls: ['./rental-summary-modal.component.scss'],
})
export class RentalSummaryModalComponent {
  @Input() acik = false;
  @Input() aracAdi = '';
  @Input() tur = 'gunluk';
  @Input() sureMetni = '';
  @Input() toplam = 0;

  @Output() vazgec = new EventEmitter<void>();
  @Output() onayla = new EventEmitter<void>();
}
