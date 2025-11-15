import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

  getCompletions(payload: AiCompletionRequest): Observable<AiCompletionResponse> {
    return this.http.post<AiCompletionResponse>(environment.aiCompletionApiUrl, payload);
  }
}
