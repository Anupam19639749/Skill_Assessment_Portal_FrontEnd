import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAssessmentHistory } from './user-assessment-history';

describe('UserAssessmentHistory', () => {
  let component: UserAssessmentHistory;
  let fixture: ComponentFixture<UserAssessmentHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAssessmentHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAssessmentHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
