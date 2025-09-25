import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionManagement } from './question-management';

describe('QuestionManagement', () => {
  let component: QuestionManagement;
  let fixture: ComponentFixture<QuestionManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
