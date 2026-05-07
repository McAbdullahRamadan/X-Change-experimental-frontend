import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducatorComponent } from './educator.component';

describe('EducatorComponent', () => {
  let component: EducatorComponent;
  let fixture: ComponentFixture<EducatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EducatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
