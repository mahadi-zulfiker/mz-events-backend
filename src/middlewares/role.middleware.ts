import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: Array<'USER' | 'HOST' | 'ADMIN'>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden access',
            });
        }
        next();
    };
};
