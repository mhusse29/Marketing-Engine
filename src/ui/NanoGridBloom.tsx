import { motion } from "framer-motion";

/** Soft “nano grid bloom” overlay. Keep it clipped by a rounded parent. */
export default function NanoGridBloom({ busy }: { busy: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={false}
      animate={busy ? { opacity: 1 } : { opacity: 0 }}
      transition={{ 
        duration: busy ? 0.6 : 0.4, 
        ease: [0.25, 0.1, 0.25, 1] 
      }}
      style={{ mixBlendMode: "screen", willChange: "opacity, background-position" }}
    >
      {/* Soft dot lattice */}
      <motion.div
        className="absolute inset-0"
        animate={busy ? { backgroundPosition: ["0% 0%", "160% 0%"] } : {}}
        transition={{ 
          repeat: busy ? Infinity : 0, 
          duration: 4.5, 
          ease: "linear",
          repeatType: "loop"
        }}
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.14) 1.3px, rgba(255,255,255,0) 1.3px)",
          backgroundSize: "20px 20px",
          opacity: 0.65,
          filter: "blur(.2px)",
          WebkitMaskImage:
            "radial-gradient(340px 160px at 50% -40px, #000 0, #000 65%, rgba(0,0,0,0) 96%)",
          maskImage:
            "radial-gradient(340px 160px at 50% -40px, #000 0, #000 65%, rgba(0,0,0,0) 96%)",
        }}
      />
      {/* Gentle vertical bloom (cool/cyan shift) */}
      <motion.div
        className="absolute inset-0"
        animate={busy ? { opacity: [0.15, 0.32, 0.15] } : { opacity: 0 }}
        transition={{ 
          repeat: busy ? Infinity : 0, 
          duration: 2.4,
          ease: [0.45, 0, 0.55, 1],
          repeatType: "mirror"
        }}
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0), rgba(0,179,255,.15), rgba(0,100,253,.10))",
        }}
      />
      {/* Subtle shimmer effect */}
      <motion.div
        className="absolute inset-0"
        animate={busy ? { 
          background: [
            "radial-gradient(circle at 20% 50%, rgba(0,179,255,.08) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(165,0,243,.08) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(0,179,255,.08) 0%, transparent 50%)",
          ]
        } : { opacity: 0 }}
        transition={{ 
          repeat: busy ? Infinity : 0, 
          duration: 5.5,
          ease: "easeInOut",
          repeatType: "loop"
        }}
      />
    </motion.div>
  );
}
