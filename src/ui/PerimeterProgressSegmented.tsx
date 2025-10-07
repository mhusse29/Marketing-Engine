import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

type Status = "queued" | "thinking" | "rendering" | "ready" | "error";

type Props = {
  status: Status;
  progress?: number;
  radius?: number;
  /** Duration for a full perimeter tour while busy (ms). */
  loopDurationMs?: number;
  /** Time to keep the outline visible after completing to 1.0. */
  holdOnReadyMs?: number;
};

const BUSY_SET = new Set<Status>(["queued", "thinking", "rendering"]);
const MIN_BEAD = 0.01;
const LOOP_TARGET = 0.999;
const EPS = 0.0005;

export default function PerimeterProgressSegmented({
  status,
  progress,
  radius = 24,
  loopDurationMs = 7000,
  holdOnReadyMs = 200,
}: Props) {
  const busy = BUSY_SET.has(status);
  const p = useMotionValue(0);
  const dash = useTransform(p, (value) => `${value} ${Math.max(0, 1 - value)}`);

  const loopRef = React.useRef<ReturnType<typeof animate> | null>(null);
  const isLooping = React.useRef(false);
  const statusRef = React.useRef(status);

  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const stopLoop = React.useCallback(() => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
    }
    isLooping.current = false;
  }, []);

  const startLoop = React.useCallback(() => {
    stopLoop();
    const duration = Math.max(1.2, loopDurationMs / 1000);

    const runOnce = () => {
      p.set(MIN_BEAD);
      loopRef.current = animate(p, LOOP_TARGET, {
        duration,
        ease: [0.45, 0, 0.55, 1], // Smoother easing
      });

      loopRef.current.finished
        ?.then(() => {
          if (!BUSY_SET.has(statusRef.current)) {
            isLooping.current = false;
            return;
          }
          // soft reset to preserve momentum
          animate(p, MIN_BEAD, { duration: 0.08, ease: [0.4, 0, 0.2, 1] }).finished
            ?.then(runOnce)
            .catch(runOnce);
        })
        .catch(() => {
          if (BUSY_SET.has(statusRef.current)) runOnce();
        });
    };

    isLooping.current = true;
    runOnce();
  }, [loopDurationMs, p, stopLoop]);

  React.useEffect(() => () => stopLoop(), [stopLoop]);

  // Handle busy sessions (start endless sweep on queued/thinking/rendering)
  React.useEffect(() => {
    if (busy) {
      startLoop();
    } else {
      stopLoop();
    }
  }, [busy, startLoop, stopLoop]);

  // If real progress arrives, gently sync forward without breaking the loop.
  React.useEffect(() => {
    if (!busy || typeof progress !== "number" || Number.isNaN(progress)) return;
    const clamped = Math.max(MIN_BEAD, Math.min(1, progress));
    const current = p.get();
    if (clamped <= current + EPS) return;

    stopLoop();
    const anim = animate(p, clamped, { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] });
    anim.finished
      ?.then(() => {
        if (BUSY_SET.has(status)) startLoop();
      })
      .catch(() => {});
  }, [busy, progress, p, startLoop, stopLoop, status]);

  // On ready/error, finish or drop and stop looping.
  React.useEffect(() => {
    if (status === "ready") {
      stopLoop();
      const readyAnim = animate(p, 1, { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }); // Slight overshoot for satisfaction
      const hold = setTimeout(() => {}, holdOnReadyMs);
      return () => {
        readyAnim.stop();
        clearTimeout(hold);
      };
    }
    if (status === "error") {
      stopLoop();
      const errAnim = animate(p, 0.25, { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] });
      return () => errAnim.stop();
    }
    return;
  }, [status, holdOnReadyMs, p, stopLoop]);

  const stroke = status === "error" ? "url(#grad-err)" : "url(#grad-neon)";

  return (
    <div className="absolute inset-0 p-[2px] pointer-events-none">
      <svg className="w-full h-full" fill="none" shapeRendering="geometricPrecision">
        <defs>
          <linearGradient id="grad-neon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0016FD" />
            <stop offset="35%" stopColor="#00B3FF" />
            <stop offset="78%" stopColor="#FD00FF" />
            <stop offset="100%" stopColor="#A500F3" />
          </linearGradient>
          <linearGradient id="grad-err" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f19797" />
            <stop offset="100%" stopColor="#ffb3b3" />
          </linearGradient>
          <clipPath id="clip-card">
            <rect x="0" y="0" width="100%" height="100%" rx={radius} />
          </clipPath>
        </defs>

        <g clipPath="url(#clip-card)">
          <rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            rx={radius}
            pathLength={1}
            stroke="rgba(255,255,255,.07)"
            strokeWidth={1.5}
            strokeDasharray="0.02 0.04"
            strokeLinecap="round"
          />

          <motion.rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            rx={radius}
            pathLength={1}
            stroke={stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{
              strokeDasharray: dash,
              filter:
                "drop-shadow(0 0 10px rgba(0,179,255,.6)) drop-shadow(0 0 16px rgba(0,100,253,.4)) drop-shadow(0 0 24px rgba(165,0,243,.25))",
            }}
          />
        </g>
      </svg>
    </div>
  );
}
