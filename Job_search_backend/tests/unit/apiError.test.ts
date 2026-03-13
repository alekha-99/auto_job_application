import { ApiError } from '../../src/utils/apiError';

describe('ApiError', () => {
    it('should create an error with status code and message', () => {
        const error = new ApiError(404, 'Not found');

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not found');
        expect(error.isOperational).toBe(true);
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
    });

    it('should allow setting isOperational to false', () => {
        const error = new ApiError(500, 'Internal error', false);

        expect(error.isOperational).toBe(false);
    });

    it('should have a stack trace', () => {
        const error = new ApiError(400, 'Bad request');

        expect(error.stack).toBeDefined();
    });
});
