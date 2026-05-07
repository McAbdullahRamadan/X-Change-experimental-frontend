import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoureAndContentmanagementComponent } from './coure-and-contentmanagement.component';

describe('CoureAndContentmanagementComponent', () => {
  let component: CoureAndContentmanagementComponent;
  let fixture: ComponentFixture<CoureAndContentmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CoureAndContentmanagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoureAndContentmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
