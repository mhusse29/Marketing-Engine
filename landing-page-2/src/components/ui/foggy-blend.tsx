"use client"

import { useEffect, useRef } from "react"

export default function FoggyBlend() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = canvas.parentElement?.clientHeight || 400

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      // Extended white area at top for smoother blend
      gradient.addColorStop(0, "#ffffff")
      gradient.addColorStop(0.25, "#ffffff")
      gradient.addColorStop(0.35, "#f5f5f5")
      gradient.addColorStop(0.45, "#d0d0d0")
      gradient.addColorStop(0.55, "#808080")
      gradient.addColorStop(0.70, "#3a3a3a")
      gradient.addColorStop(0.85, "#000000")
      gradient.addColorStop(1, "#000000")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add foggy noise effect
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 20 - 10
        data[i] += noise
        data[i + 1] += noise
        data[i + 2] += noise
      }

      ctx.putImageData(imageData, 0, 0)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  return (
    <div className="w-full h-[25vh] md:h-[30vh] relative overflow-hidden -mt-1">
      {/* Absolute white overlay at very top to blend with white section above */}
      <div 
        className="absolute top-0 left-0 w-full h-16 bg-white z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, transparent 100%)",
        }}
      />
      <style>{`
        @keyframes smokeRiseTop {
          0% { transform: translateY(0) translateX(-2px); opacity: 0.8; }
          50% { transform: translateY(-15px) translateX(2px); opacity: 0.9; }
          100% { transform: translateY(-30px) translateX(-1px); opacity: 0.7; }
        }

        @keyframes smokeFallBottom {
          0% { transform: translateY(0) translateX(2px); opacity: 0.7; }
          50% { transform: translateY(15px) translateX(-2px); opacity: 0.9; }
          100% { transform: translateY(30px) translateX(1px); opacity: 0.8; }
        }

        @keyframes smokeWaveMiddle {
          0% { transform: scaleX(1); opacity: 0.6; }
          50% { transform: scaleX(1.05); opacity: 0.8; }
          100% { transform: scaleX(1); opacity: 0.6; }
        }
      `}</style>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: "normal",
        }}
      />

      {/* Top edge blend - eliminates harsh line */}
      <div
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* Top smoke - white rising */}
      <div
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{
          height: "20%",
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.3) 100%)",
          mixBlendMode: "screen",
          filter: "blur(50px)",
          animation: "smokeRiseTop 4s ease-in-out infinite",
        }}
      />

      {/* Middle fog wave */}
      <div
        className="absolute left-0 w-full pointer-events-none"
        style={{
          top: "15%",
          height: "50%",
          background:
            "linear-gradient(180deg, rgba(220,220,220,0.4) 0%, rgba(150,150,150,0.3) 25%, rgba(100,100,100,0.3) 50%, rgba(80,80,80,0.3) 75%, rgba(30,30,30,0.4) 100%)",
          mixBlendMode: "multiply",
          filter: "blur(80px)",
          animation: "smokeWaveMiddle 5s ease-in-out infinite",
        }}
      />

      {/* Bottom smoke - black falling */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: "15%",
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.95) 100%)",
          mixBlendMode: "multiply",
          filter: "blur(50px)",
          animation: "smokeFallBottom 4s ease-in-out infinite",
        }}
      />

      {/* Enhanced atmospheric overlay for depth */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 15%, rgba(128,128,128,0.08) 50%, rgba(0,0,0,0.1) 85%, rgba(0,0,0,0.25) 100%)",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  )
}
