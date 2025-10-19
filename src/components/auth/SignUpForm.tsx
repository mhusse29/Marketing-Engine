import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { cn } from '../../lib/format';
import { auth } from '../../lib/supabase';
import { logActivity } from '../../lib/activityLogger';
import { useAuthTransition } from '../../contexts/AuthTransitionContext';

export default function SignUpForm() {
  const { triggerSuccessTransition } = useAuthTransition();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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
      const { data, error } = await auth.signUp(
        formData.email,
        formData.password,
        { full_name: formData.fullName }
      );
      
      if (error) {
        setErrors({ general: error.message });
        return;
      }

      if (data.user) {
        // Log sign-up activity
        await logActivity({ action: 'user_signed_up' });
        // Extract user name for greeting
        const userName = formData.fullName || 
                        data.user.email?.split('@')[0] || 
                        'User';
        // Successfully signed up - trigger premium transition animation
        triggerSuccessTransition(userName);
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { strength, label: labels[strength - 1] || '' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Full Name Field */}
      <motion.div variants={itemVariants}>
        <label htmlFor="fullName" className="block text-sm font-medium text-white/80 mb-2">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-white/40" />
          </div>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border text-white placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30',
              'transition-all duration-200 backdrop-blur-sm',
              errors.fullName ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10'
            )}
            placeholder="John Doe"
            disabled={isLoading}
          />
        </div>
        {errors.fullName && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {errors.fullName}
          </motion.p>
        )}
      </motion.div>

      {/* Email Field */}
      <motion.div variants={itemVariants}>
        <label htmlFor="signup-email" className="block text-sm font-medium text-white/80 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-white/40" />
          </div>
          <input
            id="signup-email"
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
        <label htmlFor="signup-password" className="block text-sm font-medium text-white/80 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-white/40" />
          </div>
          <input
            id="signup-password"
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
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {formData.password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2"
          >
            <div className="flex gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    i < passwordStrength.strength
                      ? passwordStrength.strength <= 2
                        ? 'bg-red-500'
                        : passwordStrength.strength <= 3
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-white/10'
                  )}
                />
              ))}
            </div>
            {passwordStrength.label && (
              <p className="text-xs text-white/60">{passwordStrength.label}</p>
            )}
          </motion.div>
        )}
        
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

      {/* Confirm Password Field */}
      <motion.div variants={itemVariants}>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-white/40" />
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={cn(
              'w-full pl-10 pr-12 py-3 rounded-lg bg-white/5 border text-white placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30',
              'transition-all duration-200 backdrop-blur-sm',
              errors.confirmPassword ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10'
            )}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60 transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {errors.confirmPassword}
          </motion.p>
        )}
      </motion.div>

      {/* Terms Acceptance */}
      <motion.div variants={itemVariants}>
        <label className="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
            className={cn(
              'w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-white',
              'focus:ring-2 focus:ring-white/20 focus:ring-offset-0 transition-colors cursor-pointer',
              errors.acceptTerms && 'border-red-500/50'
            )}
            disabled={isLoading}
          />
          <span className="ml-2 text-sm text-white/60 group-hover:text-white/80 transition-colors">
            I agree to the{' '}
            <a href="#" className="text-white underline-offset-2 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-white underline-offset-2 hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.acceptTerms && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {errors.acceptTerms}
          </motion.p>
        )}
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
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </motion.button>
    </motion.form>
  );
}
