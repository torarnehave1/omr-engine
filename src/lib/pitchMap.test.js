import { describe, it, expect } from 'vitest';
import { STAFF_POS, BASE_SOL, ALL_SOL, SOL_COL, yToPos, posToNote } from './pitchMap.js';
import { KEY_SIGS } from './keySig.js';

describe('constants', () => {
  it('STAFF_POS has 14 entries spanning A3 to G5', () => {
    expect(STAFF_POS).toHaveLength(14);
    expect(STAFF_POS[0]).toEqual({ l: 'A', o: 3 });
    expect(STAFF_POS[4]).toEqual({ l: 'E', o: 4 });   // pos 0 (bottom line)
    expect(STAFF_POS[13]).toEqual({ l: 'G', o: 5 });
  });

  it('BASE_SOL maps every natural letter', () => {
    expect(BASE_SOL).toEqual({ C: 'DO', D: 'RE', E: 'MI', F: 'FA', G: 'SOL', A: 'LA', B: 'TI' });
  });

  it('ALL_SOL contains all 11 solfège tokens (incl. SUS, FI, TIB, MIB)', () => {
    expect(ALL_SOL).toHaveLength(11);
    expect(ALL_SOL).toContain('SUS');
    expect(ALL_SOL).toContain('FI');
    expect(ALL_SOL).toContain('TIB');
    expect(ALL_SOL).toContain('MIB');
  });

  it('SOL_COL has a color for every ALL_SOL entry', () => {
    ALL_SOL.forEach(sol => {
      expect(SOL_COL[sol]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('yToPos', () => {
  // Synthetic stave: 5 lines starting at y=100, step=20px. lines[4] = 180 (bottom line).
  const stave = { lines: [100, 120, 140, 160, 180], step: 20 };

  it('returns 0 at the bottom line (lines[4])', () => {
    expect(yToPos(180, stave)).toBe(0);
  });

  it('returns 1 one halfStep above the bottom line', () => {
    expect(yToPos(170, stave)).toBe(1);  // 180 - 1*10 = 170
  });

  it('returns 8 at the top line (lines[0])', () => {
    expect(yToPos(100, stave)).toBe(8);  // 180 - 8*10 = 100
  });

  it('snaps to nearest grid position (within ±halfStep/2)', () => {
    expect(yToPos(173, stave)).toBe(1);  // closer to 170 than 180
    expect(yToPos(177, stave)).toBe(0);  // closer to 180
  });

  it('clamps to lowest pos (-4) below the staff', () => {
    expect(yToPos(220, stave)).toBe(-4);  // 180 - (-4)*10 = 220
  });

  it('clamps to highest pos (12) above the staff', () => {
    expect(yToPos(60, stave)).toBe(12);   // 180 - 12*10 = 60
  });
});

describe('posToNote', () => {
  describe('out-of-range positions return null', () => {
    it('pos < -4 returns null', () => {
      expect(posToNote(-5, KEY_SIGS.natural)).toBeNull();
    });
    it('pos > 9 (idx > 13) returns null', () => {
      expect(posToNote(10, KEY_SIGS.natural)).toBeNull();
    });
  });

  describe('natural (C Major) — no accidentals', () => {
    it('pos 0 (bottom line) → E4 / MI', () => {
      expect(posToNote(0, KEY_SIGS.natural)).toEqual({
        letter: 'E', accidental: '', octave: 4, solfege: 'MI', pitch: 'E4',
      });
    });
    it('pos 4 (middle line) → B4 / TI', () => {
      expect(posToNote(4, KEY_SIGS.natural)).toEqual({
        letter: 'B', accidental: '', octave: 4, solfege: 'TI', pitch: 'B4',
      });
    });
    it('pos 8 (top line) → F5 / FA', () => {
      expect(posToNote(8, KEY_SIGS.natural)).toEqual({
        letter: 'F', accidental: '', octave: 5, solfege: 'FA', pitch: 'F5',
      });
    });
    it('pos -4 (below staff) → A3 / LA', () => {
      expect(posToNote(-4, KEY_SIGS.natural)).toEqual({
        letter: 'A', accidental: '', octave: 3, solfege: 'LA', pitch: 'A3',
      });
    });
  });

  describe('hicaz_a (Bb + F#) — flats apply B, sharps apply F→FI', () => {
    it('pos 4 → B4 becomes Bb4 / TIB', () => {
      expect(posToNote(4, KEY_SIGS.hicaz_a)).toEqual({
        letter: 'B', accidental: 'b', octave: 4, solfege: 'TIB', pitch: 'Bb4',
      });
    });
    it('pos 8 → F5 becomes F#5 / FI (F# special case)', () => {
      expect(posToNote(8, KEY_SIGS.hicaz_a)).toEqual({
        letter: 'F', accidental: '#', octave: 5, solfege: 'FI', pitch: 'F#5',
      });
    });
    it('pos 0 (E4) is unaffected by Bb+F# in this key', () => {
      expect(posToNote(0, KEY_SIGS.hicaz_a)).toEqual({
        letter: 'E', accidental: '', octave: 4, solfege: 'MI', pitch: 'E4',
      });
    });
  });

  describe('ussak (Bb only)', () => {
    it('pos 4 → B4 becomes TIB', () => {
      const n = posToNote(4, KEY_SIGS.ussak);
      expect(n.solfege).toBe('TIB');
      expect(n.pitch).toBe('Bb4');
    });
    it('pos 8 → F5 stays FA (no sharps)', () => {
      const n = posToNote(8, KEY_SIGS.ussak);
      expect(n.solfege).toBe('FA');
      expect(n.pitch).toBe('F5');
    });
  });

  describe('segah (F# only)', () => {
    it('pos 4 → B4 stays TI (no flats)', () => {
      const n = posToNote(4, KEY_SIGS.segah);
      expect(n.solfege).toBe('TI');
      expect(n.pitch).toBe('B4');
    });
    it('pos 8 → F5 becomes FI', () => {
      const n = posToNote(8, KEY_SIGS.segah);
      expect(n.solfege).toBe('FI');
      expect(n.pitch).toBe('F#5');
    });
  });

  describe('TISHARP → TI special case (when B is sharped)', () => {
    // B# is enharmonically C, but the HTML normalises the solfège label back to TI.
    it('custom key with B# → solfege "TI" not "TISHARP"', () => {
      const customKey = { flats: [], sharps: ['B'], name: 'Custom (B#)' };
      const n = posToNote(4, customKey);
      expect(n.solfege).toBe('TI');
      expect(n.pitch).toBe('B#4');
    });
  });
});
