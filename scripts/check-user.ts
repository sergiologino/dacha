import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { PrismaClient } from '../lib/generated/prisma/client';
const p = new PrismaClient();
async function main() {
  const users = await p.user.findMany({ select: { id: true, email: true, name: true }, take: 10 });
  console.log("Users in DB:", JSON.stringify(users, null, 2));
  console.log("Total users:", users.length);
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
