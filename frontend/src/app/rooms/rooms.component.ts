import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomService } from '../services/room.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, catchError, of, startWith, Observable } from 'rxjs';
import { RoomsState } from '../models/rooms.model';
import { Router, ActivatedRoute } from '@angular/router';

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
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  newRoomName = signal('');

  private initialRoom = this.route.snapshot.queryParamMap.get('room') || 'default-room';
  readonly currentRoom = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('room') || 'default-room')),
    { initialValue: this.initialRoom }
  );

  private apiState$ = this.roomService.getActiveRooms().pipe(
    map((roomList): Omit<RoomsState, 'rooms'> & { apiRooms: string[] } => ({
      apiRooms: roomList,
      isLoading: false,
      error: null,
    })),
    catchError((err): Observable<Omit<RoomsState, 'rooms'> & { apiRooms: string[] }> => {
      console.error('The list of rooms could not be loaded.', err);
      return of({
        apiRooms: [],
        isLoading: false,
        error: 'The list of rooms could not be loaded. Try to create a new room.',
      });
    }),
    startWith({
      apiRooms: [],
      isLoading: true,
      error: null,
    })
  );

  private apiState = toSignal(this.apiState$, { requireSync: true });

  state = computed((): RoomsState => {
    const api = this.apiState();
    const current = this.currentRoom();

    if (api.error) {
      return {
        rooms: [current],
        isLoading: false,
        error: api.error,
      };
    }

    const roomSet = new Set(api.apiRooms);
    roomSet.add(current);

    return {
      rooms: Array.from(roomSet).sort(),
      isLoading: api.isLoading,
      error: api.error,
    };
  });

  switchRoom(roomName: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { room: roomName },
    });
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
