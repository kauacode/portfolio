import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName = 'arrow' | 'download' | 'mail' | 'linkedin' | 'moon' | 'sun' | 'menu' | 'check';

@Component({
  selector: 'svg[appIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    viewBox: '0 0 24 24',
    '[attr.class]': 'themeClass()',
    '[attr.fill]': "filled() ? 'currentColor' : 'none'",
    '[attr.stroke]': "filled() ? null : 'currentColor'",
    '[attr.stroke-width]': "filled() ? null : '2.2'",
    '[attr.stroke-linecap]': "filled() ? null : 'round'",
    '[attr.stroke-linejoin]': "filled() ? null : 'round'",
    'aria-hidden': 'true',
    focusable: 'false',
  },
  template: `
    @switch (name()) {
      @case ('arrow') {
        <svg:path d="M7 17 17 7M8 7h9v9" />
      }
      @case ('download') {
        <svg:path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
      }
      @case ('mail') {
        <svg:rect x="3" y="5" width="18" height="14" rx="2" />
        <svg:path d="m4 7 8 6 8-6" />
      }
      @case ('linkedin') {
        <svg:path
          d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm7 0h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.37 2.65 4.37 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4v-11Z"
        />
      }
      @case ('moon') {
        <svg:path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      }
      @case ('sun') {
        <svg:circle cx="12" cy="12" r="4" />
        <svg:path
          d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        />
      }
      @case ('menu') {
        <svg:path d="M4 7h16M4 12h16M4 17h16" />
      }
      @case ('check') {
        <svg:path d="m5 12.5 4.5 4.5L19 7.5" />
      }
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>({ alias: 'appIcon' });
  protected readonly filled = computed(() => this.name() === 'linkedin');
  protected readonly themeClass = computed(() =>
    this.name() === 'moon' ? 'i-moon' : this.name() === 'sun' ? 'i-sun' : null,
  );
}
