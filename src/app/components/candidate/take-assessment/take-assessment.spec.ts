import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeAssessment } from './take-assessment';

describe('TakeAssessment', () => {
  let component: TakeAssessment;
  let fixture: ComponentFixture<TakeAssessment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeAssessment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TakeAssessment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
