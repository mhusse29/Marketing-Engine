import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type AuthTransitionPhase = 
  | 'idle' 
  | 'success-show' 
  | 'liquid-collapse' 
  | 'fade-out'
  | 'revealing' 
  | 'fade-to-black'
  | 'complete';

interface AuthTransitionContextType {
  phase: AuthTransitionPhase;
  userName: string;
  triggerSuccessTransition: (userName: string) => void;
  setPhase: (phase: AuthTransitionPhase) => void;
}

const AuthTransitionContext = createContext<AuthTransitionContextType | undefined>(undefined);

export function AuthTransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<AuthTransitionPhase>('idle');
  const [userName, setUserName] = useState<string>('');

  const triggerSuccessTransition = useCallback((name: string) => {
    setUserName(name);
    setPhase('success-show');
  }, []);

  return (
    <AuthTransitionContext.Provider value={{ phase, userName, triggerSuccessTransition, setPhase }}>
      {children}
    </AuthTransitionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthTransition() {
  const context = useContext(AuthTransitionContext);
  if (context === undefined) {
    throw new Error('useAuthTransition must be used within AuthTransitionProvider');
  }
  return context;
}
