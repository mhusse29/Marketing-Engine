"use client";

import * as React from "react";
import { Pause } from "lucide-react";

interface SidebarToggleButtonProps {
  onClick?: () => void;
}

export default function SidebarToggleButton({ onClick }: SidebarToggleButtonProps) {
  return (
    <span className="fixed left-4 top-0 z-[21] mt-[35.5px] flex h-10 w-10 items-center justify-center rounded-xl bg-background">
      <button onClick={onClick} className="group h-full w-full">
        <div className="flex size-full cursor-pointer items-center justify-center text-foreground/50 transition-colors duration-200 ease-out group-hover:text-foreground">
          <Pause className="h-4 w-4" fill="currentColor" />
        </div>
        <span className="sr-only">Toggle Sidebar</span>
      </button>
    </span>
  );
}