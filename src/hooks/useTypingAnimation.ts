import { useState, useEffect, useRef } from 'react';

/**
 * Hook for smooth typing animation effect
 * Displays text with natural, comfortable typing rhythm
 * Optimized for readability and minimal eye strain
 */
export function useTypingAnimation(
  fullText: string,
  speed: number = 50, // milliseconds per character - slower for better visibility
  enabled: boolean = true
): { displayedText: string; isTyping: boolean } {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const previousTextRef = useRef<string>('');

  useEffect(() => {
    // If disabled, show full text immediately
    if (!enabled) {
      setDisplayedText(fullText);
      setIsTyping(false);
      return;
    }

    // If text hasn't changed, don't restart animation
    if (fullText === previousTextRef.current) {
      return;
    }

    previousTextRef.current = fullText;
    setDisplayedText('');
    setIsTyping(true);

    if (!fullText) {
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    const baseSpeed = speed;
    
    const typeNextChunk = () => {
      if (currentIndex >= fullText.length) {
        setIsTyping(false);
        return;
      }

      // Smart chunking for natural flow
      let chunkSize = 1;
      const currentChar = fullText[currentIndex];
      
      // Faster at spaces and punctuation for natural rhythm
      if (currentChar === ' ' || currentChar === '\n') {
        chunkSize = 1;
      } else if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
        chunkSize = 1; // Pause at sentence end
      } else if (currentChar === ',' || currentChar === ';') {
        chunkSize = 1;
      } else {
        // Type 2-3 characters at a time for smooth flow
        chunkSize = Math.min(2, fullText.length - currentIndex);
      }

      setDisplayedText(fullText.slice(0, currentIndex + chunkSize));
      currentIndex += chunkSize;

      // Variable delay for natural rhythm
      const delay = 
        currentChar === '.' || currentChar === '!' || currentChar === '?' ? baseSpeed * 3 : // Longer pause at sentences
        currentChar === ',' || currentChar === ';' ? baseSpeed * 2 : // Medium pause at commas
        currentChar === '\n' ? baseSpeed * 2 : // Medium pause at line breaks
        baseSpeed; // Normal speed

      setTimeout(typeNextChunk, delay);
    };

    // Start typing
    const startTimeout = setTimeout(typeNextChunk, 300); // Slightly longer initial delay for better visibility

    return () => {
      clearTimeout(startTimeout);
      setIsTyping(false);
    };
  }, [fullText, speed, enabled]);

  return { displayedText, isTyping };
}

