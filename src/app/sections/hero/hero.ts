import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { Assets } from '../../core/browser/assets';
import { PROFILE, TODAY } from '../../core/content/content.tokens';
import { wholeYearsSince } from '../../core/dates';
import { Locale } from '../../core/i18n/locale';
import { CvLink } from '../../shared/cv-link';
import { ExternalLink } from '../../shared/external-link';
import { Icon } from '../../shared/icon';
import { Parallax } from './parallax';

const AWS_ISSUER = 'Amazon Web Services';
const PORTRAIT_WIDTHS = [320, 480, 640] as const;
const PORTRAIT_SIZES = '(max-width: 860px) min(64vw, 300px), 460px';

@Component({
  selector: 'section[appHero]',
  imports: [CvLink, ExternalLink, Icon, Parallax],
  templateUrl: './hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hero',
    'aria-labelledby': 'hero-title',
  },
})
export class Hero {
  protected readonly locale = inject(Locale);
  protected readonly profile = inject(PROFILE);
  protected readonly assets = inject(Assets);
  private readonly today = inject(TODAY);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly portrait = viewChild.required<ElementRef<HTMLElement>>('portrait');
  private pointerFrame = 0;

  protected readonly title = computed(() => this.profile.person.title[this.locale.lang()]);
  protected readonly nameParts = this.profile.person.name.split(' ');

  protected readonly facts = computed(() => {
    const i18n = this.locale.i18n();
    const text = i18n.text;
    const lang = this.locale.lang();
    const { person, hero, certifications } = this.profile;
    const aws = certifications.filter((c) => c.issuer === AWS_ISSUER).length;
    return [
      { label: text.fact_current, value: `${person.company} · ${hero.sector[lang]}` },
      {
        label: text.fact_experience,
        value: i18n.fmt(text.fact_experience_value, {
          years: wholeYearsSince(person.careerStart, this.today),
        }),
      },
      ...(aws ? [{ label: text.fact_certs, value: `${aws}× AWS Certified` }] : []),
      { label: text.fact_base, value: person.area[lang] },
    ];
  });

  constructor() {
    // fora do Angular: mover o mouse não deve disparar detecção de mudanças
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const move = (event: PointerEvent) => this.followPointer(event);
      const leave = () => this.setPointer(0, 0);
      host.addEventListener('pointermove', move);
      host.addEventListener('pointerleave', leave);
      destroyRef.onDestroy(() => {
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerleave', leave);
      });
    });
  }

  // --px/--py vão de -1 a 1; o deslocamento é calculado no CSS
  private followPointer(event: PointerEvent): void {
    const view = this.window;
    if (!view || this.pointerFrame) return;
    if (!view.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const area = event.currentTarget as HTMLElement;
    this.pointerFrame = view.requestAnimationFrame(() => {
      this.pointerFrame = 0;
      const rect = area.getBoundingClientRect();
      this.setPointer(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
    });
  }

  private setPointer(x: number, y: number): void {
    const style = this.portrait().nativeElement.style;
    style.setProperty('--px', x.toFixed(3));
    style.setProperty('--py', y.toFixed(3));
  }

  protected sizes(): string | null {
    return this.assets.offline ? null : PORTRAIT_SIZES;
  }

  protected srcset(format: 'avif' | 'webp' | 'jpg'): string | null {
    if (this.assets.offline) return null;
    return PORTRAIT_WIDTHS.map((w) => `/assets/img/kaua-braccio-${w}.${format} ${w}w`).join(', ');
  }
}
