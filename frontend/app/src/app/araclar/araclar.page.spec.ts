import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AraclarPage } from './araclar.page';

describe('AraclarPage', () => {
  let component: AraclarPage;
  let fixture: ComponentFixture<AraclarPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(AraclarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
