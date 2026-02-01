import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/app/api/model/UserModel';

export async function POST(request) {
    try {
        // Connect to MongoDB
        await connectDB();

        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password using the comparePassword method
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }
        console.log("first")

        // Update last login
        user.lastLogin = new Date().toISOString();

        await user.save({ validateBeforeSave: false });

        // Generate token
        const token = generateToken(user._id.toString());

        // Return user data (without password)
        const userResponse = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            isVerified: user.isVerified
        };

        return NextResponse.json({
            success: true,
            user: userResponse,
            token,
            message: 'Signed in successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Signin error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
