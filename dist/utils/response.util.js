"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, status, message, data) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, status, message, error) => {
    return res.status(status).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
};
exports.sendError = sendError;
