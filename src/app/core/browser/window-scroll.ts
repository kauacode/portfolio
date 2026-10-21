import { DOCUMENT, DestroyRef, afterNextRender, inject } from '@angular/core';

/**
 * Listener passivo de scroll registrado direto na window. Um `(window:scroll)` no host faria o Angular checar
 * a página a cada evento; aqui só há trabalho quando um signal muda.
 */
export function onWindowScroll(handler: (view: Window) => void): void {
  const view = inject(DOCUMENT).defaultView;
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    if (!view) return;
    const listener = () => handler(view);
    view.addEventListener('scroll', listener, { passive: true });
    destroyRef.onDestroy(() => view.removeEventListener('scroll', listener));
    listener();
  });
}
