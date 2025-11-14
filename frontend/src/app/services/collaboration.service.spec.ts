import { TestBed } from '@angular/core/testing';
import { CollaborationService } from './collaboration.service';
import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import * as YWebsocket from 'y-websocket';

type MockWebsocketProvider = jasmine.SpyObj<YWebsocket.WebsocketProvider>;

describe('CollaborationService', () => {
  let service: CollaborationService;
  let mockProvider: MockWebsocketProvider;
  let mockAwareness: any;
  let websocketProviderSpy: jasmine.Spy;

  beforeEach(() => {
    mockAwareness = {};

    mockProvider = jasmine.createSpyObj('WebsocketProvider', ['destroy']);

    Object.defineProperty(mockProvider, 'awareness', {
      value: mockAwareness,
      writable: false,
    });

    websocketProviderSpy = spyOn(YWebsocket, 'WebsocketProvider').and.returnValue(mockProvider);

    TestBed.configureTestingModule({
      providers: [CollaborationService],
    });
    service = TestBed.inject(CollaborationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connect', () => {
    const testRoomName = 'test-room-123';

    beforeEach(() => {
      service.connect(testRoomName);
    });

    it('should initialize Y.Doc and Y.Text', () => {
      expect(service.ydoc).toBeInstanceOf(Y.Doc);
      expect(service.yText).toBeInstanceOf(Y.Text);
      expect(service.ydoc.getText('codemirror')).toBe(service.yText);
    });

    it('should initialize UndoManager for the yText', () => {
      expect(service.undoManager).toBeInstanceOf(UndoManager);
      expect((service.undoManager as any).scope).toContain(service.yText);
    });

    it('should create and assign mock WebsocketProvider', () => {
      expect(websocketProviderSpy).toHaveBeenCalledTimes(1);
      expect(websocketProviderSpy).toHaveBeenCalledWith(
        'ws://localhost:1234',
        testRoomName,
        service.ydoc
      );
    });

    it('should assign awareness from the provider', () => {
      expect(service.awareness).toBe(mockAwareness);
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw error if connect was never called', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should call destroy on provider and ydoc if connect was called', () => {
      service.connect('test-room');

      const ydocDestroySpy = spyOn(service.ydoc, 'destroy');

      service.ngOnDestroy();

      expect(mockProvider.destroy).toHaveBeenCalledTimes(1);
      expect(ydocDestroySpy).toHaveBeenCalledTimes(1);
    });
  });
});
