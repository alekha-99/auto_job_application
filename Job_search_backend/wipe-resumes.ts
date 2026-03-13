import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Wiping generated resumes that have no PDF buffer...");
    try {
        const res = await prisma.generatedResume.deleteMany({
            where: { pdfBuffer: null }
        });
        console.log(`Successfully deleted ${res.count} old textual generated resumes!`);
    } catch(e) {
        console.error("Failed to delete", e);
    }
}
main().finally(() => prisma.$disconnect());
