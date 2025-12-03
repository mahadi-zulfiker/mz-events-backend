import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import httpStatus from 'http-status';

const cookieOptions = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
};

const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string
) => {
    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

const register = async (req: Request, res: Response) => {
    try {
        const result = await AuthService.register(req.body);
        const { password, ...userWithoutPassword } = result;

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'User registered successfully',
            data: userWithoutPassword,
        });
    } catch (error: any) {
        res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: error.message || 'Failed to register user',
            error,
        });
    }
};

const login = async (req: Request, res: Response) => {
    try {
        const result = await AuthService.login(req.body);

        setAuthCookies(res, result.accessToken, result.refreshToken);

        res.status(httpStatus.OK).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.UNAUTHORIZED).json({
            success: false,
            message: error.message || 'Failed to login',
            error,
        });
    }
};

const refresh = async (req: Request, res: Response) => {
    try {
        const token =
            req.cookies?.refreshToken ||
            (req.headers['x-refresh-token'] as string | undefined);

        if (!token) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Refresh token missing',
            });
        }

        const result = await AuthService.refresh(token);
        setAuthCookies(res, result.accessToken, result.refreshToken);

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Token refreshed',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.UNAUTHORIZED).json({
            success: false,
            message: error.message || 'Failed to refresh token',
            error,
        });
    }
};

const logout = async (_req: Request, res: Response) => {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(httpStatus.OK).json({
        success: true,
        message: 'Logged out successfully',
    });
};

export const AuthController = {
    register,
    login,
    refresh,
    logout,
};
