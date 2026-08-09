import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, X, Loader2, Info } from 'lucide-react';
import { formatErrorMessage } from '../utils/helpers';

interface NotificationProps {
  message: string | null;
  type: 'success' | 'error' | 'info';
  onClear: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClear }) => {
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(onClear, 8000); // Increased time for reading suggestions
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message) return null;

  const formatted = type === 'error' ? formatErrorMessage(message) : { message: message.replace(/_/g, ' '), suggestion: null };

  const config = {
    success: {
      icon: <CheckCircle2 className="text-ink" size={18} />,
      bg: 'bg-paper',
      border: 'border-ink',
      text: 'text-ink'
    },
    error: {
      icon: <XCircle className="text-ink" size={18} />,
      bg: 'bg-paper',
      border: 'border-ink border-2',
      text: 'text-ink'
    },
    info: {
      icon: <Info className="text-ink" size={18} />,
      bg: 'bg-paper',
      border: 'border-ink',
      text: 'text-ink'
    }
  };

  const { icon, bg, border, text } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-8 left-1/2 z-[300] flex items-center gap-4 px-6 py-4 border shadow-2xl ${bg} ${border} ${text} min-w-[320px] max-w-md rounded-xl`}
    >
      {icon}
      <div className="flex-1">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 mb-1">{type} signal</p>
        <p className="text-[11px] font-mono font-bold uppercase">{formatted.message}</p>
        {formatted.suggestion && (
          <p className="text-[9px] font-mono uppercase opacity-50 mt-1 leading-tight">
            SUGGESTION: {formatted.suggestion}
          </p>
        )}
      </div>
      <button onClick={onClear} className="p-1 hover:bg-black/5 transition-all">
        <X size={14} />
      </button>
    </motion.div>
  );
};

interface GlobalNotificationSystemProps {
  error: string | null;
  success: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

export const GlobalNotificationSystem: React.FC<GlobalNotificationSystemProps> = ({ 
  error, 
  success, 
  onClearError, 
  onClearSuccess 
}) => {
  return (
    <AnimatePresence>
      {error && (
        <Notification 
          key="error"
          message={error} 
          type="error" 
          onClear={onClearError} 
        />
      )}
      {success && (
        <Notification 
          key="success"
          message={success} 
          type="success" 
          onClear={onClearSuccess} 
        />
      )}
    </AnimatePresence>
  );
};
