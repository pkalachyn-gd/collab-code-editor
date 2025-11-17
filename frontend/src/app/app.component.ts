import {Component} from '@angular/core';
import {CommonModule} from '@angular/common'; // <-- Нужен для @if
import {RouterOutlet} from '@angular/router';
import {EditorComponent} from './editor/editor.component';
import {RoomsComponent} from './rooms/rooms.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, EditorComponent, RoomsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
}
