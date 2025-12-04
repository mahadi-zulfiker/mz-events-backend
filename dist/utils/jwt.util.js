"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const sign = (payload, secret, expiresIn) => {
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
const signAccessToken = (payload) => sign(payload, config_1.default.jwt.secret, config_1.default.jwt.expiresIn);
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => sign(payload, config_1.default.refreshJwt.secret, config_1.default.refreshJwt.expiresIn);
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, config_1.default.refreshJwt.secret);
exports.verifyRefreshToken = verifyRefreshToken;
