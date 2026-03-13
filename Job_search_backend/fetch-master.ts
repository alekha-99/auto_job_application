import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'alekh@example.com' }
    });
    if (user && user.masterResume) {
        fs.writeFileSync('master_resume.txt', user.masterResume);
        console.log('Saved master_resume.txt');
    } else {
        console.log('User or master resume not found.');
    }
}

main().finally(() => prisma.$disconnect());
