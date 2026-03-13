import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Fetching jobs from the DB...");
    const jobs = await prisma.job.findMany({ take: 3 });
    if (jobs.length < 3) {
        console.log("Not enough jobs! Found:", jobs.length);
    }
    jobs.forEach(j => console.log(j.id, j.title, j.organization));
    prisma.$disconnect();
}
main();
