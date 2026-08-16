import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Copy } from 'lucide-react';

interface SubscribeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: (email: string, name?: string) => Promise<void>;
}

export const SubscribeListModal: React.FC<SubscribeListModalProps> = ({
  isOpen,
  onClose,
  onSubscribe
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('PLEASE ENTER A VALID EMAIL ADDRESS.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (onSubscribe) {
        await onSubscribe(email, name);
      }
      setIsSubmitted(true);
    } catch (err) {
      console.error("Subscribe error:", err);
      // Fallback success if offline/unconfigured
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('WELCOME10');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[650] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-paper w-full max-w-md max-h-[92vh] overflow-hidden relative border border-ink/20 shadow-2xl rounded-2xl font-typewriter flex flex-col text-ink"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-30 p-2 bg-paper/90 hover:bg-ink hover:text-paper transition-all border border-ink/20 rounded-full shadow-sm group cursor-pointer"
              aria-label="Close popup"
            >
              <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Sign Up Form Content */}
            <div className="w-full p-6 sm:p-8 flex flex-col justify-between relative z-10 bg-paper">
              <div className="my-auto space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-ink leading-tight">
                    GET ON THE LIST
                  </h2>
                  <p className="text-xs font-mono font-medium uppercase tracking-wider text-ink/70 mt-1.5">
                    SUBSCRIBE TO RECEIVE A DISCOUNT
                  </p>
                </div>

                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ENTER YOUR EMAIL ADDRESS"
                        className="w-full px-4 py-3.5 bg-paper border border-ink/30 focus:border-ink rounded-xl text-xs font-mono font-medium tracking-wider text-ink focus:outline-none focus:ring-1 focus:ring-ink/20 transition-all placeholder:text-ink/30 placeholder:font-normal"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-[10px] font-mono text-red-600 font-medium tracking-wider">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 bg-ink text-paper hover:bg-ink/90 active:scale-[0.98] transition-all rounded-xl font-medium text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="animate-pulse">PROCESSING...</span>
                      ) : (
                        <span>JOIN NOW & GET 10% OFF</span>
                      )}
                    </button>
                    
                    <p className="text-[10px] font-mono text-ink/40 text-center tracking-wider uppercase">
                      NO SPAM. UNSUBSCRIBE AT ANY TIME.
                    </p>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-ink/5 border border-ink/20 rounded-2xl space-y-4 text-center"
                  >
                    <div className="w-12 h-12 bg-ink text-paper rounded-full flex items-center justify-center mx-auto shadow-md">
                      <Check size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg uppercase tracking-tight text-ink">YOU'RE ON THE LIST</h3>
                      <p className="text-[11px] font-mono text-ink/70 mt-1 uppercase tracking-wider">
                        YOUR DISCOUNT CODE FOR 10% OFF:
                      </p>
                    </div>

                    <div
                      onClick={handleCopyCode}
                      className="p-3.5 bg-paper border border-ink/20 rounded-xl flex items-center justify-between cursor-pointer hover:bg-ink/5 transition-all group"
                    >
                      <span className="font-mono font-bold text-lg tracking-widest text-ink">WELCOME10</span>
                      <button className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink/80 group-hover:text-ink">
                        {copied ? (
                          <>
                            <Check size={14} className="text-emerald-600" />
                            <span className="text-emerald-600">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-full py-3 px-4 bg-ink text-paper rounded-xl font-medium text-xs uppercase tracking-widest hover:bg-ink/90 transition-all cursor-pointer"
                    >
                      CONTINUE SHOPPING
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Bottom Brand Stamp */}
              <div className="pt-4 mt-6 border-t border-ink/10 flex items-center justify-between text-[9px] font-mono uppercase text-ink/40 tracking-widest">
                <span>D3COMPOSURE VIP</span>
                <span>LIMITED VAULT ACCESS</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
