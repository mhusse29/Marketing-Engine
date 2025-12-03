"use client"

import { cn } from "@/lib/utils";

// --- SiriOrb Component with Apple Intelligence Theme ---
interface SiriOrbProps {
  size?: string
  className?: string
  colors?: {
    bg?: string
    c1?: string
    c2?: string
    c3?: string
    c4?: string
    c5?: string
  }
  animationDuration?: number
  onClick?: () => void
}

const SiriOrb: React.FC<SiriOrbProps> = ({
  size = "192px",
  className,
  colors,
  animationDuration = 20,
  onClick,
}) => {
  // Apple Intelligence gradient colors: Orange → Pink → Purple → Blue
  const defaultColors = {
    bg: "transparent",
    c1: "oklch(75% 0.18 45)",   // Warm Orange
    c2: "oklch(72% 0.22 350)",  // Hot Pink / Magenta
    c3: "oklch(65% 0.25 300)",  // Purple
    c4: "oklch(68% 0.20 260)",  // Indigo / Blue-Purple
    c5: "oklch(70% 0.18 230)",  // Blue
  }

  const finalColors = { ...defaultColors, ...colors }
  const sizeValue = parseInt(size.replace("px", ""), 10)

  const blurAmount = Math.max(sizeValue * 0.12, 12)
  const contrastAmount = Math.max(sizeValue * 0.004, 1.5)

  return (
    <div
      className={cn("siri-orb", className)}
      onClick={onClick}
      style={
        {
          width: size,
          height: size,
          "--bg": finalColors.bg,
          "--c1": finalColors.c1,
          "--c2": finalColors.c2,
          "--c3": finalColors.c3,
          "--c4": finalColors.c4 || finalColors.c1,
          "--c5": finalColors.c5 || finalColors.c2,
          "--animation-duration": `${animationDuration}s`,
          "--blur-amount": `${blurAmount}px`,
          "--contrast-amount": contrastAmount,
        } as React.CSSProperties
      }
    >
      <style jsx>{`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .siri-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          cursor: pointer;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.02) 40%,
            transparent 70%
          );
        }

        .siri-orb::before {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background:
            /* Orange glow - top right */
            conic-gradient(
              from calc(var(--angle) * 1.1) at 70% 25%,
              var(--c1) 0deg,
              transparent 70deg 290deg,
              var(--c1) 360deg
            ),
            /* Pink/Magenta sweep - right */
            conic-gradient(
              from calc(var(--angle) * -0.9) at 80% 55%,
              var(--c2) 0deg,
              transparent 65deg 295deg,
              var(--c2) 360deg
            ),
            /* Purple core - center-bottom */
            conic-gradient(
              from calc(var(--angle) * 1.5) at 50% 70%,
              var(--c3) 0deg,
              transparent 80deg 280deg,
              var(--c3) 360deg
            ),
            /* Indigo sweep - bottom-left */
            conic-gradient(
              from calc(var(--angle) * -1.3) at 25% 75%,
              var(--c4) 0deg,
              transparent 60deg 300deg,
              var(--c4) 360deg
            ),
            /* Blue accent - left */
            conic-gradient(
              from calc(var(--angle) * 0.7) at 20% 40%,
              var(--c5) 0deg,
              transparent 55deg 305deg,
              var(--c5) 360deg
            ),
            /* Soft radial blends for smooth transitions */
            radial-gradient(
              ellipse 100% 100% at 65% 35%,
              var(--c1) 0%,
              var(--c2) 25%,
              transparent 50%
            ),
            radial-gradient(
              ellipse 100% 100% at 35% 65%,
              var(--c4) 0%,
              var(--c5) 25%,
              transparent 50%
            ),
            radial-gradient(
              ellipse 80% 80% at 50% 50%,
              var(--c3) 0%,
              transparent 45%
            );
          filter: blur(var(--blur-amount)) contrast(var(--contrast-amount)) saturate(1.4);
          animation: rotate var(--animation-duration) linear infinite;
          transform: translateZ(0);
          will-change: transform;
        }

        .siri-orb::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: 
            radial-gradient(
              circle at 40% 40%,
              rgba(255, 255, 255, 0.15) 0%,
              rgba(255, 255, 255, 0.05) 25%,
              transparent 50%
            ),
            radial-gradient(
              circle at 60% 60%,
              rgba(255, 255, 255, 0.08) 0%,
              transparent 40%
            );
          mix-blend-mode: overlay;
        }

        @keyframes rotate {
          from {
            --angle: 0deg;
          }
          to {
            --angle: 360deg;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .siri-orb::before {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

export { SiriOrb }
export type { SiriOrbProps }
