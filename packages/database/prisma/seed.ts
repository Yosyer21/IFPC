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
      firstName: 'Demo',
      lastName: 'Player',
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

  const schoolHash = await bcrypt.hash('school123', 10);
  const schoolUser = await prisma.user.upsert({
    where: { email: 'school@demo.com' },
    update: {},
    create: {
      email: 'school@demo.com',
      name: 'Demo School',
      role: 'SCHOOL',
      passwordHash: schoolHash,
    },
  });
  await prisma.school.upsert({
    where: { userId: schoolUser.id },
    update: {},
    create: {
      userId: schoolUser.id,
      name: 'Ballarat Grammar',
      type: 'SCHOOL',
      country: 'Australia',
      city: 'Ballarat',
      contactName: 'Sports Department',
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
      league: 'LaLiga',
      // Perfil público de demo (ver `packages/config/src/club-profile.ts`).
      headline: 'Youth development club · Madrid',
      description:
        'Development club with teams from U12 to U19 and a residential programme for international players.',
      foundedYear: 1998,
      tags: ['RECRUITING', 'YOUTH'],
      accentColor: 'cyan',
    },
  });

  const playerProfile = await prisma.player.findUnique({ where: { userId: playerUser.id } });

  // ─── Career history deportiva del player demo ──────────────
  if (playerProfile) {
    const career = [
      {
        clubName: 'Future Baller Academy',
        category: 'Sub-17',
        season: '2025/26',
        appearances: 18,
        goals: 12,
        assists: 7,
        isCurrent: true,
      },
      {
        clubName: 'Ballarat City FC',
        category: 'Sub-16',
        season: '2024/25',
        appearances: 22,
        goals: 9,
        assists: 5,
        isCurrent: false,
      },
      {
        clubName: 'Ballarat Grammar',
        category: 'School',
        season: '2023/24',
        appearances: 15,
        goals: 4,
        assists: 3,
        isCurrent: false,
      },
    ];
    for (const entry of career) {
      await prisma.careerEntry.upsert({
        where: {
          playerId_clubName_season: {
            playerId: playerProfile.id,
            clubName: entry.clubName,
            season: entry.season,
          },
        },
        update: {},
        create: { playerId: playerProfile.id, ...entry },
      });
    }
    // El club "actual" de la trayectoria manda en el `clubName` del perfil.
    await prisma.player.update({
      where: { id: playerProfile.id },
      data: { clubName: 'Future Baller Academy' },
    });
  }

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

  // ─── Training content ──────────────────────────────
  const trainingContents: {
    id: string;
    title: string;
    category: string;
    description: string;
    durationMinutes: number;
    difficulty: number;
    outcomes?: string[];
    content?: string;
    /** Curso o ejercicio (por defecto, curso del catálogo general). */
    kind?: 'COURSE' | 'EXERCISE';
  }[] = [
    {
      id: 'tc-tech-1',
      title: 'Control and first touch',
      category: 'technical',
      description: 'Oriented receiving and first-touch work with both feet to play under pressure.',
      durationMinutes: 25,
      difficulty: 2,
      outcomes: [
        'Take the first touch into space, away from pressure',
        'Scan (check shoulders) before receiving',
        'Receive side-on and play forward immediately',
        'Adjust the body to receive on either foot',
      ],
      content: `WHAT THE COURSE COVERS
Oriented receiving: using the first touch to move the ball into space and set up the next action. The first touch should always have a purpose — escape pressure, face forward or create a passing angle.

KEY COACHING POINTS
- Body orientation before receiving: open up before the ball arrives, check your shoulders to scan, get on your toes and time your movement to arrive with the ball.
- The first touch itself: take it into space, use a soft "cushioned" contact, direct it to set up the next action, avoid a heavy touch.
- Decision-making under pressure: receive side-on, protect the ball with your body, know when to play forward versus shield.

COMMON MISTAKES
- Ball bounces off the player (tensing up) -> relax the controlling surface, "catch it like an egg".
- Needs a second touch to get the ball out of feet -> take the first touch into space.
- Caught in possession, receiving with a closed body -> open up before receiving.
- Indecisive about which surface to use -> rehearse inside, outside, sole, thigh, chest.

SAMPLE DRILLS
1) Wall passing (solo): 3-5 m from a wall, control each rebound with a different surface. Aim for 50 clean touches.
2) Cone receive and turn: four cones in a square; receive and turn toward the next cone.
3) Oriented control with pressure (pairs): first touch through a gate, then add a passive defender.
4) 2v2 transition game: a good first touch that sets up a pass or a shot.

SESSION STRUCTURE (25 min)
5 min dynamic warm-up with ball - 8 min technical drill - 7 min pressure drill - 5 min small-sided game.

ASSESSMENT
The player has improved when the first touch goes away from pressure without a second touch, scanning is consistent, and they receive side-on to play forward.`,
    },
    {
      id: 'tc-tech-2',
      title: 'Dribbling and change of pace',
      category: 'technical',
      description:
        'Dribbling circuits with direction and speed changes. Key to beating opponents in tight spaces.',
      durationMinutes: 30,
      difficulty: 3,
      outcomes: [
        'Change pace without losing control of the ball',
        'Keep the head up while dribbling',
        'Use both feet and all surfaces',
        'Accelerate immediately after a change of direction',
      ],
      content: `WHAT THE COURSE COVERS
Dribbling circuits with direction and speed changes: beating opponents in tight spaces. A sudden change of pace moves the ball into dangerous areas quickly; an abrupt change of direction lets the player receive with time and space.

KEY COACHING POINTS
- Ball manipulation and close control: keep the ball close, use inside, outside and sole of the foot.
- Awareness and scanning: head up and eyes forward, watch the ball and surroundings, anticipate where space opens.
- Executing the change: treat a change of direction like a feint, explode out of it, drive into space as soon as it appears.
- Body positioning: flexible shape, low centre of gravity, relaxed posture to move fluidly.

COMMON MISTAKES
- Ball gets away during a change of pace -> smaller, controlled touches keep the ball in playing distance.
- Runs into traffic -> scan ahead, keep the head up.
- Change of direction too slow -> deceive the opponent first, then explode.
- Loses balance during a sharp cut -> bend the knees, get low, use the arms for balance.

SAMPLE DRILLS
1) Gates dribbling (warm-up): dribble through gates, practise a skill then a pace change.
2) "Pace" and "Change" command drill: react to the coach's call with tempo and direction changes.
3) 1v1 in a square: drag backs, scissors, Cruyff turns, drag and tap.
4) Dribble past an opponent: meet in the middle and beat the rival to the opposite cone.
5) Small-sided game with gates: score by dribbling through gates.

SESSION STRUCTURE (30 min)
5 min gates warm-up - 8 min command drill - 7 min 1v1 - 5 min small-sided game - 5 min cool-down juggling.

ASSESSMENT
Improved when the player changes pace without losing control, keeps the head up, uses both feet, and accelerates straight after the change of direction.`,
    },
    {
      id: 'tc-tech-3',
      title: 'Passing accuracy',
      category: 'technical',
      description:
        'Short and long passes aiming for accuracy and rhythm, including passing under pressure.',
      durationMinutes: 20,
      difficulty: 2,
      outcomes: [
        'Weight passes so a teammate can control with one touch',
        'Scan for BOTS before receiving',
        'Receive on the half-turn and play forward',
        'Create passing lanes with movement off the ball',
      ],
      content: `WHAT THE COURSE COVERS
Short and long passes focused on accuracy and rhythm, including passing under pressure. Small details of body positioning let players receive with more control and play more progressive passes.

KEY COACHING POINTS
- Body positioning before receiving: open up and play on the half-turn; scan for BOTS (Ball, Opposition, Teammates, Space).
- First touch: a quality touch away from pressure, firm and close so it does not get stuck under foot.
- Passing technique: firm and accurate; weight passes so they are neither too hard nor too soft; pass to the correct foot (away from pressure).
- Movement off the ball: create passing lanes, rotate positions, time movement into space.

COMMON MISTAKES
- Pass intercepted -> weight the pass ("firm, accurate").
- Needs an extra touch -> positive first touch away from pressure.
- Caught in possession -> open the body and play on the half-turn.
- Passing lane disappears -> teammates must move, not stand still.
- Pass behind a teammate -> pass to the correct foot.

SAMPLE DRILLS
1) Two-player wall passes (warm-up): inside of the foot, then switch to the weaker foot.
2) Triangle passing with movement: pass, follow and rotate, first touch into space.
3) Passing gates for precision: pass through small gates, then increase distance.
4) One-touch rondo (4v1 / 5v2): head up, correct surface, support angles.

SESSION STRUCTURE (20 min)
4 min wall passes - 4 min triangle passing - 4 min passing gates - 4 min rondo - 4 min small-sided game.

ASSESSMENT
Improved when passes are weighted for a one-touch control, the player scans before receiving, receives on the half-turn and keeps possession under pressure.`,
    },
    {
      id: 'tc-strength-1',
      title: 'Core strength',
      category: 'strength-conditioning',
      description:
        '15-minute core routine for stability and injury prevention. Recommended 3 times per week.',
      durationMinutes: 15,
      difficulty: 1,
      outcomes: [
        'Hold a plank with a straight line from head to toe',
        'Keep alignment when alternating arms or legs',
        'Progress only when control is excellent',
        'Breathe steadily during isometric holds',
      ],
      content: `WHAT THE COURSE COVERS
Core strength for stability and injury prevention, recommended 3 times per week. The core is the "epicentre for transferring movement throughout the body": it produces power, absorbs external forces and protects against injury.

KEY COACHING POINTS
- The core transfers force between the upper and lower body and absorbs stress on the musculoskeletal system.
- Training principles: master simple exercises with near-perfect execution before progressing; quality over quantity; 15 minutes, 3 times per week; progress gradually.
- Technique per exercise: plank (straight line, engaged core, neutral spine), alternating arm reach (do not rotate), Superman (engage glutes and spine), glute-hamstring lifts, side plank (hips forward, feet in dorsiflexion).

COMMON MISTAKES
- Hips sag or rise during the plank -> activate the abs and keep a straight line.
- Rotating during alternating exercises -> do not rotate toward the extended arm.
- Progressing too quickly -> only advance when control is excellent.
- Holding the breath -> breathe steadily.
- Neglecting the side plank -> it targets hip abductors and obliques.

SAMPLE EXERCISES
1) Prone isometric hold (plank) - foundation.
2) Plank with alternating arm reach - progression 1.
3) Alternating Superman - posterior chain.
4) Glute-hamstring lifts.
5) Side plank, legs together.
6) Side plank, legs apart - progression.
7) Seated alternating leg raises.
8) High reach, on-the-spot marching.

SESSION STRUCTURE (15 min)
3 min plank - 3 min plank with arm reach - 3 min Superman - 3 min side plank (both sides) - 3 min glute-hamstring lifts or seated leg raises.

ASSESSMENT
Improved when the plank is held with perfect alignment, no rotation during alternating exercises, and progression happens only when control is excellent.`,
    },
    {
      id: 'tc-strength-2',
      title: 'Lower-body power',
      category: 'strength-conditioning',
      description: 'Squats, lunges and plyometric jumps to improve acceleration and jumping.',
      durationMinutes: 30,
      difficulty: 3,
      outcomes: [
        'Perform bilateral and unilateral squats/lunges with perfect technique',
        'Land softly and control plyometric landings',
        'Use both bilateral and unilateral work',
        'Improve acceleration and jumping in matches',
      ],
      content: `WHAT THE COURSE COVERS
Squats, lunges and plyometric jumps to improve acceleration and jumping. Lower-body power transfers force up the kinetic chain (ankle, knee, hip) and is vital for locomotion, physical duels, acceleration/deceleration and changes of direction.

KEY COACHING POINTS
- Foundation first: master bodyweight patterns before adding load.
- Squat technique: head up, chest out, neutral back; drive through glutes and quads; progress to unilateral variations.
- Lunge technique: lower under control, drive back up powerfully; add a rotational twist to challenge the core.
- Plyometric jumps: land softly on the front of the foot, control the landing, and use the landing load to recoil into the next jump.

COMMON MISTAKES
- Knees collapse inward during the squat -> emphasise hip abduction, track knees over toes.
- Heavy landing on plyometrics -> land on the ball of the foot, absorb through ankle, knee and hip.
- Progressing to unilateral too early -> only advance when bilateral work is perfect.
- Adding load before technique -> increase resistance only after perfect form.
- Neglecting single-leg work -> use both bilateral and unilateral loading.

SAMPLE EXERCISES
1) Kettlebell split squats / lunge.
2) Alternating reverse split squats / lunge.
3) (Unilateral) Bulgarian split squat / skater squat.
4) Plyometric jumps: seated to vertical, lateral jumps.
5) Reactive jumps: use the landing load to recoil upward.

SESSION STRUCTURE (30 min)
5 min dynamic warm-up - 8 min bilateral strength - 7 min unilateral block - 5 min plyometrics - 5 min cool-down.

ASSESSMENT
Improved when squats/lunges are perfect before loading, landings are soft and controlled, and acceleration and jumping improve in matches.`,
    },
    {
      id: 'tc-strength-3',
      title: 'Hamstring injury prevention',
      category: 'strength-conditioning',
      description: 'Specific hamstring work (Nordics, slides) to reduce injury risk.',
      durationMinutes: 20,
      difficulty: 2,
      outcomes: [
        'Control the eccentric lowering of the Nordic exercise',
        'Increase eccentric hamstring strength over 4-12 weeks',
        'Maintain high adherence (>= 75% of sessions)',
        'Reduce hamstring discomfort in sprinting and changes of direction',
      ],
      content: `WHAT THE COURSE COVERS
Specific hamstring work (Nordics, sliders) to reduce injury risk. Hamstring strain injuries are the most common in football (12-16% of all injuries). The Nordic Hamstring Exercise (NHE) is the best-researched tool: including it in prevention programmes halves the rate of hamstring injuries.

KEY COACHING POINTS
- Mechanism: injuries occur mainly during sprinting, in the terminal swing phase, when the hamstring decelerates the swinging leg.
- The NHE: an eccentric exercise providing eccentric overload; high muscle damage and DOMS are common at first, so progression must be gradual.
- Dose: 1.5-3.5 sessions/week (median 2) over 7-43 weeks; sessions ~15 min.
- Adherence is the strongest modifier (high adherence >= 75% gives RR ~ 0.36).
- Combine hip-dominant (RDL, 45-degree hip extensions) with knee-dominant (NHE) work.

CLASSIC NHE PROGRESSION (Petersen / van der Horst)
Week 1: 1x/week, 2x5 reps. Week 2: 2x/week, 2x6. Week 3: 2x/week, 3x6. Week 4: 2x/week, 3x6-7-8. Week 5: 2x/week, 3x8-9-10. Weeks 6-13: 2x/week, 3x10-9-8.

COMMON MISTAKES
- Progressing too fast -> follow the gradual progression.
- Using only knee-dominant work -> add hip-dominant exercises.
- Neglecting sprint exposure -> include high-speed running and sprinting.
- Poor adherence -> the programme only works if it is done consistently.

SAMPLE EXERCISES
1) Nordic Hamstring Exercise (NHE) - foundation.
2) Romanian deadlift (hip-dominant).
3) Slider leg curls (eccentric + concentric).
4) Sprint training (on-field, high specificity).

SESSION STRUCTURE (20 min)
3 min dynamic warm-up - 7 min NHE (grouped) - 5 min hip-dominant exercise - 5 min core stability.

ASSESSMENT
Improved when the eccentric lowering is controlled, eccentric strength increases over 4-12 weeks, adherence stays high, and sprinting feels comfortable.`,
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
      description: 'Keys to nutrition, hydration and sleep for developing young players.',
      durationMinutes: 15,
      difficulty: 1,
    },
  ];
  for (const content of trainingContents) {
    const data = {
      title: content.title,
      category: content.category,
      kind: content.kind ?? 'COURSE',
      ownerType: 'GENERAL' as const,
      description: content.description,
      durationMinutes: content.durationMinutes,
      difficulty: content.difficulty,
      content: content.content ?? null,
      outcomes: content.outcomes ?? [],
    };
    await prisma.trainingContent.upsert({
      where: { id: content.id },
      update: data,
      create: { id: content.id, ...data, videoUrl: null, thumbnailUrl: null },
    });
  }

  // Ejemplos antiguos que ya no forman parte del catálogo de contenido.
  await prisma.trainingContent.deleteMany({
    where: { id: { in: ['tc-psych-1', 'tc-psych-2', 'tc-psych-3'] } },
  });

  // ─── Course quizzes (one per course) ───────────────
  const trainingQuizzes = [
    {
      contentId: 'tc-tech-1',
      title: 'Control and first touch',
      description: 'Check your understanding of oriented receiving and first-touch principles.',
      passScore: 70,
      questions: [
        {
          prompt: 'What should the first touch always have?',
          options: ['A purpose', 'Maximum power', 'A bounce off the body', 'Backspin'],
          correct: 0,
        },
        {
          prompt: 'Which surfaces can be used to control the ball?',
          options: [
            'Only the inside of the foot',
            'Inside, outside, sole, thigh and chest',
            'Only the chest',
            'Only the head',
          ],
          correct: 1,
        },
        {
          prompt: 'How should you receive under pressure?',
          options: [
            'Facing your own goal',
            'Side-on, facing forward',
            'With a closed body',
            'Standing still',
          ],
          correct: 1,
        },
        {
          prompt: 'A cushioned touch means...',
          options: [
            'Striking the ball hard',
            'Relaxing the surface on contact so the ball does not bounce away',
            'Taking a heavy touch',
            'Only using the head',
          ],
          correct: 1,
        },
      ],
    },
    {
      contentId: 'tc-tech-2',
      title: 'Dribbling and change of pace',
      description: 'Check your understanding of dribbling, scanning and changing pace.',
      passScore: 70,
      questions: [
        {
          prompt: 'What makes the ball get away during a change of pace?',
          options: [
            'Too heavy a touch when accelerating',
            'Using the sole',
            'Keeping the head up',
            'A low centre of gravity',
          ],
          correct: 0,
        },
        {
          prompt: 'Why keep the head up while dribbling?',
          options: [
            'To look at the ball',
            'To scan for obstacles and space',
            'To slow down',
            'To protect the ball with the arms',
          ],
          correct: 1,
        },
        {
          prompt: 'How should a change of direction be treated?',
          options: [
            'Like a feint to deceive the opponent',
            'Like a pass',
            'Like a shot',
            'Like a slow turn',
          ],
          correct: 0,
        },
        {
          prompt: 'What helps balance during a sharp cut?',
          options: [
            'A high centre of gravity',
            'Bending the knees and getting low',
            'Standing tall',
            'Holding the ball with the hands',
          ],
          correct: 1,
        },
      ],
    },
    {
      contentId: 'tc-tech-3',
      title: 'Passing accuracy',
      description: 'Check your understanding of passing technique, weight and BOTS scanning.',
      passScore: 70,
      questions: [
        {
          prompt: 'What does BOTS stand for?',
          options: [
            'Ball, Opposition, Teammates, Space',
            'Body, Options, Touch, Speed',
            'Ball, Offside, Time, Shot',
            'Back, Over, Turn, Sprint',
          ],
          correct: 0,
        },
        {
          prompt: 'How should a pass be weighted?',
          options: [
            'As hard as possible',
            'Firm and accurate, not too hard or too soft',
            'Always softly',
            'Only long',
          ],
          correct: 1,
        },
        {
          prompt: 'Which foot should you pass to?',
          options: [
            'The nearest foot',
            'The correct foot, away from pressure',
            'Always the left',
            'Always the right',
          ],
          correct: 1,
        },
        {
          prompt: 'What do players off the ball need to do?',
          options: [
            'Stand still',
            'Create passing lanes with movement',
            'Only defend',
            'Hide behind defenders',
          ],
          correct: 1,
        },
      ],
    },
    {
      contentId: 'tc-strength-1',
      title: 'Core strength',
      description: 'Check your understanding of core training principles and technique.',
      passScore: 70,
      questions: [
        {
          prompt: 'How often is the core routine recommended?',
          options: [
            'Every day, twice',
            '15 minutes, 3 times a week',
            'Once a month',
            'Only in pre-season',
          ],
          correct: 1,
        },
        {
          prompt: 'What should the plank look like?',
          options: [
            'Hips sagging',
            'A straight line from head to toe',
            'Hips high up',
            'Knees on the floor',
          ],
          correct: 1,
        },
        {
          prompt: 'During alternating exercises you should...',
          options: [
            'Rotate toward the extended arm',
            'Not rotate, keeping alignment',
            'Hold your breath',
            'Go as fast as possible',
          ],
          correct: 1,
        },
        {
          prompt: 'When should you progress to harder exercises?',
          options: [
            'Immediately after one rep',
            'Only when excellent control has been achieved',
            'After one session',
            'Never',
          ],
          correct: 1,
        },
      ],
    },
    {
      contentId: 'tc-strength-2',
      title: 'Lower-body power',
      description: 'Check your understanding of squats, lunges and plyometrics.',
      passScore: 70,
      questions: [
        {
          prompt: 'When can load be added to a squat or lunge?',
          options: [
            'Straight away',
            'Only after perfect technique',
            'Never',
            'Only with a partner',
          ],
          correct: 1,
        },
        {
          prompt: 'How should you land from a plyometric jump?',
          options: [
            'On the heel, heavily',
            'Softly on the front of the foot, absorbing through ankle, knee and hip',
            'On a straight leg',
            'With locked knees',
          ],
          correct: 1,
        },
        {
          prompt: 'If the knees collapse inward during a squat...',
          options: [
            'Add more weight',
            'Emphasise hip abduction and track the knees over the toes',
            'Hold the breath',
            'Land harder',
          ],
          correct: 1,
        },
        {
          prompt: 'Which loading should be used?',
          options: [
            'Only bilateral',
            'Only unilateral',
            'Both bilateral and unilateral',
            'No loading at all',
          ],
          correct: 2,
        },
      ],
    },
    {
      contentId: 'tc-strength-3',
      title: 'Hamstring injury prevention',
      description: 'Check your understanding of the Nordic programme and hamstring care.',
      passScore: 70,
      questions: [
        {
          prompt: 'What does the Nordic Hamstring Exercise mainly train?',
          options: ['Concentric strength', 'Eccentric strength', 'Flexibility', 'Balance'],
          correct: 1,
        },
        {
          prompt: 'What is the strongest modifier of programme effectiveness?',
          options: [
            'The equipment',
            'Adherence (doing the sessions)',
            'The time of day',
            'The surface',
          ],
          correct: 1,
        },
        {
          prompt: 'Which exercises complement the NHE?',
          options: [
            'Only jumping',
            'Hip-dominant exercises such as Romanian deadlifts',
            'Only sprinting',
            'Only planks',
          ],
          correct: 1,
        },
        {
          prompt: 'How should the NHE programme progress?',
          options: [
            'All weeks at maximum volume',
            'Gradually, following the 13-week progression',
            'Once a month',
            'Only in the off-season',
          ],
          correct: 1,
        },
      ],
    },
  ];

  for (const quiz of trainingQuizzes) {
    const existing = await prisma.quiz.findUnique({ where: { contentId: quiz.contentId } });
    if (existing) {
      await prisma.quiz.update({
        where: { id: existing.id },
        data: { title: quiz.title, description: quiz.description, passScore: quiz.passScore },
      });
      continue;
    }
    await prisma.quiz.create({
      data: {
        contentId: quiz.contentId,
        title: quiz.title,
        description: quiz.description,
        passScore: quiz.passScore,
        questions: {
          create: quiz.questions.map((question, questionIndex) => ({
            prompt: question.prompt,
            position: questionIndex,
            options: {
              create: question.options.map((label, optionIndex) => ({
                label,
                isCorrect: optionIndex === question.correct,
                position: optionIndex,
              })),
            },
          })),
        },
      },
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
        goals: 'Reach 20 official appearances, improve 30m sprint times and complete the profile.',
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
          title: 'Improve weaker foot',
          description: 'Do 15 minutes daily of dribbling and passing with the non-dominant foot.',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'goal-player-2',
          playerId: playerProfile.id,
          title: 'Reduce 30m sprint time',
          description: 'Goal: get under 4.2s in the 30-metre sprint.',
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
        notes: 'Good reading of space in attack. Work on defensive positioning.',
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
          evaluatedBy: 'Demo Coach',
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

  // ─── Reclutamiento (agent, scout, staff, requirements, inquiry, submission, trial) ──
  const agentHash = await bcrypt.hash('agent123', 10);
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@demo.com' },
    update: {},
    create: {
      email: 'agent@demo.com',
      name: 'Demo Agent',
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
      name: 'Demo Scout',
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
        notes: 'Sent by the agent after viewing the player profile.',
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
      description:
        'We are looking for a striker with good striking and mobility for the youth team.',
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
      subject: 'Trial for my son',
      message:
        'My son plays center midfield and we would like to know how to take part in a trial.',
      status: 'NEW',
    },
  });

  await prisma.opportunity.upsert({
    where: { id: 'opp-club-1' },
    update: {},
    create: {
      id: 'opp-club-1',
      clubId: club.id,
      title: 'U-17 youth trial',
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
      title: 'Sports scholarship for strikers',
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
        message:
          'I am a U17 striker with national-level experience. I would love to take part in the trial day.',
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
      title: 'New opportunity available',
      message: 'Club Demo is looking for strikers for their U-17 trial. Apply before it closes.',
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
      title: 'IFPC summer camp',
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
      title: 'Strikers clinic (draft)',
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
      title: 'One-to-one trial with a scout',
      description: 'Live 1:1 trial with a scout to assess your current competitive level.',
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

  // Live de club (privado: solo su staff y jugadores con contrato).
  await prisma.liveSession.upsert({
    where: { id: 'live-club-1' },
    update: { clubId: club.id, visibility: 'CLUB' },
    create: {
      id: 'live-club-1',
      title: 'Club squad session: recovery and set pieces',
      description: 'Internal session for the club squad and staff.',
      type: 'TRAINING',
      status: 'SCHEDULED',
      visibility: 'CLUB',
      startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      clubId: club.id,
      coachId: coachProfile?.id,
    },
  });

  // Live público + su anuncio en Discovery (post enlazado).
  const publicLiveStartsAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const publicLive = await prisma.liveSession.upsert({
    where: { id: 'live-public-1' },
    update: { visibility: 'PUBLIC' },
    create: {
      id: 'live-public-1',
      title: 'Open live: build your scouting profile',
      description:
        'Free open session for any player: how to build a scouting profile that clubs and scouts actually notice.',
      type: 'LECTURE',
      status: 'SCHEDULED',
      visibility: 'PUBLIC',
      startsAt: publicLiveStartsAt,
      endsAt: new Date(publicLiveStartsAt.getTime() + 60 * 60 * 1000),
      coachId: coachProfile?.id,
      meetingUrl: 'https://meet.example.com/future-baller-open-live',
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-live-1' },
    update: { liveSessionId: publicLive.id },
    create: {
      id: 'seed-post-live-1',
      authorId: clubUser.id,
      type: 'ANNOUNCEMENT',
      status: 'PUBLISHED',
      title: publicLive.title,
      body: 'Free open live session for every player. Open the post for details and to join.\n\n#live',
      linkUrl: `/dashboard/live-sessions/${publicLive.id}`,
      liveSessionId: publicLive.id,
      tags: ['live'],
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

  // ─── Visitas al perfil del player demo (métricas de interés) ───
  if (playerProfile) {
    const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const profileViews = [
      {
        viewerUserId: clubUser.id,
        viewerRole: 'CLUB',
        viewCount: 3,
        firstViewedAt: daysAgo(1),
        lastViewedAt: daysAgo(0.05),
      },
      {
        viewerUserId: scoutUser.id,
        viewerRole: 'SCOUT',
        viewCount: 1,
        firstViewedAt: daysAgo(2),
        lastViewedAt: daysAgo(0.2),
      },
      {
        viewerUserId: agentUser.id,
        viewerRole: 'AGENT',
        viewCount: 1,
        firstViewedAt: daysAgo(3),
        lastViewedAt: daysAgo(1.5),
      },
      {
        viewerUserId: coachUser.id,
        viewerRole: 'COACH',
        viewCount: 1,
        firstViewedAt: daysAgo(5),
        lastViewedAt: daysAgo(5),
      },
      {
        viewerUserId: universityUser.id,
        viewerRole: 'UNIVERSITY',
        viewCount: 2,
        firstViewedAt: daysAgo(21),
        lastViewedAt: daysAgo(9),
      },
    ];
    for (const view of profileViews) {
      await prisma.profileView.upsert({
        where: {
          playerId_viewerUserId: { playerId: playerProfile.id, viewerUserId: view.viewerUserId },
        },
        update: {},
        create: { playerId: playerProfile.id, ...view },
      });
    }
  }

  // ─── Discovery: posts de ejemplo (una por tipo de perfil) ───
  const opportunity = await prisma.opportunity.findFirst({ where: { creatorType: 'CLUB' } });
  const daysAgoPost = (days: number, hours = 0) =>
    new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000);

  const demoPosts = [
    {
      id: 'seed-post-1',
      authorId: clubUser.id,
      type: 'ANNOUNCEMENT' as const,
      title: 'Looking for a U-17 left-back',
      body: 'We are opening the call-up for next season. Training sessions at the club and the chance of a sports scholarship. #sub17 #leftback',
      opportunityId: opportunity?.id ?? null,
      tags: ['sub17', 'leftback'],
      createdAt: daysAgoPost(0, 2),
    },
    {
      id: 'seed-post-2',
      authorId: playerUser.id,
      type: 'VIDEO' as const,
      body: 'My best plays of the season. #highlights #striker',
      mediaUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
      mediaKind: 'embed',
      tags: ['highlights', 'striker'],
      createdAt: daysAgoPost(1),
    },
    {
      id: 'seed-post-3',
      authorId: universityUser.id,
      type: 'ANNOUNCEMENT' as const,
      title: 'Sports scholarships 2026',
      body: 'The call-up for athletes is open: full tuition and accommodation. #scholarships #university',
      linkUrl: 'https://example.com/scholarships',
      tags: ['scholarships', 'university'],
      createdAt: daysAgoPost(2),
    },
    {
      id: 'seed-post-4',
      authorId: schoolUser.id,
      type: 'ACHIEVEMENT' as const,
      body: 'Our school team wins the regional tournament after an incredible final. Congratulations to the whole group! #school #tournament',
      tags: ['school', 'tournament'],
      createdAt: daysAgoPost(3),
    },
    {
      id: 'seed-post-5',
      authorId: coachUser.id,
      type: 'PHOTO' as const,
      body: 'Finishing session in today’s training. #training',
      mediaUrl: '/images/football-03.jpg',
      mediaKind: 'image',
      tags: ['training'],
      createdAt: daysAgoPost(4),
    },
    {
      id: 'seed-post-6',
      authorId: scoutUser.id,
      type: 'ANNOUNCEMENT' as const,
      body: 'Preparing the January tracking round. Families can message me through the platform. #scouts #tracking',
      tags: ['scouts', 'tracking'],
      createdAt: daysAgoPost(5),
    },
    {
      id: 'seed-post-7',
      authorId: parentUser.id,
      type: 'ACHIEVEMENT' as const,
      body: 'Proud of our son’s first youth contract. Thank you to everyone who has been part of the journey. #family',
      tags: ['family'],
      createdAt: daysAgoPost(6),
    },
  ];

  for (const post of demoPosts) {
    await prisma.post.upsert({ where: { id: post.id }, update: {}, create: post });
  }

  // Reacciones de ejemplo sobre las posts de demo.
  const demoLikes = [
    { postId: 'seed-post-1', userId: playerUser.id },
    { postId: 'seed-post-1', userId: scoutUser.id },
    { postId: 'seed-post-1', userId: agentUser.id },
    { postId: 'seed-post-2', userId: clubUser.id },
    { postId: 'seed-post-2', userId: coachUser.id },
    { postId: 'seed-post-2', userId: scoutUser.id },
    { postId: 'seed-post-2', userId: universityUser.id },
    { postId: 'seed-post-4', userId: parentUser.id },
    { postId: 'seed-post-5', userId: playerUser.id },
  ];
  for (const like of demoLikes) {
    await prisma.postLike.upsert({
      where: { postId_userId: { postId: like.postId, userId: like.userId } },
      update: {},
      create: like,
    });
  }

  const demoComments = [
    {
      id: 'seed-comment-1',
      postId: 'seed-post-1',
      authorId: parentUser.id,
      body: 'Is there a chance of a trial before the call-up?',
      createdAt: daysAgoPost(0, 1),
    },
    {
      id: 'seed-comment-2',
      postId: 'seed-post-1',
      authorId: clubUser.id,
      body: 'Yes, we will message the interested families privately.',
      createdAt: daysAgoPost(0, 1),
    },
    {
      id: 'seed-comment-3',
      postId: 'seed-post-2',
      authorId: scoutUser.id,
      body: 'Good first touch and movement. We are tracking him.',
      createdAt: daysAgoPost(0, 20),
    },
  ];
  for (const comment of demoComments) {
    await prisma.postComment.upsert({ where: { id: comment.id }, update: {}, create: comment });
  }

  // Alcance del anuncio del club (métricas del autor).
  const demoPostViews = [
    {
      viewerUserId: scoutUser.id,
      viewerRole: 'SCOUT',
      viewCount: 4,
      firstViewedAt: daysAgoPost(1),
      lastViewedAt: daysAgoPost(0, 1),
    },
    {
      viewerUserId: agentUser.id,
      viewerRole: 'AGENT',
      viewCount: 2,
      firstViewedAt: daysAgoPost(1),
      lastViewedAt: daysAgoPost(0, 3),
    },
    {
      viewerUserId: universityUser.id,
      viewerRole: 'UNIVERSITY',
      viewCount: 1,
      firstViewedAt: daysAgoPost(2),
      lastViewedAt: daysAgoPost(2),
    },
  ];
  for (const view of demoPostViews) {
    await prisma.postView.upsert({
      where: { postId_viewerUserId: { postId: 'seed-post-1', viewerUserId: view.viewerUserId } },
      update: {},
      create: { postId: 'seed-post-1', ...view },
    });
  }

  // Relaciones de tracking de ejemplo (pestaña "Following" y sugerencias).
  const demoFollows: { followerId: string; followingId: string }[] = [
    { followerId: playerUser.id, followingId: clubUser.id },
    { followerId: playerUser.id, followingId: universityUser.id },
    { followerId: playerUser.id, followingId: scoutUser.id },
    { followerId: parentUser.id, followingId: clubUser.id },
    { followerId: parentUser.id, followingId: schoolUser.id },
    { followerId: scoutUser.id, followingId: playerUser.id },
    { followerId: agentUser.id, followingId: playerUser.id },
    { followerId: coachUser.id, followingId: schoolUser.id },
    { followerId: universityUser.id, followingId: playerUser.id },
  ];
  for (const follow of demoFollows) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: follow.followerId,
          followingId: follow.followingId,
        },
      },
      update: {},
      create: follow,
    });
  }

  // Denuncias de ejemplo (cola de moderación) y una post fijada.
  const demoReports = [
    {
      postId: 'seed-post-6',
      reporterId: parentUser.id,
      reason: 'Direct contact outside the platform',
    },
    { postId: 'seed-post-6', reporterId: coachUser.id, reason: 'Publicidad encubierta' },
    { postId: 'seed-post-3', reporterId: playerUser.id, reason: 'The link does not load' },
  ];
  for (const report of demoReports) {
    await prisma.postReport.upsert({
      where: {
        postId_reporterId: { postId: report.postId, reporterId: report.reporterId },
      },
      update: {},
      create: report,
    });
  }

  await prisma.post.updateMany({
    where: { id: 'seed-post-1' },
    data: { pinnedAt: daysAgoPost(0, 2) },
  });

  // ─── Football Center: ejercicios generales ─────────────────────────────
  const generalExercises = [
    {
      id: 'tc-gen-ex-1',
      title: 'Cone dribbling circuit',
      category: 'technical',
      description: 'Close-control dribbling through a slalom of cones with both feet.',
      durationMinutes: 15,
      difficulty: 2,
      content:
        'Place 6 cones 1.5 m apart. Dribble through with the inside, outside and sole of the foot.\n4 series per foot with 60 s rest between series.',
      outcomes: ['Keep the ball under control at speed', 'Use both feet and the sole'],
      series: 4,
      reps: '1 run per foot',
      restSeconds: 60,
      equipment: ['balls', 'cones'],
      space: '20x10 m',
      players: 'Individual',
    },
    {
      id: 'tc-gen-ex-2',
      title: 'Wall passing: first touch and return',
      category: 'technical',
      description: 'Two-touch wall work to sharpen the first touch and body orientation.',
      durationMinutes: 12,
      difficulty: 1,
      content:
        '2 minutes per foot against a wall, 5 m away.\nFirst touch away from the wall, second touch back. Alternate inside and outside of the foot.',
      outcomes: ['Control away from pressure', 'Receive side-on'],
      series: 2,
      reps: '2 min per foot',
      restSeconds: 60,
      equipment: ['balls', 'wall'],
      space: '5 m from the wall',
      players: 'Individual or in pairs',
    },
    {
      id: 'tc-gen-ex-3',
      title: 'Core stability series',
      category: 'strength-conditioning',
      description: 'Plank, side plank and dead bug circuit to build trunk stability.',
      durationMinutes: 18,
      difficulty: 2,
      content:
        'Circuit: front plank 40 s, side plank 30 s per side, dead bug 10 per side.\n3 rounds with 60 s rest between rounds.',
      outcomes: ['Hold a neutral spine', 'Transfer force from the trunk'],
      series: 3,
      reps: '1 circuit',
      restSeconds: 60,
      equipment: [],
      space: 'Free space',
      players: 'Individual',
    },
  ];

  for (const exercise of generalExercises) {
    const data = {
      title: exercise.title,
      category: exercise.category,
      kind: 'EXERCISE' as const,
      ownerType: 'GENERAL' as const,
      description: exercise.description,
      durationMinutes: exercise.durationMinutes,
      difficulty: exercise.difficulty,
      content: exercise.content,
      outcomes: exercise.outcomes,
      series: exercise.series ?? null,
      reps: exercise.reps ?? null,
      restSeconds: exercise.restSeconds ?? null,
      equipment: exercise.equipment ?? [],
      space: exercise.space ?? null,
      players: exercise.players ?? null,
    };
    await prisma.trainingContent.upsert({
      where: { id: exercise.id },
      update: data,
      create: { id: exercise.id, ...data },
    });
  }

  // ─── Football Center: contenido de un coach y de un club ───────────────
  if (coachProfile) {
    await prisma.trainingContent.upsert({
      where: { id: 'tc-coach-1' },
      update: {},
      create: {
        id: 'tc-coach-1',
        title: 'Scanning before receiving',
        category: 'technical',
        kind: 'COURSE',
        ownerType: 'COACH',
        coachId: coachProfile.id,
        description: 'Body shape and scanning to play forward on the first touch.',
        durationMinutes: 30,
        difficulty: 3,
        content:
          '1. Why scanning matters: two checks before the ball arrives.\n2. Body shape: half-turned, eyes over the shoulder.\n3. Progressive practice: rondo, then 4v4+2.',
        outcomes: ['Check both shoulders before receiving', 'Receive side-on facing up'],
      },
    });

    await prisma.trainingContent.upsert({
      where: { id: 'tc-coach-ex-1' },
      update: {},
      create: {
        id: 'tc-coach-ex-1',
        title: 'Third-man runs (4v4+2)',
        category: 'technical',
        kind: 'EXERCISE',
        ownerType: 'COACH',
        coachId: coachProfile.id,
        description: 'Possession game with two neutral players to find the third man.',
        durationMinutes: 20,
        difficulty: 3,
        content: '4 series of 4 minutes with 90 s rest. Two touches maximum per player.',
        outcomes: ['Play around the press', 'Time the third-man run'],
        series: 4,
        reps: '4 min',
        restSeconds: 90,
        equipment: ['balls', 'cones', 'bibs'],
        space: '30x20 m',
        players: '4v4 + 2 neutrals',
      },
    });

    // Borrador de ejemplo: solo lo ve el coach, y así se ve el estado en la lista.
    await prisma.trainingContent.upsert({
      where: { id: 'tc-coach-ex-draft' },
      update: {},
      create: {
        id: 'tc-coach-ex-draft',
        title: 'Warm-up mobility (draft)',
        category: 'strength-conditioning',
        kind: 'EXERCISE',
        ownerType: 'COACH',
        coachId: coachProfile.id,
        status: 'DRAFT',
        description: 'Draft: joint mobility routine to open the session.',
        durationMinutes: 12,
        difficulty: 1,
        content: 'Ankle, hip and shoulder mobility. 2 rounds of 6 exercises.',
        outcomes: ['Prepare joints before training'],
        series: 2,
        reps: '8 exercises',
        restSeconds: 30,
        equipment: ['markers'],
        space: 'Half pitch',
        players: 'Whole squad',
      },
    });
  }

  if (playerProfile) {
    // El jugador demo pertenece al club: ve su contenido y sus live privados.
    await prisma.contract.upsert({
      where: { id: 'contract-demo-1' },
      update: {},
      create: {
        id: 'contract-demo-1',
        clubId: club.id,
        playerId: playerProfile.id,
        startsAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'SIGNED',
        signedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.trainingContent.upsert({
    where: { id: 'tc-club-1' },
    update: {},
    create: {
      id: 'tc-club-1',
      title: 'Club playing model: build-up from the back',
      category: 'technical',
      kind: 'COURSE',
      ownerType: 'CLUB',
      clubId: club.id,
      description: 'How the club wants to build up, with the roles of each line.',
      durationMinutes: 35,
      difficulty: 3,
      content:
        '1. Principles: width, depth and a free man.\n2. Goalkeeper and centre-backs: first pass options.\n3. Midfield rotation and the third man.',
      outcomes: ['Recognise the build-up structure', 'Find the free man'],
    },
  });

  await prisma.trainingContent.upsert({
    where: { id: 'tc-club-ex-1' },
    update: {},
    create: {
      id: 'tc-club-ex-1',
      title: 'Rondo 6v2 with transition',
      category: 'technical',
      kind: 'EXERCISE',
      ownerType: 'CLUB',
      clubId: club.id,
      description: 'Club rondo to train the first pass and the reaction after losing the ball.',
      durationMinutes: 18,
      difficulty: 2,
      content: '6v2 in a 12x12 grid. When the defenders win the ball, 5-second counter.',
      outcomes: ['Play away from pressure', 'React immediately after loss'],
      series: 4,
      reps: '3 min',
      restSeconds: 60,
      equipment: ['balls', 'bibs', 'cones'],
      space: '12x12 m',
      players: '6v2',
    },
  });

  console.log('Seed completed:');
  console.log(`- admin: admin@ifpc.com / admin123`);
  console.log(`- player: player@demo.com / player123`);
  console.log(`- parent: parent@demo.com / parent123`);
  console.log(`- club: club@demo.com / club123`);
  console.log(`- agent: agent@demo.com / agent123`);
  console.log(`- scout: scout@demo.com / scout123`);
  console.log(`- coach: coach@demo.com / coach123`);
  console.log(`- university: university@demo.com / university123`);
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
