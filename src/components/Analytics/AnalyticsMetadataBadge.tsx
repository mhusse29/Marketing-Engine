/**
 * Analytics Metadata Badge
 * Shows freshness, data source, error states for analytics panels
 */

import { AlertCircle, CheckCircle, Clock, Database, Zap, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AnalyticsMetadata } from '../../lib/analyticsClient';

interface AnalyticsMetadataBadgeProps {
  metadata?: AnalyticsMetadata | null;
  error?: string | null;
  showDetails?: boolean;
}

export function AnalyticsMetadataBadge({ metadata, error, showDetails = false }: AnalyticsMetadataBadgeProps) {
  if (!metadata && !error) return null;

  // Error state
  if (error || metadata?.error) {
    return (
      <div className="terminal-badge terminal-badge--alert flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs font-medium">
          {error || metadata?.error || 'Error loading data'}
        </span>
        {((error || metadata?.error) ?? '').toLowerCase().includes('unauthorized') && (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="terminal-button terminal-button--primary flex items-center gap-1 px-2 py-1 text-xs"
          >
            <LogOut className="w-3 h-3" />
            Sign in again
          </button>
        )}
      </div>
    );
  }

  // Stale data warning
  if (metadata?.freshness === 'stale') {
    return (
      <div className="terminal-badge terminal-badge--warning flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span className="text-xs font-medium">
          Stale data
        </span>
        {showDetails && metadata.timestamp && (
          <span className="text-xs opacity-70">
            Last updated: {new Date(metadata.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  // Live/realtime data
  if (metadata?.source === 'realtime' || metadata?.freshness === 'live') {
    return (
      <div className="terminal-badge terminal-badge--active flex items-center gap-2">
        <span className="terminal-led"></span>
        <Zap className="w-4 h-4" />
        <span className="text-xs font-medium">
          Live
        </span>
      </div>
    );
  }

  // Cached data
  if (metadata?.cached) {
    return (
      <div className="terminal-badge flex items-center gap-2" style={{borderColor: '#33ff33', color: '#33ff33', background: 'rgba(51, 255, 51, 0.08)'}}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">
          Cached
        </span>
        {showDetails && metadata.timestamp && (
          <span className="text-xs opacity-70">
            {new Date(metadata.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  // Fresh from database
  return (
    <div className="terminal-badge flex items-center gap-2">
      <Database className="w-4 h-4" />
      <span className="text-xs font-medium">
        Fresh
      </span>
      {showDetails && metadata?.timestamp && (
        <span className="text-xs terminal-text-muted">
          {new Date(metadata.timestamp).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

/**
 * Panel Header with Metadata
 * Standardized header for analytics panels with metadata badge
 */
interface PanelHeaderProps {
  title: string;
  description?: string;
  metadata?: AnalyticsMetadata | null | undefined;
  error?: string | null;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PanelHeader({ title, description, metadata, error, icon, actions }: PanelHeaderProps) {
  return (
    <div className="terminal-panel p-6 mb-6">
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && <div className="text-[#33ff33]">{icon}</div>}
            <h2 className="text-xl font-bold terminal-text-glow terminal-uppercase" style={{color: '#33ff33'}}>{title}</h2>
          </div>
          {description && (
            <p className="text-sm terminal-text-muted">{description}</p>
          )}
          <div className="mt-3">
            <AnalyticsMetadataBadge metadata={metadata} error={error} showDetails />
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Error State Component
 * Full-panel error display
 */
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="terminal-panel p-8 max-w-md w-full text-center">
        <div className="relative z-10">
          <AlertCircle className="w-16 h-16 text-[#ff3333] mx-auto mb-4" style={{filter: 'drop-shadow(0 0 8px rgba(255, 51, 51, 0.6))'}} />
          <h3 className="text-lg font-semibold terminal-text mb-2 terminal-uppercase">Failed to Load Data</h3>
          <p className="text-sm terminal-text-muted mb-6">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="terminal-button terminal-button--primary"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading State Component
 * Standardized loading display
 */
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="terminal-loader">
        <div className="terminal-loader__spinner">|</div>
        <span>Loading analytics data...</span>
      </div>
    </div>
  );
}
