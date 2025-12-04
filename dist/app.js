"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = __importDefault(require("./middlewares/notFound"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const config_1 = __importDefault(require("./config"));
const app = (0, express_1.default)();
// Stripe webhook needs raw body
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
// Parsers
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        return next();
    }
    return express_1.default.json({ limit: '10mb' })(req, res, next);
});
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowed = config_1.default.corsOrigin.split(',').map((o) => o.trim());
        if (allowed.includes(origin))
            return callback(null, true);
        if (config_1.default.corsOrigin === '*')
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Application Routes
app.use('/api', routes_1.default);
app.get('/', (_req, res) => {
    res.send({
        message: 'Events & Activities Platform API is running',
    });
});
// Not Found Handler
app.use(notFound_1.default);
// Global Error Handler
app.use(error_middleware_1.default);
exports.default = app;
