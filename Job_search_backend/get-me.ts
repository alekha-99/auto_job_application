import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const anyUser = await prisma.user.findFirst({ where: { masterResume: { not: null } } });
        if(!anyUser) throw new Error("Need user.");
        console.log("Using primary user:", anyUser.email);
        
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: anyUser.email, 
            password: 'password123' 
        });
        const token = loginRes.data.data.token;
        
        console.log(`curl -X GET "http://localhost:3000/api/resume/generated" -H "Authorization: Bearer ${token}"`);
    } catch(e: any) {
         console.error("Client Error:", e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
