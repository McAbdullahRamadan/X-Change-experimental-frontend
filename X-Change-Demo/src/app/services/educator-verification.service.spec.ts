import { TestBed } from '@angular/core/testing';

import { EducatorVerificationService } from './educator-verification.service';

describe('EducatorVerificationService', () => {
  let service: EducatorVerificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EducatorVerificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
