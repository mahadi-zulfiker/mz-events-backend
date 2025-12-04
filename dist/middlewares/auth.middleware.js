"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const authMiddleware = (req, res, next) => {
    var _a;
    try {
        const authHeader = req.headers.authorization;
        const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))
            ? authHeader.split(' ')[1]
            : (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'You are not authorized',
            });
        }
        const decoded = (0, jwt_util_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }
};
exports.authMiddleware = authMiddleware;
