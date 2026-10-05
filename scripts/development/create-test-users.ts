import { writeFileSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { prisma } from '@ifpc/database';

/**
 * Crea un perfil de prueba por CADA rol de la plataforma (con su registro
 * asociado y relaciones de ejemplo) y escribe un fichero TXT con todas las
 * credenciales para pruebas manuales.
 *
 * Uso:  pnpm scripts:create-test-users   (usa la BD de .env — PGlite por defecto)
 * Salida: TEST_PROFILES.txt en la raíz del repositorio.
 */

type TestRole =
  | 'ADMIN'
  | 'PLAYER'
  | 'PARENT'
  | 'COACH'
  | 'SCOUT'
  | 'AGENT'
  | 'CLUB'
  | 'UNIVERSITY'
  | 'SCHOOL';

interface TestProfile {
  role: TestRole;
  label: string;
  name: string;
  email: string;
  password: string;
  area: string;
  notes: string;
}

const PROFILES: TestProfile[] = [
  {
    role: 'ADMIN',
    label: 'Administrador',
    name: 'Administrator',
    email: 'admin@ifpc.com',
    password: 'admin123',
    area: '/dashboard/admin',
    notes: 'Control center: usuarios, roles, contenidos, analytics y ajustes.',
  },
  {
    role: 'PLAYER',
    label: 'Jugador/a',
    name: 'Demo Player',
    email: 'player@demo.com',
    password: 'player123',
    area: '/dashboard/player',
    notes: 'Perfil de jugadora: posición, disponibilidad, desarrollo y oportunidades.',
  },
  {
    role: 'PARENT',
    label: 'Familiar',
    name: 'Demo Parent',
    email: 'parent@demo.com',
    password: 'parent123',
    area: '/dashboard/parent',
    notes: 'Vinculado a la jugadora demo. Educación, pathways y pagos.',
  },
  {
    role: 'COACH',
    label: 'Entrenador/a',
    name: 'Demo Coach',
    email: 'coach@demo.com',
    password: 'coach123',
    area: '/dashboard/coach',
    notes: 'Vinculado a la jugadora demo. Evaluaciones, objetivos y sesiones.',
  },
  {
    role: 'SCOUT',
    label: 'Ojeador/a',
    name: 'Demo Scout',
    email: 'scout@demo.com',
    password: 'scout123',
    area: '/dashboard/scout',
    notes: 'Explora jugadoras, guarda favoritas y redacta informes de scouting.',
  },
  {
    role: 'AGENT',
    label: 'Agente',
    name: 'Demo Agent',
    email: 'agent@demo.com',
    password: 'agent123',
    area: '/dashboard/agent',
    notes: 'Vinculado a la jugadora demo. Envíos, pruebas, negociaciones y contratos.',
  },
  {
    role: 'CLUB',
    label: 'Club',
    name: 'Demo Club',
    email: 'club@demo.com',
    password: 'club123',
    area: '/dashboard/club',
    notes: 'Reclutamiento: oportunidades, requisitos, staff y solicitudes.',
  },
  {
    role: 'UNIVERSITY',
    label: 'Universidad',
    name: 'Demo University',
    email: 'university@demo.com',
    password: 'university123',
    area: '/dashboard/university',
    notes: 'Reclutamiento académico-deportivo y becas.',
  },
  {
    role: 'SCHOOL',
    label: 'Escuela / Servicio comunitario',
    name: 'Demo School',
    email: 'school@demo.com',
    password: 'school123',
    area: '/dashboard/school',
    notes: 'Programas y clínicas para colegios y servicios comunitarios.',
  },
];

/** Birth date for a player of the given age, so demo data stays valid over time. */
function birthDateForAge(age: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - age, now.getMonth(), Math.min(now.getDate(), 28));
}

async function createProfileRecord(profile: TestProfile, userId: string) {
  switch (profile.role) {
    case 'PLAYER':
      await prisma.player.upsert({
        where: { userId },
        update: { status: 'AVAILABLE', dateOfBirth: birthDateForAge(17) },
        create: {
          userId,
          firstName: 'Demo',
          lastName: 'Player',
          dateOfBirth: birthDateForAge(17),
          nationality: 'Spain',
          position: 'DEL',
          foot: 'Derecha',
          heightCm: 168,
          weightKg: 58,
          competitionLevel: 'nacional',
          status: 'AVAILABLE',
          bio: 'Jugadora demo de Future Baller.',
        },
      });
      break;
    case 'PARENT':
      await prisma.parent.upsert({ where: { userId }, update: {}, create: { userId } });
      break;
    case 'COACH':
      await prisma.coach.upsert({
        where: { userId },
        update: {},
        create: { userId, clubName: 'Future Baller Academy' },
      });
      break;
    case 'SCOUT':
      await prisma.scout.upsert({
        where: { userId },
        update: {},
        create: { userId, agency: 'Global Scouting Network' },
      });
      break;
    case 'AGENT':
      await prisma.agent.upsert({
        where: { userId },
        update: {},
        create: { userId, agency: 'Elite Player Management', license: 'FIFA-AGT-2026' },
      });
      break;
    case 'CLUB':
      await prisma.club.upsert({
        where: { email: profile.email },
        update: { userId },
        create: {
          userId,
          email: profile.email,
          name: 'Demo Club FC',
          country: 'Spain',
          city: 'Madrid',
          league: 'Liga F',
          description: 'Club de prueba para el área de reclutamiento.',
        },
      });
      break;
    case 'UNIVERSITY':
      await prisma.university.upsert({
        where: { userId },
        update: {},
        create: { userId, name: 'Demo University', country: 'Spain', city: 'Valencia' },
      });
      break;
    case 'SCHOOL':
      await prisma.school.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          name: 'Ballarat Grammar',
          type: 'SCHOOL',
          country: 'Australia',
          city: 'Ballarat',
          contactName: 'Sports Department',
          website: 'https://www.ballaratgrammar.vic.edu.au',
          description: 'Escuela demo de Future Baller (programas y clínicas).',
        },
      });
      break;
    case 'ADMIN':
      break;
  }
}

/** Enlaza parent/coach/agent con la jugadora demo para probar áreas conectadas. */
async function linkDemoRelations() {
  const playerUser = await prisma.user.findUnique({ where: { email: 'player@demo.com' } });
  const player = playerUser
    ? await prisma.player.findUnique({ where: { userId: playerUser.id } })
    : null;
  if (!player) return;

  const parentUser = await prisma.user.findUnique({ where: { email: 'parent@demo.com' } });
  const parent = parentUser
    ? await prisma.parent.findUnique({ where: { userId: parentUser.id } })
    : null;
  if (parent) {
    await prisma.parentChild.upsert({
      where: { parentId_playerId: { parentId: parent.id, playerId: player.id } },
      update: {},
      create: { parentId: parent.id, playerId: player.id },
    });
  }

  const coachUser = await prisma.user.findUnique({ where: { email: 'coach@demo.com' } });
  const coach = coachUser
    ? await prisma.coach.findUnique({ where: { userId: coachUser.id } })
    : null;
  if (coach) {
    await prisma.coachPlayer.upsert({
      where: { coachId_playerId: { coachId: coach.id, playerId: player.id } },
      update: {},
      create: { coachId: coach.id, playerId: player.id },
    });
  }

  const agentUser = await prisma.user.findUnique({ where: { email: 'agent@demo.com' } });
  const agent = agentUser
    ? await prisma.agent.findUnique({ where: { userId: agentUser.id } })
    : null;
  if (agent) {
    await prisma.agentPlayer.upsert({
      where: { agentId_playerId: { agentId: agent.id, playerId: player.id } },
      update: {},
      create: { agentId: agent.id, playerId: player.id },
    });
  }
}

function buildReport(profiles: TestProfile[]): string {
  const divider = '─'.repeat(72);
  const intro = [
    'FUTURE BALLER — PERFILES DE PRUEBA (TEST)',
    '========================================',
    `Generado: ${new Date().toISOString()}`,
    `Base de datos: PGlite embebida (USE_PGLITE) → ${process.env.PGLITE_DIR ?? './.pglite'}`,
    'App local: http://localhost:3000',
    '',
    'CÓMO USAR',
    '---------',
    '1. Arranca la app:  pnpm dev         (http://localhost:3000)',
    '2. Abre el login:   http://localhost:3000/login',
    '3. Entra con el email y la contraseña de cualquiera de los perfiles de abajo.',
    '   La plataforma redirige sola a tu área (/dashboard/<rol>).',
    '4. Guard por rol: si abres el área de otro rol, te devuelve a la tuya.',
    '',
    'Regenerar estos perfiles:   pnpm scripts:create-test-users',
    '',
    'PERFILES',
    '--------',
    '',
  ].join('\n');

  const blocks = profiles
    .map((profile) =>
      [
        divider,
        `[${profile.role}]  ${profile.label}`,
        `  Nombre      : ${profile.name}`,
        `  Email       : ${profile.email}`,
        `  Contraseña  : ${profile.password}`,
        `  Área        : ${profile.area}`,
        `  Notas       : ${profile.notes}`,
      ].join('\n')
    )
    .join('\n\n');

  const table = [
    '',
    'TABLA RÁPIDA',
    '------------',
    'ROL          EMAIL                      CONTRASEÑA        ÁREA',
    ...profiles.map(
      (profile) =>
        `${profile.role.padEnd(12)} ${profile.email.padEnd(26)} ${profile.password.padEnd(17)} ${profile.area}`
    ),
    '',
  ].join('\n');

  return `${intro}${blocks}\n${table}\n`;
}

async function main() {
  const created: TestProfile[] = [];
  for (const profile of PROFILES) {
    const passwordHash = await bcrypt.hash(profile.password, 10);
    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: { name: profile.name, role: profile.role, passwordHash },
      create: { email: profile.email, name: profile.name, role: profile.role, passwordHash },
    });
    await createProfileRecord(profile, user.id);
    created.push(profile);
  }

  await linkDemoRelations();

  const root = path.resolve(import.meta.dirname, '..', '..');
  const outFile = path.join(root, 'TEST_PROFILES.txt');
  writeFileSync(outFile, buildReport(created), 'utf-8');

  console.log(`✔ ${created.length} perfiles de prueba listos`);
  console.log(`✔ Credenciales escritas en: ${outFile}`);
  for (const profile of created) {
    console.log(`  · [${profile.role}] ${profile.email} / ${profile.password}`);
  }
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
