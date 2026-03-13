import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getUserProfile } from './auth.service';
import { ApiError } from '../../utils/apiError';

/**
 * POST /api/auth/register
 */
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name, email, password, phoneNumber, preferredRole } = req.body;

        // Input validation
        if (!name || !email || !password || !preferredRole) {
            throw new ApiError(400, 'name, email, password, and preferredRole are required.');
        }

        if (password.length < 8) {
            throw new ApiError(400, 'Password must be at least 8 characters.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, 'Invalid email format.');
        }

        const user = await registerUser({ name, email, password, phoneNumber, preferredRole });

        res.status(201).json({
            success: true,
            message: 'Registration successful.',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 */
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, 'email and password are required.');
        }

        const result = await loginUser(email, password);

        res.json({
            success: true,
            message: 'Login successful.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me — requires JWT
 */
export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        if (!userId) {
            throw new ApiError(401, 'Not authenticated.');
        }

        const user = await getUserProfile(userId);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};
