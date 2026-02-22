import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('../lib/generated/prisma/client.ts');
const p = new PrismaClient();
try {
  const users = await p.user.findMany({ select: { id: true, email: true, name: true }, take: 10 });
  console.log("Users in DB:", JSON.stringify(users, null, 2));
  const count = await p.user.count();
  console.log("Total users:", count);
} catch (e) {
  console.error("Error:", e.message);
} finally {
  await p.$disconnect();
}
