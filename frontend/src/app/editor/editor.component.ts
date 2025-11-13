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

import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { yCollab } from 'y-codemirror.next';

@Component({
  selector: 'app-editor',
  standalone: true,
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorHost') editorHost!: ElementRef;

  private editor!: EditorView;
  private ydoc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;

  private completionThrottle = false;

  constructor(private aiService: AiCompletionService) {}

  ngAfterViewInit(): void {
    this.ydoc = new Y.Doc();
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'my-default-room';

    this.provider = new WebsocketProvider('ws://localhost:1234', roomName, this.ydoc);
    const yText = this.ydoc.getText('codemirror');
    const awareness = this.provider.awareness;

    const undoManager = new UndoManager(yText);

    const customAiCompletion = (context: CompletionContext): Promise<CompletionResult | null> => {
      const cursorPosition = context.pos;
      const fullText = context.state.doc.toString();
      const textBeforeCursor = fullText.substring(0, cursorPosition);

      const requestPayload = {
        fullText: fullText,
        cursorPosition: cursorPosition,
        textBeforeCursor: textBeforeCursor,
      };

      const resetThrottle = () => {
        this.completionThrottle = false;
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
      if (this.completionThrottle) {
        return true;
      }

      this.completionThrottle = true;

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
    if (this.provider) {
      this.provider.destroy();
    }
    if (this.ydoc) {
      this.ydoc.destroy();
    }
  }
}
