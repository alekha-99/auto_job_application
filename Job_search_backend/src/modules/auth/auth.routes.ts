import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { requireJwt } from '../../middlewares/auth.middleware';

const router = Router();

// Public: Register a new user
router.post('/register', register as any);

// Public: Login and get JWT
router.post('/login', login as any);

// Protected: Get current user profile
router.get('/me', requireJwt as any, getMe as any);

export default router;
