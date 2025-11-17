import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RoomService} from '../services/room.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {catchError, map, Observable, of, startWith} from 'rxjs';
import {RoomsState} from '../models/rooms.model';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";

const ROOM_ID_PATTERN = /^\s*[\da-z-]+\s*$/;

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomsComponent {
  private roomService = inject(RoomService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  roomForm = this.fb.group({roomId: ['', [Validators.required, Validators.pattern(ROOM_ID_PATTERN), Validators.required]]});

  readonly currentRoom = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('room') || 'default-room')),
    {initialValue: 'default-room'}
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

  private apiState = toSignal(this.apiState$, {requireSync: true});

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

  goToRoom(roomId: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {room: roomId},
    });
  }

  createOrJoinRoom() {
    const roomId = this.roomForm.controls.roomId?.value?.trim() || '';
    if (ROOM_ID_PATTERN.test(roomId)) {
      this.goToRoom(roomId);
    }
  }

}
