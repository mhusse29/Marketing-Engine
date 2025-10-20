import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { analyticsClient } from '../../lib/analyticsClient';

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);
    
    try {
      // Call gateway endpoint with rate limiting
      const result = await analyticsClient.refresh();
      
      if (result.success) {
        setIsError(false);
        setMessage('Data refreshed successfully');
        
        // Wait a moment for views to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Trigger a custom event that hooks can listen to
        window.dispatchEvent(new CustomEvent('refreshAnalytics'));
      } else {
        setIsError(true);
        setMessage(result.message || 'Refresh failed');
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Refresh failed');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="terminal-button terminal-button--primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh dashboard data"
      >
        <RefreshCw 
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
      </button>
      
      {/* Feedback message */}
      {message && (
        <div 
          className={`terminal-badge flex items-center gap-2 ${
            isError 
              ? 'terminal-badge--alert' 
              : 'terminal-badge--active'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
