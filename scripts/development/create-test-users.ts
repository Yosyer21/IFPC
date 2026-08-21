import bcrypt from 'bcryptjs';
import { prisma } from '@future-buller/database';

const USERS: { email: string; name: string; role: 'PLAYER' | 'PARENT' | 'CLUB' | 'AGENT' | 'SCOUT'; password: string }[] = [
  { email: 'player@demo.com', name: 'Jugador Demo', role: 'PLAYER', password: 'player123' },
  { email: 'parent@demo.com', name: 'Familiar Demo', role: 'PARENT', password: 'parent123' },
  { email: 'club@demo.com', name: 'Club Demo', role: 'CLUB', password: 'club123' },
  { email: 'agent@demo.com', name: 'Agente Demo', role: 'AGENT', password: 'agent123' },
  { email: 'scout@demo.com', name: 'Ojeador Demo', role: 'SCOUT', password: 'scout123' },
];

async function main() {
  for (const entry of USERS) {
    const passwordHash = await bcrypt.hash(entry.password, 10);
    const user = await prisma.user.upsert({
      where: { email: entry.email },
      update: { role: entry.role, passwordHash },
      create: { email: entry.email, name: entry.name, role: entry.role, passwordHash },
    });
    if (entry.role === 'PLAYER') {
      await prisma.player.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, firstName: 'Jugador', lastName: 'Demo' },
      });
    }
  }
  console.log(`Usuarios de prueba listos (${USERS.length})`);
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
