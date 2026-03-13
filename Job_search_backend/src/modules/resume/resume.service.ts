import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import { env } from '../../config/env';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

/**
 * Update the user's master resume.
 */
export const updateMasterResume = async (userId: string, content: string, fileBuffer?: Buffer, fileName?: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { 
            masterResume: content,
            ...(fileBuffer ? { masterResumePdf: fileBuffer } : {}),
            ...(fileName ? { masterResumeName: fileName } : {}),
        },
        select: { id: true, masterResume: true },
    });
};

/**
 * Generate a customized resume using OpenAI based on a master resume and a job description.
 * If one already exists for the given user and job, returns the existing one instead of regenerating.
 */
export const generateTailoredResume = async (userId: string, jobId: string) => {
    // 1. Check if we already generated a resume for this job
    const existing = await prisma.generatedResume.findUnique({
        where: {
            userId_jobId: {
                userId,
                jobId,
            },
        },
    });

    if (existing) {
        return existing;
    }

    // 2. Fetch User's Master Resume and Target Job
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { masterResume: true, name: true },
    });

    if (!user?.masterResume) {
        throw new ApiError(400, "You must save a Master Resume before generating a tailored one.");
    }

    const job = await prisma.job.findUnique({
        where: { id: jobId },
    });

    if (!job) {
        throw new ApiError(404, "Target job not found.");
    }

    if (!job.descriptionText) {
        throw new ApiError(400, "This job does not have a description to tailor the resume against.");
    }

    // 3. Prepare the OpenAI Prompt
    const systemPrompt = `You are an expert executive technical recruiter. 
Your task is to take a candidate's master resume and tailor it specifically for a target job description.
CRITICAL: You MUST output ONLY pure HTML. Do not wrap the HTML in markdown backticks.

Follow these strict ATS-friendly HTML guidelines:
1. PRESERVE CONTENT: You must NOT delete bullet points, dates, or locations from the Master Resume's experience section. Retain the exact length and depth of their work history.
2. TAILORING: You may gently reword, reorder, or emphasize existing bullet points to match EXACT keywords found in the Target Job Description. 
3. DO NOT INVENT: Do not hallucinate facts, metrics, jobs, or degrees.
4. STYLING: You MUST use the following CSS block in the <head> of your output to ensure the PDF looks like a highly professional, modern executive resume:

<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 40px 50px; line-height: 1.5; color: #1f2937; }
    h1 { font-size: 24pt; color: #111827; text-align: center; margin-bottom: 5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .contact-info { text-align: center; font-size: 10pt; color: #4b5563; margin-bottom: 25px; }
    .contact-info a { color: #2563eb; text-decoration: none; }
    h2 { font-size: 14pt; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-top: 25px; margin-bottom: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    h3 { font-size: 12pt; color: #111827; margin: 15px 0 5px 0; font-weight: 600; display: flex; justify-content: space-between; }
    .job-title { font-weight: 700; }
    .job-company { font-weight: 600; color: #374151; }
    .job-date { font-weight: 400; font-size: 10.5pt; color: #6b7280; }
    p { font-size: 10.5pt; margin: 0 0 10px 0; }
    ul { margin: 0 0 15px 0; padding-left: 20px; }
    li { font-size: 10.5pt; margin-bottom: 6px; }
    .skills-category { font-weight: 600; display: inline; }
</style>

Structure the resume logically: Header (h1 name, .contact-info p) > Professional Summary > Skills > Experience (h3 for jobs containing title and date) > Education. 
Ensure dates align to the right side if possible by using the classes defined above.`;

    const userPrompt = `
TARGET JOB TITLE: ${job.title}
TARGET COMPANY: ${job.organization || 'Unknown'}

--- TARGET JOB DESCRIPTION ---
${job.descriptionText}

--- CANDIDATE MASTER RESUME ---
${user.masterResume}
`;

    // 4. Call OpenAI API (using gpt-4o for complex HTML instruction following)
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 4000,
    });

    let tailoredContent = completion.choices[0]?.message?.content?.trim() || "";

    // Clean up markdown wrapping if the AI accidentally adds it
    if (tailoredContent.startsWith('\`\`\`html')) {
        tailoredContent = tailoredContent.replace(/^\`\`\`html\n?/, '').replace(/\n?\`\`\`$/, '');
    } else if (tailoredContent.startsWith('\`\`\`')) {
        tailoredContent = tailoredContent.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    if (!tailoredContent) {
        throw new ApiError(500, "Failed to generate resume from OpenAI.");
    }

    // 5. Generate PDF using Puppeteer
    let pdfBuffer: Buffer;
    try {
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setContent(tailoredContent, { waitUntil: 'networkidle0' });
        
        pdfBuffer = Buffer.from(await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' }
        }));
        await browser.close();
    } catch (error) {
        console.error("Puppeteer PDF generation failed:", error);
        throw new ApiError(500, "Failed to generate PDF document.");
    }

    // 6. Save or update the generated resume in the database
    const pdfName = `${user.name || 'Candidate'}_${(job.organization || 'Job').replace(/\\s+/g, '_')}_Resume.pdf`;
    
    // Find if one already exists to grab its ID for upserting,
    // or just use unique constraint if Prisma supports it natively.
    // GeneratedResume has @@unique([userId, jobId]) so we can use that for upsert.
    const generatedResume = await prisma.generatedResume.upsert({
        where: { userId_jobId: { userId, jobId } },
        update: {
            content: tailoredContent,
            pdfBuffer,
            pdfName,
        },
        create: {
            userId,
            jobId,
            content: tailoredContent,
            pdfBuffer,
            pdfName,
        },
    });

    return generatedResume;
};
