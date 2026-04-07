import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsercommunityComponent } from './usercommunity.component';

describe('UsercommunityComponent', () => {
  let component: UsercommunityComponent;
  let fixture: ComponentFixture<UsercommunityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsercommunityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsercommunityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
