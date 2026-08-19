import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, RefreshCw, Maximize2, Minimize2, Layers, Image as ImageIcon, X } from 'lucide-react';

interface AirtableStorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedUrl?: string;
  title?: string;
  subtitle?: string;
}

export const AirtableStorefrontModal: React.FC<AirtableStorefrontModalProps> = ({
  isOpen,
  onClose,
  embedUrl = "https://airtable.com/embed/appU8lAjcTDz63elZ/shrmZ7W5eZ5FayORv",
  title = "Live Airtable Storefront",
  subtitle = "Direct live connection to your Airtable product base and high-resolution media gallery"
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-paper/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          className="bg-paper border border-ink/15 w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden relative shadow-2xl rounded-md"
        >
          {/* Top Bar Header */}
          <div className="px-5 py-4 border-b border-ink/10 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-sans font-medium uppercase tracking-[0.18em] text-ink">
                    {title}
                  </h2>
                  <span className="text-[8px] font-mono uppercase bg-black text-white px-1.5 py-0.5 rounded-xs tracking-wider">
                    SECURE PORTAL
                  </span>
                </div>
                <p className="text-[10.5px] font-sans text-ink/60 mt-0.5 hidden sm:block">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-ink/5 hover:bg-ink hover:text-paper text-[9.5px] font-mono uppercase tracking-wider transition-all rounded-xs cursor-pointer text-ink"
                title="Refresh Airtable Embed"
              >
                <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">REFRESH</span>
              </button>

              <a
                href="https://airtable.com/appU8lAjcTDz63elZ/shrmZ7W5eZ5FayORv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-ink/5 hover:bg-ink hover:text-paper text-[9.5px] font-mono uppercase tracking-wider transition-all rounded-xs cursor-pointer text-ink"
              >
                <span className="hidden sm:inline">AIRTABLE.COM</span>
                <ExternalLink size={10} />
              </a>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-ink hover:text-paper transition-all rounded-xs cursor-pointer text-ink ml-1"
                aria-label="Close"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Embed Frame */}
          <div className="relative w-full flex-1 min-h-0 bg-white">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-paper/90 backdrop-blur-xs gap-3">
                <div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-ink">
                    CONNECTING TO LIVE AIRTABLE STOREFRONT...
                  </p>
                  <p className="text-[9px] font-mono text-ink/50 uppercase tracking-widest">
                    SYNCING REAL-TIME MEDIA & PRODUCT CATALOG
                  </p>
                </div>
              </div>
            )}

            <iframe
              key={iframeKey}
              className="airtable-embed w-full h-full"
              src={embedUrl}
              frameBorder="0"
              onWheel={() => {}}
              onLoad={() => setIsLoading(false)}
              width="100%"
              height="100%"
              style={{ background: 'transparent', border: 'none' }}
              title="Airtable Storefront Embed"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-2.5 bg-white border-t border-ink/10 flex items-center justify-between text-[9px] font-mono text-ink/50 uppercase tracking-wider shrink-0">
            <span className="flex items-center gap-1.5">
              <Layers size={10} />
              BASE: appU8lAjcTDz63elZ / shrmZ7W5eZ5FayORv
            </span>
            <span className="flex items-center gap-1.5">
              <ImageIcon size={10} />
              AUTHENTICATED ASSET PIPELINE
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
