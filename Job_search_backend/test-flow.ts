import axios from 'axios';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Creating test user...");
        const email = `flowtest_${Date.now()}@test.com`;
        await axios.post('http://localhost:3000/api/auth/register', {
            name: "Flow User", email, password: "password123", preferredRole: "SDE"
        });

        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: email, password: "password123"
        });

        const token = loginRes.data.data.token;

        console.log("Setting master resume...");
        await axios.post('http://localhost:3000/api/resume/master', {
            content: "Test master resume."
        }, { headers: { Authorization: `Bearer ${token}` } });

        console.log("Fetching a job...");
        const job = await prisma.job.findFirst();
        if(!job) throw new Error("No jobs in DB");
        const jobId = job.id;
        console.log("Target job:", jobId);

        console.log("Generating tailored resume using Puppeteer...");
        const genRes = await axios.post(`http://localhost:3000/api/resume/generate/${jobId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Generate result:", genRes.data.success);
        
        console.log("Downloading the generated PDF resume...");
        const fetchRes = await axios.get(`http://localhost:3000/api/resume/generated/${jobId}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });
        
        fs.writeFileSync('test_generated_resume_v2.pdf', fetchRes.data);
        console.log("Successfully saved test_generated_resume_v2.pdf! Size:", fetchRes.data.length);

    } catch(e: any) {
         console.error("Test Flow Error:", e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
