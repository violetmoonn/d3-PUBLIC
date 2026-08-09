import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X, Shield, Info } from 'lucide-react';
import { t } from '../utils/helpers';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('d3composure-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('d3composure-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('d3composure-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="cookie-consent-banner"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-6 right-6 md:right-auto md:left-6 md:max-w-md bg-paper border border-ink/10 rounded-[var(--radius-phi-2)] shadow-2xl p-6 z-[8000] backdrop-blur-md"
        >
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-ink/5 rounded-md text-ink">
                  <Cookie size={16} />
                </div>
                <h3 className="font-mono text-[10.5px] font-black uppercase tracking-[0.2em] text-ink">
                  Cookie Registry
                </h3>
              </div>
              <button 
                onClick={handleDecline}
                className="text-ink/40 hover:text-ink transition-colors p-1"
                aria-label="Dismiss cookie consent"
              >
                <X size={14} />
              </button>
            </div>

            {/* Description */}
            <p className="font-sans text-[11px] leading-relaxed text-ink/70">
              We use essential and analytical cookies to optimize your archival experience. By accepting, you consent to our telemetry standards designed to preserve the performance and elegance of the collection.
            </p>

            {/* Links and Actions */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-ink/5">
              <a 
                href="#privacy"
                onClick={(e) => {
                  // If we need to trigger privacy view or custom flow
                  // Standard anchor link for SPA / static router
                }}
                className="font-mono text-[8px] font-bold uppercase tracking-wider text-ink/40 hover:text-ink transition-all flex items-center gap-1"
              >
                <Shield size={10} />
                <span>Privacy Standards</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDecline}
                  className="font-mono text-[8.5px] font-bold tracking-wider uppercase text-ink/60 hover:text-ink hover:bg-ink/5 px-3 py-1.5 rounded-[var(--radius-phi-1)] border border-ink/10 transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="font-mono text-[8.5px] font-bold tracking-wider uppercase text-paper bg-ink hover:opacity-90 px-4 py-1.5 rounded-[var(--radius-phi-1)] transition-all"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
