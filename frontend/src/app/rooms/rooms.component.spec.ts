import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomsComponent } from './rooms.component';
import { RoomService } from '../services/room.service';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const mockRoomService = jasmine.createSpyObj('RoomService', ['getActiveRooms']);
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

const mockActivatedRoute = {
  snapshot: {
    queryParamMap: new Map([['room', 'default-room']]),
  },
  queryParamMap: of(new Map([['room', 'default-room']])),
};

describe('RoomsComponent', () => {
  let component: RoomsComponent;
  let fixture: ComponentFixture<RoomsComponent>;

  beforeEach(async () => {
    mockRoomService.getActiveRooms.calls.reset();
    mockRouter.navigate.calls.reset();

    mockRoomService.getActiveRooms.and.returnValue(of(['room1', 'room2']));

    await TestBed.configureTestingModule({
      imports: [RoomsComponent, HttpClientTestingModule],
      providers: [
        { provide: RoomService, useValue: mockRoomService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load rooms and set current room on init', () => {
    expect(component.currentRoom()).toBe('default-room');

    expect(mockRoomService.getActiveRooms).toHaveBeenCalled();

    expect(component.state().isLoading).toBeFalse();
    expect(component.state().rooms).toEqual(['default-room', 'room1', 'room2']);
  });
});
