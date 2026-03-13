import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking the first user with a master resume...");
        const user = await prisma.user.findFirst({
            where: { masterResume: { not: null } }
        });
        
        if (!user) {
            console.log("No user with a master resume found.");
            return;
        }

        console.log(`Using user ${user.id} (${user.email})`);

        console.log("Fetching their generated resumes directly from DB to find a jobId to test with...");
        const dbResumes = await prisma.generatedResume.findMany({
            where: { userId: user.id }
        });

        if (dbResumes.length === 0) {
            console.log("User has no generated resumes.");
            return;
        }

        const jobId = dbResumes[0].jobId;
        console.log(`Found a generated resume for jobId: ${jobId}`);

        // Mocking the express req object the same way the endpoint does it:
        // getGeneratedResumeForJob expects req.userId and req.params.jobId
        console.log("Simulating the Prisma query from the endpoint:");
        console.log(`userId: ${user.id}`);
        console.log(`jobId: ${jobId} (Type: ${typeof jobId})`);

        const resume = await prisma.generatedResume.findFirst({
            where: { userId: user.id, jobId: jobId as string }
        });

        if (!resume) {
            console.log("FAILED! Query returned null. This is the 404.");
        } else {
            console.log("SUCCESS! Query found the resume.", resume.id);
        }
    } catch(e: any) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
