import { describe, expect, it } from 'vitest';

// Integration tests require an available PostgreSQL database.
// Without DATABASE_URL (or without an active service) they are skipped automatically.
const DATABASE_URL = process.env.DATABASE_URL;
const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb('Auth · integration (requires a database)', () => {
  it('creates a user and verifies the password hash', async () => {
    const { prisma } = await import('@ifpc/database');
    const { hashPassword, verifyPassword } = await import('@ifpc/auth');

    const password = 'integration-test-123';
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('otra-clave', hash)).toBe(false);

    const email = `it-${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: { email, name: 'IT Test', role: 'PLAYER', passwordHash: hash },
    });
    expect(user.id).toBeTruthy();

    await prisma.user.delete({ where: { id: user.id } });
  });

  it('creates a player linked to their user', async () => {
    const { prisma } = await import('@ifpc/database');

    const email = `it-player-${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: { email, name: 'IT Player', role: 'PLAYER' },
    });
    const player = await prisma.player.create({
      data: { userId: user.id, firstName: 'IT', lastName: 'Player', position: 'MED' },
    });
    expect(player.position).toBe('MED');

    await prisma.player.delete({ where: { id: player.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
