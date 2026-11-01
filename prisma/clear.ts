// Removes ALL rows (hospitals, users, patients, cases, PDFs records, audit log) and stored files.
//   npm run db:clear                    everything, including accounts and hospitals
//   npm run db:clear -- --keep-accounts all case data, but keeps hospitals and user accounts
// Does not re-create anything.
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function counts() {
  return {
    hospitals: await prisma.hospital.count(),
    users: await prisma.user.count(),
    patients: await prisma.patient.count(),
    requests: await prisma.cashlessRequest.count(),
    pdfVersions: await prisma.documentVersion.count(),
    auditLogs: await prisma.auditLog.count(),
    documents: await prisma.claimChecklistDocument.count(),
  };
}

async function main() {
  console.log('Before:', JSON.stringify(await counts()));
  // Children first so foreign keys are never violated.
  await prisma.claimChecklistDocument.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.documentVersion.deleteMany({});
  await prisma.cashlessRequest.deleteMany({});
  await prisma.patient.deleteMany({});
  if (!process.argv.includes('--keep-accounts')) {
    await prisma.user.deleteMany({});
    await prisma.hospital.deleteMany({});
  }

  for (const dir of ['pdfs', 'docs']) {
    const p = path.resolve(process.cwd(), 'storage', dir);
    if (fs.existsSync(p)) for (const f of fs.readdirSync(p)) fs.rmSync(path.join(p, f), { force: true });
  }
  console.log('After: ', JSON.stringify(await counts()));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
