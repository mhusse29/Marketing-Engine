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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-xs font-medium text-red-400">
          {error || metadata?.error || 'Error loading data'}
        </span>
        {((error || metadata?.error) ?? '').toLowerCase().includes('unauthorized') && (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <Clock className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-medium text-amber-400">
          Stale data
        </span>
        {showDetails && metadata.timestamp && (
          <span className="text-xs text-amber-400/70">
            Last updated: {new Date(metadata.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  // Live/realtime data
  if (metadata?.source === 'realtime' || metadata?.freshness === 'live') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <Zap className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400">
          Live
        </span>
      </div>
    );
  }

  // Cached data
  if (metadata?.cached) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <CheckCircle className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium text-blue-400">
          Cached
        </span>
        {showDetails && metadata.timestamp && (
          <span className="text-xs text-blue-400/70">
            {new Date(metadata.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  // Fresh from database
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
      <Database className="w-4 h-4 text-white/60" />
      <span className="text-xs font-medium text-white/60">
        Fresh
      </span>
      {showDetails && metadata?.timestamp && (
        <span className="text-xs text-white/40">
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
    <div className="flex items-start justify-between mb-6">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {icon && <div className="text-white/70">{icon}</div>}
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-white/50">{description}</p>
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
      <div className="glass-card-elevated p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Data</h3>
        <p className="text-sm text-white/60 mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all"
          >
            Retry
          </button>
        )}
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
      <div className="relative">
        <div className="w-12 h-12 border-4 border-white/10 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-sm text-white/50 mt-4">Loading analytics data...</p>
    </div>
  );
}
