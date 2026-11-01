// Creates a hospital and/or a user in an empty database (there is no admin screen yet).
//
//   Hospital + first desk user:
//     HOSPITAL_NAME="..." HOSPITAL_CITY="..." HOSPITAL_STATE="..." HOSPITAL_PIN="400001" \
//     HOSPITAL_CONTACT="022-..." HOSPITAL_EMAIL="desk@..." \
//     USER_NAME="..." USER_EMAIL="..." USER_PASSWORD="at least 12 characters" npm run bootstrap
//
//   Another user in an existing hospital (HOSPITAL_ID = its id, printed when it was created):
//     HOSPITAL_ID=... USER_ROLE=DOCTOR USER_NAME=... USER_EMAIL=... USER_PASSWORD=... \
//     USER_REGISTRATION_NO=... USER_QUALIFICATION=... npm run bootstrap
//
// USER_ROLE: HOSPITAL_STAFF (default), DOCTOR, EMERGENCY_OPERATOR, ADMIN (ADMIN needs no hospital).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const env = (k: string) => (process.env[k] ?? '').trim();
const ROLES = ['HOSPITAL_STAFF', 'DOCTOR', 'EMERGENCY_OPERATOR', 'ADMIN'];

async function main() {
  const role = env('USER_ROLE') || 'HOSPITAL_STAFF';
  if (!ROLES.includes(role)) throw new Error(`USER_ROLE must be one of ${ROLES.join(', ')}`);

  let hospitalId = env('HOSPITAL_ID') || null;
  if (!hospitalId && env('HOSPITAL_NAME')) {
    for (const k of ['HOSPITAL_CITY', 'HOSPITAL_STATE', 'HOSPITAL_PIN', 'HOSPITAL_CONTACT', 'HOSPITAL_EMAIL']) {
      if (!env(k)) throw new Error(`${k} is required when creating a hospital`);
    }
    const h = await prisma.hospital.create({
      data: {
        name: env('HOSPITAL_NAME'), city: env('HOSPITAL_CITY'), state: env('HOSPITAL_STATE'), pinCode: env('HOSPITAL_PIN'),
        contactNo: env('HOSPITAL_CONTACT'), emailId: env('HOSPITAL_EMAIL'),
        hospitalIdCode: env('HOSPITAL_HOSP_ID') || null, rohiniId: env('HOSPITAL_ROHINI_ID') || null,
        landmark: env('HOSPITAL_LANDMARK') || null, faxNo: env('HOSPITAL_FAX') || null, tpaDeskNo: env('HOSPITAL_TPA_DESK') || null,
      },
    });
    hospitalId = h.id;
    console.log(`Created hospital "${h.name}" (HOSPITAL_ID=${h.id})`);
  }

  if (!env('USER_EMAIL')) {
    if (!hospitalId) throw new Error('Nothing to do: give HOSPITAL_NAME and/or USER_EMAIL');
    return;
  }
  if (role !== 'ADMIN' && !hospitalId) throw new Error('This role needs a hospital: set HOSPITAL_NAME (new) or HOSPITAL_ID (existing)');
  if (env('USER_PASSWORD').length < 12) throw new Error('USER_PASSWORD must be at least 12 characters');
  if (!env('USER_NAME')) throw new Error('USER_NAME is required');

  const u = await prisma.user.create({
    data: {
      name: env('USER_NAME'), email: env('USER_EMAIL').toLowerCase(), role, status: 'ACTIVE',
      passwordHash: await bcrypt.hash(env('USER_PASSWORD'), 10),
      hospitalId: role === 'ADMIN' ? null : hospitalId,
      phone: env('USER_PHONE') || null,
      qualification: env('USER_QUALIFICATION') || null,
      registrationNo: env('USER_REGISTRATION_NO') || null,
      specialization: env('USER_SPECIALIZATION') || null,
    },
  });
  console.log(`Created ${role} user ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
