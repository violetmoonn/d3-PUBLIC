import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  onConfirm,
  onCancel,
  isDestructive = true
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-paper border border-ink/10 shadow-2xl z-[210] overflow-hidden rounded-2xl"
          >
            <div className="p-6 sm:p-8 space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-ink/5 text-ink'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] opacity-30 mb-1">SECURITY CHECK</h2>
                    <h3 className="text-xl font-display uppercase tracking-tight">{title}</h3>
                  </div>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-ink/5 transition-all opacity-40 hover:opacity-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-mono uppercase leading-relaxed opacity-60">
                  {message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink/5">
                <button
                  onClick={onCancel}
                  className="py-3 text-[10px] font-mono font-bold uppercase tracking-widest border border-ink/10 hover:bg-ink/5 transition-all text-ink/40 hover:text-ink rounded-full"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-all rounded-full ${
                    isDestructive 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-ink text-paper hover:bg-zinc-800'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Aesthetic progress bar decoration */}
            <div className="h-1 bg-ink/5 relative overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className={`absolute inset-0 w-1/3 ${isDestructive ? 'bg-red-500/50' : 'bg-ink/20'}`}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
