import { NextResponse } from 'next/server';
import { generateToken, isValidEmail } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/app/api/model/UserModel';

export async function POST(request) {
    try {
        // Connect to MongoDB
        await connectDB();

        const body = await request.json();
        const { name, email, password, passwordConfirm } = body;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Email validation
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Password validation
        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 409 }
            );
        }

        // Create new user (password will be hashed by the pre-save hook)
        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            passwordConfirm: passwordConfirm || password, // Use passwordConfirm if provided
        });

        // Generate token
        const token = generateToken(newUser._id.toString());

        // Return user data (without password)
        const userResponse = {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            createdAt: newUser.createdAt,
            isVerified: newUser.isVerified
        };

        return NextResponse.json({
            success: true,
            user: userResponse,
            token,
            message: 'Account created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Signup error:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return NextResponse.json(
                { success: false, error: messages[0] || 'Validation error' },
                { status: 400 }
            );
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
