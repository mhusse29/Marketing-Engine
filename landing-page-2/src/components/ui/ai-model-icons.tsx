"use client";

import React from "react";

// Flux Pro (Black Forest Labs) - Green angular "A"/tree shape
export const FluxProIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L4 12h5l-1 10 12-14h-5l1-6z"
      fill="currentColor"
    />
  </svg>
);

// Stability AI (SD 3.5) - Simple purple dot/circle (their actual minimalist logo)
export const StabilityAIIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" fill="currentColor" />
  </svg>
);

// OpenAI (DALL-E 3) - Official OpenAI hexagonal flower logo
export const OpenAIIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
      fill="currentColor"
    />
  </svg>
);

// Ideogram - Stylized artistic "I" letterform with gradient look
export const IdeogramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="5" r="3" fill="currentColor" />
    <rect x="9" y="10" width="6" height="12" rx="2" fill="currentColor" />
  </svg>
);

// Nano Banana (Google Gemini 3 Pro Image) - Banana emoji shape in monochrome
export const NanoBananaIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" className={className}>
    <path
      d="M56.12 20.69c-2.28-1.14-5.36-1.03-8.68.22-5.58 2.1-12.03 7.06-17.31 13.52-5.28 6.46-9.24 13.73-10.34 19.65-.65 3.52-.36 6.57 1.14 8.44 1.5 1.87 4.12 2.64 7.68 2.04 4.76-.8 10.79-3.79 16.07-8.25 5.28-4.46 9.74-10.08 12.13-15.54 2.39-5.46 2.79-10.76 1.31-14.64-.74-1.94-1.92-3.54-3.5-4.44z"
      fill="currentColor"
    />
    <path
      d="M18.5 52c-1.5-3-1.8-6.5-.8-10.5 1.2-4.8 4-10 7.8-14.5"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Runway ML - Stylized lowercase "r" letterform (their actual typography-based logo)
export const RunwayIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M7 6v14"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M7 12c0-4 3-6 6-6s5 2 5 5"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Export all icons as a map for easy access
export const AIModelIcons = {
  "Flux Pro": FluxProIcon,
  "SD 3.5": StabilityAIIcon,
  "DALL-E 3": OpenAIIcon,
  "IDEOGRAM": IdeogramIcon,
  "Nano Banana": NanoBananaIcon,
  "RUNWAY Gen-4": RunwayIcon,
};
