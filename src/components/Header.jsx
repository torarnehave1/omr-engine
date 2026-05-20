export default function Header() {
  return (
    <header className="hdr">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '.7rem',
        }}
      >
        <img
          src="https://favicons.vegvisr.org/favicons/sdxl-1779256409969-1779256438669-180x180.png"
          alt=""
          width="36"
          height="36"
          referrerPolicy="no-referrer"
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: '1px solid rgba(106,168,255,.2)',
            boxShadow: '0 2px 10px rgba(106,168,255,.18)',
            flexShrink: 0,
          }}
        />
        <h1>OMR Scanner</h1>
      </div>
      <p>Pixel analysis · manual correction · AI maqam education</p>
    </header>
  )
}
