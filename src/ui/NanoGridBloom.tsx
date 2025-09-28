import { motion } from "framer-motion";

/** Soft “nano grid bloom” overlay. Keep it clipped by a rounded parent. */
export default function NanoGridBloom({ busy }: { busy: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={false}
      animate={busy ? { opacity: 1 } : { opacity: 0 }}
      style={{ mixBlendMode: "screen", willChange: "opacity, background-position" }}
    >
      {/* Soft dot lattice */}
      <motion.div
        className="absolute inset-0"
        animate={busy ? { backgroundPosition: ["0% 0%", "160% 0%"] } : {}}
        transition={{ repeat: busy ? Infinity : 0, duration: 3.2, ease: "linear" }}
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.12) 1.2px, rgba(255,255,255,0) 1.2px)",
          backgroundSize: "18px 18px",
          opacity: 0.6,
          filter: "blur(.15px)",
          WebkitMaskImage:
            "radial-gradient(320px 140px at 50% -40px, #000 0, #000 60%, rgba(0,0,0,0) 95%)",
          maskImage:
            "radial-gradient(320px 140px at 50% -40px, #000 0, #000 60%, rgba(0,0,0,0) 95%)",
        }}
      />
      {/* Gentle vertical bloom (cool/cyan shift) */}
      <motion.div
        className="absolute inset-0"
        animate={busy ? { opacity: [0.12, 0.28, 0.12] } : { opacity: 0 }}
        transition={{ repeat: busy ? Infinity : 0, duration: 1.9 }}
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0), rgba(0,179,255,.12), rgba(0,22,253,.08))",
        }}
      />
    </motion.div>
  );
}
