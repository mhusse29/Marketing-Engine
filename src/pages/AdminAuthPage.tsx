import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLSLHills } from '../components/ui/glsl-hills';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Lock, AlertCircle } from 'lucide-react';

export default function AdminAuthPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading for UX
    setTimeout(() => {
      const success = login(password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid password');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* GLSLHills Background */}
      <div className="absolute inset-0 z-0">
        <GLSLHills width="100vw" height="100vh" cameraZ={125} planeSize={256} speed={0.5} />
      </div>

      {/* Auth Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Admin Badge */}
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center">
              <div className="relative">
                <h1 className="text-5xl font-bold tracking-tighter text-white">
                  SINAIQ
                </h1>
              </div>
            </div>
            <div className="mt-3 inline-block rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <p className="text-sm font-medium tracking-wide text-white/80">
                Admin
              </p>
            </div>
          </div>

          {/* Auth Card with Glass Effect */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl shadow-2xl">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
            
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white">
                  Analytics Dashboard
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Enter admin password to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-white/80">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-white/40" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/40 backdrop-blur-sm transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full rounded-lg bg-white py-3 font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    'Access Dashboard'
                  )}
                </button>
              </form>

              {/* Helper Text */}
              <div className="text-center">
                <p className="text-xs text-white/40">
                  Protected area • Admin access only
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-white/30">
            Analytics Dashboard v1.0 • Powered by SINAIQ
          </div>
        </div>
      </div>
    </div>
  );
}
