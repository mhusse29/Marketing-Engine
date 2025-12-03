"use client";

import { useCallback, useRef, useEffect } from "react";

interface UseSoundOptions {
  volume?: number;
}

export function useSound(url: string, options: UseSoundOptions = {}) {
  const { volume = 0.5 } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(url);
      audioRef.current.volume = volume;
      audioRef.current.preload = "auto";
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [url, volume]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, stop };
}

export function useActivationSounds() {
  const activateSound = useSound("/sounds/activate.mp3", { volume: 0.4 });
  const deactivateSound = useSound("/sounds/deactivate.mp3", { volume: 0.3 });

  const playActivationSound = useCallback(() => {
    activateSound.play();
  }, [activateSound]);

  const playDeactivationSound = useCallback(() => {
    deactivateSound.play();
  }, [deactivateSound]);

  return { playActivationSound, playDeactivationSound };
}
