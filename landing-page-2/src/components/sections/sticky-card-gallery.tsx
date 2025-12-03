"use client"

import { motion, useInView, useMotionValue, useScroll } from "framer-motion"
import { ReactLenis } from "lenis/react"
import { useEffect, useRef, useState, ReactNode } from "react"
import IntroSection from "./intro-section"

const images = [
  "/AI images/-O4xKbGiS7uaDvVYCe8Oiw.png",
  "/AI images/NVyGBKgrTX6gYXIEHAamHg.png",
  "/AI images/download.png",
  "/AI images/hFPxQlg2QxuuYe0indl1BQ.png",
  "/AI images/img-MoG4skbyEuOvazG3PfsNqtkT.png",
]

const StickyCard = ({ imgUrl, index }: { imgUrl: string; index: number }) => {
  const vertMargin = 10
  const container = useRef(null)
  const [maxScrollY, setMaxScrollY] = useState(Number.POSITIVE_INFINITY)

  const filter = useMotionValue(0)
  const scaleValue = useMotionValue(1)

  const { scrollY } = useScroll()

  const isInView = useInView(container, {
    margin: `0px 0px -${100 - vertMargin}% 0px`,
    once: true,
  })

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (currentScrollY) => {
      let animationValue = 1
      if (currentScrollY > maxScrollY) {
        animationValue = Math.max(0, 1 - (currentScrollY - maxScrollY) / 10000)
      }

      scaleValue.set(animationValue)
      filter.set((1 - animationValue) * 100)
    })

    return () => unsubscribe()
  }, [maxScrollY, scrollY, scaleValue, filter])

  useEffect(() => {
    if (isInView && maxScrollY === Number.POSITIVE_INFINITY) {
      setMaxScrollY(scrollY.get())
    }
  }, [isInView, scrollY, maxScrollY])

  return (
    <motion.div
      ref={container}
      className="rounded-4xl sticky h-[200px] w-full max-w-4xl overflow-hidden bg-neutral-200 shadow-lg"
      style={{
        scale: scaleValue,
        rotate: filter,
        height: `${100 - 2 * vertMargin}vh`,
        top: `${vertMargin}vh`,
      }}
    >
      <img
        src={imgUrl}
        alt={`Card ${index + 1}`}
        className="h-full w-full object-cover"
        sizes="90vw"
      />
    </motion.div>
  )
}

export default function StickyCardGallery({ children }: { children?: ReactNode }) {
  return (
    <ReactLenis root>
      {/* IntroSection - iPhone 17 Pro white block first */}
      <IntroSection />
      
      {/* Sticky Cards Section */}
      <section className="relative flex w-screen flex-col items-center gap-[10vh] px-4 pt-[50vh] bg-black">
        <div className="absolute left-1/2 top-24 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
          <span className="after:from-background after:to-foreground relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:content-['']">
            scroll down to see effect
          </span>
        </div>
        {images.map((img, idx) => (
          <StickyCard key={idx} imgUrl={img} index={idx} />
        ))}
        <div className="h-96" />
      </section>
      
      {/* Children (AIGallery) comes after */}
      {children}
    </ReactLenis>
  )
}

export { StickyCard }
