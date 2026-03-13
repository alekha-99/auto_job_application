import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * API Key authentication middleware.
 * Protects sensitive endpoints (e.g., POST /sync) from unauthorized access.
 * Expects: Authorization: Bearer <SYNC_API_KEY>
 */
export const requireApiKey = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized: Missing or invalid Authorization header. Use: Bearer <API_KEY>',
        });
        return;
    }

    const token = authHeader.slice(7);

    if (token !== env.SYNC_API_KEY) {
        res.status(403).json({
            success: false,
            message: 'Forbidden: Invalid API key.',
        });
        return;
    }

    next();
};

/**
 * JWT authentication middleware.
 * Protects user-specific endpoints (e.g., GET /auth/me).
 * Expects: Authorization: Bearer <JWT_TOKEN>
 * Sets req.userId on success.
 */
export const requireJwt = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized: Missing or invalid Authorization header.',
        });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
        (req as any).userId = decoded.userId;
        next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid token.' });
        }
    }
};
