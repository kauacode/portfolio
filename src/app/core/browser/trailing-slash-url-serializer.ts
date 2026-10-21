import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, type UrlTree } from '@angular/router';

// O router tira a barra final ("/en/" vira "/en"); a URL canônica é com barra.
@Injectable()
export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override serialize(tree: UrlTree): string {
    const url = super.serialize(tree);
    const end = url.search(/[?#]/);
    const path = end === -1 ? url : url.slice(0, end);
    const lastSegment = path.slice(path.lastIndexOf('/') + 1);
    if (path.endsWith('/') || lastSegment.includes('.')) return url;
    return `${path}/${end === -1 ? '' : url.slice(end)}`;
  }
}
