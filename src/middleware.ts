import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';

    // Allow localhost for development
    if (hostname.includes('localhost')) {
        return NextResponse.next();
    }

    // Allow preview URLs (optional, but usually good to keep them working)
    // But user asked to "forward to skibidi.games".
    // If they want to enforce the domain on production, we should redirect.
    // However, redirecting ALL vercel.app traffic might break previews.
    // I will safer approach: Only redirect if it's NOT skibidi.games and NOT a preview branch URL (which usually have simplified names)
    // Actually, standard practice for "forward to X" is to catch the main vercel domain.

    // Let's implement strict forwarding to skibidi.games for any non-localhost traffic
    // EXCEPTION: Check if it's already skibidi.games
    if (hostname === 'skibidi.games' || hostname === 'www.skibidi.games') {
        return NextResponse.next();
    }

    // Redirect to skibidi.games
    const url = new URL(request.url);
    url.hostname = 'skibidi.games';
    url.protocol = 'https';
    url.port = ''; // Clear port if any
    return NextResponse.redirect(url);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - sitelogo.png (logo file)
         * - manifest.json (PWA manifest)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitelogo.png|manifest.json).*)',
    ],
};
