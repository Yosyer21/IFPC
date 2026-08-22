import bcrypt from 'bcryptjs';
import { prisma } from '@ifpc/database';

const email = process.env.ADMIN_EMAIL ?? 'admin@ifpc.com';
const password = process.env.ADMIN_PASSWORD ?? 'admin123';

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', passwordHash },
    create: { email, name: 'Administrador', role: 'ADMIN', passwordHash },
  });
  console.log(`Administrador listo: ${email} (contraseña: ${password})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
