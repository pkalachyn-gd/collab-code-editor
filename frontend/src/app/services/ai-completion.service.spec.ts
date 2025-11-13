import { TestBed } from '@angular/core/testing';

import { AiCompletion } from './ai-completion.service';

describe('AiCompletion', () => {
  let service: AiCompletion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiCompletion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
