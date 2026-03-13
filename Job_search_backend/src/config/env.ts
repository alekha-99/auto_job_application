import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string(),
    APIFY_API_TOKEN: z.string().min(1, 'Apify API Token is required'),
    SYNC_API_KEY: z.string().min(16, 'Sync API Key must be at least 16 characters'),
    JWT_SECRET: z.string().min(32, 'JWT Secret must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    CLIENT_URL: z.string().default('http://localhost:3000'),
    OPENAI_API_KEY: z.string().min(1, 'OpenAI API Key is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
