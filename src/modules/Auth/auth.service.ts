import { User } from '@prisma/client';
import prisma from '../../config/database';
import {
    JwtPayload,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../../utils/jwt.util';
import { comparePassword, hashPassword } from '../../utils/password.util';
import { ILoginUser, IRegisterUser } from './auth.interface';

const register = async (payload: IRegisterUser): Promise<User> => {
    const existing = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (existing) {
        throw new Error('User already exists with this email');
    }

    const hashedPassword = await hashPassword(payload.password);

    const result = await prisma.user.create({
        data: {
            email: payload.email,
            password: hashedPassword,
            fullName: payload.fullName,
            role: payload.role || 'USER',
        },
    });

    return result;
};

const buildUser = (user: User) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
});

const createTokens = (user: User) => {
    const payload: JwtPayload = {
        userId: user.id,
        role: user.role,
        email: user.email,
    };

    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
    };
};

const login = async (payload: ILoginUser) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        throw new Error('User does not exist');
    }

    const isPasswordMatched = await comparePassword(
        payload.password,
        user.password
    );

    if (!isPasswordMatched) {
        throw new Error('Password does not match');
    }

    const tokens = createTokens(user);

    return { ...tokens, user: buildUser(user) };
};

const refresh = async (token: string) => {
    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const tokens = createTokens(user);

    return { ...tokens, user: buildUser(user) };
};

export const AuthService = {
    register,
    login,
    refresh,
};
