import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { RoomsComponent } from './rooms/rooms.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EditorComponent, RoomsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
