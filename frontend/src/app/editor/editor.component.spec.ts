import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import { EditorComponent } from './editor.component';
import { AiCompletionService } from '../services/ai-completion.service';
import { CollaborationService } from '../services/collaboration.service';
import * as CodeMirror from 'codemirror';
import * as YCollab from 'y-codemirror.next';
import * as Autocomplete from '@codemirror/autocomplete';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

class MockElementRef implements ElementRef {
  nativeElement = document.createElement('div');
}

const mockUrlParams = jasmine.createSpyObj('URLSearchParams', ['get']);

const mockAiService = jasmine.createSpyObj('AiCompletionService', ['getCompletions']);

const mockCollabService = jasmine.createSpyObj('CollaborationService', ['connect', 'ngOnDestroy'], {
  yText: new Y.Text(),
  awareness: { on: () => {}, off: () => {} },
  undoManager: new UndoManager(new Y.Text()),
});

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  let editorViewSpy: jasmine.Spy;
  let yCollabSpy: jasmine.Spy;
  let startCompletionSpy: jasmine.Spy;

  beforeEach(async () => {
    mockUrlParams.get.calls.reset();
    mockAiService.getCompletions.calls.reset();
    mockCollabService.connect.calls.reset();
    mockCollabService.ngOnDestroy.calls.reset();

    spyOn(window, 'URLSearchParams').and.returnValue(mockUrlParams);

    editorViewSpy = spyOn(CodeMirror, 'EditorView').and.callFake(() => ({ state: {} } as any));

    yCollabSpy = spyOn(YCollab, 'yCollab').and.returnValue({} as any);

    startCompletionSpy = spyOn(Autocomplete, 'startCompletion').and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        { provide: AiCompletionService, useValue: mockAiService },
        { provide: CollaborationService, useValue: mockCollabService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;

    component.editorHost = new MockElementRef();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit', () => {
    it('should connect to "default-room" if no room param is present', () => {
      mockUrlParams.get.withArgs('room').and.returnValue(null);

      fixture.detectChanges();

      expect(window.URLSearchParams).toHaveBeenCalledWith(window.location.search);
      expect(mockUrlParams.get).toHaveBeenCalledWith('room');
      expect(mockCollabService.connect).toHaveBeenCalledWith('default-room');
    });

    it('should connect to room from URL parameter "room=test-room"', () => {
      mockUrlParams.get.withArgs('room').and.returnValue('test-room');

      fixture.detectChanges();

      expect(mockCollabService.connect).toHaveBeenCalledWith('test-room');
    });

    it('should initialize EditorView with yCollab and autocompletion', () => {
      fixture.detectChanges();

      expect(editorViewSpy).toHaveBeenCalledTimes(1);

      expect(yCollabSpy).toHaveBeenCalledWith(
        mockCollabService.yText,
        mockCollabService.awareness,
        { undoManager: mockCollabService.undoManager }
      );

      const editorConfig = editorViewSpy.calls.mostRecent().args[0];
      expect(editorConfig.parent).toBe(component.editorHost.nativeElement);

      expect(editorConfig.extensions).toContain(yCollabSpy.calls.mostRecent().returnValue);
      const autocompletionConfig = editorConfig.extensions.find(
        (ext: any) => ext && ext.config && ext.config.override
      );
      expect(autocompletionConfig).toBeDefined();
      expect(autocompletionConfig.config.activateOnTyping).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call collabService.ngOnDestroy', () => {
      fixture.detectChanges();
      fixture.destroy();

      expect(mockCollabService.ngOnDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('customAiCompletion function', () => {
    let customAiCompletion: (context: CompletionContext) => Promise<CompletionResult | null>;
    let mockContext: CompletionContext;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();

      const editorConfig = editorViewSpy.calls.mostRecent().args[0];
      const autocompletionConfig = editorConfig.extensions.find(
        (ext: any) => ext && ext.config && ext.config.override
      );
      customAiCompletion = autocompletionConfig.config.override[0];

      mockContext = {
        pos: 10,
        state: { doc: { toString: () => 'const hello' } },
      } as any;

      (component as any).shouldThrottleCompletion = true;
    }));

    it('should call aiService and return mapped suggestions', fakeAsync(() => {
      const mockSuggestions = {
        suggestions: [{ label: 'console.log', type: 'function' }],
      };
      mockAiService.getCompletions.and.returnValue(of(mockSuggestions));

      let result: CompletionResult | null = null;
      customAiCompletion(mockContext).then((res) => (result = res));

      tick();

      expect(mockAiService.getCompletions).toHaveBeenCalledWith({
        fullText: 'const hello',
        cursorPosition: 10,
        textBeforeCursor: 'const hello',
      });

      expect(result).toEqual(
        jasmine.objectContaining({
          from: 10,
          options: [{ label: 'console.log', type: 'function', apply: 'console.log' }],
        })
      );

      expect((component as any).shouldThrottleCompletion).toBeFalse();
    }));

    it('should return null if aiService returns no suggestions', fakeAsync(() => {
      mockAiService.getCompletions.and.returnValue(of({ suggestions: [] }));

      let result: CompletionResult | null = null;
      customAiCompletion(mockContext).then((res) => (result = res));

      tick();

      expect(result).toBeNull();
      expect((component as any).shouldThrottleCompletion).toBeFalse();
    }));

    it('should return null and log error on aiService failure', fakeAsync(() => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('AI Service Failed');
      mockAiService.getCompletions.and.returnValue(throwError(() => error));

      let result: CompletionResult | null = null;
      customAiCompletion(mockContext).then((res) => (result = res));

      tick();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('AI Completion Error:', error);
      expect((component as any).shouldThrottleCompletion).toBeFalse();
    }));
  });

  describe('throttledStartCompletion function', () => {
    let throttledStartCompletion: (view: CodeMirror.EditorView) => boolean;

    beforeEach(() => {
      fixture.detectChanges();

      const editorConfig = editorViewSpy.calls.mostRecent().args[0];
      // Находим расширение keymap
      const keymapPlugin = editorConfig.extensions.find(
        (ext: any) => ext && ext.value && ext.value.keymaps
      );
      const keymapEntry = keymapPlugin.value.keymaps[0].find((k: any) => k.key === 'Ctrl-.');
      throttledStartCompletion = keymapEntry.run;

      (component as any).shouldThrottleCompletion = false;
      startCompletionSpy.calls.reset();
    });

    it('should call startCompletion and set throttle flag on first call', () => {
      const result = throttledStartCompletion({} as any);

      expect(result).toBeTrue();
      expect(startCompletionSpy).toHaveBeenCalledTimes(1);
      expect((component as any).shouldThrottleCompletion).toBeTrue();
    });

    it('should NOT call startCompletion if already throttled', () => {
      throttledStartCompletion({} as any);
      expect((component as any).shouldThrottleCompletion).toBeTrue();
      startCompletionSpy.calls.reset();

      const result = throttledStartCompletion({} as any);

      expect(result).toBeTrue();
      expect(startCompletionSpy).not.toHaveBeenCalled();
      expect((component as any).shouldThrottleCompletion).toBeTrue();
    });
  });
});
