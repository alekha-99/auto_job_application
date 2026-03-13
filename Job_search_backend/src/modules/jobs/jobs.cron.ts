import cron from 'node-cron';
import { syncJobsToDb } from './jobs.service';

/**
 * Schedule job sync once a day
 * Cron: "0 0 * * *" = at minute 0 of hour 0
 */
export const startJobSyncCron = (): void => {
    console.log('[Cron] Job sync cron scheduled: once a day');

    cron.schedule('0 0 * * *', async () => {
        console.log(`[Cron] Running scheduled job sync at ${new Date().toISOString()}`);
        try {
            const result = await syncJobsToDb();
            console.log(`[Cron] Sync result: ${result.synced} synced, ${result.errors} errors`);
        } catch (error) {
            console.error('[Cron] Scheduled job sync failed:', error);
        }
    });
};
