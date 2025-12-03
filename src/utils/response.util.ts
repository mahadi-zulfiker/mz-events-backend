import { Response } from 'express';

export const sendSuccess = <T>(
    res: Response,
    status: number,
    message: string,
    data?: T
) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};

export const sendError = (
    res: Response,
    status: number,
    message: string,
    error?: any
) => {
    return res.status(status).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
};
