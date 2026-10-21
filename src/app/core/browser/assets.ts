import { DOCUMENT, Injectable, inject } from '@angular/core';

// Na versão offline (scripts/offline.ts) os arquivos vêm embutidos como data URI.
@Injectable({ providedIn: 'root' })
export class Assets {
  private readonly embedded = readEmbedded(inject(DOCUMENT));

  readonly offline = this.embedded !== null;

  url(path: string): string {
    return this.embedded?.[path] ?? path;
  }
}

function readEmbedded(document: Document): Record<string, string> | null {
  const source = document.getElementById('offline-assets')?.textContent;
  return source ? (JSON.parse(source) as Record<string, string>) : null;
}
