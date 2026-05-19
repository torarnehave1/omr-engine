import { useEffect, useState } from 'react'

export default function Toast({ msg }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!msg) { setVisible(false); return }
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2800)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <div className={'toast' + (visible ? ' visible' : '')}>{msg}</div>
  )
}
