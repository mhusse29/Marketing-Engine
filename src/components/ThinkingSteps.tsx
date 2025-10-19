/**
 * Thinking Steps Component
 * Shows AI reasoning process with pulsing animation (like ChatGPT o1/o3)
 */

import { useState, useEffect } from 'react';
import { Brain, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/format';

interface ThinkingStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'complete';
  duration?: number;
}

interface ThinkingStepsProps {
  steps?: ThinkingStep[];
  isThinking?: boolean;
}

// Default thinking steps for when specific steps aren't provided
const DEFAULT_STEPS: ThinkingStep[] = [
  { id: '1', title: 'Analyzing your question', status: 'pending' },
  { id: '2', title: 'Searching knowledge base', status: 'pending' },
  { id: '3', title: 'Evaluating relevant information', status: 'pending' },
  { id: '4', title: 'Structuring response', status: 'pending' },
  { id: '5', title: 'Validating accuracy', status: 'pending' },
];

export function ThinkingSteps({ steps = DEFAULT_STEPS, isThinking = true }: ThinkingStepsProps) {
  const [currentSteps, setCurrentSteps] = useState(steps);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isThinking) return;

    // Simulate step progression
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= currentSteps.length - 1) {
          return prev; // Stay on last step
        }
        return prev + 1;
      });
    }, 1500); // Move to next step every 1.5 seconds

    return () => clearInterval(interval);
  }, [isThinking, currentSteps.length]);

  useEffect(() => {
    // Update step statuses based on active index
    setCurrentSteps((prevSteps) =>
      prevSteps.map((step, index) => ({
        ...step,
        status: index < activeIndex ? 'complete' : index === activeIndex ? 'active' : 'pending',
      }))
    );
  }, [activeIndex]);

  if (!isThinking && activeIndex === 0) return null;

  return (
    <div className="thinking-steps space-y-3 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Brain className="h-4 w-4 text-blue-400" />
          <div className="absolute inset-0 animate-ping">
            <Brain className="h-4 w-4 text-blue-400 opacity-30" />
          </div>
        </div>
        <span className="text-sm font-medium text-blue-400">
          {isThinking ? 'BADU is thinking...' : 'Thought process complete'}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-2 pl-1">
        {currentSteps.map((step, index) => (
          <ThinkingStepItem
            key={step.id}
            step={step}
            isActive={index === activeIndex}
            isLast={index === currentSteps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function ThinkingStepItem({
  step,
}: {
  step: ThinkingStep;
  isActive: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2.5 rounded-lg transition-all duration-500',
        step.status === 'active' && 'bg-blue-500/10 border border-blue-500/30',
        step.status === 'complete' && 'bg-emerald-500/5 border border-emerald-500/20',
        step.status === 'pending' && 'bg-white/3 border border-white/5 opacity-50'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {step.status === 'complete' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : step.status === 'active' ? (
          <div className="relative">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-white/20" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-[13px] font-medium transition-colors duration-300',
              step.status === 'active' && 'text-blue-400',
              step.status === 'complete' && 'text-emerald-400',
              step.status === 'pending' && 'text-white/50'
            )}
          >
            {step.title}
          </span>
          
          {/* Pulsing indicator for active step */}
          {step.status === 'active' && (
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse delay-75" />
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse delay-150" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export for use in loading states
export function SimpleThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-blue-400">
      <div className="relative">
        <Brain className="h-4 w-4" />
        <div className="absolute inset-0 animate-ping">
          <Brain className="h-4 w-4 opacity-30" />
        </div>
      </div>
      <span className="text-sm font-medium">BADU is thinking...</span>
      <div className="flex gap-1 ml-2">
        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse delay-75" />
        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse delay-150" />
      </div>
    </div>
  );
}


