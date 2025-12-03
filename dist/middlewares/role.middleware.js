"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden access',
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
