import { describe, it, expect } from 'vitest';
import { KEY_SIGS, parseCustomKey } from './keySig.js';

describe('KEY_SIGS', () => {
  it('has the 5 preset key signatures', () => {
    expect(Object.keys(KEY_SIGS).sort()).toEqual(['hicaz', 'hicaz_a', 'natural', 'segah', 'ussak']);
  });

  it('hicaz_a has Bb + F# and tonic A=LA', () => {
    expect(KEY_SIGS.hicaz_a).toEqual({
      flats: ['B'], sharps: ['F'],
      name: 'Hicaz (Bb + F#) tonic A',
      tonicNote: 'A', tonicSol: 'LA',
    });
  });

  it('natural (C major) has no accidentals', () => {
    expect(KEY_SIGS.natural.flats).toEqual([]);
    expect(KEY_SIGS.natural.sharps).toEqual([]);
  });

  it('ussak is Bb only', () => {
    expect(KEY_SIGS.ussak.flats).toEqual(['B']);
    expect(KEY_SIGS.ussak.sharps).toEqual([]);
  });

  it('segah is F# only', () => {
    expect(KEY_SIGS.segah.flats).toEqual([]);
    expect(KEY_SIGS.segah.sharps).toEqual(['F']);
  });
});

describe('parseCustomKey', () => {
  it('parses empty string → no accidentals', () => {
    const r = parseCustomKey('');
    expect(r.flats).toEqual([]);
    expect(r.sharps).toEqual([]);
    expect(r.name).toBe('Custom ()');
  });

  it('parses single flat "Bb"', () => {
    const r = parseCustomKey('Bb');
    expect(r.flats).toEqual(['B']);
    expect(r.sharps).toEqual([]);
  });

  it('parses single sharp "F#"', () => {
    const r = parseCustomKey('F#');
    expect(r.flats).toEqual([]);
    expect(r.sharps).toEqual(['F']);
  });

  it('parses combined "Bb F#"', () => {
    const r = parseCustomKey('Bb F#');
    expect(r.flats).toEqual(['B']);
    expect(r.sharps).toEqual(['F']);
  });

  it('parses multiple flats and sharps "Bb Eb F# C#"', () => {
    const r = parseCustomKey('Bb Eb F# C#');
    expect(r.flats).toEqual(['B', 'E']);
    expect(r.sharps).toEqual(['F', 'C']);
  });

  it('handles lowercase input (uppercases internally)', () => {
    const r = parseCustomKey('bb f#');
    expect(r.flats).toEqual(['B']);
    expect(r.sharps).toEqual(['F']);
  });

  it('handles undefined/null input gracefully', () => {
    expect(parseCustomKey(undefined).flats).toEqual([]);
    expect(parseCustomKey(null).flats).toEqual([]);
  });

  it('name includes the trimmed raw string', () => {
    expect(parseCustomKey('  Bb F#  ').name).toBe('Custom (BB F#)');
  });
});
