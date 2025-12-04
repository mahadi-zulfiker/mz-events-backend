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
exports.FaqController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const http_status_1 = __importDefault(require("http-status"));
const createFaq = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { question, answer, category } = req.body;
        const faq = yield database_1.default.faq.create({
            data: { question, answer, category },
        });
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: 'FAQ created successfully',
            data: faq,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create FAQ',
            error,
        });
    }
});
const getFaqs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = req.query.category;
        const faqs = yield database_1.default.faq.findMany({
            where: category ? { category } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            data: faqs,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch FAQs',
            error,
        });
    }
});
const updateFaq = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { question, answer, category } = req.body;
        const existing = yield database_1.default.faq.findUnique({ where: { id } });
        if (!existing) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'FAQ not found',
            });
        }
        const faq = yield database_1.default.faq.update({
            where: { id },
            data: {
                question: question !== null && question !== void 0 ? question : undefined,
                answer: answer !== null && answer !== void 0 ? answer : undefined,
                category: category === '' ? null : category !== null && category !== void 0 ? category : undefined,
            },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'FAQ updated successfully',
            data: faq,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update FAQ',
            error,
        });
    }
});
const deleteFaq = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.default.faq.delete({ where: { id } });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'FAQ deleted successfully',
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete FAQ',
            error,
        });
    }
});
exports.FaqController = {
    createFaq,
    getFaqs,
    updateFaq,
    deleteFaq,
};
