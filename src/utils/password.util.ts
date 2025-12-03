import bcrypt from 'bcryptjs';
import config from '../config';

export const hashPassword = async (plain: string) => {
    return bcrypt.hash(plain, config.bcryptSaltRounds);
};

export const comparePassword = async (plain: string, hash: string) => {
    return bcrypt.compare(plain, hash);
};
