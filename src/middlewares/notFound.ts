import { Request, Response, NextFunction } from 'express';

const notFound = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        success: false,
        message: 'API Not Found',
        error: {
            path: req.originalUrl,
            message: 'API Not Found',
        },
    });
};

export default notFound;
