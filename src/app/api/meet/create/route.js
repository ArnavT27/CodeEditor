import { NextResponse } from 'next/server';
import { createGoogleMeet, createSimpleMeetLink } from '@/lib/googleMeet';
import connectDB from '@/lib/mongodb';
import { cookies } from 'next/headers';

/**
 * API Route: Create Google Meet
 * POST /api/meet/create
 */
export async function POST(request) {
    try {
        console.log('📥 Received POST request to /api/meet/create');

        const body = await request.json();
        console.log('📦 Request body:', body);

        const { roomId, roomName, useOAuth } = body;

        if (!roomId) {
            console.log('❌ No room ID provided');
            return NextResponse.json(
                { success: false, error: 'Room ID is required' },
                { status: 400 }
            );
        }

        console.log(`🔧 Creating room: ${roomId}, OAuth: ${useOAuth}`);

        // Check if user wants to use OAuth (requires Google authentication)
        if (useOAuth) {
            console.log('🔐 OAuth mode requested');
            // Get Google access token from cookies
            const cookieStore = await cookies();
            const accessToken = cookieStore.get('google_access_token')?.value;
            const userEmail = cookieStore.get('user_email')?.value || 'user@example.com';

            if (!accessToken) {
                console.log('❌ No access token found');
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Google authentication required',
                        requiresAuth: true,
                        authUrl: '/api/auth/google'
                    },
                    { status: 401 }
                );
            }

            console.log('✅ Access token found, creating Meet with Google API');
            // Create Meet using Google Calendar API
            const result = await createGoogleMeet({
                summary: roomName || `CodeEditor Room: ${roomId}`,
                description: `Collaborative coding session\nRoom ID: ${roomId}`,
                userEmail,
                accessToken
            });

            if (result.success) {
                // Save meeting info to database
                try {
                    await connectDB();
                    const { default: Room } = await import('@/models/Room');

                    await Room.findOneAndUpdate(
                        { roomId },
                        {
                            roomId,
                            name: roomName,
                            meetLink: result.meetLink,
                            eventId: result.eventId,
                            createdBy: userEmail,
                            createdAt: new Date()
                        },
                        { upsert: true, new: true }
                    );
                    console.log('✅ Saved to database');
                } catch (dbError) {
                    console.error('⚠️ Database error:', dbError);
                    // Continue even if DB save fails
                }
            }

            console.log('✅ Returning result:', result);
            return NextResponse.json(result);
        } else {
            console.log('🔓 Simple mode - generating direct Meet link');
            // Use simple Meet link generation (no OAuth required)
            const result = createSimpleMeetLink(roomId);
            console.log('✅ Generated simple link:', result);

            return NextResponse.json({
                ...result,
                roomId,
                roomName: roomName || 'Untitled Room'
            });
        }
    } catch (error) {
        console.error('❌ Error in /api/meet/create:', error);
        console.error('Stack trace:', error.stack);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create meeting',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/meet/create
 * Get meeting info for a room
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) {
            return NextResponse.json(
                { success: false, error: 'Room ID is required' },
                { status: 400 }
            );
        }

        // Try to get from database
        try {
            await connectDB();
            const { default: Room } = await import('@/models/Room');

            const room = await Room.findOne({ roomId });

            if (room) {
                return NextResponse.json({
                    success: true,
                    meetLink: room.meetLink,
                    roomName: room.name,
                    createdAt: room.createdAt
                });
            }
        } catch (dbError) {
            console.error('Database error:', dbError);
        }

        // If not in database, generate simple link
        const result = createSimpleMeetLink(roomId);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in GET /api/meet/create:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get meeting info' },
            { status: 500 }
        );
    }
}
