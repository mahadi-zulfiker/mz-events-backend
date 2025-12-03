import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from '../config';

export interface JwtPayload {
    userId: string;
    role: 'USER' | 'HOST' | 'ADMIN';
    email: string;
}

const sign = (
    payload: JwtPayload,
    secret: Secret,
    expiresIn: SignOptions['expiresIn']
) => {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, secret, options);
};

export const signAccessToken = (payload: JwtPayload) =>
    sign(
        payload,
        config.jwt.secret as Secret,
        config.jwt.expiresIn as SignOptions['expiresIn']
    );

export const signRefreshToken = (payload: JwtPayload) =>
    sign(
        payload,
        config.refreshJwt.secret as Secret,
        config.refreshJwt.expiresIn as SignOptions['expiresIn']
    );

export const verifyAccessToken = (token: string) =>
    jwt.verify(token, config.jwt.secret) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
    jwt.verify(token, config.refreshJwt.secret) as JwtPayload;
