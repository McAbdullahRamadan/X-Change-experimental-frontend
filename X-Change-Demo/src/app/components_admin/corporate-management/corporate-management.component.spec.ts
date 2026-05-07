import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorporateManagementComponent } from './corporate-management.component';

describe('CorporateManagementComponent', () => {
  let component: CorporateManagementComponent;
  let fixture: ComponentFixture<CorporateManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CorporateManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
