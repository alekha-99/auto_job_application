import { Request, Response, NextFunction } from 'express';
import { updateMasterResume, generateTailoredResume } from './resume.service';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import PDFParser from 'pdf2json';

/**
 * GET /api/resume/master
 * Fetches the logged-in user's master resume.
 */
export const getMasterResume = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { masterResume: true },
        });

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        res.json({
            success: true,
            data: {
                content: user.masterResume || "",
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/resume/master
 * Updates the user's master resume.
 */
export const saveMasterResume = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const { content } = req.body;

        if (typeof content !== 'string') {
            throw new ApiError(400, "Resume content must be a string.");
        }

        const updatedUser = await updateMasterResume(userId, content);

        res.json({
            success: true,
            message: "Master resume saved successfully.",
            data: {
                content: updatedUser.masterResume,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/resume/upload
 * Uploads a PDF file, extracts the text using pdf2json, and saves it as the master resume.
 */
export const uploadMasterResumePdf = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const file = req.file;

        if (!file) {
            throw new ApiError(400, "No PDF file uploaded.");
        }

        const extractedText = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(this, true); // true = returns raw text content

            pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                // When instantiated with 1, pdfData is the raw text string returned by the parser
                // Technically the type definition says it returns the PDFData object, but the docs say it returns text if flag is 1. We'll use the getRawTextContent() fallback if needed.
                const text = pdfParser.getRawTextContent();
                resolve(text);
            });

            pdfParser.parseBuffer(file.buffer);
        });

        if (!extractedText || extractedText.trim().length === 0) {
            throw new ApiError(400, "Could not extract text from the uploaded PDF.");
        }

        // Update the master resume with the extracted text AND the raw PDF file
        const updatedUser = await updateMasterResume(
            userId,
            extractedText.trim(),
            file.buffer,
            file.originalname
        );

        res.json({
            success: true,
            message: "PDF uploaded and master resume saved successfully.",
            data: {
                content: updatedUser.masterResume,
            },
        });
    } catch (error) {
        // Handle multer errors specifically if needed
        if (error instanceof Error && error.message === 'Only PDF files are allowed') {
            next(new ApiError(400, error.message));
        } else {
            next(new ApiError(500, "Failed to parse PDF document."));
        }
    }
};

/**
 * POST /api/resume/generate/:jobId
 * Generates a tailored resume for the specific job using OpenAI.
 */
export const generateResumeForJob = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const { jobId } = req.params;

        if (!jobId) {
            throw new ApiError(400, "Target jobId is required.");
        }

        const result = await generateTailoredResume(userId, jobId as string);

        res.status(201).json({
            success: true,
            message: "Resume generated successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/resume/generated
 * Fetches all generated resumes for the logged-in user.
 * We can use this on the frontend to know which jobs have generated resumes (turn button green).
 */
export const getGeneratedResumes = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;

        const resumes = await prisma.generatedResume.findMany({
            where: { userId },
            select: {
                id: true,
                jobId: true,
                createdAt: true,
            }
        });

        res.json({
            success: true,
            data: resumes,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/resume/generated/:jobId
 * Fetches the specific generated resume for a job so the user can view/copy it.
 */
export const getGeneratedResumeForJob = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const { jobId } = req.params;

        if (!jobId) {
            throw new ApiError(400, "Target jobId is required.");
        }
        
        console.log("----");
        console.log(`[DEBUG] API Hit: GET /api/resume/generated/${jobId}`);
        console.log(`[DEBUG] Token userId: ${userId}`);
        console.log(`[DEBUG] Param jobId: ${jobId}`);
        console.log("----");

        const resume = await prisma.generatedResume.findFirst({
            where: { userId, jobId: jobId as string }
        });

        if (!resume) {
            throw new ApiError(404, "Generated resume not found for this job.");
        }

        res.json({
            success: true,
            data: resume,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/resume/generated/:jobId/pdf
 * Returns the generated resume PDF buffer directly for downloading.
 */
export const getGeneratedResumePdf = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const { jobId } = req.params;

        if (!jobId) {
            throw new ApiError(400, "Target jobId is required.");
        }

        const resume = await prisma.generatedResume.findFirst({
            where: { userId, jobId: jobId as string },
            select: { pdfBuffer: true, pdfName: true }
        });

        if (!resume || !resume.pdfBuffer) {
            res.status(404).json({ success: false, message: "Generated PDF not found for this job." });
            return;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${resume.pdfName || 'ATS_Tailored_Resume.pdf'}"`);
        res.send(resume.pdfBuffer);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/resume/master/pdf
 * Returns the raw PDF buffer as an application/pdf response.
 */
export const getMasterResumePdf = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { masterResumePdf: true, masterResumeName: true },
        });

        if (!user || !user.masterResumePdf) {
            res.status(404).json({ success: false, message: "No master resume PDF found." });
            return;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${user.masterResumeName || 'resume.pdf'}"`);
        res.send(user.masterResumePdf);
    } catch (error) {
        next(error);
    }
};
