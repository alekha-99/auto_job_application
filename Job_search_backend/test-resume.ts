import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const resumes = await prisma.generatedResume.findMany();
    console.log(`Found ${resumes.length} generated resumes in the DB.`);
    if (resumes.length > 0) {
        console.dir(resumes[0], { depth: null });
    } else {
        console.log("No generated resumes exist.");
    }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
