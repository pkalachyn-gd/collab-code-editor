import { Injectable, OnDestroy } from '@angular/core';
import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import { WebsocketProvider } from 'y-websocket';

/**
 * This service is NOT provided at 'root'.
 * It must be provided in the `providers` array of the component that uses it.
 * This ensures that a new service instance is created for each omponent instance.
 */
@Injectable()
export class CollaborationService implements OnDestroy {
  public ydoc!: Y.Doc;
  public yText!: Y.Text;
  public awareness!: any; // (WebsocketProvider.awareness)
  public undoManager!: UndoManager;

  private provider?: WebsocketProvider;

  constructor() {}

  connect(roomName: string) {
    this.ydoc = new Y.Doc();
    this.yText = this.ydoc.getText('codemirror');

    // We use `any` for awareness, since WebsocketProvider has
    // a complex type that we don't need to fully describe here.
    this.provider = new WebsocketProvider(
      'whttps://collab-editor-backend-eqfl.onrender.com',
      roomName,
      this.ydoc
    );

    this.awareness = this.provider.awareness;
    this.undoManager = new UndoManager(this.yText);
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
