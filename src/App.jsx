import { useReducer } from 'react'
import { initialState, reducer } from './state/appReducer.js'
import Header from './components/Header.jsx'
import ApiTokenInput from './components/ApiTokenInput.jsx'
import UploadZone from './components/UploadZone.jsx'
import PdfCard from './components/PdfCard.jsx'
import CanvasPanel from './components/CanvasPanel.jsx'
import SequenceRow from './components/SequenceRow.jsx'
import SolPicker from './components/SolPicker.jsx'
import SaveToCloudButton from './components/SaveToCloudButton.jsx'
import CloudLibrary from './components/CloudLibrary.jsx'
import Toast from './components/Toast.jsx'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <>
      <Header />
      <ApiTokenInput />

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
