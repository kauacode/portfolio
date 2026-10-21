import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Color } from '../core/content/profile.model';

const SHAPES: Readonly<Record<Color, string>> = {
  blue: 'm-circle',
  ochre: 'm-leaf',
  green: 'm-quarter',
  purple: 'm-pill',
};

@Component({
  selector: 'span[appMarker]',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style.--c]': 'colorVar()',
    'aria-hidden': 'true',
  },
})
export class Marker {
  readonly color = input.required<Color>({ alias: 'appMarker' });
  protected readonly classes = computed(() => `marker ${SHAPES[this.color()]}`);
  protected readonly colorVar = computed(() => `var(--${this.color()})`);
}
