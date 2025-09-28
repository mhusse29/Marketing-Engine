import { ChevronDown, HelpCircle, LogOut, Plus, Save, Settings } from 'lucide-react'

import { cn } from '../lib/format'
import SinaiqLogo from './SinaiqLogo'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

type Tab = 'content' | 'pictures' | 'video';

export interface AppTopBarProps {
  active: Tab;
  onChange(tab: Tab): void;
  onNewCampaign(): void;
  onSave(): void;
  onOpenSettings(): void;
  onHelp(): void;
  onSignOut(): void;
  enabled?: Partial<Record<Tab, boolean>>;
  copyLength?: string;
}

export function AppTopBar({
  active,
  onChange,
  onNewCampaign,
  onSave,
  onOpenSettings,
  onHelp,
  onSignOut,
  enabled = {},
  copyLength,
}: AppTopBarProps) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'content', label: 'Content' },
    { key: 'pictures', label: 'Pictures' },
    { key: 'video', label: 'Video' },
  ];

  return (
    <div
      className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-sm"
      style={{
        background: 'linear-gradient(to bottom, rgba(16,22,30,0.82), rgba(10,14,20,0.82))',
        height: 'var(--topbar-h, 64px)',
      }}
      role="banner"
    >
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <SinaiqLogo size={21} className="hover:opacity-90 transition-opacity" />
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-4 md:flex">
          {tabs.map(({ key, label }) => {
            const isActive = active === key;
            const glow = enabled[key];
            const showLongCue = key === 'content' && copyLength === 'Detailed';
            const showGlow = glow || showLongCue;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={cn(
                  'relative rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm font-medium text-white/80 transition-all outline-none',
                  'hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-blue-500/35',
                  isActive &&
                    'border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.35)]',
                  !isActive && showLongCue &&
                    'border-white/20 bg-white/[0.08] shadow-[0_0_24px_rgba(80,160,255,0.25)] text-white/90'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
                {showLongCue && (
                  <span className="ml-2 rounded-full border border-white/20 bg-white/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90">
                    Long
                  </span>
                )}
                {showGlow && (
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-blue-400/0 [animation:tabPulse_2.6s_ease-in-out_infinite]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    'h-9 w-9 rounded-full text-[#ECF3FF]',
                    'bg-gradient-to-b from-[#0D1C2A] to-[#152A43]',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.45)]',
                    'hover:-translate-y-[1px] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_32px_rgba(10,112,255,0.25)]',
                    'active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/35'
                  )}
                  onClick={onNewCampaign}
                  aria-label="New campaign"
                >
                  <Plus className="h-[18px] w-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border border-white/10 bg-[#0C1320]/95 px-2 py-1 text-xs text-white"
              >
                New Campaign
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-white/80 transition-colors',
                  'hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35'
                )}
                aria-label="Account"
              >
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-b from-slate-300 to-slate-400 text-slate-800">
                  <span className="sr-only">Profile</span>
                  <div className="h-3 w-3 rounded-full bg-slate-800/80" />
                </div>
                <ChevronDown className="h-4 w-4 text-white/60 transition-colors group-hover:text-white/85" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 border border-white/10 bg-[#0C1320]/95 text-[0.92rem] text-white shadow-xl"
            >
              <DropdownMenuItem onClick={onSave} className="gap-2">
                <Save className="h-4 w-4 text-white/75" /> Save campaign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSettings} className="gap-2">
                <Settings className="h-4 w-4 text-white/75" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onHelp} className="gap-2">
                <HelpCircle className="h-4 w-4 text-white/75" /> Help
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={onSignOut}
                className="gap-2 text-red-200 transition-colors hover:text-red-100"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default AppTopBar;
