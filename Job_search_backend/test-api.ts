import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Registering a new test user...");
        const email = `testuser_${Date.now()}@example.com`;
        const registerRes = await axios.post('http://localhost:3000/api/auth/register', {
            name: "Test User",
            email: email, 
            password: 'password123',
            preferredRole: "SDE"
        });
        const token = registerRes.data.data.token;
        const userId = registerRes.data.data.user.id;
        console.log("Got token for new user:", token.substring(0, 20) + '...');
        
        console.log("Fetching a job to generate a resume for...");
        const jobs = await prisma.job.findMany({ take: 1 });
        if (jobs.length === 0) throw new Error("No jobs found");
        const jobId = jobs[0].id;
        
        console.log("Setting master resume...");
        await axios.post('http://localhost:3000/api/resume/master', {
            content: "This is a master resume."
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        console.log(`Generating resume for jobId: ${jobId}...`);
        await axios.post(`http://localhost:3000/api/resume/generate/${jobId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Fetching /api/resume/generated");
        const res = await axios.get('http://localhost:3000/api/resume/generated', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Got generated resumes:", res.data.data.length);
        
        if (res.data.data.length > 0) {
            const fetchedJobId = res.data.data[0].jobId;
            console.log(`Fetching specific resume for jobId: ${fetchedJobId}`);
            const specificRes = await axios.get(`http://localhost:3000/api/resume/generated/${fetchedJobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Success! Content length:", specificRes.data.data.content.length);
        }
    } catch(e: any) {
        console.error("Error:", e.response?.data || e.message);
        if (e.response?.status === 404) {
             console.error("THIS IS THE 404 BUG!");
        }
    } finally {
        await prisma.$disconnect();
    }
}
main();
