import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterSkillsComponent } from './master-skills.component';

describe('MasterSkillsComponent', () => {
  let component: MasterSkillsComponent;
  let fixture: ComponentFixture<MasterSkillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterSkillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterSkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
