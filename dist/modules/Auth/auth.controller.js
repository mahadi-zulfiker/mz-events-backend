"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const http_status_1 = __importDefault(require("http-status"));
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};
const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: 15 * 60 * 1000 }));
    res.cookie('refreshToken', refreshToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: 30 * 24 * 60 * 60 * 1000 }));
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield auth_service_1.AuthService.register(req.body);
        const { password } = result, userWithoutPassword = __rest(result, ["password"]);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: 'User registered successfully',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to register user',
            error,
        });
    }
});
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield auth_service_1.AuthService.login(req.body);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.UNAUTHORIZED).json({
            success: false,
            message: error.message || 'Failed to login',
            error,
        });
    }
});
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
            req.headers['x-refresh-token'];
        if (!token) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Refresh token missing',
            });
        }
        const result = yield auth_service_1.AuthService.refresh(token);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Token refreshed',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.UNAUTHORIZED).json({
            success: false,
            message: error.message || 'Failed to refresh token',
            error,
        });
    }
});
const logout = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Logged out successfully',
    });
});
exports.AuthController = {
    register,
    login,
    refresh,
    logout,
};
