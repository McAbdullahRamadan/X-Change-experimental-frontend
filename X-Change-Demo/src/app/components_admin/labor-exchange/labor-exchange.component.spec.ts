import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaborExchangeComponent } from './labor-exchange.component';

describe('LaborExchangeComponent', () => {
  let component: LaborExchangeComponent;
  let fixture: ComponentFixture<LaborExchangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LaborExchangeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaborExchangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
