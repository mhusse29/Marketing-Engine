import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";

type AnimationStyle = "stagger-fade" | "pop" | "slide-up" | "wave" | "tilt-rise";

interface LogoProps {
  className?: string;
  withText?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  triggerAnimation?: boolean;
  animationStyle?: AnimationStyle;
  hoverAnimation?: boolean;
  layout?: "vertical" | "horizontal";
  iconSize?: number;
  fontSize?: number;
  onClick?: () => void;
}

export const SinaiqLogo = ({ 
  className, 
  withText = true, 
  size = "md", 
  animate = true, 
  triggerAnimation,
  animationStyle = "stagger-fade",
  hoverAnimation = false,
  layout = "vertical",
  iconSize,
  fontSize,
  onClick
}: LogoProps) => {
  const sizes: Record<"sm" | "md" | "lg", { width: number; height: number; iconWidth: number; fontSize: number }> = {
    sm: { width: 82, height: 42, iconWidth: 24, fontSize: 14 },
    md: { width: 130, height: 66, iconWidth: 36, fontSize: 20 },
    lg: { width: 205, height: 105, iconWidth: 52, fontSize: 32 },
  };

  const s = sizes[size] || sizes.md;
  const finalIconSize = iconSize ?? s.iconWidth;
  const finalFontSize = fontSize ?? s.fontSize;
  
  const [animationKey, setAnimationKey] = useState(0);
  const [isVisible, setIsVisible] = useState(!animate);
  const [isHovered, setIsHovered] = useState(false);

  // Re-trigger animation when triggerAnimation changes to true
  useEffect(() => {
    if (triggerAnimation && animate) {
      setIsVisible(false);
      setAnimationKey(prev => prev + 1);
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [triggerAnimation, animate]);

  // Trigger animation on hover
  useEffect(() => {
    if (isHovered && hoverAnimation) {
      setIsVisible(false);
      setAnimationKey(prev => prev + 1);
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isHovered, hoverAnimation]);

  // Initial animation on mount
  useEffect(() => {
    if (animate && !triggerAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Get animation keyframes and config based on style
  const getAnimationConfig = () => {
    switch (animationStyle) {
      case "tilt-rise":
        return {
          keyframes: `
            @keyframes tiltRise {
              0% { opacity: 0; transform: translateY(20px) rotate(-5deg) scale(0.9); }
              100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
            }
          `,
          name: "tiltRise",
          duration: "0.6s",
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        };
      case "pop":
        return {
          keyframes: `
            @keyframes pop {
              0% { opacity: 0; transform: scale(0.5); }
              70% { transform: scale(1.1); }
              100% { opacity: 1; transform: scale(1); }
            }
          `,
          name: "pop",
          duration: "0.5s",
          easing: "ease-out",
        };
      case "slide-up":
        return {
          keyframes: `
            @keyframes slideUp {
              0% { opacity: 0; transform: translateY(30px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `,
          name: "slideUp",
          duration: "0.5s",
          easing: "ease-out",
        };
      case "wave":
        return {
          keyframes: `
            @keyframes wave {
              0% { opacity: 0; transform: translateY(15px) rotate(3deg); }
              50% { transform: translateY(-5px) rotate(-1deg); }
              100% { opacity: 1; transform: translateY(0) rotate(0deg); }
            }
          `,
          name: "wave",
          duration: "0.7s",
          easing: "ease-in-out",
        };
      case "stagger-fade":
      default:
        return {
          keyframes: `
            @keyframes staggerFade {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
            }
          `,
          name: "staggerFade",
          duration: "0.4s",
          easing: "ease-out",
        };
    }
  };

  const animConfig = getAnimationConfig();

  // Path data with colors for animation
  const paths = [
    { d: "M44.8801 209.197L87.3801 122.197L61.3801 107.697L0.880127 209.197H44.8801Z", fill: "white" },
    { d: "M86.8801 121.197L114.38 61.197L155.38 99.697L114.38 138.697L86.8801 121.197Z", fill: "white" },
    { d: "M113.38 139.197L87.3801 123.197L50.8801 197.197L113.38 139.197Z", fill: "#E7E7E4" },
    { d: "M165.88 170.697L114.38 139.197L47.8801 201.197L42.3801 209.197H96.8801L165.88 170.697Z", fill: "#D0D1CE" },
    { d: "M155.093 99.697L199.38 140.268L190.626 157.004L165.907 170.697L113.38 139.254L155.093 99.697Z", fill: "#E3E4DF" },
    { d: "M180.38 178.697L166.38 208.197L99.8801 208.697L167.38 170.697L180.38 178.697Z", fill: "#BABCB7" },
    { d: "M167.88 170.697L190.38 158.197L180.88 178.697L167.88 170.697Z", fill: "#CDCFCB" },
    { d: "M167.37 208.197L180.88 179.197L227.88 207.697L167.37 208.197Z", fill: "#ABABA7" },
    { d: "M220.38 98.697L199.38 140.697L155.88 98.697L188.38 68.697L220.38 98.697Z", fill: "white" },
    { d: "M199.38 140.697L207.38 148.197L191.88 156.697L199.38 140.697Z", fill: "#D1D1CD" },
    { d: "M207.38 148.197L271.38 207.697H229.88L181.38 178.697L191.38 157.697L207.38 148.197Z", fill: "#BEC0BB" },
    { d: "M207.461 148.197L199.38 140.378L220.087 99.197L249.38 124.218L207.461 148.197Z", fill: "#E4E5E2" },
    { d: "M263.38 1.19696L304.38 93.197L249.88 125.197L217.88 97.197L263.38 1.19696Z", fill: "white" },
    { d: "M308.38 180.697L298.38 207.697H271.38L207.88 148.697L248.88 125.697L308.38 180.697Z", fill: "#CFD0CB" },
    { d: "M308.38 180.697L249.38 125.697L303.88 93.697L323.88 140.197L308.38 180.697Z", fill: "#E4E5E1" },
    { d: "M308.88 181.697L336.38 207.197H298.88L308.88 181.697Z", fill: "#BCBEBA" },
    { d: "M323.38 138.697L348.38 70.197L304.88 94.197L323.38 138.697Z", fill: "white" },
    { d: "M349.38 69.197L323.38 140.697L352.88 206.697H409.88L349.38 69.197Z", fill: "#DFE1DC" },
    { d: "M308.38 180.197L323.38 140.197L352.88 207.197H336.88L308.38 180.197Z", fill: "#CDCDCB" },
  ];

  const isHorizontal = layout === "horizontal";

  return (
    <div 
      className={cn(
        "flex items-center justify-center select-none cursor-pointer",
        isHorizontal ? "flex-row gap-2" : "flex-col -mt-4",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <svg
        width={isHorizontal ? finalIconSize : s.width}
        height={isHorizontal ? finalIconSize * 0.51 : s.height}
        viewBox="0 0 411 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SINAIQ Logo"
      >
        <style>
          {animConfig.keyframes}
        </style>
        {paths.map((path, index) => (
          <path
            key={`${animationKey}-${index}`}
            d={path.d}
            fill={path.fill}
            stroke={path.fill}
            strokeWidth="2"
            strokeLinejoin="round"
            style={{
              opacity: isVisible ? 1 : 0,
              animation: isVisible 
                ? `${animConfig.name} ${animConfig.duration} ${animConfig.easing} ${index * 0.04}s forwards` 
                : 'none',
              transformOrigin: 'center',
            }}
          />
        ))}
      </svg>
      
      {/* SINAIQ text */}
      {withText && (
        <span 
          className={cn(
            "font-sans font-bold tracking-[0.15em] text-white",
            !isHorizontal && "mt-2"
          )}
          style={{ fontSize: isHorizontal ? finalFontSize : s.height * 0.4 }}
        >
          SINAIQ
        </span>
      )}
    </div>
  );
};

export default SinaiqLogo;
