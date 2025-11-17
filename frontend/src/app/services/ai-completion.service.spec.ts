import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiCompletionService } from './ai-completion.service';
import { AiCompletionRequest, AiCompletionResponse } from '../models/ai-completion.models';
import { environment } from '../../environments/environment';

describe('AiCompletionService', () => {
  let service: AiCompletionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiCompletionService],
    });
    service = TestBed.inject(AiCompletionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a POST request and return completions', () => {
    const mockRequest: AiCompletionRequest = {
      fullText: 'cons',
      cursorPosition: 4,
    };

    const expectedResponse: AiCompletionResponse = {
      suggestions: [
        { label: 'console', type: 'variable' },
        { label: 'const', type: 'keyword' },
      ],
    };

    let actualResponse: AiCompletionResponse | undefined;

    service.getCompletions(mockRequest).subscribe((response) => {
      actualResponse = response;
    });

    const req = httpMock.expectOne(environment.aiCompletionApiUrl);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);

    req.flush(expectedResponse);

    expect(actualResponse).toEqual(expectedResponse);
  });
});
