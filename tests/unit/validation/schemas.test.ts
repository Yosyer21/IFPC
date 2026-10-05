import { describe, expect, it } from 'vitest';
import {
  careerEntrySchema,
  loginSchema,
  playerProfileSchema,
  registerSchema,
} from '@ifpc/validation';

describe('registerSchema', () => {
  it('accepts valid data', () => {
    const result = registerSchema.safeParse({
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'no-es-un-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'ana@test.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('acepta credenciales completas', () => {
    const result = loginSchema.safeParse({ email: 'ana@test.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty credentials', () => {
    const result = loginSchema.safeParse({ email: 'ana@test.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('playerProfileSchema', () => {
  it('acepta valores opcionales null', () => {
    const result = playerProfileSchema.safeParse({
      firstName: 'Ana',
      lastName: 'García',
      heightCm: null,
      weightKg: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza altura negativa', () => {
    const result = playerProfileSchema.safeParse({ firstName: 'Ana', lastName: 'G', heightCm: -5 });
    expect(result.success).toBe(false);
  });

  it('rechaza una altura fuera de rango', () => {
    const result = playerProfileSchema.safeParse({ firstName: 'Ana', lastName: 'G', heightCm: 300 });
    expect(result.success).toBe(false);
  });

  it('rechaza un peso fuera de rango', () => {
    const result = playerProfileSchema.safeParse({ firstName: 'Ana', lastName: 'G', weightKg: 20 });
    expect(result.success).toBe(false);
  });

  it('acepta altura y peso dentro de rango', () => {
    const result = playerProfileSchema.safeParse({
      firstName: 'Ana',
      lastName: 'G',
      heightCm: 168,
      weightKg: 58,
    });
    expect(result.success).toBe(true);
  });

  it('acepta una fecha de nacimiento válida', () => {
    const result = playerProfileSchema.safeParse({
      firstName: 'Ana',
      lastName: 'G',
      dateOfBirth: '2010-05-20',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza una fecha de nacimiento inválida', () => {
    const result = playerProfileSchema.safeParse({
      firstName: 'Ana',
      lastName: 'G',
      dateOfBirth: 'ayer',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una fecha de nacimiento en el futuro', () => {
    const result = playerProfileSchema.safeParse({
      firstName: 'Ana',
      lastName: 'G',
      dateOfBirth: '2999-01-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('careerEntrySchema', () => {
  const valid = {
    clubName: 'Future Baller Academy',
    category: 'Sub-17',
    season: '2025/26',
    appearances: 18,
    goals: 12,
    assists: 7,
  };

  it('acepta una temporada válida', () => {
    expect(careerEntrySchema.safeParse(valid).success).toBe(true);
  });

  it('acepta un año suelto como temporada', () => {
    expect(careerEntrySchema.safeParse({ ...valid, season: '2024' }).success).toBe(true);
  });

  it('rechaza una temporada mal formada', () => {
    expect(careerEntrySchema.safeParse({ ...valid, season: 'verano 2025' }).success).toBe(false);
    expect(careerEntrySchema.safeParse({ ...valid, season: '25/26' }).success).toBe(false);
  });

  it('exige el club', () => {
    expect(careerEntrySchema.safeParse({ ...valid, clubName: '  ' }).success).toBe(false);
  });

  it('rechaza estadísticas fuera de rango', () => {
    expect(careerEntrySchema.safeParse({ ...valid, goals: -1 }).success).toBe(false);
    expect(careerEntrySchema.safeParse({ ...valid, appearances: 501 }).success).toBe(false);
  });

  it('acepta estadísticas vacías (null)', () => {
    const result = careerEntrySchema.safeParse({
      clubName: 'Ballarat City FC',
      season: '2024/25',
      appearances: null,
      goals: null,
      assists: null,
    });
    expect(result.success).toBe(true);
  });
});
