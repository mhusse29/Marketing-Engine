"use client";

import { Command, RefreshCw, Code, Settings } from "lucide-react";

const TopUtilityBar = () => {
  const buttonStyles =
    "flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a1a] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <div className="fixed right-4 top-4 z-10">
      <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-[rgba(255,255,255,0.95)] p-1 backdrop-blur-lg">
        <button aria-label="Command Palette" className={buttonStyles}>
          <Command size={16} />
        </button>
        <button aria-label="Refresh" className={buttonStyles}>
          <RefreshCw size={16} />
        </button>
        <button aria-label="View Code" className={buttonStyles}>
          <Code size={16} />
        </button>
        <button aria-label="Settings" className={buttonStyles}>
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default TopUtilityBar;