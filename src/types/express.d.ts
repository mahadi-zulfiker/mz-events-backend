import { JwtPayload } from '../utils/jwt.util';

declare global {
    namespace Express {
        // Augment Request with our JWT payload
        interface Request {
            user?: JwtPayload;
        }
    }
}

export {};
