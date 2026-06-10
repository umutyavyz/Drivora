import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KiralamalarimPage } from './kiralamalarim.page';

describe('KiralamalarimPage', () => {
  let component: KiralamalarimPage;
  let fixture: ComponentFixture<KiralamalarimPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(KiralamalarimPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
