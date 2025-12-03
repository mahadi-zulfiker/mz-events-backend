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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const jwt_util_1 = require("../../utils/jwt.util");
const password_util_1 = require("../../utils/password.util");
const register = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield database_1.default.user.findUnique({
        where: { email: payload.email },
    });
    if (existing) {
        throw new Error('User already exists with this email');
    }
    const hashedPassword = yield (0, password_util_1.hashPassword)(payload.password);
    const result = yield database_1.default.user.create({
        data: {
            email: payload.email,
            password: hashedPassword,
            fullName: payload.fullName,
            role: payload.role || 'USER',
        },
    });
    return result;
});
const login = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield database_1.default.user.findUnique({
        where: { email: payload.email },
    });
    if (!user) {
        throw new Error('User does not exist');
    }
    const isPasswordMatched = yield (0, password_util_1.comparePassword)(payload.password, user.password);
    if (!isPasswordMatched) {
        throw new Error('Password does not match');
    }
    const accessToken = (0, jwt_util_1.signToken)({
        userId: user.id,
        role: user.role,
        email: user.email,
    });
    return {
        accessToken,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        },
    };
});
exports.AuthService = {
    register,
    login,
};
