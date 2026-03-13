import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJobsFromDb, getJobById, syncJobsToDb } from './jobs.service';
import { ApiError } from '../../utils/apiError';
import { env } from '../../config/env';
import prisma from '../../config/prisma';

/**
 * Optionally extract userId from JWT (does NOT reject if missing)
 */
const extractUserId = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
};

/**
 * GET /api/jobs — List jobs from local DB
 * If user is logged in (JWT), auto-filters by their preferredRole.
 * If not logged in, returns all jobs.
 */
export const listJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page, limit, title, location, organization, remote, source, category, atsPlatform, sortBy, order } =
            req.query;

        // Auto-detect user's preferred role from JWT
        let roleFilter = category as string | undefined;
        const userId = extractUserId(req);
        if (userId && !roleFilter) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { preferredRole: true },
            });
            if (user && user.preferredRole !== 'Other') {
                roleFilter = user.preferredRole;
            }
        }

        const result = await getJobsFromDb({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            title: title as string | undefined,
            location: location as string | undefined,
            organization: organization as string | undefined,
            remote: remote as string | undefined,
            source: source as string | undefined,
            category: roleFilter,
            atsPlatform: atsPlatform as string | undefined,
            sortBy: sortBy as string | undefined,
            order: order as 'asc' | 'desc' | undefined,
        });

        res.json({
            success: true,
            data: result.jobs,
            pagination: result.pagination,
            ...(userId ? { filter: { preferredRole: roleFilter } } : {}),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/jobs/:id — Get single job
 */
export const getJob = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const job = await getJobById(req.params.id as string);
        if (!job) {
            throw new ApiError(404, 'Job not found');
        }

        res.json({
            success: true,
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/jobs/sync — Manually trigger job sync
 */
export const triggerSync = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { title_filter, location_filter } = req.body || {};

        const result = await syncJobsToDb({
            title_filter,
            location_filter,
        });

        res.json({
            success: true,
            message: `Sync complete. ${result.synced} jobs synced, ${result.errors} errors.`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
