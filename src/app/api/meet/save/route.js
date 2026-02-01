import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

/**
 * API Route: Save Google Meet URL
 * POST /api/meet/save
 */
export async function POST(request) {
    try {
        console.log('📥 Received POST request to /api/meet/save');

        const body = await request.json();
        const { roomId, meetLink } = body;

        if (!roomId || !meetLink) {
            return NextResponse.json(
                { success: false, error: 'Room ID and Meet link are required' },
                { status: 400 }
            );
        }

        // Validate Meet URL format
        if (!meetLink.includes('meet.google.com')) {
            return NextResponse.json(
                { success: false, error: 'Invalid Google Meet URL' },
                { status: 400 }
            );
        }

        console.log(`💾 Saving Meet link for room: ${roomId}`);

        // Save to database
        try {
            await connectDB();
            const { default: Room } = await import('@/models/Room');

            const room = await Room.findOneAndUpdate(
                { roomId },
                {
                    roomId,
                    meetLink,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );

            console.log('✅ Meet link saved successfully');

            return NextResponse.json({
                success: true,
                meetLink: room.meetLink,
                message: 'Meet link saved successfully'
            });
        } catch (dbError) {
            console.error('❌ Database error:', dbError);
            return NextResponse.json(
                { success: false, error: 'Failed to save to database' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('❌ Error in /api/meet/save:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to save Meet link',
                details: error.message
            },
            { status: 500 }
        );
    }
}
