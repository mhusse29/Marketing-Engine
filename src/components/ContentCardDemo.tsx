import { useContentAI } from '../useContentAI'
import type { ContentVariantResult } from '../types'

const demoOptions = {
  persona: 'B2B DM',
  tones: ['Bold', 'Professional'],
  ctas: ['Get a demo', 'Learn more'],
  language: 'EN',
  platforms: ['LinkedIn', 'FBIG'],
  keywords: ['AI workspace', 'multi-channel'],
  avoid: ['cheap', 'free forever'],
  hashtags: ['B2BMarketing', 'AIforGrowth'],
  copyLength: 'Standard',
}

export default function ContentCardDemo() {
  const { status, result, run } = useContentAI()

  return (
    <div>
      <button onClick={() => run('Write copy for a B2B AI workspace launch…', demoOptions, 3)}>
        Ask AI
      </button>
      <div>Status: {status}</div>
      {result?.variants?.map((v: ContentVariantResult, i: number) => (
        <div key={i} style={{ margin: '12px 0', padding: 12, border: '1px solid #333', borderRadius: 12 }}>
          <div>{v.platform}</div>
          <strong>{v.headline}</strong>
          <p>{v.primary_text}</p>
          <small>
            CTA: {v.cta_label} • {v.hashtags?.map((h) => '#' + h.replace(/^#/, '')).join(' ')}
          </small>
        </div>
      ))}
    </div>
  )
}
