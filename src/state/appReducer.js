// State shape and reducer for the React port.
// Based on the global vars in omr_engine.html (lines 383-393).

export const initialState = {
  // image / pdf
  imgEl: null,
  rawCanvas: null,
  pdfDoc: null,
  pdfPageNum: 1,
  pdfScale: 2.5,
  pdfFilename: null,   // for meta.pdfFilename when saving to cloud
  pdfArrayBuffer: null, // original PDF bytes (so Save to cloud uploads the actual PDF)

  // OMR results (filled in when session is applied or OMR pipeline runs)
  omrData: null, // { staves, mappedNotes, keySig, W, H }

  // session bridge (JSON loaded before image)
  pendingSession: null,
  savedSessionId: null, // last cloud-saved id (for re-saves)

  // visibility flags — which UI cards are mounted
  show: {
    upload: true,
    pdfCard: false,
    canvas: false,
    cloudLibrary: false,
  },

  // manual correction
  selectedIdx: -1,
  picker: { visible: false, idx: -1, x: 0, y: 0 },

  // ephemeral
  toastMsg: '',
  logMessages: [], // [{ time, msg, type }]
};

export function reducer(state, action) {
  switch (action.type) {
    case 'PDF_LOADED':
      return {
        ...state,
        pdfDoc: action.pdfDoc,
        pdfArrayBuffer: action.arrayBuffer || null,
        pdfPageNum: 1,
        pdfFilename: action.filename || state.pdfFilename,
        show: { ...state.show, pdfCard: true },
      };

    case 'CLOUD_LIBRARY_TOGGLE':
      return { ...state, show: { ...state.show, cloudLibrary: !state.show.cloudLibrary } };

    case 'SAVED_SESSION_ID':
      return { ...state, savedSessionId: action.id };

    case 'PDF_PAGE_CHANGED':
      return { ...state, pdfPageNum: action.pageNum };

    case 'PDF_SCALE_CHANGED':
      return { ...state, pdfScale: action.scale };

    case 'PDF_PAGE_CONFIRMED':
      return {
        ...state,
        imgEl: action.imgEl,
        rawCanvas: action.rawCanvas,
        // Preserve existing pdfArrayBuffer if action doesn't supply a new one
        // (cloud-load path sends arrayBuffer; local PDF flow already set it on PDF_LOADED).
        pdfArrayBuffer: action.arrayBuffer ?? state.pdfArrayBuffer,
        show: { ...state.show, pdfCard: false, upload: false, canvas: true },
      };

    case 'SESSION_PENDING':
      return { ...state, pendingSession: action.session };

    case 'SESSION_APPLIED':
      return {
        ...state,
        omrData: action.omrData,
        pendingSession: null,
        show: { ...state.show, upload: false, pdfCard: false, canvas: true },
      };

    case 'TOAST':
      return { ...state, toastMsg: action.msg };

    case 'LOG':
      return {
        ...state,
        logMessages: [...state.logMessages, { time: new Date(), msg: action.msg, type: action.level || '' }],
      };

    case 'PICKER_SHOWN':
      return {
        ...state,
        selectedIdx: action.idx,
        picker: { visible: true, idx: action.idx, x: action.x, y: action.y },
      };

    case 'PICKER_HIDDEN':
      return { ...state, picker: { visible: false, idx: -1, x: 0, y: 0 } };

    case 'NOTE_SOLFEGE_CHANGED': {
      if (!state.omrData) return state;
      const mappedNotes = state.omrData.mappedNotes.map((n, i) =>
        i === action.idx ? { ...n, manualSol: action.solfege } : n
      );
      return {
        ...state,
        omrData: { ...state.omrData, mappedNotes },
        picker: { visible: false, idx: -1, x: 0, y: 0 },
      };
    }

    case 'NOTE_REVERTED': {
      if (!state.omrData) return state;
      const mappedNotes = state.omrData.mappedNotes.map((n, i) =>
        i === action.idx ? { ...n, manualSol: null } : n
      );
      return {
        ...state,
        omrData: { ...state.omrData, mappedNotes },
        picker: { visible: false, idx: -1, x: 0, y: 0 },
      };
    }

    case 'NOTE_DELETED': {
      if (!state.omrData) return state;
      const mappedNotes = state.omrData.mappedNotes
        .filter((_, i) => i !== action.idx)
        .map((n, i) => ({ ...n, idx: i }));
      return {
        ...state,
        omrData: { ...state.omrData, mappedNotes },
        selectedIdx: -1,
        picker: { visible: false, idx: -1, x: 0, y: 0 },
      };
    }

    case 'NOTE_MOVED': {
      if (!state.omrData) return state;
      let mappedNotes = state.omrData.mappedNotes.map((n, i) =>
        i === action.idx
          ? { ...n, cx: action.cx, cy: action.cy, staffPos: action.staffPos, noteInfo: action.noteInfo, manualSol: null }
          : n
      );
      // Re-sort by stave then x, re-index
      mappedNotes = [...mappedNotes].sort((a, b) => {
        const aS = a.staveIdx || 0, bS = b.staveIdx || 0;
        if (aS !== bS) return aS - bS;
        return a.cx - b.cx;
      }).map((n, i) => ({ ...n, idx: i }));
      return { ...state, omrData: { ...state.omrData, mappedNotes } };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
