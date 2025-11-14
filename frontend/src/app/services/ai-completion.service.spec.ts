import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import {
  AiCompletionService,
  AiCompletionRequest,
  AiCompletionResponse,
} from './ai-completion.service';
import { of } from 'rxjs';

describe('AiCompletionService', () => {
  let service: AiCompletionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiCompletionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return mock completions after delay', fakeAsync(() => {
    const mockRequest: AiCompletionRequest = {
      fullText: 'cons',
      cursorPosition: 4,
      textBeforeCursor: 'cons',
    };

    const expectedResponse: AiCompletionResponse = {
      suggestions: [
        { label: 'console', type: 'variable' },
        { label: 'console.log', type: 'function' },
        { label: 'const', type: 'keyword' },
      ],
    };

    let actualResponse: AiCompletionResponse | undefined;

    spyOn(service, 'getCompletions').and.callThrough();

    service.getCompletions(mockRequest).subscribe((response) => {
      actualResponse = response;
    });

    expect(actualResponse).toBeUndefined();

    tick(300);

    expect(actualResponse).toEqual(expectedResponse);
    expect(service.getCompletions).toHaveBeenCalledWith(mockRequest);
  }));

  // An alternative test using done() for asynchrony
  it('should return mock completions (using done)', (done: DoneFn) => {
    const mockRequest: AiCompletionRequest = {
      fullText: 'cons',
      cursorPosition: 4,
      textBeforeCursor: 'cons',
    };

    const expectedResponse: AiCompletionResponse = {
      suggestions: [
        { label: 'console', type: 'variable' },
        { label: 'console.log', type: 'function' },
        { label: 'const', type: 'keyword' },
      ],
    };

    service.getCompletions(mockRequest).subscribe((response) => {
      expect(response).toEqual(expectedResponse);
      done();
    });
  });
});
