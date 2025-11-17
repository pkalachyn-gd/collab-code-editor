import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomService } from '../services/room.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, catchError, of, startWith, Observable } from 'rxjs';
import { RoomsState } from '../models/rooms.model';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomsComponent {
  private roomService = inject(RoomService);
  readonly currentRoom = new URLSearchParams(window.location.search).get('room') || 'default-room';
  newRoomName = signal('');

  private state$ = this.roomService.getActiveRooms().pipe(
    map((roomList): RoomsState => {
      let rooms = roomList;
      if (this.currentRoom && !roomList.includes(this.currentRoom)) {
        rooms = [...roomList, this.currentRoom];
      }
      return {
        rooms: rooms.sort(),
        isLoading: false,
        error: null,
      };
    }),
    catchError((err): Observable<RoomsState> => {
      console.error('The list of rooms could not be loaded.', err);
      return of({
        rooms: [this.currentRoom],
        isLoading: false,
        error: 'The list of rooms could not be loaded. Try to create a new room.',
      });
    }),
    startWith({
      rooms: [],
      isLoading: true,
      error: null,
    })
  );

  state = toSignal(this.state$, { requireSync: true });

  switchRoom(roomName: string): void {
    window.location.href = `/?room=${encodeURIComponent(roomName)}`;
  }

  createOrJoinRoom(): void {
    const room = this.newRoomName().trim();
    if (room) {
      this.switchRoom(room);
    }
  }

  onNewRoomInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.newRoomName.set(target.value);
  }
}
