import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { prisma } from '../src/client';

export async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@futurebuller.com' },
    update: {},
    create: {
      email: 'admin@futurebuller.com',
      name: 'Administrador',
      role: 'ADMIN',
      passwordHash: adminHash,
    },
  });

  const playerHash = await bcrypt.hash('player123', 10);
  const playerUser = await prisma.user.upsert({
    where: { email: 'player@demo.com' },
    update: {},
    create: {
      email: 'player@demo.com',
      name: 'Jugador Demo',
      role: 'PLAYER',
      passwordHash: playerHash,
    },
  });
  await prisma.player.upsert({
    where: { userId: playerUser.id },
    update: {},
    create: {
      userId: playerUser.id,
      firstName: 'Jugador',
      lastName: 'Demo',
      position: 'DEL',
      competitionLevel: 'nacional',
      status: 'AVAILABLE',
    },
  });

  const parentHash = await bcrypt.hash('parent123', 10);
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@demo.com' },
    update: {},
    create: {
      email: 'parent@demo.com',
      name: 'Familiar Demo',
      role: 'PARENT',
      passwordHash: parentHash,
    },
  });
  await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id },
  });

  const coachHash = await bcrypt.hash('coach123', 10);
  const coachUser = await prisma.user.upsert({
    where: { email: 'coach@demo.com' },
    update: {},
    create: {
      email: 'coach@demo.com',
      name: 'Entrenador Demo',
      role: 'COACH',
      passwordHash: coachHash,
    },
  });
  await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      userId: coachUser.id,
      clubName: 'Academia Demo',
    },
  });

  const universityHash = await bcrypt.hash('university123', 10);
  const universityUser = await prisma.user.upsert({
    where: { email: 'university@demo.com' },
    update: {},
    create: {
      email: 'university@demo.com',
      name: 'Universidad Demo',
      role: 'UNIVERSITY',
      passwordHash: universityHash,
    },
  });
  await prisma.university.upsert({
    where: { userId: universityUser.id },
    update: {},
    create: {
      userId: universityUser.id,
      name: 'Universidad Demo',
      country: 'España',
      city: 'Valencia',
    },
  });

  const clubHash = await bcrypt.hash('club123', 10);
  const clubUser = await prisma.user.upsert({
    where: { email: 'club@demo.com' },
    update: {},
    create: {
      email: 'club@demo.com',
      name: 'Club Demo',
      role: 'CLUB',
      passwordHash: clubHash,
    },
  });
  const club = await prisma.club.upsert({
    where: { email: 'club@demo.com' },
    update: { userId: clubUser.id },
    create: {
      userId: clubUser.id,
      email: 'club@demo.com',
      name: 'Club Demo',
      country: 'España',
      city: 'Madrid',
    },
  });

  const playerProfile = await prisma.player.findUnique({ where: { userId: playerUser.id } });

  // Entrenador demo vinculado al jugador demo (para evaluaciones y objetivos)
  const coachProfile = await prisma.coach.findUnique({ where: { userId: coachUser.id } });
  if (coachProfile && playerProfile) {
    await prisma.coachPlayer.upsert({
      where: {
        coachId_playerId: { coachId: coachProfile.id, playerId: playerProfile.id },
      },
      update: {},
      create: { coachId: coachProfile.id, playerId: playerProfile.id },
    });
  }

  // Familiar demo vinculado al jugador demo (acompañamiento familiar)
  const parentProfile = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
  if (parentProfile && playerProfile) {
    await prisma.parentChild.upsert({
      where: {
        parentId_playerId: { parentId: parentProfile.id, playerId: playerProfile.id },
      },
      update: {},
      create: { parentId: parentProfile.id, playerId: playerProfile.id },
    });

    await prisma.payment.upsert({
      where: { id: 'pay-parent-1' },
      update: {},
      create: {
        id: 'pay-parent-1',
        userId: parentUser.id,
        amount: 5999,
        currency: 'EUR',
        status: 'PAID',
        description: 'Membresía familiar · Acompañamiento Premium',
      },
    });
  }

  // ─── Contenido de entrenamiento ──────────────────────────────
  const trainingContents = [
    {
      id: 'tc-tech-1',
      title: 'Control y primer toque',
      category: 'technical',
      description:
        'Ejercicios de recepción orientada y primer toque con ambas piernas. Mejora la capacidad de jugar bajo presión.',
      durationMinutes: 25,
      difficulty: 2,
    },
    {
      id: 'tc-tech-2',
      title: 'Conducción y cambio de ritmo',
      category: 'technical',
      description:
        'Circuitos de conducción con cambios de dirección y velocidad. Clave para superar rivales en espacios reducidos.',
      durationMinutes: 30,
      difficulty: 3,
    },
    {
      id: 'tc-tech-3',
      title: 'Precisión en el pase',
      category: 'technical',
      description:
        'Serie de pases cortos y largos buscando precisión y cadencia. Incluye trabajo de pase con presión.',
      durationMinutes: 20,
      difficulty: 2,
    },
    {
      id: 'tc-strength-1',
      title: 'Fuerza del core',
      category: 'strength-conditioning',
      description:
        'Rutina de core de 15 minutos para estabilidad y prevención de lesiones. Recomendada 3 veces por semana.',
      durationMinutes: 15,
      difficulty: 1,
    },
    {
      id: 'tc-strength-2',
      title: 'Potencia de tren inferior',
      category: 'strength-conditioning',
      description:
        'Squats, lunges y saltos pliométricos para mejorar aceleración y salto.',
      durationMinutes: 30,
      difficulty: 3,
    },
    {
      id: 'tc-strength-3',
      title: 'Prevención de lesiones: isquios',
      category: 'strength-conditioning',
      description:
        'Trabajo específico de isquiosurales (nórdicos, deslizamientos) para reducir el riesgo de lesión.',
      durationMinutes: 20,
      difficulty: 2,
    },
    {
      id: 'tc-psych-1',
      title: 'Concentración en partido',
      category: 'psychology',
      description:
        'Técnicas de rutina pre-partido y anclajes para mantener el foco durante los 90 minutos.',
      durationMinutes: 10,
      difficulty: 1,
    },
    {
      id: 'tc-psych-2',
      title: 'Gestión de la presión',
      category: 'psychology',
      description:
        'Respiración, visualización y diálogo interno para rendir en situaciones de máxima exigencia.',
      durationMinutes: 15,
      difficulty: 2,
    },
    {
      id: 'tc-psych-3',
      title: 'Visualización de jugadas',
      category: 'psychology',
      description:
        'Entrenamiento mental mediante visualización de acciones y toma de decisiones previas al partido.',
      durationMinutes: 12,
      difficulty: 2,
    },
    {
      id: 'tc-parent-1',
      title: 'Cómo acompañar a tu hijo deportista',
      category: 'parent-education',
      description:
        'Guía práctica para apoyar a tu hijo en su carrera deportiva: comunicación, gestión de expectativas y equilibrio entre fútbol y estudios.',
      durationMinutes: 20,
      difficulty: 1,
    },
    {
      id: 'tc-parent-2',
      title: 'Alimentación y descanso del joven futbolista',
      category: 'parent-education',
      description:
        'Claves de nutrición, hidratación y sueño para el desarrollo de jugadores en formación.',
      durationMinutes: 15,
      difficulty: 1,
    },
  ];
  for (const content of trainingContents) {
    await prisma.trainingContent.upsert({
      where: { id: content.id },
      update: {},
      create: { ...content, videoUrl: null, thumbnailUrl: null },
    });
  }

  // ─── Pathway, objetivos, evaluación y documento (player demo) ──
  if (playerProfile) {
    await prisma.pathway.upsert({
      where: { playerId: playerProfile.id },
      update: {},
      create: {
        id: 'pw-player-demo',
        playerId: playerProfile.id,
        title: 'Ruta al fútbol profesional',
        description:
          'Programa de desarrollo de 12 meses centrado en toma de decisiones, físico y exposición a ojeadores.',
        level: 'Sub-17',
        focus: 'Toma de decisiones, velocidad de ejecución, potencia de tren inferior.',
        goals: 'Sumar 20 apariciones oficiales, mejorar el tiempo en sprints de 30m y completar el perfil.',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    await prisma.playerGoal.createMany({
      data: [
        {
          id: 'goal-player-1',
          playerId: playerProfile.id,
          title: 'Mejorar pierna no dominante',
          description: 'Realizar 15 minutos diarios de conducción y pase con la pierna no dominante.',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'goal-player-2',
          playerId: playerProfile.id,
          title: 'Reducir tiempo en 30m sprint',
          description: 'Objetivo: bajar de 4.2s en sprint de 30 metros.',
          status: 'pending',
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });

    const evaluationSeeds = [
      {
        id: 'ev-player-1',
        category: 'technical',
        score: 8,
        notes: 'Buen control orientado y precisión en pase corto. Mejorar el juego de espaldas.',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'ev-player-2',
        category: 'physical',
        score: 7,
        notes: 'Potencia de tren inferior correcta. Falta velocidad de reacción en los primeros metros.',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'ev-player-3',
        category: 'tactical',
        score: 6,
        notes: 'Buena lectura de espacios en ataque. Trabajar el posicionamiento defensivo.',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'ev-player-4',
        category: 'psychological',
        score: 8,
        notes: 'Gran concentración en partidos y manejo de la presión.',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'ev-player-5',
        category: 'technical',
        score: 9,
        notes: 'Progreso notable en el primer toque. Candidato a rotación en el once titular.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const evaluation of evaluationSeeds) {
      await prisma.evaluation.upsert({
        where: { id: evaluation.id },
        update: {},
        create: {
          id: evaluation.id,
          playerId: playerProfile.id,
          category: evaluation.category,
          score: evaluation.score,
          notes: evaluation.notes,
          evaluatedBy: 'Entrenador Demo',
          createdAt: evaluation.createdAt,
        },
      });
    }

    await prisma.document.upsert({
      where: { id: 'doc-player-1' },
      update: {},
      create: {
        id: 'doc-player-1',
        playerId: playerProfile.id,
        title: 'Certificado médico',
        url: '/uploads/example.pdf',
        type: 'medical',
      },
    });
  }

  // ─── Reclutamiento (agente, ojeador, staff, requirements, inquiry, submission, trial) ──
  const agentHash = await bcrypt.hash('agent123', 10);
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@demo.com' },
    update: {},
    create: {
      email: 'agent@demo.com',
      name: 'Agente Demo',
      role: 'AGENT',
      passwordHash: agentHash,
    },
  });
  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: { userId: agentUser.id, agency: 'Demo Sports Management', license: 'FIFA-12345' },
  });

  const scoutHash = await bcrypt.hash('scout123', 10);
  const scoutUser = await prisma.user.upsert({
    where: { email: 'scout@demo.com' },
    update: {},
    create: {
      email: 'scout@demo.com',
      name: 'Ojeador Demo',
      role: 'SCOUT',
      passwordHash: scoutHash,
    },
  });
  const scout = await prisma.scout.upsert({
    where: { userId: scoutUser.id },
    update: {},
    create: { userId: scoutUser.id, agency: 'Demo Scouting Network' },
  });

  if (playerProfile) {
    await prisma.agentPlayer.upsert({
      where: { agentId_playerId: { agentId: agent.id, playerId: playerProfile.id } },
      update: {},
      create: { agentId: agent.id, playerId: playerProfile.id },
    });

    await prisma.savedPlayer.upsert({
      where: { scoutId_playerId: { scoutId: scout.id, playerId: playerProfile.id } },
      update: {},
      create: { scoutId: scout.id, playerId: playerProfile.id },
    });

    await prisma.scoutingReport.upsert({
      where: { id: 'sr-player-1' },
      update: {},
      create: {
        id: 'sr-player-1',
        scoutId: scout.id,
        playerId: playerProfile.id,
        rating: 8,
        strengths: 'Buen control, visión de juego y golpeo con ambas piernas.',
        weaknesses: 'Juego de espaldas y juego aéreo.',
        notes: 'Proyecto interesante para categoría Sub-17.',
      },
    });

    await prisma.submission.upsert({
      where: { id: 'sub-player-1' },
      update: {},
      create: {
        id: 'sub-player-1',
        playerId: playerProfile.id,
        clubId: club.id,
        agentId: agent.id,
        stage: 'TRIAL',
        status: 'IN_REVIEW',
        notes: 'Enviado por el agente tras ver el perfil del jugador.',
      },
    });

    await prisma.trial.upsert({
      where: { id: 'trial-player-1' },
      update: {},
      create: {
        id: 'trial-player-1',
        submissionId: 'sub-player-1',
        clubId: club.id,
        playerId: playerProfile.id,
        startsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        location: 'Ciudad Deportiva Demo',
        status: 'SCHEDULED',
      },
    });
  }

  await prisma.clubStaff.upsert({
    where: { clubId_userId: { clubId: club.id, userId: clubUser.id } },
    update: {},
    create: { clubId: club.id, userId: clubUser.id, role: 'OWNER' },
  });

  await prisma.requirement.upsert({
    where: { id: 'req-club-1' },
    update: {},
    create: {
      id: 'req-club-1',
      clubId: club.id,
      title: 'Delantero Sub-17',
      position: 'DEL',
      ageMin: 15,
      ageMax: 17,
      level: 'nacional',
      country: 'España',
      description: 'Buscamos un delantero con buen golpeo y movilidad para el equipo juvenil.',
      status: 'OPEN',
    },
  });

  await prisma.inquiry.upsert({
    where: { id: 'inq-club-1' },
    update: {},
    create: {
      id: 'inq-club-1',
      clubId: club.id,
      name: 'María López',
      email: 'maria@example.com',
      subject: 'Prueba para mi hijo',
      message: 'Mi hijo juega de mediocentro y nos gustaría saber cómo participar en una prueba.',
      status: 'NEW',
    },
  });

  await prisma.opportunity.upsert({
    where: { id: 'opp-club-1' },
    update: {},
    create: {
      id: 'opp-club-1',
      clubId: club.id,
      title: 'Prueba para juvenil Sub-17',
      type: 'TRIAL',
      status: 'OPEN',
      position: 'DEL',
      ageMin: 15,
      ageMax: 17,
      location: 'Madrid',
      description: 'Jornada de pruebas abierta para delanteros de la categoría Sub-17.',
      closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.opportunity.upsert({
    where: { id: 'opp-club-2' },
    update: {},
    create: {
      id: 'opp-club-2',
      clubId: club.id,
      title: 'Beca deportiva para delanteros',
      type: 'SCHOLARSHIP',
      status: 'OPEN',
      position: 'DEL',
      ageMin: 17,
      ageMax: 19,
      location: 'Valencia',
      description:
        'Beca académica-deportiva para delanteros que quieran combinar estudios y fútbol de alto nivel.',
      closesAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  if (playerProfile) {
    await prisma.savedOpportunity.upsert({
      where: {
        playerId_opportunityId: { playerId: playerProfile.id, opportunityId: 'opp-club-1' },
      },
      update: {},
      create: { playerId: playerProfile.id, opportunityId: 'opp-club-1' },
    });

    // Solicitud de aplicación del jugador demo (para que el club tenga candidatos en su bandeja)
    await prisma.application.upsert({
      where: {
        playerId_opportunityId: { playerId: playerProfile.id, opportunityId: 'opp-club-1' },
      },
      update: {},
      create: {
        playerId: playerProfile.id,
        opportunityId: 'opp-club-1',
        message: 'Soy delantero Sub-17 con experiencia en categoría nacional. Me encantaría participar en la jornada de pruebas.',
      },
    });
  }

  await prisma.notification.upsert({
    where: { id: 'notif-demo-1' },
    update: {},
    create: {
      id: 'notif-demo-1',
      userId: playerUser.id,
      type: 'opportunity',
      title: 'Nueva oportunidad disponible',
      message: 'Club Demo busca delanteros para su prueba Sub-17. Aplica antes de que cierre.',
      link: '/dashboard/player/opportunities/opp-club-1',
    },
  });

  // ─── Oportunidad de universidad (beca SCHOLARSHIP) ─────────────
  const universityProfile = await prisma.university.findUnique({
    where: { userId: universityUser.id },
  });
  if (universityProfile) {
    await prisma.opportunity.upsert({
      where: { id: 'opp-uni-1' },
      update: {},
      create: {
        id: 'opp-uni-1',
        universityId: universityProfile.id,
        creatorType: 'UNIVERSITY',
        title: 'Beca deportiva universitaria (fútbol masculino)',
        type: 'SCHOLARSHIP',
        status: 'OPEN',
        position: 'DEL',
        ageMin: 17,
        ageMax: 20,
        location: 'Valencia',
        description:
          'Beca académica-deportiva para delanteros. Grado universitario + fútbol de competición en categoría nacional universitaria.',
        closesAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ─── Camps demo ────────────────────────────────────────────────
  await prisma.camp.upsert({
    where: { id: 'camp-1' },
    update: {},
    create: {
      id: 'camp-1',
      title: 'Campus de verano Future Buller',
      description:
        'Campus intensivo de pretemporada: técnico-táctico por la mañana y físico por la tarde. Plazas limitadas con seguimiento individualizado.',
      country: 'España',
      city: 'Valencia',
      startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      capacity: 20,
      price: 29900,
      status: 'OPEN',
      coachId: coachProfile?.id,
    },
  });

  await prisma.camp.upsert({
    where: { id: 'camp-2' },
    update: {},
    create: {
      id: 'camp-2',
      title: 'Clinic de delanteros (borrador)',
      description: 'Clinic de 3 días para delanteros Sub-15 a Sub-18 con entrenadores invitados.',
      country: 'España',
      city: 'Madrid',
      startsAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 48 * 24 * 60 * 60 * 1000),
      capacity: 12,
      price: 14900,
      status: 'DRAFT',
      clubId: club.id,
    },
  });

  if (playerProfile) {
    await prisma.campRegistration.upsert({
      where: { playerId_campId: { playerId: playerProfile.id, campId: 'camp-1' } },
      update: {},
      create: { playerId: playerProfile.id, campId: 'camp-1', status: 'CONFIRMED' },
    });
  }

  // ─── Live sessions demo ────────────────────────────────────────
  await prisma.liveSession.upsert({
    where: { id: 'live-1' },
    update: {},
    create: {
      id: 'live-1',
      title: 'Entrenamiento en directo: primer toque bajo presión',
      description: 'Sesión grupal en directo centrada en recepción orientada y juego bajo presión.',
      type: 'TRAINING',
      status: 'SCHEDULED',
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      coachId: coachProfile?.id,
    },
  });

  await prisma.liveSession.upsert({
    where: { id: 'live-2' },
    update: {},
    create: {
      id: 'live-2',
      title: 'Prueba individual con visor',
      description: 'Prueba 1:1 en directo con un ojeador para evaluar tu nivel competitivo actual.',
      type: 'TRIAL',
      status: 'SCHEDULED',
      startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      coachId: coachProfile?.id,
      playerId: playerProfile?.id,
    },
  });

  await prisma.liveSession.upsert({
    where: { id: 'live-3' },
    update: {},
    create: {
      id: 'live-3',
      title: 'Charla: gestión de la presión en partidos decisivos',
      description: 'Píldora de psicología deportiva grabada en directo.',
      type: 'LECTURE',
      status: 'ENDED',
      startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      coachId: coachProfile?.id,
    },
  });

  // ─── Mensajería demo ───────────────────────────────────────────
  await prisma.conversation.upsert({
    where: { id: 'conv-1' },
    update: {},
    create: {
      id: 'conv-1',
      subject: 'Colaboración Club Demo × Futuro jugador',
      participants: {
        create: [
          { userId: clubUser.id, role: 'OWNER' },
          { userId: admin.id, role: 'OWNER' },
          { userId: agentUser.id, role: 'MEMBER' },
        ],
      },
      messages: {
        create: [
          {
            senderId: clubUser.id,
            body: 'Hola, estamos buscando delanteros Sub-17 para nuestra próxima jornada de pruebas. ¿Podéis difundirlo en la plataforma?',
          },
          {
            senderId: admin.id,
            body: '¡Claro! La oportunidad ya está publicada y enlazada desde el perfil de los jugadores. Os avisaremos de cada solicitud recibida.',
          },
        ],
      },
    },
  });

  console.log('Seed completado:');
  console.log(`- admin: admin@futurebuller.com / admin123`);
  console.log(`- jugador: player@demo.com / player123`);
  console.log(`- familiar: parent@demo.com / parent123`);
  console.log(`- club: club@demo.com / club123`);
  console.log(`- agente: agent@demo.com / agent123`);
  console.log(`- ojeador: scout@demo.com / scout123`);
  console.log(`- entrenador: coach@demo.com / coach123`);
  console.log(`- universidad: university@demo.com / university123`);
  console.log(`- club id: ${club.id}`);
  console.log(`- contenido entrenamiento: ${trainingContents.length} ítems`);
}

// Auto-ejecución solo cuando se invoca directamente (pnpm db:seed, scripts:seed).
const argvEntry = process.argv[1];
const isDirectRun = argvEntry ? import.meta.url === pathToFileURL(argvEntry).href : false;
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
}


