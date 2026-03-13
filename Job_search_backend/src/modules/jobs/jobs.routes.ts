import { Router } from 'express';
import { listJobs, getJob, triggerSync } from './jobs.controller';
import { requireApiKey } from '../../middlewares/auth.middleware';

const router = Router();

// Public: List jobs with pagination/filters
router.get('/', listJobs as any);

// Protected: Manually trigger job sync from Apify
router.post('/sync', requireApiKey as any, triggerSync as any);

// Public: Get single job by ID
router.get('/:id', getJob as any);

export default router;
