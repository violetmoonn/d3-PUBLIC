import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Lock, LogIn, User, X, Layers, ExternalLink } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
  onGoogleLogin: () => void;
  password: string;
  setPassword: (password: string) => void;
  onOpenAirtable?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  onGoogleLogin,
  password,
  setPassword,
  onOpenAirtable
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-paper/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-paper border border-ink/10 w-full max-w-md overflow-hidden relative shadow-2xl rounded-lg"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-10 p-2 hover:bg-ink hover:text-paper transition-all rounded cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="p-8 sm:p-10">
              <div className="mb-8 text-center">
                <span className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-ink/80 block">
                  CLIENT ACCESS
                </span>
                <p className="text-[12px] font-sans text-ink/60 mt-2 leading-relaxed">
                  Sign in with your credentials to manage your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono font-medium uppercase tracking-wider text-ink/70">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 stroke-[1.5]" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password..."
                      autoFocus
                      className="w-full bg-ink/5 border border-ink/15 rounded-md p-3.5 pl-10 text-[12px] font-mono text-ink focus:outline-none focus:border-ink transition-all placeholder:text-ink/30"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full bg-ink text-paper py-3.5 text-[11px] font-mono font-medium uppercase tracking-[0.2em] rounded-md flex items-center justify-center gap-2 hover:bg-ink/80 transition-all disabled:opacity-40 cursor-pointer shadow-sm group"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <LogIn size={15} className="group-hover:translate-x-0.5 transition-transform stroke-[1.5]" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-ink/10 space-y-3">
                <p className="text-[9px] font-mono font-medium uppercase tracking-widest text-ink/40 text-center">
                  OR CONTINUE WITH
                </p>
                <button 
                  type="button"
                  onClick={onGoogleLogin}
                  className="w-full bg-paper border border-ink/15 text-ink py-3 text-[11px] font-mono font-medium uppercase tracking-wider rounded-md flex items-center justify-center gap-2.5 hover:bg-ink/5 transition-all cursor-pointer group"
                >
                  <User size={15} className="group-hover:scale-110 transition-transform stroke-[1.5]" />
                  CONTINUE WITH GOOGLE
                </button>

                {onOpenAirtable && (
                  <button 
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAirtable();
                    }}
                    className="w-full bg-ink/5 border border-ink/15 text-ink py-3 text-[11px] font-mono font-medium uppercase tracking-wider rounded-md flex items-center justify-center gap-2.5 hover:bg-ink hover:text-paper transition-all cursor-pointer group"
                  >
                    <Layers size={15} className="group-hover:scale-110 transition-transform stroke-[1.5]" />
                    LIVE AIRTABLE STOREFRONT
                  </button>
                )}
              </div>

              <p className="mt-8 text-[9px] font-mono uppercase text-center text-ink/30 leading-relaxed">
                * 256-BIT ENCRYPTED CLIENT PORTAL
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
