import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ArrowRight } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';

export const FooterNewsletter: React.FC<{ onOpenModal?: () => void }> = ({ onOpenModal }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isInlineOpen, setIsInlineOpen] = useState(false);

  const triggerOpen = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      window.dispatchEvent(new CustomEvent('open-subscribe-modal'));
    }
  };

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
    <div className="w-full py-1 font-sans text-left">
      {!isSubmitted ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* Clean button on the left */}
          <button
            onClick={triggerOpen}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[11px] font-sans font-medium tracking-wide rounded hover:bg-black/80 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <span>Sign up for newsletter</span>
            <span className="text-[10px] text-white/70 font-mono font-normal">• 10% OFF</span>
            <ArrowRight size={12} className="stroke-[2]" />
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[11px] font-mono"
        >
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Check size={14} /> SUBSCRIBED
          </span>
          <button
            onClick={handleCopyCode}
            className="px-2.5 py-1 bg-black/5 border border-black/20 rounded text-[10px] font-medium tracking-wider text-black hover:bg-black/10 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>CODE: WELCOME10</span>
            {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-black/60" />}
          </button>
        </motion.div>
      )}

      {errorMsg && (
        <p className="text-[10px] font-mono text-red-600 mt-1">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

