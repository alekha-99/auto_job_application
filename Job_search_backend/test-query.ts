import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const resumes = await prisma.generatedResume.findMany();
    console.log(`Found ${resumes.length} generated resumes in the DB.`);
    
    if (resumes.length > 0) {
        const testResume = resumes[0];
        console.log(`Testing lookup for userId: ${testResume.userId}, jobId: ${testResume.jobId}`);
        // This is the query from resume.controller.ts:
        // const resume = await prisma.generatedResume.findFirst({
        //    where: { userId, jobId: jobId as string }
        // });
        const resume = await prisma.generatedResume.findFirst({
            where: { 
                userId: testResume.userId, 
                jobId: testResume.jobId 
            }
        });
        
        if (resume) {
            console.log("SUCCESS! Resume found.");
        } else {
            console.log("FAILED! Resume NOT found. (This is the bug)");
        }
    }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
