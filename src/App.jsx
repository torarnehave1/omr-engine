import { useReducer, useContext } from 'react'
import { initialState, reducer } from './state/appReducer.js'
import AuthGate, { AuthContext } from './components/AuthGate.jsx'
import Header from './components/Header.jsx'
import UploadZone from './components/UploadZone.jsx'
import PdfCard from './components/PdfCard.jsx'
import CanvasPanel from './components/CanvasPanel.jsx'
import SequenceRow from './components/SequenceRow.jsx'
import SolPicker from './components/SolPicker.jsx'
import SaveToCloudButton from './components/SaveToCloudButton.jsx'
import CloudLibrary from './components/CloudLibrary.jsx'
import Toast from './components/Toast.jsx'

function AuthedApp() {
  const auth = useContext(AuthContext)
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <>
      <Header />

      {/* Compact signed-in bar (email + role + logout). Replaces the API-token paste field. */}
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '.6rem',
          fontSize: '.6rem',
          color: 'var(--muted)',
        }}
      >
        {auth?.devAutoLogin && (
          <span
            title="Dev auto-login from .env.local — production builds skip this path"
            style={{
              background: 'rgba(240,192,96,.12)',
              border: '1px solid rgba(240,192,96,.4)',
              color: 'var(--gold)',
              borderRadius: 5,
              padding: '.15rem .45rem',
              fontSize: '.52rem',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            dev
          </span>
        )}
        {auth?.user?.role && (
          <span
            style={{
              background: 'rgba(168,124,240,.12)',
              border: '1px solid rgba(168,124,240,.4)',
              color: 'var(--purple)',
              borderRadius: 5,
              padding: '.15rem .45rem',
              fontSize: '.52rem',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {auth.user.role}
          </span>
        )}
        <span>signed in as <strong style={{ color: 'var(--green)' }}>{auth?.user?.email}</strong></span>
        <button
          onClick={auth?.logout}
          style={{
            background: 'none',
            border: '1px solid var(--border2)',
            borderRadius: 6,
            color: 'var(--muted)',
            fontFamily: 'inherit',
            fontSize: '.58rem',
            padding: '.3rem .65rem',
            cursor: 'pointer',
          }}
        >
          log out
        </button>
      </div>

      {state.show.upload && <UploadZone dispatch={dispatch} />}

      {state.show.pdfCard && (
        <PdfCard
          pdfDoc={state.pdfDoc}
          pageNum={state.pdfPageNum}
          scale={state.pdfScale}
          pendingSession={state.pendingSession}
          dispatch={dispatch}
        />
      )}

      {state.show.canvas && (
        <>
          <div style={{ width: '100%', maxWidth: 800, display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <SaveToCloudButton state={state} dispatch={dispatch} />
          </div>
          <CanvasPanel
            rawCanvas={state.rawCanvas}
            omrData={state.omrData}
            selectedIdx={state.selectedIdx}
            dispatch={dispatch}
          />
          <SequenceRow
            omrData={state.omrData}
            selectedIdx={state.selectedIdx}
            dispatch={dispatch}
          />
        </>
      )}

      <SolPicker
        visible={state.picker.visible}
        idx={state.picker.idx}
        x={state.picker.x}
        y={state.picker.y}
        omrData={state.omrData}
        dispatch={dispatch}
      />

      {state.show.cloudLibrary && (
        <CloudLibrary
          onClose={() => dispatch({ type: 'CLOUD_LIBRARY_TOGGLE' })}
          dispatch={dispatch}
        />
      )}

      <Toast msg={state.toastMsg} />
    </>
  )
}

export default function App() {
  return (
    <AuthGate>
      <AuthedApp />
    </AuthGate>
  )
}
