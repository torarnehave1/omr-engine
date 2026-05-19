// Ported line-for-line from omr_engine.html (lines 365-371, 1618-1621).
// No DOM access — parseCustomKey takes the raw string instead of reading the input.

export const KEY_SIGS = {
  hicaz_a: { flats: ['B'], sharps: ['F'], name: 'Hicaz (Bb + F#) tonic A', tonicNote: 'A', tonicSol: 'LA' },
  hicaz:   { flats: ['B'], sharps: ['F'], name: 'Hicaz (Bb + F#) tonic D', tonicNote: 'D', tonicSol: 'RE' },
  ussak:   { flats: ['B'], sharps: [],    name: 'Uşşak (Bb) tonic A',      tonicNote: 'A', tonicSol: 'LA' },
  segah:   { flats: [],    sharps: ['F'], name: 'Segah (F#) tonic E',      tonicNote: 'E', tonicSol: 'MI' },
  natural: { flats: [],    sharps: [],    name: 'C Major',                  tonicNote: 'C', tonicSol: 'DO' },
};

export function parseCustomKey(raw) {
  const r = (raw || '').toUpperCase();
  return {
    flats:  (r.match(/([A-G])B/g) || []).map(s => s[0]),
    sharps: (r.match(/([A-G])#/g) || []).map(s => s[0]),
    name:   'Custom (' + r.trim() + ')',
  };
}
