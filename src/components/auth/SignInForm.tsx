import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { cn } from '../../lib/format';
import { auth } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { logActivity } from '../../lib/activityLogger';
import { useAuthTransition } from '../../contexts/AuthTransitionContext';

export default function SignInForm() {
  const { triggerSuccessTransition } = useAuthTransition();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({}); // Clear previous errors

    try {
      const { data, error } = await auth.signIn(formData.email, formData.password);
      
      if (error) {
        setErrors({ general: error.message });
        return;
      }

      if (data.user) {
        // Log sign-in activity
        await logActivity({ action: 'user_signed_in' });
        // Extract user name for greeting
        const userName = data.user.user_metadata?.full_name || 
                        data.user.email?.split('@')[0] || 
                        'User';
        // Successfully signed in - trigger premium transition animation
        triggerSuccessTransition(userName);
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Email Field */}
      <motion.div variants={itemVariants}>
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
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border text-white placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30',
              'transition-all duration-200 backdrop-blur-sm',
              errors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10'
            )}
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {errors.email}
          </motion.p>
        )}
      </motion.div>

      {/* Password Field */}
      <motion.div variants={itemVariants}>
        <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-white/40" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={cn(
              'w-full pl-10 pr-12 py-3 rounded-lg bg-white/5 border text-white placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30',
              'transition-all duration-200 backdrop-blur-sm',
              errors.password ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10'
            )}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {errors.password}
          </motion.p>
        )}
      </motion.div>

      {/* Remember Me & Forgot Password */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-white/20 focus:ring-offset-0 transition-colors cursor-pointer"
            disabled={isLoading}
          />
          <span className="ml-2 text-sm text-white/60 group-hover:text-white/80 transition-colors">
            Remember me
          </span>
        </label>
        <Link
          to="/reset-password"
          className="text-sm text-white/60 hover:text-white transition-colors underline-offset-2 hover:underline"
        >
          Forgot password?
        </Link>
      </motion.div>

      {/* General Error Message */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm"
        >
          <p className="text-sm text-red-400">{errors.general}</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        variants={itemVariants}
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
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </motion.button>
    </motion.form>
  );
}
