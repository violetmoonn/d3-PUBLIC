import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Package, ShieldCheck } from 'lucide-react';

interface SuccessOverlayProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  orderId: string | null;
  onReturn: () => void;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ status, orderId, onReturn }) => {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-paper/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-paper border border-ink/5 w-full max-w-2xl overflow-hidden relative shadow-2xl p-12 sm:p-24 text-center"
        >
          <div className="mb-12">
            <AnimatePresence mode="wait">
              {status === 'processing' ? (
                <motion.div key="processing" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-24 h-24 bg-ink text-paper flex items-center justify-center mx-auto mb-8">
                  <Loader2 className="animate-spin" size={48} />
                </motion.div>
              ) : status === 'success' ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-24 h-24 bg-ink text-paper flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 size={48} />
                </motion.div>
              ) : (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-24 h-24 bg-paper text-ink border-4 border-ink flex items-center justify-center mx-auto mb-8">
                  <XCircle size={48} />
                </motion.div>
              )}
            </AnimatePresence>

            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-2 block">
              {status === 'processing' ? 'PROCESSING ORDER' : status === 'success' ? 'ORDER CONFIRMED' : 'CHECKOUT ERROR'}
            </span>
            <h2 className="text-5xl sm:text-7xl font-display tracking-tighter">
              {status === 'processing' ? 'PROCESSING...' : status === 'success' ? 'THANK YOU' : 'UNABLE TO PROCESS'}
            </h2>
          </div>

          <div className="space-y-8 max-w-md mx-auto">
            {status === 'processing' ? (
              <p className="text-xs font-mono uppercase opacity-40 leading-relaxed">
                Securing your payment and preparing your order. Please do not close this window.
              </p>
            ) : status === 'success' ? (
              <>
                <div className="p-8 bg-ink/5 border border-ink/5 space-y-4">
                  <div className="flex items-center gap-3 justify-center opacity-40">
                    <Package size={14} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">ORDER REFERENCE</span>
                  </div>
                  <p className="text-xl font-mono font-bold tracking-tighter">{orderId}</p>
                  <p className="text-[8px] font-mono uppercase opacity-40">Keep this reference ID for tracking your shipment.</p>
                </div>
                <p className="text-xs font-mono uppercase opacity-40 leading-relaxed">
                  Your order has been placed. A confirmation email with details has been sent to your inbox.
                </p>
                <button 
                  onClick={onReturn}
                  className="w-full bg-ink text-paper py-5 text-[12px] font-mono font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all group cursor-pointer"
                >
                  RETURN TO STORE
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-mono uppercase opacity-40 leading-relaxed">
                  We were unable to complete your payment. Please verify your payment details and try again.
                </p>
                <button 
                  onClick={onReturn}
                  className="w-full bg-ink text-paper py-5 text-[12px] font-mono font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all group cursor-pointer"
                >
                  RETRY PAYMENT
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </div>

          <div className="mt-16 flex items-center gap-3 justify-center opacity-30">
            <ShieldCheck size={16} />
            <span className="text-[8.5px] font-mono uppercase tracking-[0.3em] font-bold">D3COMPOSURE SECURE CHECKOUT</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
