import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/compare/')) {
    // Strip leading /compare/ and any trailing slashes
    const slug = pathname.replace(/^\/compare\/?/, '').replace(/\/$/, '');
    if (!slug) {
      return NextResponse.next();
    }

    // Special architectural slugs
    if (slug === 'anthropic-prompt-caching-vs-standard' || slug === 'openai-batch-api-vs-standard-api') {
      return NextResponse.next();
    }
    if (slug === 'standard-vs-anthropic-prompt-caching') {
      const url = request.nextUrl.clone();
      url.pathname = '/compare/anthropic-prompt-caching-vs-standard/';
      return NextResponse.redirect(url, 301);
    }
    if (slug === 'standard-api-vs-openai-batch-api') {
      const url = request.nextUrl.clone();
      url.pathname = '/compare/openai-batch-api-vs-standard-api/';
      return NextResponse.redirect(url, 301);
    }

    const parts = slug.split('-vs-');
    if (parts.length === 2) {
      const [a, b] = parts;

      // Canonical mapping for o1 vs openai-o1
      if ((a === 'deepseek-r1' && b === 'o1') || (a === 'o1' && b === 'deepseek-r1')) {
        const url = request.nextUrl.clone();
        url.pathname = '/compare/deepseek-r1-vs-openai-o1/';
        return NextResponse.redirect(url, 301);
      }
      if (a === 'openai-o1' && b === 'deepseek-r1') {
        const url = request.nextUrl.clone();
        url.pathname = '/compare/deepseek-r1-vs-openai-o1/';
        return NextResponse.redirect(url, 301);
      }

      // Check alphabetical ordering
      if (a > b) {
        const canonicalSlug = `${b}-vs-${a}`;
        const url = request.nextUrl.clone();
        url.pathname = `/compare/${canonicalSlug}/`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/compare/:path*'],
};
