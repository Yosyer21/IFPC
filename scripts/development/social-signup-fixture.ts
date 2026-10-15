import { prisma } from '@ifpc/database';
import { hashPassword } from '@ifpc/auth';

/**
 * Usuario de prueba que simula el estado en el que queda una cuenta recién creada
 * con Google: existe, tiene el email verificado, **no** tiene perfil de rol y
 * `onboardedAt` es nulo. Solo para verificar el flujo de `?welcome=1`.
 *
 * Uso: tsx social-signup-fixture.ts create | delete
 */
const EMAIL = 'coach.new@demo.com';

async function main() {
  const mode = process.argv[2];

  if (mode === 'delete') {
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { id: true },
    });
    if (user) {
      await prisma.coach.deleteMany({ where: { userId: user.id } });
      await prisma.notificationPreference.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    console.log(`borrado: ${EMAIL}`);
    return;
  }

  await prisma.coach.deleteMany({ where: { user: { email: EMAIL } } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'Nuevo Entrenador',
      emailVerified: new Date(),
      passwordHash: await hashPassword('coach123'),
    },
  });
  console.log(`creado: ${EMAIL} / coach123 (id ${user.id}, sin perfil)`);
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
