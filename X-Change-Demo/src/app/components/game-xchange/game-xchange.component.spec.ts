import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameXChangeComponent } from './game-xchange.component';

describe('GameXChangeComponent', () => {
  let component: GameXChangeComponent;
  let fixture: ComponentFixture<GameXChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameXChangeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameXChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
