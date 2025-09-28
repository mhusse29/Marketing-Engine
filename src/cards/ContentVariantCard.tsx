import React from "react";
import { motion } from "framer-motion";
import NanoGridBloom from "@/ui/NanoGridBloom";
import PerimeterProgressSegmented from "@/ui/PerimeterProgressSegmented";
import PlatformIcon from "@/ui/PlatformIcon";
import CopyBtn from "@/ui/CopyBtn";

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
  progress,
  onRegenerate,
  onSave
}: {
  status: Status;
  variant: ContentVariant | null;
  progress?: number;
  onRegenerate?: () => void;
  onSave?: () => void;
}) {
  const busyStages: Status[] = ["queued", "thinking", "rendering"];
  const stageIndex = busyStages.indexOf(status);
  const loading = stageIndex >= 0;
  const clampedProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : undefined

  const stageCopy: Record<Status, string> = {
    queued: "Queued up — lining up your request…",
    thinking: "Thinking through angles and tone…",
    rendering: "Rendering the final copy…",
    ready: "",
    error: "",
  };

  const renderStageChain = () => (
    <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.35em]">
      {busyStages.map((stage, idx) => {
        const isActive = stage === status;
        const isComplete = idx < stageIndex;
        const tone = isActive
          ? "text-[#00b3ff]"
          : isComplete
          ? "text-white/60"
          : "text-white/30";
        return (
          <React.Fragment key={stage}>
            <span className={`transition-colors ${tone}`}>{stage}</span>
            {idx < busyStages.length - 1 ? <span className="text-white/25">→</span> : null}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <motion.article
      className="relative isolate overflow-hidden rounded-[24px] bg-white/5 backdrop-blur-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(0,0,0,0.40)]"
      data-loading={loading ? "true" : "false"}
      aria-busy={loading}
      layout
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {/* CONTENT (no outer padding; inner blocks own spacing) */}
      <div className="relative z-10">
        {loading ? (
          <div className="px-4 pt-5 pb-5 space-y-4">
            {renderStageChain()}
            <p className="text-white/65 text-sm leading-relaxed">
              {stageCopy[status]}
            </p>
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
            {(onSave || onRegenerate) && status !== "error" && !loading ? (
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

      {/* Interior Nano Grid Bloom (breathes only while loading) */}
      <NanoGridBloom busy={loading} />

      {/* Segmented Dots perimeter outline (blue-first) */}
      <PerimeterProgressSegmented status={status} progress={clampedProgress} />
    </motion.article>
  );
}
