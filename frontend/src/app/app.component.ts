import { Component, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Нужен для @if
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { RoomsComponent } from './rooms/rooms.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, distinctUntilChanged, skip } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, EditorComponent, RoomsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  showEditor = signal(true);

  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('room')),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.showEditor.set(false);

        setTimeout(() => {
          this.showEditor.set(true);
        }, 0);
      });
  }
}
