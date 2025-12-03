import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL,
    jwt: {
        secret: process.env.JWT_SECRET || 'change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    refreshJwt: {
        secret:
            process.env.JWT_REFRESH_SECRET ||
            process.env.JWT_SECRET ||
            'change-me',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
    corsOrigin:
        process.env.CORS_ORIGIN ||
        'http://localhost:3000,http://127.0.0.1:3000',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
};
