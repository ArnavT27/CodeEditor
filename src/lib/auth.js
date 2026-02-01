import jwt from 'jsonwebtoken';
import '../lib/loadEnv.js';

// JWT token generation
export function generateToken(userId) {
    const secret = process.env.JWT_SECRET_KEY || 'fallback-secret-key-change-in-production';
    const expiresIn = process.env.JWT_EXPIRE_IN || '90d';

    return jwt.sign({ userId }, secret, { expiresIn });
}

// Verify JWT token
export function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET_KEY || 'fallback-secret-key-change-in-production';
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}

// Email validation
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
