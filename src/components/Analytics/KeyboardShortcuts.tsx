/**
 * Keyboard Shortcuts System
 * Global shortcuts for analytics dashboard navigation
 */

import { useEffect, useState } from 'react';
import { Command, X } from 'lucide-react';

type TabType = 'executive' | 'operations' | 'users' | 'finance' | 'technical' | 'models' | 'feedback';

interface KeyboardShortcutsProps {
  onTabChange: (tab: TabType) => void;
}

export function KeyboardShortcuts({ onTabChange }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show/hide shortcuts overlay with ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      // Don't handle shortcuts if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Navigation shortcuts
      if (!e.metaKey && !e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case '1':
            e.preventDefault();
            onTabChange('executive');
            break;
          case '2':
            e.preventDefault();
            onTabChange('operations');
            break;
          case '3':
            e.preventDefault();
            onTabChange('technical');
            break;
          case '4':
            e.preventDefault();
            onTabChange('finance');
            break;
          case '5':
            e.preventDefault();
            onTabChange('users');
            break;
          case '6':
            e.preventDefault();
            onTabChange('models');
            break;
          case '7':
            e.preventDefault();
            onTabChange('feedback');
            break;
          case 'r':
            e.preventDefault();
            // Trigger refresh
            window.dispatchEvent(new CustomEvent('refreshAnalytics'));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="glass-button p-3 shadow-xl hover:scale-105 transition-transform"
          title="Keyboard shortcuts (Press ?)"
        >
          <Command className="w-5 h-5 text-white/70" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card-elevated max-w-2xl w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Command className="w-6 h-6 text-violet-400" />
            <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="glass-button p-2 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wide">Navigation</h3>
            <div className="space-y-2">
              <ShortcutItem shortcut="1" description="Executive Overview" />
              <ShortcutItem shortcut="2" description="Real-time Operations" />
              <ShortcutItem shortcut="3" description="Technical Performance" />
              <ShortcutItem shortcut="4" description="Financial Analytics" />
              <ShortcutItem shortcut="5" description="User Intelligence" />
              <ShortcutItem shortcut="6" description="Model Usage" />
              <ShortcutItem shortcut="7" description="Feedback Analytics" />
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wide">Actions</h3>
            <div className="space-y-2">
              <ShortcutItem shortcut="R" description="Refresh dashboard data" />
              <ShortcutItem shortcut="?" description="Show/hide shortcuts" />
              <ShortcutItem shortcut="ESC" description="Close modals" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Press <kbd className="px-2 py-1 bg-white/10 rounded text-white/70 font-mono">?</kbd> anytime to toggle this menu
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
      <span className="text-sm text-white/80">{description}</span>
      <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs font-mono text-white/90">
        {shortcut}
      </kbd>
    </div>
  );
}
