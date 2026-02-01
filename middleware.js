// Middleware - Runs before requests are processed
import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Add security headers
    const response = NextResponse.next();

    // CORS headers for API routes
    if (pathname.startsWith('/api/')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Rate limiting simulation (in production, use Redis or similar)
    const userIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    // Log API requests
    if (pathname.startsWith('/api/')) {
        console.log(`API Request: ${request.method} ${pathname} from ${userIP}`);
    }

    // Security: Block suspicious requests
    const userAgent = request.headers.get('user-agent') || '';
    if (userAgent.includes('bot') && !userAgent.includes('Googlebot')) {
        console.log(`Blocked suspicious request from: ${userAgent}`);
        return new NextResponse('Access Denied', { status: 403 });
    }

    // Redirect old API paths (example)
    if (pathname.startsWith('/api/v1/')) {
        const newPath = pathname.replace('/api/v1/', '/api/');
        return NextResponse.redirect(new URL(newPath, request.url));
    }

    return response;
}

// Configure which paths the middleware runs on
export const config = {
    matcher: [
        // Match all API routes
        '/api/:path*',
        // Match specific pages that need middleware
        '/editor/:path*',
        // Exclude static files and images
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}