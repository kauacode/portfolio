import { ChangeDetectionStrategy, Component, Directive, computed, inject, input } from '@angular/core';
import type { Color } from '../core/content/profile.model';
import type { SectionKey } from '../core/content/ui-strings';
import { Locale } from '../core/i18n/locale';
import { Marker } from '../shared/marker';

@Directive({
  selector: 'section[appPageSection]',
  host: {
    '[class]': "field() ? 'section field-' + field() : 'section'",
    '[id]': 'id()',
    '[attr.aria-labelledby]': "id() + '-title'",
  },
})
export class PageSection {
  readonly key = input.required<SectionKey>({ alias: 'appPageSection' });
  readonly field = input<Color>();

  private readonly locale = inject(Locale);
  protected readonly id = computed(() => this.locale.sectionId(this.key()));
}

@Component({
  selector: 'div[appSectionHead]',
  imports: [Marker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'section-head' },
  template: `<span [appMarker]="color()"></span>
    <h2 [id]="locale.sectionId(key()) + '-title'">{{ heading() }}</h2>`,
})
export class SectionHead {
  readonly key = input.required<SectionKey>({ alias: 'appSectionHead' });
  readonly color = input.required<Color>();
  readonly heading = input.required<string>();
  protected readonly locale = inject(Locale);
}
