import { describe, expect, it } from 'vitest';
import { POSITIONS, POSITION_LABELS } from '@ifpc/config';
import { isPitchPosition, pitchSpot, zoneGlow } from '@/lib/player-pitch';

const WIDE = ['LAT', 'CAR', 'EXT'] as const;

describe('pitchSpot', () => {
  it('no coloca nada cuando no hay posición (o es desconocida)', () => {
    expect(pitchSpot(null)).toBeNull();
    expect(pitchSpot(undefined)).toBeNull();
    expect(pitchSpot('')).toBeNull();
    expect(pitchSpot('MC')).toBeNull();
    expect(isPitchPosition('MC')).toBe(false);
  });

  it('todas las posiciones declaradas tienen sitio en la cancha', () => {
    for (const position of POSITIONS) {
      const spot = pitchSpot(position);
      expect(spot).not.toBeNull();
      expect(spot?.position).toBe(position);
      expect(spot?.label).toBe(POSITION_LABELS[position]);
      expect(isPitchPosition(position)).toBe(true);
    }
  });

  it('la geometría queda dentro del campo (0-100)', () => {
    for (const position of POSITIONS) {
      const spot = pitchSpot(position);
      if (!spot) throw new Error(`sin sitio para ${position}`);

      expect(spot.zones.length).toBeGreaterThan(0);
      expect(spot.markers.length).toBeGreaterThan(0);

      for (const zone of spot.zones) {
        expect(zone.x).toBeGreaterThanOrEqual(0);
        expect(zone.y).toBeGreaterThanOrEqual(0);
        expect(zone.x + zone.w).toBeLessThanOrEqual(100);
        expect(zone.y + zone.h).toBeLessThanOrEqual(100);
      }

      for (const marker of spot.markers) {
        expect(marker.x).toBeGreaterThanOrEqual(0);
        expect(marker.x).toBeLessThanOrEqual(100);
        expect(marker.y).toBeGreaterThanOrEqual(0);
        expect(marker.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('los marcadores caen dentro de su zona', () => {
    for (const position of POSITIONS) {
      const spot = pitchSpot(position);
      if (!spot) throw new Error(`sin sitio para ${position}`);

      for (const marker of spot.markers) {
        const inside = spot.zones.some(
          (zone) =>
            marker.x >= zone.x &&
            marker.x <= zone.x + zone.w &&
            marker.y >= zone.y &&
            marker.y <= zone.y + zone.h
        );
        expect(inside, `${position} con el marcador fuera de la zona`).toBe(true);
      }
    }
  });

  it('las posiciones de banda marcan los dos carriles (el lado no está guardado)', () => {
    for (const position of POSITIONS) {
      const spot = pitchSpot(position);
      if (!spot) throw new Error(`sin sitio para ${position}`);

      if ((WIDE as readonly string[]).includes(position)) {
        expect(spot.wide).toBe(true);
        expect(spot.markers).toHaveLength(2);
        expect(spot.zones).toHaveLength(2);
        // Los dos marcadores son espejo respecto al centro del campo.
        const [left, right] = spot.markers;
        expect(left.x).toBeLessThan(50);
        expect(right.x).toBeGreaterThan(50);
        expect(left.x + right.x).toBe(100);
        expect(left.y).toBe(right.y);
      } else {
        expect(spot.wide).toBe(false);
        expect(spot.markers).toHaveLength(1);
        expect(spot.zones).toHaveLength(1);
        expect(spot.markers[0].x).toBe(50);
      }
    }
  });

  it('se ataca hacia arriba: portero al fondo propio y delantero arriba', () => {
    const goalkeeper = pitchSpot('POR');
    const striker = pitchSpot('DEL');
    const defender = pitchSpot('DEF');
    const midfielder = pitchSpot('MED');

    expect(goalkeeper?.markers[0].y).toBeGreaterThan(85);
    expect(striker?.markers[0].y).toBeLessThan(25);
    // El orden de las líneas es portero > defensa > medio > delantero.
    expect(goalkeeper!.markers[0].y).toBeGreaterThan(defender!.markers[0].y);
    expect(defender!.markers[0].y).toBeGreaterThan(midfielder!.markers[0].y);
    expect(midfielder!.markers[0].y).toBeGreaterThan(striker!.markers[0].y);
  });

  it('agrupa cada posición en su familia', () => {
    expect(pitchSpot('POR')?.group).toBe('Goalkeeper');
    expect(pitchSpot('DEF')?.group).toBe('Defence');
    expect(pitchSpot('LAT')?.group).toBe('Defence');
    expect(pitchSpot('CAR')?.group).toBe('Defence');
    expect(pitchSpot('PIV')?.group).toBe('Midfield');
    expect(pitchSpot('MED')?.group).toBe('Midfield');
    expect(pitchSpot('EXT')?.group).toBe('Attack');
    expect(pitchSpot('DEL')?.group).toBe('Attack');
  });
});

describe('zoneGlow', () => {
  it('centra el halo en la zona y lo mide en ancho del campo', () => {
    expect(zoneGlow({ x: 30, y: 9, w: 40, h: 20 })).toEqual({ x: 50, y: 19, size: 40 });
    expect(zoneGlow({ x: 2, y: 62, w: 26, h: 20 })).toEqual({ x: 15, y: 72, size: 26 });
  });

  it('el halo de cada zona cae dentro del campo', () => {
    for (const position of POSITIONS) {
      const spot = pitchSpot(position);
      if (!spot) throw new Error(`sin sitio para ${position}`);

      for (const zone of spot.zones) {
        const glow = zoneGlow(zone);
        expect(glow.x).toBeGreaterThan(0);
        expect(glow.x).toBeLessThan(100);
        expect(glow.y).toBeGreaterThan(0);
        expect(glow.y).toBeLessThan(100);
        expect(glow.size).toBeGreaterThan(0);
        expect(glow.size).toBeLessThanOrEqual(100);
      }
    }
  });
});
