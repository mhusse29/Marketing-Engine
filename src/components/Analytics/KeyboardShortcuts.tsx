/**
 * Keyboard Shortcuts System
 * Global shortcuts for analytics dashboard navigation
 */

import { useEffect, useState } from 'react';
import { Command, X } from 'lucide-react';

type TabType = 'executive' | 'operations' | 'users' | 'finance' | 'technical' | 'models' | 'feedback' | 'slo';

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
          case '8':
            e.preventDefault();
            onTabChange('slo');
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
          className="terminal-button terminal-button--primary p-3 shadow-xl hover:scale-105 transition-transform"
          title="Keyboard shortcuts (Press ?)"
        >
          <Command className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 terminal-modal-overlay">
      <div className="terminal-modal max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="terminal-modal__header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Command className="w-6 h-6 text-[#33ff33]" />
            <h2 className="terminal-modal__title">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="terminal-button p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="terminal-modal__content">

          {/* Shortcuts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Navigation */}
            <div>
              <h3 className="terminal-panel__title mb-3">Navigation</h3>
            <div className="space-y-2">
              <ShortcutItem shortcut="1" description="Executive Overview" />
              <ShortcutItem shortcut="2" description="Real-time Operations" />
              <ShortcutItem shortcut="3" description="Technical Performance" />
              <ShortcutItem shortcut="4" description="Financial Analytics" />
              <ShortcutItem shortcut="5" description="User Intelligence" />
              <ShortcutItem shortcut="6" description="Model Usage" />
              <ShortcutItem shortcut="7" description="Feedback Analytics" />
              <ShortcutItem shortcut="8" description="SLO Dashboard" />
            </div>
          </div>

            {/* Actions */}
            <div>
              <h3 className="terminal-panel__title mb-3">Actions</h3>
            <div className="space-y-2">
              <ShortcutItem shortcut="R" description="Refresh dashboard data" />
              <ShortcutItem shortcut="?" description="Show/hide shortcuts" />
              <ShortcutItem shortcut="ESC" description="Close modals" />
            </div>
          </div>
        </div>

        </div>

        {/* Footer */}
        <div className="terminal-modal__footer">
          <p className="text-xs terminal-text-muted text-center">
            Press <kbd className="px-2 py-1 bg-[#33ff33]/10 border border-[#33ff33]/30 rounded terminal-text font-mono">?</kbd> anytime to toggle this menu
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-[#33ff33]/8 transition-colors">
      <span className="text-sm terminal-text">{description}</span>
      <kbd className="px-2 py-1 bg-[#33ff33]/10 border border-[#33ff33]/30 rounded text-xs font-mono text-[#33ff33]">
        {shortcut}
      </kbd>
    </div>
  );
}
