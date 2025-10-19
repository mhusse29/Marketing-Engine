interface MiniVideoPreviewProps {
  video?: {
    url: string;
    provider?: string;
    model?: string;
  };
}

export function MiniVideoPreview({ video }: MiniVideoPreviewProps) {
  const provider = video?.provider || 'RUNWAY';
  const model = video?.model || 'GEN4';

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/12 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_45px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 backdrop-blur-xl" />

      {video?.url ? (
        <>
          <video
            src={video.url}
            className="h-full w-full object-cover relative z-10 rounded-[24px]"
            muted
            loop
            playsInline
          />
          {/* Glass overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent z-20" />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 relative z-20">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">{provider}</span>
          <span className="text-[9px] text-white/45">{model}</span>
        </div>
      )}
      
      {/* Enhanced play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="w-5 h-5 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg">
          <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
        </div>
      </div>
      
      {/* Enhanced provider badge overlay */}
      <div className="absolute left-4 bottom-4 z-30 flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Preview</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-white/80">
          {provider} · {model}
        </span>
      </div>
    </div>
  );
}
