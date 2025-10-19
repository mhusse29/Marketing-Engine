import { useEffect, useState, useCallback } from 'react';
import { LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SessionTimeoutBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener('analytics:unauthorized', show);
    return () => window.removeEventListener('analytics:unauthorized', show);
  }, []);

  const handleSignInAgain = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4">
      <div className="mt-4 flex max-w-4xl items-center gap-4 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-100 shadow-lg backdrop-blur">
        <span className="font-semibold">Session expired.</span>
        <span>Please sign in again to continue receiving live telemetry.</span>
        <button
          onClick={handleSignInAgain}
          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 font-medium text-white transition hover:bg-white/20"
        >
          <LogOut className="h-4 w-4" />
          Sign in again
        </button>
        <button
          onClick={() => setVisible(false)}
          className="ml-auto rounded-full border border-white/10 p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss session timeout banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
