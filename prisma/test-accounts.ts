// Creates (or resets) four synthetic TEST accounts and one test hospital. Nothing is deleted.
// The password is deliberately weak, so use this on a development database only.
//   npm run test-accounts
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PASSWORD = 'password123';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  let hospital = await prisma.hospital.findFirst({ where: { name: 'City Care Super Specialty Hospital' } });
  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        name: 'City Care Super Specialty Hospital', city: 'Mumbai', state: 'Maharashtra', pinCode: '400001',
        hospitalIdCode: 'HSP12345', rohiniId: 'ROH07665', landmark: 'Near Central Mall',
        contactNo: '022-2345678', faxNo: '022-2345679', tpaDeskNo: '022-2345670', emailId: 'insurance@citycare.com',
      },
    });
  }

  const accounts = [
    { email: 'hospital_desk@carehosp.com', name: 'Priya Sharma', role: 'HOSPITAL_STAFF', phone: '9876543210', hospitalId: hospital.id },
    {
      email: 'doctor_101@carehosp.com', name: 'Dr. Amit Verma', role: 'DOCTOR', phone: '9820011223', hospitalId: hospital.id,
      specialization: 'General Surgery', qualification: 'MBBS, MS (General Surgery)', registrationNo: 'MMC20120541',
    },
    { email: 'er@carehosp.com', name: 'Vikram Rao', role: 'EMERGENCY_OPERATOR', phone: '9820044556', hospitalId: hospital.id },
    { email: 'admin@claimflow.com', name: 'System Admin', role: 'ADMIN', phone: '9800000000', hospitalId: null },
  ];

  for (const a of accounts) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { ...a, passwordHash, status: 'ACTIVE' },
      create: { ...a, passwordHash, status: 'ACTIVE' },
    });
    console.log(`ready: ${a.role.padEnd(18)} ${a.email}`);
  }
  console.log(`Password for all four: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
