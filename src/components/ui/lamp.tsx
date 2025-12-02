import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden w-full z-0 bg-black",
        className
      )}
      style={{
        background: `
          radial-gradient(ellipse 35% 30% at 50% 8%, rgba(0, 200, 80, 0.04) 0%, rgba(0, 60, 30, 0.015) 40%, transparent 70%),
          linear-gradient(180deg, #000000 0%, #000000 100%)
        `,
      }}
    >
      <div className="relative flex w-full flex-1 items-center justify-center isolate z-0" style={{ paddingTop: '60px' }}>
        {/* Lamp bar */}
        <motion.div
          initial={{ width: "40vw" }}
          whileInView={{ width: "80vw" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute z-60"
          style={{
            top: '0',
            left: '50%',
            transform: 'translate(-50%, 0)',
            height: '8px',
            maxWidth: '900px',
            background: '#32CD32',
            boxShadow: '0 0 15px rgba(50, 205, 50, 0.9), 0 0 30px rgba(50, 205, 50, 0.6), 0 0 50px rgba(50, 205, 50, 0.4), 0 0 80px rgba(50, 205, 50, 0.2), inset 0 0 12px rgba(50, 255, 50, 0.8)',
            borderRadius: '4px',
          }}
        />

        {/* Left beam */}
        <motion.div
          initial={{ opacity: 0.5, width: "40vw" }}
          whileInView={{ opacity: 1, width: "80vw" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(from 70deg at center top, rgb(34, 197, 94), transparent, transparent)`,
            top: '0',
            maxWidth: '900px',
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible"
        >
          <div className="absolute w-full left-0 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" style={{ background: '#000000' }} />
          <div className="absolute w-40 h-full left-0 bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" style={{ background: '#000000' }} />
        </motion.div>

        {/* Right beam */}
        <motion.div
          initial={{ opacity: 0.5, width: "40vw" }}
          whileInView={{ opacity: 1, width: "80vw" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, rgb(34, 197, 94))`,
            top: '0',
            maxWidth: '900px',
          }}
          className="absolute inset-auto left-1/2 h-56 overflow-visible"
        >
          <div className="absolute w-40 h-full right-0 bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" style={{ background: '#000000' }} />
          <div className="absolute w-full right-0 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" style={{ background: '#000000' }} />
        </motion.div>


        {/* Bottom blend to solid black */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-70 pointer-events-none"
          style={{
            height: '40vh',
            background: 'linear-gradient(to top, #000000 0%, #000000 20%, transparent 100%)'
          }}
        />

        {/* Text container */}
        <div className="absolute z-60 flex flex-col items-center px-5" style={{ top: '15vh' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
