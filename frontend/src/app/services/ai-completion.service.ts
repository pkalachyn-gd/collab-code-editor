import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface AiCompletionRequest {
  fullText: string;
  cursorPosition: number;
  textBeforeCursor: string;
}

export interface AiCompletionResponse {
  suggestions: {
    label: string;
    type: string; // e.g., "function", "keyword"
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class AiCompletionService {
    constructor(private http: HttpClient) {}

  // getCompletions(payload: AiCompletionRequest): Observable<AiCompletionResponse> {
  //   console.log('Sent to BackEnd (mock):', payload);
  //
  //   const mockResponse: AiCompletionResponse = {
  //     suggestions: [
  //       { label: 'console', type: 'variable' },
  //       { label: 'console.log', type: 'function' },
  //       { label: 'const', type: 'keyword' },
  //     ],
  //   };
  //
  //   return of(mockResponse).pipe(delay(300));
  // }


  getCompletions(payload: AiCompletionRequest): Observable<AiCompletionResponse> {
    return this.http.post<AiCompletionResponse>('http://localhost:8080/api/complete', payload);
  }
}
