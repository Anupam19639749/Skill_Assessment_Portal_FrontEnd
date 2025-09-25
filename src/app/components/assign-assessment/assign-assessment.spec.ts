import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignAssessment } from './assign-assessment';

describe('AssignAssessment', () => {
  let component: AssignAssessment;
  let fixture: ComponentFixture<AssignAssessment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignAssessment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignAssessment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
