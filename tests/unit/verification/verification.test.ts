import { describe, expect, it } from 'vitest';
import {
  VERIFICATION_LABELS,
  canContactPlayers,
  isListable,
  verificationBadges,
} from '../../../apps/web/lib/verification';

describe('verification helpers', () => {
  it('devuelve solo las insignias activas', () => {
    expect(verificationBadges({})).toEqual([]);
    expect(verificationBadges({ verified: true })).toEqual([VERIFICATION_LABELS.verified]);
    expect(
      verificationBadges({ verified: true, backgroundChecked: true, safeguardingPolicy: true })
    ).toEqual([
      VERIFICATION_LABELS.verified,
      VERIFICATION_LABELS.backgroundChecked,
      VERIFICATION_LABELS.safeguardingPolicy,
    ]);
    expect(verificationBadges({ safeguardingCertified: true })).toEqual([
      VERIFICATION_LABELS.safeguardingCertified,
    ]);
  });

  it('exige verificación y antecedentes para contactar jugadores', () => {
    expect(canContactPlayers({ verified: true, backgroundChecked: true })).toBe(true);
    expect(canContactPlayers({ verified: true, backgroundChecked: false })).toBe(false);
    expect(canContactPlayers({ verified: false, backgroundChecked: true })).toBe(false);
    expect(canContactPlayers({})).toBe(false);
  });

  it('solo los verificados son listables en el marketplace', () => {
    expect(isListable({ verified: true })).toBe(true);
    expect(isListable({ verified: false })).toBe(false);
    expect(isListable({})).toBe(false);
  });
});
