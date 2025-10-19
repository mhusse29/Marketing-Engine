import { useEffect, useRef, useMemo } from 'react';
import { useTypingAnimation } from '../hooks/useTypingAnimation';

interface AnimatedMessageProps {
  content: string;
  messageId: string;
  renderFormattedText: (text: string) => React.ReactNode;
  onTypingUpdate?: () => void; // Callback for smooth scrolling during typing
}

/**
 * Animated message component with smooth typing effect
 * Shows a subtle blinking cursor while typing
 * Comfortable for eyes with gentle animation
 */
export function AnimatedMessage({ content, renderFormattedText, onTypingUpdate }: AnimatedMessageProps) {
  const { displayedText, isTyping } = useTypingAnimation(content, 30, true); // Faster speed for testing
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger scroll update during typing for smooth following
  useEffect(() => {
    if (isTyping && onTypingUpdate) {
      onTypingUpdate();
    }
  }, [displayedText, isTyping, onTypingUpdate]);

  // Memoize the rendered content to avoid unnecessary re-renders
  const renderedContent = useMemo(() => {
    try {
      return renderFormattedText(displayedText);
    } catch (error) {
      // Fallback to plain text if formatting fails on partial text
      console.warn('Formatting error during typing:', error);
      return displayedText;
    }
  }, [displayedText, renderFormattedText]);

  return (
    <div 
      ref={containerRef}
      className="text-[13px] leading-relaxed w-full"
      style={{ 
        color: 'rgba(231,236,243,0.90)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}
    >
      {renderedContent}
      {isTyping && (
        <span 
          className="inline-block ml-0.5"
          style={{ 
            width: '2px',
            height: '14px',
            backgroundColor: 'rgba(62,139,255,0.6)',
            verticalAlign: 'text-bottom',
            animation: 'badu-cursor 1s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

