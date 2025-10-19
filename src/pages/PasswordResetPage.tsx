import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/supabase';
import { cn } from '../lib/format';
import SinaiqLogo from '../components/SinaiqLogo';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await auth.resetPassword(email);

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Radial Gradient Background */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_50%,_transparent_30%,_black_100%)]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
            {/* Logo */}
            <div className="flex justify-center pt-8 pb-6">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-white/20 to-white/10 rounded-full" />
                <div className="relative">
                  <SinaiqLogo size={28} className="drop-shadow-2xl" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-8">
              {!success ? (
                <>
                  <h1 className="text-2xl font-bold text-white text-center mb-2">
                    Reset Password
                  </h1>
                  <p className="text-sm text-white/60 text-center mb-8">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-white/40" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn(
                            'w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border text-white placeholder:text-white/30',
                            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30',
                            'transition-all duration-200 backdrop-blur-sm',
                            error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10'
                          )}
                          placeholder="you@example.com"
                          disabled={isLoading}
                        />
                      </div>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-red-400"
                        >
                          {error}
                        </motion.p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        'w-full py-3 px-4 rounded-lg font-medium text-white',
                        'bg-gradient-to-r from-white/20 to-white/10',
                        'border border-white/20 backdrop-blur-sm',
                        'hover:from-white/30 hover:to-white/20 hover:border-white/30',
                        'focus:outline-none focus:ring-2 focus:ring-white/30',
                        'transition-all duration-300',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'hover:shadow-lg hover:shadow-white/10',
                        'active:scale-[0.98]'
                      )}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="w-16 h-16 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
                  <p className="text-sm text-white/60 mb-6">
                    We've sent a password reset link to <strong className="text-white">{email}</strong>.
                    Please check your inbox and follow the instructions.
                  </p>
                </motion.div>
              )}

              {/* Back to Sign In */}
              <div className="mt-6 text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
