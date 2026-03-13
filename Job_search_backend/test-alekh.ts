import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Logging in as alekh@example.com...");
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: "alekh@example.com", password: "SecurePass123"
        });
        const token = loginRes.data.data.token;
        const userId = loginRes.data.data.id;
        
        console.log("Logged in successfully. User ID:", userId);

        const resumes = await prisma.generatedResume.findMany({ where: { userId }});
        console.log(`Found ${resumes.length} generated resumes for this user.`);
        if(resumes.length === 0) throw new Error("No generated resumes to download. The user needs to click Generate first.");
        
        const jobId = resumes[0].jobId;
        console.log(`Testing download for Job ID: ${jobId}`);
        
        const fetchRes = await axios.get(`http://localhost:3000/api/resume/generated/${jobId}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });
        
        console.log("Success! Headers:", fetchRes.headers['content-type']);
        console.log("Buffer size:", fetchRes.data.length);
        fs.writeFileSync('alekh_test_resume.pdf', fetchRes.data);
        console.log("Saved to alekh_test_resume.pdf");

    } catch(e: any) {
         console.error("Test Failed.");
         if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", e.response.data.toString());
         } else {
            console.error(e.message);
         }
    } finally {
        await prisma.$disconnect();
    }
}
main();
