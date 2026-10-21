import { Injectable, computed, inject } from '@angular/core';
import { Assets } from '../core/browser/assets';
import { PROFILE } from '../core/content/content.tokens';
import { Locale } from '../core/i18n/locale';

@Injectable()
export class Curriculum {
  private readonly cv = inject(PROFILE).person.cv;
  private readonly assets = inject(Assets);
  private readonly locale = inject(Locale);

  private readonly path = computed(() => this.cv[this.locale.lang()] ?? this.cv.pt);
  readonly href = computed(() => this.assets.url(`/${this.path()}`));
  // explícito porque offline o href é um data URI
  readonly fileName = computed(() => this.path().split('/').at(-1) ?? this.path());
  readonly otherLanguage = computed(() => !this.cv[this.locale.lang()]);
}
