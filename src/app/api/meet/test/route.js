import { NextResponse } from 'next/server';

/**
 * Simple test endpoint
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
}

export async function POST(request) {
    try {
        const body = await request.json();

        return NextResponse.json({
            success: true,
            message: 'Received your request',
            data: body
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
