import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  startCompletion,
} from '@codemirror/autocomplete';
import { AiCompletionService } from '../services/ai-completion.service';
import { CollaborationService } from '../services/collaboration.service';
import { yCollab } from 'y-codemirror.next';

@Component({
  selector: 'app-editor',
  standalone: true,
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  providers: [CollaborationService],
  // We don't use CDR:OnPush,  because we have external signals from WebSocket
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorHost') editorHost!: ElementRef;

  private editor!: EditorView;
  private shouldThrottleCompletion = false;

  constructor(
    private aiService: AiCompletionService,
    private collabService: CollaborationService
  ) {}

  ngAfterViewInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'default-room';

    this.collabService.connect(roomName);

    const yText = this.collabService.yText;
    const awareness = this.collabService.awareness;
    const undoManager = this.collabService.undoManager;

    const customAiCompletion = (context: CompletionContext): Promise<CompletionResult | null> => {
      const cursorPosition = context.pos;
      const fullText = context.state.doc.toString();

      const requestPayload = {
        fullText: fullText,
        cursorPosition: cursorPosition,
      };

      const resetThrottle = () => {
        this.shouldThrottleCompletion = false;
      };

      return this.aiService
        .getCompletions(requestPayload)
        .toPromise()
        .then((response): CompletionResult | null => {
          resetThrottle();
          if (!response || !response.suggestions || response.suggestions.length === 0) {
            return null;
          }
          return {
            from: cursorPosition,
            options: response.suggestions.map((s) => ({
              label: s.label,
              type: s.type,
              apply: s.label,
            })),
          };
        })
        .catch((err) => {
          resetThrottle();
          console.error('AI Completion Error:', err);
          return null;
        });
    };

    const throttledStartCompletion = (view: EditorView): boolean => {
      if (this.shouldThrottleCompletion) {
        return true;
      }
      this.shouldThrottleCompletion = true;
      return startCompletion(view);
    };

    const newCompletionKeymap = keymap.of([
      {
        key: 'Ctrl-.',
        run: throttledStartCompletion,
      },
    ]);

    this.editor = new EditorView({
      extensions: [
        basicSetup,
        javascript(),
        autocompletion({
          override: [customAiCompletion],
          activateOnTyping: false,
        }),
        newCompletionKeymap,
        yCollab(yText, awareness, { undoManager }),
      ],
      parent: this.editorHost.nativeElement,
    });
  }

  ngOnDestroy(): void {
    this.collabService.ngOnDestroy();
  }
}
