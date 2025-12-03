import { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';

    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack || err : undefined,
    });
};

export default errorMiddleware;
