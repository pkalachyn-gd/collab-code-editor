import { TestBed } from '@angular/core/testing';
import { CollaborationService } from './collaboration.service';
import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { environment } from '../../environments/environment';

type MockWebsocketProvider = jasmine.SpyObj<WebsocketProvider>;

describe('CollaborationService', () => {
  let service: CollaborationService;
  let mockProvider: MockWebsocketProvider;
  let mockAwareness: any;

  beforeEach(() => {
    mockAwareness = {}; // Простой мок
    mockProvider = jasmine.createSpyObj('WebsocketProvider', ['destroy']);

    Object.defineProperty(mockProvider, 'awareness', {
      value: mockAwareness,
      writable: false,
    });

    TestBed.configureTestingModule({
      providers: [CollaborationService],
    });

    service = TestBed.inject(CollaborationService);

    spyOn(service as any, '_createProvider').and.returnValue(mockProvider);
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
    });

    it('should initialize UndoManager for the yText', () => {
      expect(service.undoManager).toBeInstanceOf(UndoManager);
      expect((service.undoManager as any).scope[0]).toBe(service.yText);
    });

    it('should call _createProvider with correct args', () => {
      expect((service as any)._createProvider).toHaveBeenCalledWith(
        environment.websocketUrl,
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
