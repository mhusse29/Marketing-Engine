import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '../../lib/format';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import SinaiqLogo from '../SinaiqLogo';
import { auth } from '../../lib/supabase';
import type { AuthTransitionPhase } from '../../contexts/AuthTransitionContext';

interface AuthCardProps {
  phase?: AuthTransitionPhase;
  userName?: string;
}

export default function AuthCard({ phase = 'idle', userName = '' }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  
  const showGreeting = phase === 'success-show' || phase === 'liquid-collapse' || phase === 'fade-out';

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    try {
      const { error } = await auth.signInWithOAuth(provider);
      if (error) {
        console.error(`${provider} auth error:`, error.message);
        alert(`Failed to sign in with ${provider}. Please try again.`);
      }
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      alert(`An error occurred. Please try again.`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full max-w-md mx-auto"
    >
      {/* Glassmorphism Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl" data-glass-card="true">
        {/* Gradient Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Inner Border Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

        {/* Greeting Message - Inside card so it scales with card */}
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <h2 className="text-2xl font-light text-white/90 tracking-wide">
                Welcome,
              </h2>
              <p className="text-xl font-medium text-white mt-1">
                {userName}
              </p>
            </div>
          </motion.div>
        )}

        <div className="relative z-10 p-8 md:p-10" data-auth-content="true">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative"
            >
              <div className="flex items-center justify-center">
                <SinaiqLogo size={28} compact={false} />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-white/10 blur-2xl -z-10" />
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-white/60">
              {mode === 'signin'
                ? 'Sign in to continue to Marketing Engine'
                : 'Get started with your free account'}
            </p>
          </motion.div>

          {/* Toggle Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex gap-2 p-1 mb-8 rounded-lg bg-white/5 border border-white/10"
          >
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={cn(
                'flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300',
                mode === 'signin'
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300',
                mode === 'signup'
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80'
              )}
            >
              Sign Up
            </button>
          </motion.div>

          {/* Forms */}
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'signin' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'signin' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'signin' ? <SignInForm /> : <SignUpForm />}
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialAuth('google')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium">
                {socialLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialAuth('facebook')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium">
                {socialLoading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
              </span>
            </button>

          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-white/40">
            By continuing, you agree to our{' '}
            <a href="#" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-white/5 blur-3xl rounded-full -z-10" />
    </motion.div>
  );
}
