import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Lock, LogIn, ShieldCheck, User, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
  onGoogleLogin: () => void;
  password: string;
  setPassword: (password: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  onGoogleLogin,
  password,
  setPassword
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
            className="bg-paper border border-ink/5 w-full max-w-md overflow-hidden relative shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 hover:bg-ink hover:text-paper transition-all"
            >
              <X size={20} />
            </button>

            <div className="p-8 sm:p-12">
              <div className="mb-12 text-center">
                <div className="w-16 h-16 bg-ink text-paper flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-2 block">SECURE ACCESS</span>
                <h2 className="text-4xl font-display tracking-tighter">ADMIN LOGIN</h2>
                <p className="text-xs font-mono uppercase opacity-40 mt-4 leading-relaxed">Enter credentials to access the admin control center.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">PASSWORD</label>
                    <span className="text-[9px] font-mono opacity-50 text-ink">PIN: 00736121</span>
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ENTER PASSWORD (00736121)"
                      className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all placeholder:opacity-40"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-ink text-paper py-5 text-[12px] font-mono font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50 group"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />}
                  LOGIN
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-ink/5 space-y-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 text-center">OR CONTINUE WITH</p>
                <button 
                  onClick={onGoogleLogin}
                  className="w-full bg-paper border border-ink/10 text-ink py-5 text-[12px] font-mono font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-ink hover:text-paper transition-all group"
                >
                  <User size={18} className="group-hover:scale-110 transition-transform" />
                  GOOGLE LOGIN
                </button>
              </div>

              <p className="mt-12 text-[8px] font-mono uppercase text-center opacity-20 leading-relaxed">
                * Unauthorized access attempts are logged and reported.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
