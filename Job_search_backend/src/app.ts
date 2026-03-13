import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import pino from 'pino';

import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';

import jobsRoutes from './modules/jobs/jobs.routes';
import authRoutes from './modules/auth/auth.routes';
import resumeRoutes from './modules/resume/resume.routes';

const app = express();

// Logger
const logger = pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' });
app.use(pinoHttp({ logger }));

// Security headers
app.use(helmet());
app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
    })
);

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Body parsers with size limits to prevent payload abuse
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/resume', resumeRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorMiddleware);

export default app;
