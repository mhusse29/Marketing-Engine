import * as React from "react";
import { useState } from "react";
import { motion, type Transition, type TargetAndTransition } from "framer-motion";

const animationStates = [
  {
    bgColor: "#fc7359",
    indicatorColor: "#790b02",
    pathColor: "#fc7359",
    smileColor: "#790b02",
    titleColor: "#790b02",
    trackColor: "#fc5b3e",
    eyeWidth: 56,
    eyeHeight: 56,
    eyeBorderRadius: "100%",
    eyeBg: "#790b02",
    smileRotate: 180,
    indicatorRotate: 180,
    noteText: "BAD",
    noteColor: "#e33719",
    noteX: "0%",
    indicatorLeft: "0%",
  },
  {
    bgColor: "#dfa342",
    indicatorColor: "#482103",
    pathColor: "#dfa342",
    smileColor: "#482103",
    titleColor: "#482103",
    trackColor: "#b07615",
    eyeWidth: 100,
    eyeHeight: 20,
    eyeBorderRadius: "36px",
    eyeBg: "#482103",
    smileRotate: 180,
    indicatorRotate: 180,
    noteText: "NOT BAD",
    noteColor: "#b37716",
    noteX: "-100%",
    indicatorLeft: "50%",
  },
  {
    bgColor: "#9fbe59",
    indicatorColor: "#0b2b03",
    pathColor: "#9fbe59",
    smileColor: "#0b2b03",
    titleColor: "#0b2b03",
    trackColor: "#698b1b",
    eyeWidth: 120,
    eyeHeight: 120,
    eyeBorderRadius: "100%",
    eyeBg: "#0b2b03",
    smileRotate: 0,
    indicatorRotate: 0,
    noteText: "GOOD",
    noteColor: "#6e901d",
    noteX: "-200%",
    indicatorLeft: "100%",
  },
];

const HandDrawnSmileIcon = ({ animate, transition }: { animate?: TargetAndTransition; transition?: Transition }) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 100 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.path
      d="M10 30 Q50 70 90 30"
      strokeWidth="12"
      strokeLinecap="round"
      animate={animate}
      transition={transition}
    />
  </svg>
);

export interface FeedbackSliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (rating: number) => void;
  onDone?: () => void;
  title?: string;
}

const FeedbackSlider = React.forwardRef<HTMLDivElement, FeedbackSliderProps>(
  ({ className, onSubmit, onDone, title = "How was your generation experience?", ...props }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hasSelected, setHasSelected] = useState(false);
    const currentAnim = animationStates[selectedIndex];
    const transition = { type: "spring", stiffness: 300, damping: 30 } as const;

    const handleSelection = (index: number) => {
      setSelectedIndex(index);
      setHasSelected(true);
      if (onSubmit) {
        // Map index to rating: 0 = Bad (0), 1 = Not Bad (1), 2 = Good (2)
        onSubmit(index);
      }
    };

    const handleDone = () => {
      if (hasSelected && onDone) {
        onDone();
      }
    };

    // Filter out conflicting props that conflict with framer-motion
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...safeProps } = props;

    return (
      <motion.div
        ref={ref}
        className={`relative flex w-full items-center justify-center overflow-hidden ${className}`}
        animate={{ backgroundColor: currentAnim.bgColor }}
        transition={transition}
        {...safeProps}
      >
        <div className="flex h-full w-[400px] flex-col items-center justify-center p-4">
          <motion.h3
            className="mb-10 w-72 text-center text-xl font-semibold"
            animate={{ color: currentAnim.titleColor }}
            transition={transition}
          >
            {title}
          </motion.h3>
          <div className="flex h-[176px] flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-8">
              <motion.div
                animate={{
                  width: currentAnim.eyeWidth,
                  height: currentAnim.eyeHeight,
                  borderRadius: currentAnim.eyeBorderRadius,
                  backgroundColor: currentAnim.eyeBg,
                }}
                transition={transition}
              />
              <motion.div
                animate={{
                  width: currentAnim.eyeWidth,
                  height: currentAnim.eyeHeight,
                  borderRadius: currentAnim.eyeBorderRadius,
                  backgroundColor: currentAnim.eyeBg,
                }}
                transition={transition}
              />
            </div>
            <motion.div
              className="flex h-14 w-14 items-center justify-center"
              animate={{ rotate: currentAnim.smileRotate }}
              transition={transition}
            >
              <HandDrawnSmileIcon
                animate={{ stroke: currentAnim.smileColor }}
                transition={transition}
              />
            </motion.div>
          </div>
          <div className="flex w-full items-center justify-start overflow-hidden pb-14 pt-7">
            <motion.div
              className="flex w-full shrink-0"
              animate={{ x: currentAnim.noteX }}
              transition={transition}
            >
              {animationStates.map((state, i) => (
                <div
                  key={i}
                  className="flex w-full shrink-0 items-center justify-center"
                >
                  <h1
                    className="text-7xl font-black"
                    style={{ color: state.noteColor }}
                  >
                    {state.noteText}
                  </h1>
                </div>
              ))}
            </motion.div>
          </div>
          <div className="w-full">
            <div className="relative flex w-full items-center justify-between">
              {animationStates.map((_, i) => (
                <button
                  key={i}
                  className="z-[2] h-6 w-6 rounded-full transition-transform hover:scale-110"
                  onClick={() => handleSelection(i)}
                  style={{ backgroundColor: currentAnim.trackColor }}
                />
              ))}
              <motion.div
                className="absolute top-1/2 h-1 w-full -translate-y-1/2"
                animate={{ backgroundColor: currentAnim.trackColor }}
                transition={transition}
              />
              <motion.div
                className="absolute z-[3] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full p-2"
                animate={{
                  left: currentAnim.indicatorLeft,
                  rotate: currentAnim.indicatorRotate,
                  backgroundColor: currentAnim.indicatorColor,
                }}
                transition={transition}
              >
                <HandDrawnSmileIcon
                  animate={{ stroke: currentAnim.pathColor }}
                  transition={transition}
                />
              </motion.div>
            </div>
            <div className="flex w-full items-center justify-between pt-6">
              {["Bad", "Not Bad", "Good"].map((text, i) => (
                <motion.span
                  key={text}
                  className="w-full text-center font-medium"
                  animate={{
                    color: currentAnim.titleColor,
                    opacity: selectedIndex === i ? 1 : 0.6,
                  }}
                  transition={transition}
                >
                  {text}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Done Button - Below Slider */}
          {onDone && (
            <div className="flex justify-center mt-8">
              <motion.button
                onClick={handleDone}
                disabled={!hasSelected}
                className="px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                animate={{
                  backgroundColor: hasSelected ? currentAnim.indicatorColor : currentAnim.trackColor,
                  color: hasSelected ? currentAnim.bgColor : currentAnim.titleColor,
                }}
                transition={transition}
                whileHover={hasSelected ? { scale: 1.05, y: -2 } : {}}
                whileTap={hasSelected ? { scale: 0.98 } : {}}
              >
                {hasSelected ? 'Done ✓' : 'Select rating'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

FeedbackSlider.displayName = "FeedbackSlider";

export default FeedbackSlider;
