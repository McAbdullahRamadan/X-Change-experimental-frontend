import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthDesignComponent } from './auth-design.component';

describe('AuthDesignComponent', () => {
  let component: AuthDesignComponent;
  let fixture: ComponentFixture<AuthDesignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthDesignComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
