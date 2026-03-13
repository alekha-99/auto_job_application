import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
    it('GET /health should return status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
    });
});

// Auth tests removed as per V2 refactoring

describe('Jobs Routes (Public)', () => {
    it('GET /api/jobs should return 200', async () => {
        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
    });

    it('GET /api/jobs/:id with invalid id should return 404', async () => {
        const res = await request(app).get('/api/jobs/non-existent-id');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toContain('Job not found');
    });
});

describe('404 Handler', () => {
    it('GET /nonexistent should return 404', async () => {
        const res = await request(app).get('/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toBe('Route not found');
    });
});
