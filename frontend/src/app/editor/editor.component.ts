import {Component, ViewChild, ElementRef, signal, effect, AfterViewInit, ChangeDetectionStrategy} from '@angular/core';
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

/** We don't use ChangeDetectionStrategy.OnPush because
 * of external signals from WebSocket
 */
@Component({
  selector: 'app-editor',
  standalone: true,
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  providers: [CollaborationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('editorHost') editorHost!: ElementRef;

  private editor?: EditorView;
  private shouldThrottleCompletion = false;
  private roomName = signal(new URLSearchParams(window.location.search).get('room') || 'default-room');

  constructor(
    private aiService: AiCompletionService,
    private collabService: CollaborationService
  ) {
    effect(() => {
      if (this.editorHost) {
        this.initializeEditor(this.roomName());
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeEditor(this.roomName());
  }

  private initializeEditor(roomName: string): void {
    this.editor?.destroy();
    this.collabService.ngOnDestroy();
    this.collabService.connect(roomName);

    const customAiCompletion = (context: CompletionContext): Promise<CompletionResult | null> => {
      const requestPayload = {
        fullText: context.state.doc.toString(),
        cursorPosition: context.pos,
      };

      return this.aiService
        .getCompletions(requestPayload)
        .toPromise()
        .then((response): CompletionResult | null => {
          this.shouldThrottleCompletion = false;
          if (!response?.suggestions?.length) return null;
          return {
            from: context.pos,
            options: response.suggestions.map((s) => ({
              label: s.label,
              type: s.type,
              apply: s.label,
            })),
          };
        })
        .catch((err) => {
          this.shouldThrottleCompletion = false;
          console.error('AI Completion Error:', err);
          return null;
        });
    };

    const throttledStartCompletion = (view: EditorView): boolean => {
      if (this.shouldThrottleCompletion) return true;
      this.shouldThrottleCompletion = true;
      return startCompletion(view);
    };

    this.editor = new EditorView({
      extensions: [
        basicSetup,
        javascript(),
        autocompletion({ override: [customAiCompletion], activateOnTyping: false }),
        keymap.of([{ key: 'Ctrl-.', run: throttledStartCompletion }]),
        yCollab(this.collabService.yText, this.collabService.awareness, { undoManager: this.collabService.undoManager }),
      ],
      parent: this.editorHost.nativeElement,
    });
  }
}
