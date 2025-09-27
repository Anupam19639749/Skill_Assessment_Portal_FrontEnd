import { TestBed } from '@angular/core/testing';

import { Submission } from './submission';

describe('Submission', () => {
  let service: Submission;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Submission);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
