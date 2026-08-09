import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ArrowRight } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';

export const FooterNewsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Enter valid email');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "waiting_list"), {
        email: email.trim().toLowerCase(),
        name: 'Subscriber',
        status: 'SUBSCRIBED',
        source: 'FOOTER_NEWSLETTER',
        created_at: serverTimestamp()
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Newsletter submission error:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, "waiting_list");
      } catch (fErr) {
        // Detailed error logged
      }
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
    <div className="w-full py-2 my-0.5 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-[10px] font-mono font-normal tracking-[0.2em] text-black uppercase">
            NEWSLETTER
          </h4>
          <p className="text-[11px] text-black/70 font-sans mt-0.5">
            Sign up for 10% off your first order and exclusive updates.
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-sm w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address..."
                className="w-full pl-3 pr-8 py-1.5 bg-neutral-100 border border-black/20 rounded-md text-[11px] font-mono text-black focus:outline-none focus:border-black transition-all placeholder:text-black/40"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-black/60 hover:text-black transition-colors focus:outline-none cursor-pointer disabled:opacity-40"
                aria-label="Submit newsletter subscription"
                title="Submit"
              >
                <ArrowRight size={13} strokeWidth={1.25} />
              </button>
            </div>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-[11px] font-mono"
          >
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <Check size={14} /> SUBSCRIBED
            </span>
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 bg-black/5 border border-black/20 rounded text-[10px] font-bold tracking-wider text-black hover:bg-black/10 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>CODE: WELCOME10</span>
              {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-black/60" />}
            </button>
          </motion.div>
        )}
      </div>

      {errorMsg && (
        <p className="text-[10px] font-mono text-red-600 mt-1">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

