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
            className="bg-paper w-full max-w-4xl max-h-[92vh] overflow-hidden relative border-2 sm:border-4 border-ink shadow-2xl rounded-2xl md:rounded-3xl font-typewriter flex flex-col md:flex-row text-ink"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 bg-paper/90 hover:bg-ink hover:text-paper transition-all border border-ink rounded-full shadow-md group"
              aria-label="Close popup"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* FIRST HALF: Sign Up Form */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between relative z-10 bg-paper">
              <div className="my-auto space-y-6">
                <div>
                  <div className="inline-block text-[10px] font-mono font-bold tracking-widest text-ink/60 uppercase border border-ink/20 px-2.5 py-0.5 rounded-full mb-3">
                    EXCLUSIVE ACCESS
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink leading-tight">
                    GET ON THE LIST
                  </h2>
                  <p className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-ink/70 mt-1">
                    SUBSCRIBE TO RECEIVE A DISCOUNT
                  </p>
                </div>

                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ENTER YOUR EMAIL ADDRESS"
                        className="w-full px-4 py-3.5 bg-paper border-2 border-ink focus:border-ink rounded-xl text-xs font-mono font-bold tracking-wider text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 transition-all placeholder:text-ink/30 placeholder:font-normal"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-[10px] font-mono text-red-600 font-bold tracking-wider">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 bg-ink text-paper hover:bg-ink/90 active:scale-[0.98] transition-all rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-md cursor-pointer"
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
                    className="p-6 bg-ink/5 border-2 border-ink rounded-2xl space-y-4 text-center"
                  >
                    <div className="w-12 h-12 bg-ink text-paper rounded-full flex items-center justify-center mx-auto shadow-md">
                      <Check size={22} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight text-ink">YOU'RE ON THE LIST</h3>
                      <p className="text-[11px] font-mono text-ink/70 mt-1 uppercase tracking-wider">
                        YOUR DISCOUNT CODE FOR 10% OFF:
                      </p>
                    </div>

                    <div
                      onClick={handleCopyCode}
                      className="p-3.5 bg-paper border-2 border-ink rounded-xl flex items-center justify-between cursor-pointer hover:bg-ink/5 transition-all group"
                    >
                      <span className="font-mono font-black text-lg tracking-widest text-ink">WELCOME10</span>
                      <button className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/80 group-hover:text-ink">
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
                      className="w-full py-3 px-4 bg-ink text-paper rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-all cursor-pointer"
                    >
                      CONTINUE SHOPPING
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Bottom Brand Stamp */}
              <div className="pt-4 border-t border-ink/10 flex items-center justify-between text-[9px] font-mono uppercase text-ink/40 tracking-widest">
                <span>D3COMPOSURE VIP</span>
                <span>LIMITED VAULT ACCESS</span>
              </div>
            </div>

            {/* NEXT HALF: D3COMPOSURE Product Artifact Photo */}
            <div className="w-full md:w-1/2 relative bg-ink/10 min-h-[260px] sm:min-h-[320px] md:min-h-[460px] flex items-center justify-center overflow-hidden border-t md:border-t-0 md:border-l border-ink/20 group">
              <img
                src="/uploads/black_hoodie_tracksuit.jpg"
                alt="D3COMPOSURE Artifact"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none md:hidden" />
              <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-full bg-paper/80 backdrop-blur-md border border-ink/20 font-mono text-[9px] font-bold tracking-widest text-ink uppercase shadow-sm">
                D3COMPOSURE // 2026
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
