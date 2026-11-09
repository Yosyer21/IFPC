import { describe, expect, it } from 'vitest';
import {
  NEW_OFFER_WINDOW_DAYS,
  applicationFromRow,
  daysSince,
  daysUntil,
  filterByCategory,
  isNewOffer,
  matchFromOpportunity,
  offerFromNegotiation,
  offerFromTrial,
  opportunityCategory,
  opportunityTypeLabel,
  transferWindowStats,
  type TransferOffer,
} from '@/lib/transfer-window';

const NOW = new Date('2026-09-11T12:00:00.000Z');
const DAY = 86_400_000;

function offer(overrides: Partial<TransferOffer> = {}): TransferOffer {
  return {
    id: 'offer-1',
    kind: 'TRIAL',
    tag: 'TRIAL',
    isNew: true,
    title: 'Offer',
    organisation: 'Club',
    message: null,
    meta: null,
    daysToReply: null,
    category: 'TRIALS',
    href: '/clubs/club-1',
    ...overrides,
  };
}

describe('daysUntil / daysSince', () => {
  it('cuenta días completos hacia delante y nunca baja de cero', () => {
    expect(daysUntil(new Date(NOW.getTime() + 36 * 3_600_000), NOW)).toBe(2);
    expect(daysUntil(new Date(NOW.getTime() + 3_600_000), NOW)).toBe(1);
    expect(daysUntil(new Date(NOW.getTime() - DAY), NOW)).toBe(0);
  });

  it('cuenta días completos hacia atrás y nunca baja de cero', () => {
    expect(daysSince(new Date(NOW.getTime() - 3 * DAY), NOW)).toBe(3);
    expect(daysSince(new Date(NOW.getTime() - 3_600_000), NOW)).toBe(0);
    expect(daysSince(new Date(NOW.getTime() + DAY), NOW)).toBe(0);
  });
});

describe('isNewOffer', () => {
  it('marca como nueva solo dentro de la ventana declarada', () => {
    expect(isNewOffer(new Date(NOW.getTime() - (NEW_OFFER_WINDOW_DAYS - 1) * DAY), NOW)).toBe(true);
    expect(isNewOffer(new Date(NOW.getTime() - NEW_OFFER_WINDOW_DAYS * DAY), NOW)).toBe(false);
  });
});

describe('opportunityTypeLabel', () => {
  it('traduce los tipos conocidos y deja pasar lo desconocido', () => {
    expect(opportunityTypeLabel('TRIAL')).toBe('Trial');
    expect(opportunityTypeLabel('SCHOLARSHIP')).toBe('Scholarship');
    expect(opportunityTypeLabel('FOO')).toBe('FOO');
  });
});

describe('opportunityCategory', () => {
  it('separa universidad, colegio/academia y pruebas', () => {
    expect(
      opportunityCategory({
        id: '1',
        title: 'A',
        type: 'SCHOLARSHIP',
        location: null,
        closesAt: null,
        universityId: 'uni-1',
      })
    ).toBe('UNIVERSITY');
    expect(
      opportunityCategory({
        id: '2',
        title: 'B',
        type: 'TRIAL',
        location: null,
        closesAt: null,
        creatorType: 'UNIVERSITY',
      })
    ).toBe('UNIVERSITY');
    expect(
      opportunityCategory({ id: '3', title: 'C', type: 'ACADEMY', location: null, closesAt: null })
    ).toBe('SCHOOL');
    expect(
      opportunityCategory({ id: '4', title: 'D', type: 'TRIAL', location: null, closesAt: null })
    ).toBe('TRIALS');
  });
});

describe('offerFromTrial', () => {
  const trial = {
    id: 'trial-1',
    createdAt: new Date(NOW.getTime() - 2 * DAY),
    startsAt: new Date(NOW.getTime() + 8 * DAY),
    endsAt: new Date(NOW.getTime() + 10 * DAY),
    location: 'Ciudad Deportiva',
    notes: 'Nota interna',
    club: { id: 'club-1', name: 'Demo Club' },
    submission: { notes: 'We watched your finishing clip.' },
  };

  it('normaliza la invitación con el mensaje del club y los días para responder', () => {
    const result = offerFromTrial(trial, NOW);

    expect(result).toMatchObject({
      id: 'trial-1',
      kind: 'TRIAL',
      tag: 'TRIAL',
      isNew: true,
      title: 'Demo Club trial invitation',
      organisation: 'Demo Club',
      message: 'We watched your finishing clip.',
      meta: 'Ciudad Deportiva',
      daysToReply: 10,
      category: 'TRIALS',
      href: '/clubs/club-1',
    });
  });

  it('cae a las notas de la prueba si la submission está vacía', () => {
    expect(offerFromTrial({ ...trial, submission: null }, NOW).message).toBe('Nota interna');
    expect(offerFromTrial({ ...trial, submission: { notes: '   ' } }, NOW).message).toBe(
      'Nota interna'
    );
  });
});

describe('offerFromNegotiation', () => {
  it('presenta la negociación como oferta de contrato sin fecha límite', () => {
    const result = offerFromNegotiation(
      {
        id: 'neg-1',
        createdAt: new Date(NOW.getTime() - 30 * DAY),
        notes: '   ',
        club: { id: 'club-2', name: 'Striker Madrid' },
      },
      NOW
    );

    expect(result).toMatchObject({
      id: 'neg-1',
      kind: 'NEGOTIATION',
      tag: 'CONTRACT',
      isNew: false,
      title: 'Striker Madrid contract offer',
      message: null,
      daysToReply: null,
      category: 'TRIALS',
      href: '/clubs/club-2',
    });
  });
});

describe('matchFromOpportunity', () => {
  it('serializa la oportunidad y sus días de cierre', () => {
    const result = matchFromOpportunity(
      {
        id: 'opp-1',
        title: 'U-17 youth trial',
        type: 'TRIAL',
        location: 'Valencia',
        closesAt: new Date(NOW.getTime() + 4 * DAY),
        club: { id: 'club-1', name: 'Demo Club' },
      },
      72,
      NOW
    );

    expect(result).toEqual({
      id: 'opp-1',
      title: 'U-17 youth trial',
      organisation: 'Demo Club',
      type: 'Trial',
      category: 'TRIALS',
      match: 72,
      location: 'Valencia',
      closesInDays: 4,
      href: '/dashboard/player/opportunities/opp-1',
    });
  });

  it('usa un guion cuando la oportunidad no tiene organización', () => {
    const result = matchFromOpportunity(
      { id: 'opp-2', title: 'Open day', type: 'ACADEMY', location: null, closesAt: null },
      50,
      NOW
    );
    expect(result.organisation).toBe('—');
    expect(result.category).toBe('SCHOOL');
    expect(result.closesInDays).toBeNull();
  });
});

describe('applicationFromRow', () => {
  it('serializa la candidatura con su antigüedad', () => {
    const result = applicationFromRow(
      {
        id: 'app-1',
        status: 'PENDING',
        createdAt: new Date(NOW.getTime() - 2 * DAY),
        opportunity: {
          id: 'opp-1',
          title: 'University scholarship',
          type: 'SCHOLARSHIP',
          location: null,
          closesAt: null,
          universityId: 'uni-1',
          university: { id: 'uni-1', name: 'Demo University' },
        },
      },
      NOW
    );

    expect(result).toEqual({
      id: 'app-1',
      title: 'University scholarship',
      organisation: 'Demo University',
      type: 'Scholarship',
      category: 'UNIVERSITY',
      status: 'PENDING',
      daysAgo: 2,
      href: '/dashboard/player/opportunities/opp-1',
    });
  });
});

describe('filterByCategory', () => {
  const items = [
    offer({ id: 'a', category: 'TRIALS' }),
    offer({ id: 'b', category: 'UNIVERSITY' }),
    offer({ id: 'c', category: 'SCHOOL' }),
  ];

  it('devuelve una copia con todo al filtrar por ALL', () => {
    const all = filterByCategory(items, 'ALL');
    expect(all).toEqual(items);
    expect(all).not.toBe(items);
  });

  it('filtra por la categoría pedida', () => {
    expect(filterByCategory(items, 'UNIVERSITY').map((item) => item.id)).toEqual(['b']);
    expect(filterByCategory(items, 'SCHOOL').map((item) => item.id)).toEqual(['c']);
  });
});

describe('transferWindowStats', () => {
  it('cuenta cada colección por separado', () => {
    expect(
      transferWindowStats({
        offers: [offer(), offer({ id: 'offer-2' })],
        matches: [],
        applications: [],
      })
    ).toEqual({ offersWaiting: 2, matches: 0, applications: 0 });
  });
});
