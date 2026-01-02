import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, XCircle, Info } from 'lucide-react';

type ToastType = 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    showToast({ type: 'error', title, message, duration: 8000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    showToast({ type: 'warning', title, message, duration: 6000 });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError, showWarning, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const config = {
    error: {
      bg: 'bg-red-950/95',
      border: 'border-red-500/40',
      icon: <XCircle className="h-5 w-5 text-red-400" />,
      titleColor: 'text-red-300',
      messageColor: 'text-red-200/80',
    },
    warning: {
      bg: 'bg-amber-950/95',
      border: 'border-amber-500/40',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
      titleColor: 'text-amber-300',
      messageColor: 'text-amber-200/80',
    },
    info: {
      bg: 'bg-blue-950/95',
      border: 'border-blue-500/40',
      icon: <Info className="h-5 w-5 text-blue-400" />,
      titleColor: 'text-blue-300',
      messageColor: 'text-blue-200/80',
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`
        pointer-events-auto rounded-xl border ${config.border} ${config.bg}
        p-4 shadow-2xl backdrop-blur-xl
      `}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-semibold text-sm ${config.titleColor}`}>
              {toast.title}
            </h4>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-white/50 hover:text-white/80" />
            </button>
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${config.messageColor} break-words`}>
            {toast.message}
          </p>
        </div>
      </div>
      
      {/* Progress bar for auto-dismiss */}
      {toast.duration && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-white/20 rounded-b-xl"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
