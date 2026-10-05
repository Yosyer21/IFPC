import { describe, expect, it } from 'vitest';
import { registerSchema, loginSchema, playerProfileSchema } from '@ifpc/validation';

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
