import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Mail, Loader2 } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';

export const FooterNewsletter: React.FC<{ onOpenModal?: () => void }> = ({ onOpenModal }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email');
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
    <div className="font-sans text-left">
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="footer-newsletter-email" className="text-[9.5px] font-sans font-medium text-black/80 uppercase tracking-wider shrink-0">
            Newsletter:
          </label>
          <div className="relative flex items-center border-b border-black/30 hover:border-black/60 focus-within:border-black transition-colors pb-0.5">
            <input
              id="footer-newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="enter email for 10% off..."
              disabled={isSubmitting}
              className="bg-transparent text-[9.5px] font-sans text-black placeholder:text-black/35 focus:outline-none w-36 sm:w-48 px-1 py-0.5 tracking-wide"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              title="Sign up for newsletter"
              aria-label="Sign up for newsletter"
              className="p-1 text-black/70 hover:text-black hover:scale-115 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={12} className="animate-spin text-black" />
              ) : (
                <Mail size={13} className="stroke-[2]" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-[9.5px] font-sans"
        >
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Check size={13} /> Subscribed!
          </span>
          <button
            onClick={handleCopyCode}
            className="px-2 py-0.5 bg-black/5 hover:bg-black/10 border border-black/15 rounded text-[9px] font-mono tracking-wide text-black transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Code: WELCOME10</span>
            {copied ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} className="text-black/50" />}
          </button>
        </motion.div>
      )}

      {errorMsg && (
        <p className="text-[8.5px] font-sans text-red-600 mt-0.5">
          {errorMsg}
        </p>
      )}
    </div>
  );
};


