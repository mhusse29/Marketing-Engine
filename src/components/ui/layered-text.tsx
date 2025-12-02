"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import type React from "react"

interface LayeredTextProps {
  lines?: Array<{ top: string; bottom: string }>
  colorMap?: Record<string, string>
  fontSize?: string | number
  fontSizeMd?: string
  lineHeight?: number
  lineHeightMd?: number
  baseOffset?: number
  letterSpacing?: number
  className?: string
}

export function LayeredText({
  lines = [
    { top: "\u00A0", bottom: "INFINITE" },
    { top: "INFINITE", bottom: "PROGRESS" },
    { top: "PROGRESS", bottom: "INNOVATION" },
    { top: "INNOVATION", bottom: "FUTURE" },
    { top: "FUTURE", bottom: "DREAMS" },
    { top: "DREAMS", bottom: "ACHIEVEMENT" },
    { top: "ACHIEVEMENT", bottom: "\u00A0" },
  ],
  colorMap = {},
  fontSize = "72px",
  fontSizeMd = "36px",
  lineHeight = 60,
  lineHeightMd = 35,
  baseOffset = 35,
  letterSpacing = -2,
  className = "",
}: LayeredTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | undefined>(undefined)

  const calculateTranslateX = (index: number) => {
    const offset = baseOffset
    // Scale mobile offset roughly proportional to desktop (20/35 ratio from original)
    const baseOffsetMd = baseOffset * (20/35)
    const centerIndex = Math.floor(lines.length / 2)
    return {
      desktop: (index - centerIndex) * offset,
      mobile: (index - centerIndex) * baseOffsetMd,
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const paragraphs = container.querySelectorAll("p")

    timelineRef.current = gsap.timeline({ paused: true })

    // Animate exactly one line height up
    const yOffsetDesktop = -(lineHeight || 60)
    const yOffsetMobile = -(lineHeightMd || 35)
    
    const isMobile = window.innerWidth < 768

    timelineRef.current.to(paragraphs, {
      y: isMobile ? yOffsetMobile : yOffsetDesktop,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.08,
    })

    const handleMouseEnter = () => {
      timelineRef.current?.play()
    }

    const handleMouseLeave = () => {
      timelineRef.current?.reverse()
    }

    container.addEventListener("mouseenter", handleMouseEnter)
    container.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter)
      container.removeEventListener("mouseleave", handleMouseLeave)
      timelineRef.current?.kill()
    }
  }, [lines, lineHeight, lineHeightMd])

  return (
    <div
      ref={containerRef}
      className={`mx-auto py-24 font-sans font-black uppercase text-black dark:text-white antialiased cursor-pointer ${className}`}
      style={{ 
        fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
        letterSpacing: `${letterSpacing}px`,
        "--md-font-size": fontSizeMd 
      } as React.CSSProperties}
    >
      <ul className="list-none p-0 m-0 flex flex-col items-center">
        {lines.map((line, index) => {
          const translateX = calculateTranslateX(index)
          return (
            <li
              key={index}
              className={`
                overflow-hidden relative
                ${
                  index % 2 === 0
                    ? "[transform:skew(60deg,-30deg)_scaleY(0.66667)]"
                    : "[transform:skew(0deg,-30deg)_scaleY(1.33333)]"
                }
              `}
              style={
                {
                  height: `${lineHeight}px`,
                  transform: `translateX(${translateX.desktop}px) skew(${index % 2 === 0 ? "60deg, -30deg" : "0deg, -30deg"}) scaleY(${index % 2 === 0 ? "0.66667" : "1.33333"})`,
                  "--md-height": `${lineHeightMd}px`,
                  "--md-translateX": `${translateX.mobile}px`,
                } as React.CSSProperties
              }
            >
              {/* Top line - slides out */}
              <p
                className="leading-[55px] md:leading-[30px] px-[15px] align-top whitespace-nowrap m-0"
                style={
                  {
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight - 5}px`,
                    fontSize: "inherit", // Critical fix for font size control
                    color: colorMap[line.top] || "inherit"
                  } as React.CSSProperties
                }
              >
                {line.top}
              </p>
              {/* Bottom line - slides in */}
              <p
                className="leading-[55px] md:leading-[30px] px-[15px] align-top whitespace-nowrap m-0"
                style={
                  {
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight - 5}px`,
                    fontSize: "inherit", // Critical fix for font size control
                    color: colorMap[line.bottom] || "inherit"
                  } as React.CSSProperties
                }
              >
                {line.bottom}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
