import { cn } from "@/lib/utils";
import { useState } from "react";

export interface CpuArchitectureSvgProps {
  className?: string;
  width?: string;
  height?: string;
  text?: string;
  showCpuConnections?: boolean;
  lineMarkerSize?: number;
  animateText?: boolean;
  animateLines?: boolean;
  animateMarkers?: boolean;
  onActivate?: (isActive: boolean) => void;
}

const CpuArchitecture = ({
  className,
  width = "100%",
  height = "100%",
  text = "Marketing Engine",
  showCpuConnections = true,
  animateText = true,
  lineMarkerSize = 18,
  animateLines = true,
  animateMarkers = true,
  onActivate,
}: CpuArchitectureSvgProps) => {
  const [isActive, setIsActive] = useState(false);

  const handleActivate = () => {
    const newState = !isActive;
    setIsActive(newState);
    onActivate?.(newState);
  };

  return (
    <svg
      className={cn("text-muted", className)}
      width={width}
      height={height}
      viewBox="0 0 200 100"
    >
      {/* Paths */}
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="0.3"
        strokeDasharray="100 100"
        pathLength="100"
        markerStart="url(#cpu-circle-marker)"
      >
        {/* 1st - Blue line from Content chip */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 10 20 h 79.5 q 5 0 5 5 v 30"
        />
        {/* 2nd - Yellow line from Pictures chip */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 180 10 h -69.7 q -5 0 -5 5 v 30"
        />
        {/* 3rd - Pinkish line */}
        <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
        {/* 4th - White line from BADU AI chip */}
        <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
        {/* 5th - Green line */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20"
        />
        {/* 6th - Orange line from Video chip */}
        <path d="M 94.8 95 v -36" />
        {/* 7th - Cyan line */}
        <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" />
        {/* 8th - Rose line */}
        <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" />
        {/* Animation For Path Starting */}
        {animateLines && (
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        )}
      </g>

      {/* Animated lights - only show when active */}
      {isActive && (
        <>
          {/* 1. Blue Light */}
          <g mask="url(#cpu-mask-1)">
            <circle
              className="cpu-architecture cpu-line-1"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-blue-grad)"
            />
          </g>
          {/* 2. Yellow Light */}
          <g mask="url(#cpu-mask-2)">
            <circle
              className="cpu-architecture cpu-line-2"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-yellow-grad)"
            />
          </g>
          {/* 3. Pinkish Light */}
          <g mask="url(#cpu-mask-3)">
            <circle
              className="cpu-architecture cpu-line-3"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-pinkish-grad)"
            />
          </g>
          {/* 4. White Light */}
          <g mask="url(#cpu-mask-4)">
            <circle
              className="cpu-architecture cpu-line-4"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-white-grad)"
            />
          </g>
          {/* 5. Green Light */}
          <g mask="url(#cpu-mask-5)">
            <circle
              className="cpu-architecture cpu-line-5"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-green-grad)"
            />
          </g>
          {/* 6. Orange Light */}
          <g mask="url(#cpu-mask-6)">
            <circle
              className="cpu-architecture cpu-line-6"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-orange-grad)"
            />
          </g>
          {/* 7. Cyan Light */}
          <g mask="url(#cpu-mask-7)">
            <circle
              className="cpu-architecture cpu-line-7"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-cyan-grad)"
            />
          </g>
          {/* 8. Rose Light */}
          <g mask="url(#cpu-mask-8)">
            <circle
              className="cpu-architecture cpu-line-8"
              cx="0"
              cy="0"
              r="8"
              fill="url(#cpu-rose-grad)"
            />
          </g>
        </>
      )}

      {/* Content Chip - at line 1 start (Blue) */}
      <g>
        <rect x="2" y="14" width="16" height="12" rx="2" fill="#181818" filter="url(#cpu-light-shadow)" />
        <text x="10" y="22" fontSize="3.5" fill={isActive ? "url(#cpu-blue-text-gradient)" : "#666666"} fontWeight="600" textAnchor="middle">Content</text>
      </g>

      {/* Pictures Chip - at line 2 start (Yellow) */}
      <g>
        <rect x="172" y="4" width="16" height="12" rx="2" fill="#181818" filter="url(#cpu-light-shadow)" />
        <text x="180" y="12" fontSize="3.5" fill={isActive ? "url(#cpu-yellow-text-gradient)" : "#666666"} fontWeight="600" textAnchor="middle">Pictures</text>
      </g>

      {/* Video Chip - at line 6 start (Orange) */}
      <g>
        <rect x="86" y="88" width="16" height="10" rx="2" fill="#181818" filter="url(#cpu-light-shadow)" />
        <text x="94" y="95" fontSize="3.5" fill={isActive ? "url(#cpu-orange-text-gradient)" : "#666666"} fontWeight="600" textAnchor="middle">Video</text>
      </g>

      {/* BADU AI Chip - at line 4 start (White) */}
      <g>
        <rect x="160" y="74" width="18" height="12" rx="2" fill="#181818" filter="url(#cpu-light-shadow)" />
        <text x="169" y="82" fontSize="3.5" fill={isActive ? "url(#cpu-white-text-gradient)" : "#666666"} fontWeight="600" textAnchor="middle">BADU AI</text>
      </g>

      {/* CPU Box */}
      <g>
        {/* Cpu connections */}
        {showCpuConnections && (
          <g fill="url(#cpu-connection-gradient)">
            <rect x="93" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="104" y="37" width="2.5" height="5" rx="0.7" />
            <rect
              x="116.3"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(90 116.25 45.5)"
            />
            <rect
              x="122.8"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(90 116.25 45.5)"
            />
            <rect
              x="104"
              y="16"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(180 105.25 39.5)"
            />
            <rect
              x="114.5"
              y="16"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(180 105.25 39.5)"
            />
            <rect
              x="80"
              y="-13.6"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(270 115.25 19.5)"
            />
            <rect
              x="87"
              y="-13.6"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(270 115.25 19.5)"
            />
          </g>
        )}
        {/* Main CPU Rectangle - Clickable */}
        <rect
          x="85"
          y="40"
          width="30"
          height="20"
          rx="2"
          fill="#181818"
          filter="url(#cpu-light-shadow)"
          style={{ cursor: "pointer" }}
          onClick={handleActivate}
        />
        {/* CPU Text */}
        <text
          x="100"
          y="48"
          fontSize="4"
          fill={isActive && animateText ? "url(#cpu-text-gradient)" : "#666666"}
          fontWeight="600"
          letterSpacing="0.02em"
          textAnchor="middle"
          style={{ cursor: "pointer", pointerEvents: "none" }}
        >
          Marketing
        </text>
        <text
          x="100"
          y="54"
          fontSize="4"
          fill={isActive && animateText ? "url(#cpu-text-gradient)" : "#666666"}
          fontWeight="600"
          letterSpacing="0.02em"
          textAnchor="middle"
          style={{ cursor: "pointer", pointerEvents: "none" }}
        >
          Engine
        </text>
      </g>
      {/* Masks */}
      <defs>
        <mask id="cpu-mask-1">
          <path
            d="M 10 20 h 79.5 q 5 0 5 5 v 24"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-2">
          <path
            d="M 180 10 h -69.7 q -5 0 -5 5 v 24"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-3">
          <path
            d="M 130 20 v 21.8 q 0 5 -5 5 h -10"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-4">
          <path
            d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-5">
          <path
            d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-6">
          <path d="M 94.8 95 v -36" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-7">
          <path
            d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-8">
          <path
            d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        {/* Gradients */}
        <radialGradient id="cpu-blue-grad" fx="1">
          <stop offset="0%" stopColor="#00E8ED" />
          <stop offset="50%" stopColor="#08F" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-yellow-grad" fx="1">
          <stop offset="0%" stopColor="#FFD800" />
          <stop offset="50%" stopColor="#FFD800" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-pinkish-grad" fx="1">
          <stop offset="0%" stopColor="#830CD1" />
          <stop offset="50%" stopColor="#FF008B" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-white-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-green-grad" fx="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad" fx="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-cyan-grad" fx="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-rose-grad" fx="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter
          id="cpu-light-shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="1.5"
            dy="1.5"
            stdDeviation="1"
            floodColor="black"
            floodOpacity="0.1"
          />
        </filter>
        <marker
          id="cpu-circle-marker"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth={lineMarkerSize}
          markerHeight={lineMarkerSize}
        >
          <circle
            id="innerMarkerCircle"
            cx="5"
            cy="5"
            r="2"
            fill="black"
            stroke="#232323"
            strokeWidth="0.5"
          >
            {animateMarkers && (
              <animate attributeName="r" values="0; 3; 2" dur="0.5s" />
            )}
          </circle>
        </marker>
        {/* Cpu connection gradient */}
        <linearGradient
          id="cpu-connection-gradient"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#4F4F4F" />
          <stop offset="60%" stopColor="#121214" />
        </linearGradient>
        {/* CPU Text Gradient - shimmer */}
        <linearGradient id="cpu-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#666666">
            <animate
              attributeName="offset"
              values="-2; -1; 0"
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
          <stop offset="25%" stopColor="white">
            <animate
              attributeName="offset"
              values="-1; 0; 1"
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
          <stop offset="50%" stopColor="#666666">
            <animate
              attributeName="offset"
              values="0; 1; 2;"
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
        </linearGradient>
        {/* Blue shimmer text gradient for Content chip */}
        <linearGradient id="cpu-blue-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0066cc">
            <animate attributeName="offset" values="-2; -1; 0" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="25%" stopColor="#00E8ED">
            <animate attributeName="offset" values="-1; 0; 1" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="50%" stopColor="#0066cc">
            <animate attributeName="offset" values="0; 1; 2" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
        </linearGradient>
        {/* Yellow shimmer text gradient for Pictures chip */}
        <linearGradient id="cpu-yellow-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cc9900">
            <animate attributeName="offset" values="-2; -1; 0" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="25%" stopColor="#FFD800">
            <animate attributeName="offset" values="-1; 0; 1" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="50%" stopColor="#cc9900">
            <animate attributeName="offset" values="0; 1; 2" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
        </linearGradient>
        {/* Orange shimmer text gradient for Video chip */}
        <linearGradient id="cpu-orange-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cc5500">
            <animate attributeName="offset" values="-2; -1; 0" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="25%" stopColor="#f97316">
            <animate attributeName="offset" values="-1; 0; 1" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="50%" stopColor="#cc5500">
            <animate attributeName="offset" values="0; 1; 2" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
        </linearGradient>
        {/* White shimmer text gradient for BADU AI chip */}
        <linearGradient id="cpu-white-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#666666">
            <animate attributeName="offset" values="-2; -1; 0" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="25%" stopColor="white">
            <animate attributeName="offset" values="-1; 0; 1" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
          <stop offset="50%" stopColor="#666666">
            <animate attributeName="offset" values="0; 1; 2" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          </stop>
        </linearGradient>
      </defs>
    </svg>
  );
};

export { CpuArchitecture };
