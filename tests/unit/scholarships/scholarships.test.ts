import { describe, expect, it } from 'vitest';
import { scholarshipSchema } from '@ifpc/validation';
import { scholarshipCoverageLabel, scholarshipSummary } from '@/lib/scholarships';

describe('scholarshipSummary', () => {
  it('resume cobertura, plazas, financiación y curso', () => {
    expect(
      scholarshipSummary({
        coverage: 'FULL',
        spots: 2,
        amount: '100% tuition',
        intakeYear: 2027,
      })
    ).toBe('Full scholarship · 2 spots · 100% tuition · Intake 2027');
  });

  it('usa singular y omite los datos que faltan', () => {
    expect(scholarshipSummary({ coverage: 'BOARDING', spots: 1 })).toBe(
      'Boarding place · 1 spot'
    );
  });

  it('devuelve null sin beca y deja pasar coberturas desconocidas', () => {
    expect(scholarshipSummary(null)).toBeNull();
    expect(scholarshipCoverageLabel('CUSTOM')).toBe('CUSTOM');
  });
});

describe('scholarshipSchema', () => {
  it('convierte el formulario completo', () => {
    const parsed = scholarshipSchema.safeParse({
      title: 'University scholarship',
      description: 'Degree + football',
      coverage: 'FULL',
      spots: '2',
      amount: '100% tuition',
      minGpa: '3.2',
      intakeYear: '2027',
      closesAt: '2026-12-01',
      position: 'DEL',
      ageMin: '16',
      ageMax: '19',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.spots).toBe(2);
      expect(parsed.data.minGpa).toBe(3.2);
      expect(parsed.data.intakeYear).toBe(2027);
      expect(parsed.data.ageMin).toBe(16);
    }
  });

  it('un campo vacío es null, nunca 0', () => {
    const parsed = scholarshipSchema.safeParse({
      title: 'Programme',
      description: '',
      coverage: 'PARTIAL',
      spots: '1',
      amount: '',
      minGpa: '',
      intakeYear: '',
      closesAt: '',
      ageMin: '',
      ageMax: '',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minGpa).toBeNull();
      expect(parsed.data.intakeYear).toBeNull();
      expect(parsed.data.ageMin).toBeNull();
    }
  });

  it('rechaza plazas 0 y GPA fuera de escala', () => {
    expect(
      scholarshipSchema.safeParse({ title: 'Programme', coverage: 'FULL', spots: '0' }).success
    ).toBe(false);
    expect(
      scholarshipSchema.safeParse({
        title: 'Programme',
        coverage: 'FULL',
        spots: '1',
        minGpa: '5',
      }).success
    ).toBe(false);
  });
});
