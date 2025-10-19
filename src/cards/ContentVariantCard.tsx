import { motion } from "framer-motion";
import { Minus } from "lucide-react";
import PlatformIcon from "@/ui/PlatformIcon";
import CopyBtn from "@/ui/CopyBtn";
import { InteractiveCardWrapper } from "@/components/Outputs/InteractiveCardWrapper";
import "@/components/Outputs/InteractiveCard.css";

type Status = "queued" | "thinking" | "rendering" | "ready" | "error";

export type ContentVariant = {
  platform: string;
  headline?: string;
  caption?: string;
  hashtags?: string;
};

export default function ContentVariantCard({
  status,
  variant,
  onRegenerate,
  onSave,
  onMinimize
}: {
  status: Status;
  variant: ContentVariant | null;
  onRegenerate?: () => void;
  onSave?: () => void;
  onMinimize?: () => void;
}) {
  const busyStages: Status[] = ["queued", "thinking", "rendering"];
  const stageIndex = busyStages.indexOf(status);
  const loading = stageIndex >= 0;


  const cardContent = (
    <motion.article
      className="relative isolate overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_8px_32px_rgba(0,0,0,0.35)] transition-shadow duration-300"
      data-loading={loading ? "true" : "false"}
      aria-busy={loading}
      layout
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {/* CONTENT (no outer padding; inner blocks own spacing) */}
      <div className="relative z-10">
        {loading ? (
          <div className="px-4 pt-5 pb-5 space-y-4">
            {/* Loading animation will go here */}
          </div>
        ) : status === "error" ? (
          <div className="px-4 pt-5 pb-5 space-y-3">
            <div className="text-rose-200 text-xs font-semibold tracking-wide uppercase">Error</div>
            <p className="text-rose-100/80 text-sm leading-relaxed">
              We hit a snag generating this variant. Try again in a moment.
            </p>
            {onRegenerate ? (
              <button
                onClick={onRegenerate}
                className="h-9 px-4 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-rose-50 text-xs uppercase tracking-wide"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Minimize Button - Top Right */}
            {onMinimize && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                className="absolute top-4 right-4 z-20 flex h-6 w-6 items-center justify-center rounded-md bg-white/10 backdrop-blur-sm border border-white/5 transition-all hover:bg-white/20 hover:border-white/10 active:scale-95"
                title="Minimize to Stage Manager"
                aria-label="Minimize card"
              >
                <Minus className="h-3.5 w-3.5 text-white/70" />
              </button>
            )}

            <div className="px-4 pb-5 pt-4 space-y-4">
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <PlatformIcon name={variant?.platform ?? "Generic"} size={18} />
                  <span className="sr-only">{variant?.platform ?? "Platform"}</span>
                </span>
              </div>
              {variant?.headline ? (
                <div className="space-y-2">
                  <h3 className="text-white/95 text-base font-semibold leading-tight break-words">
                    {variant.headline}
                  </h3>
                  <CopyBtn text={variant.headline} label="Copy" />
                </div>
              ) : null}
              {variant?.caption ? (
                <div className="space-y-2">
                  <p className="text-white/75 text-sm leading-relaxed break-words">
                    {variant.caption}
                  </p>
                  <CopyBtn text={variant.caption} label="Copy" />
                </div>
              ) : null}
              {variant?.hashtags ? (
                <div className="space-y-2">
                  <p className="text-white/60 text-xs leading-relaxed break-words">
                    {variant.hashtags}
                  </p>
                  <CopyBtn text={variant.hashtags} label="Copy" />
                </div>
              ) : null}
              {!variant?.headline && !variant?.caption && !variant?.hashtags ? (
                <p className="text-white/60 text-sm italic">No content yet for this platform.</p>
              ) : null}
            </div>
            {(onSave || onRegenerate) && status === "ready" && !loading ? (
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                {onSave && (
                  <button
                    onClick={onSave}
                    className="h-8 px-3 rounded-lg bg-white/12 hover:bg-white/16 border border-white/14 text-white/75 text-[11px]"
                  >
                    Save
                  </button>
                )}
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="h-8 px-3 rounded-lg bg-white/12 hover:bg-white/16 border border-white/14 text-white/75 text-[11px]"
                  >
                    Regenerate
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </motion.article>
  );

  return (
    <InteractiveCardWrapper enableTilt={true} enableMobileTilt={false}>
      {cardContent}
    </InteractiveCardWrapper>
  );
}
