import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GmaificationManagementComponent } from './gmaification-management.component';

describe('GmaificationManagementComponent', () => {
  let component: GmaificationManagementComponent;
  let fixture: ComponentFixture<GmaificationManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GmaificationManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GmaificationManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
