import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routes';
import notFound from './middlewares/notFound';
import errorMiddleware from './middlewares/error.middleware';
import config from './config';

const app: Application = express();

// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parsers
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        return next();
    }
    return express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowed = config.corsOrigin.split(',').map((o) => o.trim());
            if (allowed.includes(origin)) return callback(null, true);
            if (config.corsOrigin === '*') return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);

// Application Routes
app.use('/api', router);

app.get('/', (_req: Request, res: Response) => {
    res.send({
        message: 'Events & Activities Platform API is running',
    });
});

// Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(errorMiddleware);

export default app;
