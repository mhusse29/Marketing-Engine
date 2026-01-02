import { ChevronDown, HelpCircle, LogOut, Loader2, Wand2, Settings, MessageCircle, X, Sparkles, FolderOpen } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { cn } from '../lib/format'
import { SinaiqLogo } from './ui/sinaiq-logo'
import { useAuth } from '../contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import GradientMenu from './ui/gradient-menu'
import type { SettingsState } from '../types';

type Tab = 'content' | 'pictures' | 'video';

export interface AppTopBarProps {
  active: Tab;
  onChange(tab: Tab): void;
  onNewCampaign(): void;
  onSave?(): void;
  onOpenSettings(): void;
  onHelp(): void;
  onSignOut(): void;
  onGenerate?(): void;
  enabled?: Partial<Record<Tab, boolean>>;
  copyLength?: string;
  contentValidated?: boolean;
  picturesValidated?: boolean;
  videoValidated?: boolean;
  isGenerating?: boolean;
  settings?: SettingsState;
  onSettingsChange?: (settings: SettingsState) => void;
  onOpenPanel?: (tab: Tab) => void;
  onClosePanel?: () => void;
  onSetHovering?: (hovering: boolean) => void;
  onOpenFeedbackSlider?: () => void;
  showPrimaryTabs?: boolean;
  height?: number;
  customNavContent?: ReactNode;
}

export function AppTopBar({
  onChange,
  onOpenSettings,
  onHelp,
  onSignOut,
  onGenerate,
  contentValidated = false,
  picturesValidated = false,
  videoValidated = false,
  isGenerating = false,
  onOpenPanel,
  onClosePanel,
  onSetHovering,
  onOpenFeedbackSlider,
  showPrimaryTabs = true,
  height,
  customNavContent,
}: AppTopBarProps) {
  const { user, profile } = useAuth()
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleSubmitFeedback = async () => {
    if (selectedRating === null || !user) return

    setIsSubmitting(true)

    try {
      const ratingLabels = ['GOOD', 'NOT BAD', 'BAD']
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          touchpointType: 'app_menu',
          rating: selectedRating === 0 ? 2 : selectedRating === 1 ? 1 : 0,
          ratingLabel: ratingLabels[selectedRating],
          comments: feedbackText || null,
          contextData: { location: 'topbar-dropdown-modal' },
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setShowFeedback(false)
          setSubmitted(false)
          setSelectedRating(null)
          setFeedbackText('')
        }, 2000)
      }
    } catch (error) {
      console.error('[Feedback] Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div
      className="w-full bg-transparent backdrop-blur-xl"
      style={{
        height: height !== undefined ? `${height}px` : 'var(--topbar-h, 64px)',
        boxShadow: `
          0 8px 32px -8px rgba(0, 0, 0, 0.2),
          0 4px 16px -4px rgba(0, 0, 0, 0.15),
          0 2px 8px rgba(255, 255, 255, 0.05)
        `,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: `
          linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.04) 0%,
            rgba(255, 255, 255, 0.02) 60%,
            rgba(255, 255, 255, 0.01) 90%,
            transparent 100%
          )
        `,
      }}
      role="banner"
    >
      {/* Additional blur overlay for enhanced blending */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: 0,
          right: 0,
          height: '20px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <SinaiqLogo 
              size="sm" 
              layout="horizontal"
              iconSize={42}
              fontSize={18}
              hoverAnimation={true}
              animationStyle="stagger-fade"
              withText={true}
              onClick={() => navigate('/')}
            />
        </div>

        <div className="flex items-center overflow-visible">
          {customNavContent ? (
            customNavContent
          ) : showPrimaryTabs ? (
            <GradientMenu 
              onItemClick={(item) => {
                onChange(item as Tab);
                onOpenPanel?.(item as Tab);
              }}
              onItemHover={(item) => {
                onOpenPanel?.(item as Tab)
                onSetHovering?.(true)
              }}
              onMouseLeave={() => onSetHovering?.(false)}
              validatedItems={[
                ...(contentValidated ? ['content'] : []),
                ...(picturesValidated ? ['pictures'] : []),
                ...(videoValidated ? ['video'] : [])
              ]}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Generate CTA Button */}
          {onGenerate && (
            <GenerateButton
              onGenerate={onGenerate}
              isGenerating={isGenerating}
              isEnabled={contentValidated || picturesValidated || videoValidated}
              onClosePanel={onClosePanel}
            />
          )}


          {/* User Badge - Expandable */}
          <UserBadgeDropdown
            profile={profile}
            user={user}
            getUserInitials={getUserInitials}
            onOpenSettings={onOpenSettings}
            onHelp={onHelp}
            onSignOut={onSignOut}
            setShowFeedback={setShowFeedback}
            navigate={navigate}
            onClosePanel={onClosePanel}
          />
        </div>
      </div>

      {/* Feedback Modal Popup */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 right-0 bottom-0 z-[100] bg-black/30 backdrop-blur-[1px] transition-opacity duration-200"
            style={{ top: 'var(--topbar-h, 64px)' }}
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-1/2 top-8 -translate-x-1/2 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-medium text-white/90">Share Feedback</h2>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {submitted ? (
                  <div className="py-8 text-center">
                    <div className="text-green-400 text-xl font-semibold mb-2">Thank you! 🎉</div>
                    <p className="text-sm text-white/60">Your feedback helps us improve</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-white/60 mb-4">
                      Help us improve by sharing your thoughts. Your feedback matters!
                    </p>
                    
                    {/* Rating Buttons */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white/80 mb-3">
                        How would you rate your experience?
                      </label>
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => setSelectedRating(0)}
                          className={cn(
                            "flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-colors",
                            selectedRating === 0
                              ? "border-emerald-500/50 bg-emerald-500/20"
                              : "border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                          )}
                        >
                          <span className="text-2xl">😊</span>
                          <span className="text-xs text-white/60">Good</span>
                        </button>
                        <button 
                          onClick={() => setSelectedRating(1)}
                          className={cn(
                            "flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-colors",
                            selectedRating === 1
                              ? "border-emerald-500/50 bg-emerald-500/20"
                              : "border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                          )}
                        >
                          <span className="text-2xl">😐</span>
                          <span className="text-xs text-white/60">Okay</span>
                        </button>
                        <button 
                          onClick={() => setSelectedRating(2)}
                          className={cn(
                            "flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-colors",
                            selectedRating === 2
                              ? "border-emerald-500/50 bg-emerald-500/20"
                              : "border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                          )}
                        >
                          <span className="text-2xl">☹️</span>
                          <span className="text-xs text-white/60">Bad</span>
                        </button>
                      </div>
                    </div>

                    {/* Feedback Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Tell us more (optional)
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={4}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                      />
                    </div>

                    {/* Quick Feedback Slider CTA */}
                    {onOpenFeedbackSlider && (
                      <div className="mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-900 px-2 text-white/40">or</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowFeedback(false);
                            onOpenFeedbackSlider();
                          }}
                          className="mt-4 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50"
                        >
                          ✨ Try Interactive Feedback Slider
                        </button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button 
                      onClick={handleSubmitFeedback}
                      disabled={selectedRating === null || isSubmitting}
                      className="w-full rounded-lg bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] px-4 py-2.5 font-medium text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)] transition-transform hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Smooth liquid spring config
const liquidSpring = {
  type: "spring" as const,
  stiffness: 150,
  damping: 20,
  mass: 1,
};

// Generate Button with liquid animation
function GenerateButton({ 
  onGenerate, 
  isGenerating, 
  isEnabled,
  onClosePanel
}: { 
  onGenerate: () => void; 
  isGenerating: boolean; 
  isEnabled: boolean;
  onClosePanel?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    onClosePanel?.();
    onGenerate();
  };
  
  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        disabled={!isEnabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative h-[56px] rounded-full flex items-center justify-center',
          'backdrop-blur-xl border cursor-pointer overflow-hidden',
          isEnabled && !isGenerating
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500/30'
            : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed',
          isGenerating && 'opacity-75 cursor-wait'
        )}
        animate={{
          width: isHovered && isEnabled ? 160 : 56,
        }}
        transition={liquidSpring}
      >
        {/* Icon - initially visible */}
        <motion.span 
          className="relative z-10 text-2xl"
          animate={{
            scale: isHovered && isEnabled ? 0 : 1,
            opacity: isHovered && isEnabled ? 0 : 1,
          }}
          transition={{
            type: "spring" as const,
            stiffness: 300,
            damping: 25,
          }}
        >
          {isGenerating ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Wand2 className="h-6 w-6" />
          )}
        </motion.span>
        
        {/* Title - shown when hover */}
        <motion.span 
          className="absolute text-white uppercase tracking-wide text-xs font-medium"
          animate={{
            scale: isHovered && isEnabled ? 1 : 0.75,
            opacity: isHovered && isEnabled ? 1 : 0,
          }}
          transition={{
            type: "spring" as const,
            stiffness: 200,
            damping: 20,
            delay: isHovered ? 0.05 : 0,
          }}
        >
          {isGenerating ? 'GENERATING...' : 'GENERATE'}
        </motion.span>
      </motion.button>
    </div>
  );
}

// User Badge Dropdown with liquid animation
function UserBadgeDropdown({ 
  profile, 
  user, 
  getUserInitials,
  onOpenSettings,
  onHelp,
  onSignOut,
  setShowFeedback,
  navigate,
  onClosePanel
}: { 
  profile: any;
  user: any;
  getUserInitials: () => string;
  onOpenSettings: () => void;
  onHelp: () => void;
  onSignOut: () => void;
  setShowFeedback: (show: boolean) => void;
  navigate: (path: string) => void;
  onClosePanel?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Keep expanded when open or hovered
  const isExpanded = isHovered || isOpen;
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      onClosePanel?.();
    }
  };
  
  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <motion.button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'relative flex items-center gap-2 rounded-full border py-1.5 overflow-hidden',
            'cursor-pointer focus-visible:outline-none',
            isOpen 
              ? 'bg-white/[0.08] border-white/25' 
              : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
          )}
          animate={{
            paddingLeft: isExpanded ? 16 : 8,
            paddingRight: isExpanded ? 16 : 8,
          }}
          transition={liquidSpring}
          aria-label="Account & Settings"
        >
          {/* Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="h-7 w-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-xs font-semibold flex-shrink-0">
              {getUserInitials()}
            </div>
          )}
          
          {/* Full name - appears on hover/open */}
          <motion.span 
            className="text-sm font-medium text-white whitespace-nowrap overflow-hidden"
            animate={{
              width: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0,
              marginLeft: isExpanded ? 8 : 0,
            }}
            transition={{
              type: "spring" as const,
              stiffness: 200,
              damping: 25,
            }}
          >
            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
          </motion.span>
          
          {/* Chevron with rotation */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
            className="flex-shrink-0"
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-colors",
              isOpen ? "text-white" : "text-white/60"
            )} />
          </motion.div>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-72 rounded-2xl border border-white/15 shadow-[0_12px_48px_rgba(0,0,0,0.6)] text-[0.92rem] text-white p-0 relative"
        style={{
          backgroundColor: 'rgba(18, 18, 22, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Visual connector arrow */}
        <div 
          className="absolute -top-[6px] right-6 w-3 h-3 rotate-45 border-l border-t border-white/15"
          style={{ backgroundColor: 'rgba(18, 18, 22, 0.98)' }}
        />
        {/* User Info Section */}
        <div className="px-3 py-2.5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-semibold">
                {getUserInitials()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-white/60 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-2 relative z-10">
          <DropdownMenuItem onClick={() => navigate('/')} className="gap-2 hover:bg-emerald-500/10 focus:bg-emerald-500/10 cursor-pointer rounded-lg px-3 py-2">
            <Sparkles className="h-4 w-4 text-white/75" /> Marketing Engine
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/media-plan-lite')} className="gap-2 hover:bg-emerald-500/10 focus:bg-emerald-500/10 cursor-pointer rounded-lg px-3 py-2">
            <FolderOpen className="h-4 w-4 text-white/75" /> Media Plan Lite
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10 my-2" />
          <DropdownMenuItem onClick={onOpenSettings} className="gap-2 hover:bg-emerald-500/10 focus:bg-emerald-500/10 cursor-pointer rounded-lg px-3 py-2">
            <Settings className="h-4 w-4 text-white/75" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowFeedback(true)} className="gap-2 hover:bg-emerald-500/10 focus:bg-emerald-500/10 cursor-pointer rounded-lg px-3 py-2">
            <MessageCircle className="h-4 w-4 text-white/75" /> Share Feedback
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onHelp} className="gap-2 hover:bg-emerald-500/10 focus:bg-emerald-500/10 cursor-pointer rounded-lg px-3 py-2">
            <HelpCircle className="h-4 w-4 text-white/75" /> Help
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10 my-2" />
          <DropdownMenuItem
            onClick={onSignOut}
            className="gap-2 text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 cursor-pointer rounded-lg px-3 py-2"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AppTopBar;
