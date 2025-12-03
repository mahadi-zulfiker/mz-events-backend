import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';

const createFaq = async (req: Request, res: Response) => {
    try {
        const { question, answer, category } = req.body;
        const faq = await prisma.faq.create({
            data: { question, answer, category },
        });

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'FAQ created successfully',
            data: faq,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create FAQ',
            error,
        });
    }
};

const getFaqs = async (req: Request, res: Response) => {
    try {
        const category = req.query.category as string | undefined;
        const faqs = await prisma.faq.findMany({
            where: category ? { category } : undefined,
            orderBy: { createdAt: 'desc' },
        });

        res.status(httpStatus.OK).json({
            success: true,
            data: faqs,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch FAQs',
            error,
        });
    }
};

const updateFaq = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { question, answer, category } = req.body;

        const existing = await prisma.faq.findUnique({ where: { id } });
        if (!existing) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'FAQ not found',
            });
        }

        const faq = await prisma.faq.update({
            where: { id },
            data: {
                question: question ?? undefined,
                answer: answer ?? undefined,
                category: category === '' ? null : category ?? undefined,
            },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'FAQ updated successfully',
            data: faq,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update FAQ',
            error,
        });
    }
};

const deleteFaq = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.faq.delete({ where: { id } });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'FAQ deleted successfully',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete FAQ',
            error,
        });
    }
};

export const FaqController = {
    createFaq,
    getFaqs,
    updateFaq,
    deleteFaq,
};
