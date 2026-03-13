import axios from 'axios';
import { env } from '../../config/env';
import prisma from '../../config/prisma';

/**
 * Interface for the Apify Career Site Job Listing API response
 */
interface ApifyJob {
    id: string | number;
    title: string;
    organization: string;
    url: string;
    source: string;           // ATS platform: "workday", "greenhouse", "lever.co", etc.
    source_domain: string;
    date_posted: string;
    date_created: string;
    locations_derived: string;
    countries_derived: string;
    description_text: string;
    employment_type: string;
    salary_raw: string;
    ai_experience_level: string;
    ai_salary_minvalue: number;
    ai_salary_maxvalue: number;
    ai_salary_currency: string;
    ai_salary_unittext: string;
    ai_work_arrangement: string;
    ai_employment_type: string[];
    ai_key_skills: string[];
    ai_taxonomies_a: string[];
    ai_keywords: string[];
    remote_derived: boolean;
}

/**
 * ATS platform name mapping from Apify source values to display names
 */
const ATS_DISPLAY_NAMES: Record<string, string> = {
    workday: 'Workday',
    greenhouse: 'Greenhouse',
    'lever.co': 'Lever',
    icims: 'iCIMS',
    bamboohr: 'BambooHR',
    smartrecruiters: 'SmartRecruiters',
    successfactors: 'SuccessFactors',
    taleo: 'Taleo',
    oraclecloud: 'Oracle Cloud',
    adp: 'ADP Workforce Now',
    jobvite: 'Jobvite',
};

/**
 * The 10 target ATS platforms to scrape
 */
const TARGET_ATS_PLATFORMS = [
    'workday', 'greenhouse', 'lever.co', 'icims',
    'bamboohr', 'smartrecruiters', 'successfactors',
    'taleo', 'oraclecloud', 'adp', 'jobvite'
];

/**
 * Helper to categorize jobs based on title and snippet
 */
const categorizeJob = (title: string, snippet: string): string => {
    const text = (`${title} ${snippet}`).toLowerCase();

    if (
        text.includes('software engineer') ||
        text.includes('sde') ||
        text.includes('software development engineer') ||
        text.includes('developer') ||
        text.includes('programmer') ||
        text.includes('full stack') ||
        text.includes('frontend') ||
        text.includes('backend') ||
        text.includes('fullstack') ||
        text.includes('front end') ||
        text.includes('back end')
    ) {
        return 'SDE';
    }

    if (
        text.includes('data engineer') ||
        text.includes('etl') ||
        text.includes('database engineer')
    ) {
        return 'Data Engineer';
    }

    if (
        text.includes('data science') ||
        text.includes('data scientist') ||
        text.includes('machine learning') ||
        text.includes('artificial intelligence') ||
        text.includes('deep learning') ||
        text.includes('ai ')
    ) {
        return 'Data Science';
    }

    return 'Other';
};

/**
 * Start an Apify actor run and return the run ID + dataset ID
 */
const startApifyRun = async (input: Record<string, any>): Promise<{ runId: string; datasetId: string }> => {
    const url = `https://api.apify.com/v2/acts/fantastic-jobs~career-site-job-listing-api/runs?token=${env.APIFY_API_TOKEN}`;

    const response = await axios.post(url, input, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });

    const runData = response.data?.data;
    if (!runData?.id || !runData?.defaultDatasetId) {
        throw new Error('Apify run did not return expected data');
    }

    return { runId: runData.id, datasetId: runData.defaultDatasetId };
};

/**
 * Poll for the Apify actor run to complete
 */
const waitForApifyRun = async (runId: string, maxWaitMs = 300000): Promise<string> => {
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();
    const url = `https://api.apify.com/v2/actor-runs/${runId}?token=${env.APIFY_API_TOKEN}`;

    while (Date.now() - startTime < maxWaitMs) {
        const response = await axios.get(url, { timeout: 10000 });
        const status = response.data?.data?.status;

        if (status === 'SUCCEEDED') return 'SUCCEEDED';
        if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
            throw new Error(`Apify run ${runId} ended with status: ${status}`);
        }

        // Still running, wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Apify run ${runId} timed out after ${maxWaitMs}ms`);
};

/**
 * Fetch dataset items from a completed Apify run
 */
const fetchApifyDatasetItems = async (datasetId: string): Promise<ApifyJob[]> => {
    const url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${env.APIFY_API_TOKEN}&limit=1000`;

    const response = await axios.get(url, { timeout: 30000 });
    return response.data || [];
};

/**
 * Sync jobs from Apify into the database (upsert)
 * Fetches SDE, Data Engineer, and Data Science roles from 11 ATS platforms,
 * posted in the last 24 hours, US only.
 * Jobs are tagged with a `category` so they can be filtered per user's preferredRole.
 */
export const syncJobsToDb = async (options?: {
    title_filter?: string;
    location_filter?: string;
}): Promise<{ synced: number; errors: number }> => {
    let totalSynced = 0;
    let totalErrors = 0;

    console.log(`[JobSync] Starting Apify Career Site sync...`);

    // Build the Apify actor input
    const apifyInput = {
        aiHasSalary: false,
        aiVisaSponsorshipFilter: false,
        locationSearch: ['United States'],
        titleSearch: ['Software Engineer', 'Data Engineer', 'Data Scientist'],
        ats: TARGET_ATS_PLATFORMS,
        includeAi: true,
        includeLinkedIn: false,
        populateAiRemoteLocation: false,
        populateAiRemoteLocationDerived: false,
        'remote only (legacy)': false,
        removeAgency: false,
        timeRange: '24h',
        limit: 100,
        descriptionType: 'text',
    };

    try {
        // 1. Start the Apify actor run
        console.log(`[JobSync] Starting Apify actor run...`);
        const { runId, datasetId } = await startApifyRun(apifyInput);
        console.log(`[JobSync] Apify run started: ${runId}, dataset: ${datasetId}`);

        // 2. Wait for actor to complete
        console.log(`[JobSync] Waiting for Apify run to complete...`);
        await waitForApifyRun(runId);
        console.log(`[JobSync] Apify run completed successfully.`);

        // 3. Fetch dataset items
        const jobs = await fetchApifyDatasetItems(datasetId);
        console.log(`[JobSync] Retrieved ${jobs.length} jobs from Apify dataset.`);

        // 4. Upsert jobs into database
        // titleSearch + locationSearch + ats filters are applied at the Apify API level,
        // so all returned jobs are already SDE roles, US-based, from target ATS platforms.

        for (const job of jobs) {
            try {

                // Map ATS platform name
                const atsSource = (job.source || '').toLowerCase();
                const atsPlatform = ATS_DISPLAY_NAMES[atsSource] || job.source || null;

                const safeDatePosted = job.date_posted
                    ? (() => { try { return new Date(job.date_posted); } catch { return null; } })()
                    : null;

                const salaryString = job.ai_salary_minvalue && job.ai_salary_maxvalue
                    ? `${job.ai_salary_currency || '$'}${job.ai_salary_minvalue} - ${job.ai_salary_currency || '$'}${job.ai_salary_maxvalue} ${job.ai_salary_unittext || ''}`
                    : job.salary_raw || null;

                // Safely convert locations_derived (could be string or array)
                const locationsRaw = job.locations_derived;
                const locationStr = Array.isArray(locationsRaw)
                    ? locationsRaw.join(', ')
                    : (locationsRaw || null);

                const jobData = {
                    title: String(job.title || 'Untitled'),
                    organization: job.organization ? String(job.organization) : null,
                    location: locationStr ? String(locationStr) : null,
                    datePosted: safeDatePosted,
                    url: job.url ? String(job.url) : null,
                    source: job.source ? String(job.source) : 'apify',
                    descriptionText: job.description_text ? String(job.description_text) : null,
                    category: categorizeJob(job.title || '', job.description_text || ''),
                    atsPlatform,
                    remote: job.remote_derived || false,
                    salaryRaw: salaryString ? String(salaryString) : null,
                    employmentType: job.employment_type ? String(job.employment_type) : null,
                    experienceLevel: job.ai_experience_level ? String(job.ai_experience_level) : null,
                    taxonomies: Array.isArray(job.ai_taxonomies_a) ? job.ai_taxonomies_a : [],
                };

                await prisma.job.upsert({
                    where: { externalId: String(job.id) },
                    update: { ...jobData, fetchedAt: new Date() },
                    create: { externalId: String(job.id), ...jobData },
                });
                totalSynced++;
            } catch (e: any) {
                totalErrors++;
                if (totalErrors === 1) {
                    console.error(`[JobSync] First error upserting job ${job.id}:`, e?.message || e);
                }
            }
        }
    } catch (error: any) {
        console.error(`[JobSync] Apify sync error:`, error?.message || error);
    }

    console.log(`[JobSync] Sync complete. Total synced: ${totalSynced}, errors: ${totalErrors}`);
    return { synced: totalSynced, errors: totalErrors };
};

/**
 * Get jobs from the local database with pagination and filters
 */
export const getJobsFromDb = async (params: {
    page?: number;
    limit?: number;
    title?: string;
    location?: string;
    organization?: string;
    remote?: string;
    category?: string;
    atsPlatform?: string;
    source?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
}) => {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.title) {
        where.title = { contains: params.title, mode: 'insensitive' };
    }
    if (params.location) {
        where.location = { contains: params.location, mode: 'insensitive' };
    }
    if (params.organization) {
        where.organization = { contains: params.organization, mode: 'insensitive' };
    }
    if (params.category) {
        where.category = { equals: params.category };
    }
    if (params.atsPlatform) {
        where.atsPlatform = { equals: params.atsPlatform };
    }
    if (params.remote === 'true') {
        where.remote = true;
    } else if (params.remote === 'false') {
        where.remote = false;
    }
    if (params.source) {
        where.source = { contains: params.source, mode: 'insensitive' };
    }

    const orderBy: any = {};
    const sortField = params.sortBy || 'datePosted';
    orderBy[sortField] = params.order || 'desc';

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        }),
        prisma.job.count({ where }),
    ]);

    return {
        jobs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get a single job by ID
 */
export const getJobById = async (id: string) => {
    return prisma.job.findUnique({ where: { id } });
};
