import { Directive, ElementRef, inject, input } from '@angular/core';
import { onWindowScroll } from '../../core/browser/window-scroll';

@Directive({ selector: '[appParallax]' })
export class Parallax {
  readonly depth = input.required<number>({ alias: 'appParallax' });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private queued = false;

  constructor() {
    onWindowScroll((view) => {
      if (this.queued) return;
      this.queued = true;
      view.requestAnimationFrame(() => this.apply(view));
    });
  }

  private apply(view: Window): void {
    this.queued = false;
    const reduce = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const y = reduce ? 0 : view.scrollY;
    if (y > view.innerHeight * 1.5) return;
    this.element.style.transform = y ? `translate3d(0, ${(y * this.depth()).toFixed(1)}px, 0)` : '';
  }
}
