import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeComponent } from './upgrade.component';

describe('UpgradeComponent', () => {
  let component: UpgradeComponent;
  let fixture: ComponentFixture<UpgradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpgradeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpgradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
