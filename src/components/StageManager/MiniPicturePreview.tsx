interface MiniPicturePreviewProps {
  image?: {
    url: string;
    provider?: string;
  };
}

export function MiniPicturePreview({ image }: MiniPicturePreviewProps) {
  const provider = image?.provider || 'FLUX';

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/12 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_45px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 backdrop-blur-xl" />

      {image?.url ? (
        <>
          <img
            src={image.url}
            alt="Generated image preview"
            className="relative z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent z-20" />
        </>
      ) : (
        <div className="relative z-20 flex h-full items-center justify-center">
          <div className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            {provider}
          </div>
        </div>
      )}

      <div className="absolute left-4 bottom-4 z-30 flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Preview</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/90">
          {provider}
        </span>
      </div>
    </div>
  );
}
