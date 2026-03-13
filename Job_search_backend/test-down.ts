import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({ where: { email: { contains: 'test.com' } } });
        if(users.length === 0) throw new Error("No test users found.");
        const userId = users[0].id;

        const resumes = await prisma.generatedResume.findMany({ where: { userId }});
        if(resumes.length === 0) throw new Error("No generated resumes to download.");
        
        const jobId = resumes[0].jobId;
        console.log(`Downloading the generated PDF resume for Job ID: ${jobId}`);
        
        // Let's generate a token manually to bypass login dependencies just for testing
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'supersecretkey');
        
        const fetchRes = await axios.get(`http://localhost:3000/api/resume/generated/${jobId}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });
        
        console.log("Success! Headers:", fetchRes.headers['content-type']);

    } catch(e: any) {
         console.error("Download Error Status:", e.response?.status);
         console.error("Download Error Message:", e.message);
         if (e.response?.data) console.error("Data:", e.response.data.toString());
    } finally {
        await prisma.$disconnect();
    }
}
main();
