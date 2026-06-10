import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, searchOutline, rocketOutline,
  lockClosedOutline, bagHandleOutline, handLeftOutline
} from 'ionicons/icons';

export type ChecklistRengi = 'mavi' | 'turuncu' | 'yesil' | 'mor' | 'kirmizi';
export type ChecklistIkonu =
  | 'konum' | 'arama' | 'roket'
  | 'kilit' | 'canta' | 'el';

export interface ChecklistAdimi {
  ikon: ChecklistIkonu;
  renk: ChecklistRengi;
  baslik: string;
  aciklama: string;
}

@Component({
  selector: 'app-rental-checklist',
  standalone: true,
  imports: [CommonModule, IonIcon, IonSpinner],
  templateUrl: './rental-checklist.component.html',
  styleUrls: ['./rental-checklist.component.scss'],
})
export class RentalChecklistComponent implements OnChanges {
  @Input() acik = false;
  @Input() adimlar: ChecklistAdimi[] = [];
  @Input() yukleniyor = false;
  @Input() yukleniyorMetin = 'İşleniyor...';
  @Input() devamMetni = 'Devam Et';
  @Input() bitisMetni = 'Tamamla';

  @Output() tamamlandi = new EventEmitter<void>();
  @Output() kapat = new EventEmitter<void>();

  adimIndex = 0;

  constructor() {
    addIcons({
      locationOutline, searchOutline, rocketOutline,
      lockClosedOutline, bagHandleOutline, handLeftOutline,
    });
  }

  ngOnChanges(c: SimpleChanges) {
    if (c['acik'] && c['acik'].currentValue === true && !c['acik'].previousValue) {
      this.adimIndex = 0;
    }
  }

  get sonAdimda(): boolean {
    return this.adimIndex >= this.adimlar.length - 1;
  }

  ileri() {
    if (this.yukleniyor) return;
    if (!this.sonAdimda) {
      this.adimIndex++;
    } else {
      this.tamamlandi.emit();
    }
  }

  overlayKapat() {
    if (this.yukleniyor) return;
    this.kapat.emit();
  }

  ionIkonAdi(ikon: ChecklistIkonu): string {
    switch (ikon) {
      case 'konum': return 'location-outline';
      case 'arama': return 'search-outline';
      case 'roket': return 'rocket-outline';
      case 'kilit': return 'lock-closed-outline';
      case 'canta': return 'bag-handle-outline';
      case 'el':    return 'hand-left-outline';
    }
  }
}
