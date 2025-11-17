import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import { EditorComponent } from './editor.component';
import { AiCompletionService } from '../services/ai-completion.service';
import { CollaborationService } from '../services/collaboration.service';
import * as CodeMirror from 'codemirror';
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

xdescribe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  let editorViewSpy: jasmine.Spy;
  let startCompletionSpy: jasmine.Spy;
  let yCollabSpy: jasmine.Spy;

  beforeEach(async () => {
    mockUrlParams.get.calls.reset();
    mockAiService.getCompletions.calls.reset();
    mockCollabService.connect.calls.reset();
    mockCollabService.ngOnDestroy.calls.reset();

    spyOn(window, 'URLSearchParams').and.returnValue(mockUrlParams);
    editorViewSpy = spyOn(CodeMirror, 'EditorView').and.callFake(() => ({ state: {} } as any));
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

    yCollabSpy = spyOn(component as any, '_yCollab').and.returnValue({} as any);
    component.editorHost = new MockElementRef();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  xdescribe('ngAfterViewInit', () => {
    it('should connect to "default-room"', () => {
      mockUrlParams.get.withArgs('room').and.returnValue(null);
      fixture.detectChanges();
      expect(mockCollabService.connect).toHaveBeenCalledWith('default-room');
    });

    it('should connect to "test-room"', () => {
      mockUrlParams.get.withArgs('room').and.returnValue('test-room');
      fixture.detectChanges();
      expect(mockCollabService.connect).toHaveBeenCalledWith('test-room');
    });

    it('should initialize EditorView and call _yCollab spy', () => {
      fixture.detectChanges();
      expect(editorViewSpy).toHaveBeenCalledTimes(1);

      expect(yCollabSpy).toHaveBeenCalledWith(
        mockCollabService.yText,
        mockCollabService.awareness,
        { undoManager: mockCollabService.undoManager }
      );
    });
  });

  xdescribe('ngOnDestroy', () => {
    it('should call collabService.ngOnDestroy', () => {
      fixture.detectChanges();
      fixture.destroy();
      expect(mockCollabService.ngOnDestroy).toHaveBeenCalledTimes(1);
    });
  });

  xdescribe('customAiCompletion function', () => {
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
    }));

    it('should call aiService and return suggestions', fakeAsync(() => {
      const mockSuggestions = {
        suggestions: [{ label: 'console.log', type: 'function' }],
      };
      mockAiService.getCompletions.and.returnValue(of(mockSuggestions));

      let result: CompletionResult | null = null;
      customAiCompletion(mockContext).then((res) => (result = res));

      tick();

      expect(mockAiService.getCompletions).toHaveBeenCalled();
      expect(result).toEqual(jasmine.objectContaining({ from: 10 }));
    }));

    it('should handle AI service error', fakeAsync(() => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('AI Failed');
      mockAiService.getCompletions.and.returnValue(throwError(() => error));

      let result: CompletionResult | null = null;
      customAiCompletion(mockContext).then((res) => (result = res));

      tick();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('AI Completion Error:', error);
    }));
  });
});
