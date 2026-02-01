import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/googleMeet';

/**
 * API Route: Initiate Google OAuth
 * GET /api/auth/google
 */
export async function GET() {
    try {
        const authUrl = getGoogleAuthUrl();

        return NextResponse.json({
            success: true,
            authUrl
        });
    } catch (error) {
        console.error('Error generating Google auth URL:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate auth URL' },
            { status: 500 }
        );
    }
}
