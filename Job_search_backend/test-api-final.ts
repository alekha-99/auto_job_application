import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Getting a token and firing request at api to see backend logs.");

        const user = await prisma.user.findFirst({
            where: { masterResume: { not: null } } // find any user with a master resume
        });

        if(!user) throw new Error("Need user.");
        console.log("Using user:", user.email);
        
        // Let's just create a new login user for this test to avoid password guessing 
        console.log("Registering temporary user to get token...");
        const email = `testuser_${Date.now()}@example.com`;
        const registerRes = await axios.post('http://localhost:3000/api/auth/register', {
            name: "Test User API",
            email: email, 
            password: 'password123',
            preferredRole: "SDE"
        });
        const token = registerRes.data.data.token;
        
        console.log("Fetching a job to generate a resume for...");
        const jobs = await prisma.job.findMany({ take: 1 });
        if (jobs.length === 0) throw new Error("No jobs found");
        const testJobId = jobs[0].id;
        
        console.log("Setting master resume for new user...");
        await axios.post('http://localhost:3000/api/resume/master', {
            content: "This is a master resume for the API test."
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        console.log(`Generating resume for jobId: ${testJobId}...`);
        await axios.post(`http://localhost:3000/api/resume/generate/${testJobId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Fetching /api/resume/generated");
        const res = await axios.get('http://localhost:3000/api/resume/generated', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.data.length > 0) {
            const jobId = res.data.data[0].jobId;
            console.log(`Firing specific resume request: GET /api/resume/generated/${jobId}`);
            // This is the call that throws 404
            const specificRes = await axios.get(`http://localhost:3000/api/resume/generated/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Client Success!", specificRes.data.data.id);
        } else {
            console.log("User has no generated resumes.");
        }
    } catch(e: any) {
         console.error("Client Error:", e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
