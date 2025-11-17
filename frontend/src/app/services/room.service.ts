import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private roomsUrl = `${environment.apiUrl}/api/rooms`;

  constructor(private http: HttpClient) {}

  getActiveRooms(): Observable<string[]> {
    return this.http.get<string[]>(this.roomsUrl);
  }
}
