/**
 * Display streaming metadata from BADU enhanced chat
 */

import { motion } from 'framer-motion'
import { Sparkles, Database, Zap, TrendingUp } from 'lucide-react'

interface StreamingMetadataProps {
  metadata: {
    confidence: number
    retrieval_ms: number
    chunks: string[]
    model: string
    panel: string
    smartDefaults?: {
      provider: string
      confidence: number
    }
    templates?: Array<{
      name: string
      ctr: number
    }>
    conversationContext: {
      messageCount: number
      mostUsedPanel: string
    }
  }
  className?: string
}

export function StreamingMetadata({ metadata, className = '' }: StreamingMetadataProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-3 backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-semibold">{metadata.confidence}%</span>
          <span className="text-blue-300/60">confident</span>
        </div>

        {/* Smart Default Suggestion */}
        {metadata.smartDefaults && (
          <div className="flex items-center gap-1.5 text-emerald-200">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-white/60">Suggested:</span>
            <span className="font-medium text-emerald-300">{metadata.smartDefaults.provider}</span>
            <span className="text-emerald-400/60">({metadata.smartDefaults.confidence}%)</span>
          </div>
        )}

        {/* Template Hint */}
        {metadata.templates && metadata.templates.length > 0 && (
          <div className="flex items-center gap-1.5 text-amber-200">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-white/60">Try:</span>
            <span className="font-medium">{metadata.templates[0].name}</span>
            <span className="text-amber-400/60">({metadata.templates[0].ctr}% CTR)</span>
          </div>
        )}
      </div>

      {/* Retrieval Info */}
      <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>{metadata.chunks.length} docs</span>
        </div>
        <span>•</span>
        <span>{metadata.retrieval_ms}ms</span>
        <span>•</span>
        <span className="font-mono text-[10px]">{metadata.model}</span>
      </div>
    </motion.div>
  )
}
