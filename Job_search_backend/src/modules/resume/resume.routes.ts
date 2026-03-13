import { Router } from 'express';
import { getMasterResume, saveMasterResume, generateResumeForJob, getGeneratedResumes, uploadMasterResumePdf, getGeneratedResumeForJob, getMasterResumePdf, getGeneratedResumePdf } from './resume.controller';
import { requireJwt } from '../../middlewares/auth.middleware';
import multer from 'multer';

// Configure multer for memory storage (we just need the buffer to parse the PDF)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

const router = Router();

// Protect all resume routes with JWT authentication
router.use(requireJwt as any);

// GET /api/resume/master -> Fetch the user's master resume
router.get('/master', getMasterResume as any);

// GET /api/resume/master/pdf -> Fetch the user's master resume PDF file
router.get('/master/pdf', getMasterResumePdf as any);

// POST /api/resume/master -> Save/update the user's master resume
router.post('/master', saveMasterResume as any);

// POST /api/resume/upload -> Upload a PDF and parse it into the master resume
router.post('/upload', upload.single('pdf'), uploadMasterResumePdf as any);

// GET /api/resume/generated -> Fetch all generated resumes for the logged-in user
router.get('/generated', getGeneratedResumes as any);

// GET /api/resume/generated/:jobId -> Fetch a specific generated resume
router.get('/generated/:jobId', getGeneratedResumeForJob as any);

// POST /api/resume/generate/:jobId -> Generate a customized resume using OpenAI
router.post('/generate/:jobId', requireJwt as any, generateResumeForJob as any);

// Protected: Direct PDF download of a generated resume
router.get('/generated/:jobId/pdf', requireJwt as any, getGeneratedResumePdf as any);

export default router;
