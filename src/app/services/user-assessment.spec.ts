import { TestBed } from '@angular/core/testing';

import { UserAssessment } from './user-assessment';

describe('UserAssessment', () => {
  let service: UserAssessment;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserAssessment);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
