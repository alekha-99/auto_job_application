import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';

const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
export const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    preferredRole: string;
}) => {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        throw new ApiError(409, 'An account with this email already exists.');
    }

    // Validate preferred role
    const validRoles = ['SDE', 'Data Engineer', 'Data Science', 'Other'];
    if (!validRoles.includes(data.preferredRole)) {
        throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email.toLowerCase().trim(),
            password: hashedPassword,
            phoneNumber: data.phoneNumber || null,
            preferredRole: data.preferredRole,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            preferredRole: true,
            createdAt: true,
        },
    });

    return user;
};

/**
 * Login user and return JWT
 */
export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
        throw new ApiError(401, 'Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password.');
    }

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'] }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            preferredRole: user.preferredRole,
        },
    };
};

/**
 * Get user profile by ID (excludes password)
 */
export const getUserProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            preferredRole: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    return user;
};
