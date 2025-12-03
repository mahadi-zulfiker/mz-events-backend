"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const signToken = (payload) => {
    const secret = config_1.default.jwt.secret;
    const options = {
        expiresIn: config_1.default.jwt.expiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.signToken = signToken;
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
};
exports.verifyToken = verifyToken;
