import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { prisma } from '../src/client';

export async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ifpc.com' },
    update: {},
    create: {
      email: 'admin@ifpc.com',
      name: 'Administrator',
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
      name: 'Demo Player',
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
      name: 'Demo Parent',
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
      name: 'Demo Coach',
      role: 'COACH',
      passwordHash: coachHash,
    },
  });
  await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      userId: coachUser.id,
      clubName: 'Demo Academy',
    },
  });

  const universityHash = await bcrypt.hash('university123', 10);
  const universityUser = await prisma.user.upsert({
    where: { email: 'university@demo.com' },
    update: {},
    create: {
      email: 'university@demo.com',
      name: 'Demo University',
      role: 'UNIVERSITY',
      passwordHash: universityHash,
    },
  });
  await prisma.university.upsert({
    where: { userId: universityUser.id },
    update: {},
    create: {
      userId: universityUser.id,
      name: 'Demo University',
      country: 'Spain',
      city: 'Valencia',
    },
  });

  const clubHash = await bcrypt.hash('club123', 10);
  const clubUser = await prisma.user.upsert({
    where: { email: 'club@demo.com' },
    update: {},
    create: {
      email: 'club@demo.com',
      name: 'Demo Club',
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
      name: 'Demo Club',
      country: 'Spain',
      city: 'Madrid',
    },
  });

  const playerProfile = await prisma.player.findUnique({ where: { userId: playerUser.id } });

  // Demo coach linked to the demo player (for assessments and goals)
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

  // Demo parent linked to the demo player (family support)
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
        description: 'Family membership · Premium support',
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
        'Oriented receiving and first-touch exercises with both feet. Improves the ability to play under pressure.',
      durationMinutes: 25,
      difficulty: 2,
    },
    {
      id: 'tc-tech-2',
      title: 'Dribbling and change of pace',
      category: 'technical',
      description:
        'Dribbling circuits with direction and speed changes. Key to beating opponents in tight spaces.',
      durationMinutes: 30,
      difficulty: 3,
    },
    {
      id: 'tc-tech-3',
      title: 'Passing accuracy',
      category: 'technical',
      description:
        'Series of short and long passes aiming for accuracy and rhythm. Includes passing under pressure.',
      durationMinutes: 20,
      difficulty: 2,
    },
    {
      id: 'tc-strength-1',
      title: 'Fuerza del core',
      category: 'strength-conditioning',
      description:
        '15-minute core routine for stability and injury prevention. Recommended 3 times per week.',
      durationMinutes: 15,
      difficulty: 1,
    },
    {
      id: 'tc-strength-2',
      title: 'Potencia de tren inferior',
      category: 'strength-conditioning',
      description:
        'Squats, lunges and plyometric jumps to improve acceleration and jumping.',
      durationMinutes: 30,
      difficulty: 3,
    },
    {
      id: 'tc-strength-3',
      title: 'Hamstring injury prevention',
      category: 'strength-conditioning',
      description:
        'Specific hamstring work (Nordics, slides) to reduce injury risk.',
      durationMinutes: 20,
      difficulty: 2,
    },
    {
      id: 'tc-psych-1',
      title: 'Match focus',
      category: 'psychology',
      description:
        'Pre-match routine techniques and anchors to stay focused through the 90 minutes.',
      durationMinutes: 10,
      difficulty: 1,
    },
    {
      id: 'tc-psych-2',
      title: 'Pressure management',
      category: 'psychology',
      description:
        'Breathing, visualization and self-talk to perform in high-pressure situations.',
      durationMinutes: 15,
      difficulty: 2,
    },
    {
      id: 'tc-psych-3',
      title: 'Match-play visualization',
      category: 'psychology',
      description:
        'Mental training through visualization of actions and pre-match decision-making.',
      durationMinutes: 12,
      difficulty: 2,
    },
    {
      id: 'tc-parent-1',
      title: 'How to support your young athlete',
      category: 'parent-education',
      description:
        'Practical guide to support your child in their sporting career: communication, expectation management and balance between football and studies.',
      durationMinutes: 20,
      difficulty: 1,
    },
    {
      id: 'tc-parent-2',
      title: 'Nutrition and rest for young footballers',
      category: 'parent-education',
      description:
        'Keys to nutrition, hydration and sleep for developing young players.',
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

  // ─── Pathway, goals, assessment and document (demo player) ──
  if (playerProfile) {
    await prisma.pathway.upsert({
      where: { playerId: playerProfile.id },
      update: {},
      create: {
        id: 'pw-player-demo',
        playerId: playerProfile.id,
        title: 'Path to professional football',
        description:
          '12-month development program focused on decision-making, physical work and exposure to scouts.',
        level: 'Sub-17',
        focus: 'Decision-making, execution speed, lower-body power.',
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
          description: 'Do 15 minutes daily of dribbling and passing with the non-dominant foot.',
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
        notes: 'Good oriented control and short-pass accuracy. Improve hold-up play.',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'ev-player-2',
        category: 'physical',
        score: 7,
        notes: 'Good lower-body power. Needs reaction speed in the first meters.',
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
        notes: 'Great focus in matches and pressure management.',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'ev-player-5',
        category: 'technical',
        score: 9,
        notes: 'Notable progress on first touch. Candidate for starting XI rotation.',
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
        title: 'Medical certificate',
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
        strengths: 'Good control, game vision and striking with both feet.',
        weaknesses: 'Hold-up play and aerial game.',
        notes: 'Interesting prospect for U17 level.',
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
      country: 'Spain',
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
      message: 'My son plays center midfield and we would like to know how to take part in a trial.',
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
      description: 'Open trial day for U17 strikers.',
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
        'Academic-sports scholarship for strikers who want to combine studies and high-level football.',
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

    // Application submitted by the demo player (so the club has candidates in its inbox)
    await prisma.application.upsert({
      where: {
        playerId_opportunityId: { playerId: playerProfile.id, opportunityId: 'opp-club-1' },
      },
      update: {},
      create: {
        playerId: playerProfile.id,
        opportunityId: 'opp-club-1',
        message: 'I am a U17 striker with national-level experience. I would love to take part in the trial day.',
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

  // ─── University opportunity (SCHOLARSHIP) ─────────────
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
        title: 'University sports scholarship (men\u2019s football)',
        type: 'SCHOLARSHIP',
        status: 'OPEN',
        position: 'DEL',
        ageMin: 17,
        ageMax: 20,
        location: 'Valencia',
        description:
          'Academic-sports scholarship for strikers. University degree + competitive football in the national collegiate category.',
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
      title: 'Campus de verano IFPC',
      description:
        'Intensive preseason camp: technical-tactical in the morning and physical in the afternoon. Limited spots with individualized follow-up.',
      country: 'Spain',
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
      description: '3-day clinic for U15–U18 strikers with guest coaches.',
      country: 'Spain',
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
      title: 'Live training: first touch under pressure',
      description: 'Live group session focused on oriented receiving and playing under pressure.',
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
      title: 'Talk: pressure management in decisive matches',
      description: 'Recorded live sports psychology session.',
      type: 'LECTURE',
      status: 'ENDED',
      startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      coachId: coachProfile?.id,
    },
  });

  // ─── Demo messaging ───────────────────────────────────────────
  await prisma.conversation.upsert({
    where: { id: 'conv-1' },
    update: {},
    create: {
      id: 'conv-1',
      subject: 'Club Demo × Future player collaboration',
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
            body: 'Hi, we are looking for U17 strikers for our next trial day. Could you spread the word on the platform?',
          },
          {
            senderId: admin.id,
            body: 'Of course! The opportunity is already published and linked from the players\u2019 profiles. We will notify you of every application received.',
          },
        ],
      },
    },
  });

  console.log('Seed completado:');
  console.log(`- admin: admin@ifpc.com / admin123`);
  console.log(`- jugador: player@demo.com / player123`);
  console.log(`- familiar: parent@demo.com / parent123`);
  console.log(`- club: club@demo.com / club123`);
  console.log(`- agente: agent@demo.com / agent123`);
  console.log(`- ojeador: scout@demo.com / scout123`);
  console.log(`- entrenador: coach@demo.com / coach123`);
  console.log(`- universidad: university@demo.com / university123`);
  console.log(`- club id: ${club.id}`);
  console.log(`- training content: ${trainingContents.length} items`);
}

// Auto-executes only when invoked directly (pnpm db:seed, scripts:seed).
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


