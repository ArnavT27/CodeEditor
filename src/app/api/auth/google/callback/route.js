import { NextResponse } from 'next/server';
import { getGoogleTokens } from '@/lib/googleMeet';
import { cookies } from 'next/headers';

/**
 * API Route: Google OAuth Callback
 * GET /api/auth/google/callback
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(
                new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/dashboard?error=no_code', request.url)
            );
        }

        // Exchange code for tokens
        const result = await getGoogleTokens(code);

        if (!result.success) {
            return NextResponse.redirect(
                new URL(`/dashboard?error=${encodeURIComponent(result.error)}`, request.url)
            );
        }

        // Store tokens in cookies (in production, use secure session storage)
        const cookieStore = cookies();
        cookieStore.set('google_access_token', result.tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600, // 1 hour
            path: '/'
        });

        if (result.tokens.refresh_token) {
            cookieStore.set('google_refresh_token', result.tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60, // 30 days
                path: '/'
            });
        }

        // Redirect back to dashboard with success
        return NextResponse.redirect(
            new URL('/dashboard?google_auth=success', request.url)
        );
    } catch (error) {
        console.error('Error in Google OAuth callback:', error);
        return NextResponse.redirect(
            new URL(`/dashboard?error=${encodeURIComponent(error.message)}`, request.url)
        );
    }
}
