import { useState } from 'react'

export default function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? '')
      setOk(true)
      window.setTimeout(() => setOk(false), 1000)
    } catch (error) {
      console.warn('Copy failed', error)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white/80 transition hover:bg-white/15"
      type="button"
    >
      {ok ? 'Copied!' : label}
    </button>
  )
}
