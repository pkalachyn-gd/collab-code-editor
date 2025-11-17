import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AiCompletionRequest, AiCompletionResponse } from '../models/ai-completion.models';

@Injectable({
  providedIn: 'root',
})
export class AiCompletionService {
  constructor(private http: HttpClient) {}

  getCompletions(payload: AiCompletionRequest): Observable<AiCompletionResponse> {
    return this.http.post<AiCompletionResponse>(environment.aiCompletionApiUrl, payload);
  }
}
