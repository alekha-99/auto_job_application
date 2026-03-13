import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const resumes = await prisma.generatedResume.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2
    });

    console.log(`Found ${resumes.length} recent generated resumes.`);
    for (let i = 0; i < resumes.length; i++) {
        const r = resumes[i];
        const filename = `resume_${i}.html`;
        fs.writeFileSync(filename, r.content);
        console.log(`Saved Resume ${i} (Job: ${r.jobId}, Date: ${r.createdAt}) to ${filename}`);
    }
}

main().finally(() => prisma.$disconnect());
