import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, RefreshCw, Maximize2, Minimize2, Sparkles, Layers, Image as ImageIcon } from 'lucide-react';

interface AirtableStorefrontProps {
  embedUrl?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  defaultHeight?: number;
  showControls?: boolean;
}

export const AirtableStorefront: React.FC<AirtableStorefrontProps> = ({
  embedUrl = "https://airtable.com/embed/appU8lAjcTDz63elZ/shrmZ7W5eZ5FayORv",
  className = "",
  title = "Airtable Product Catalog",
  subtitle = "Live synced product inventory, high-resolution photography, and media assets",
  defaultHeight = 620,
  showControls = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className={`w-full font-sans ${className}`}>
      {/* Header Bar */}
      {showControls && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-ink/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm sm:text-base font-normal uppercase tracking-[0.14em] text-ink">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-[11px] font-normal text-ink/60 tracking-wide mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink/5 hover:bg-ink hover:text-paper text-[10px] uppercase font-normal tracking-widest transition-all rounded-xs cursor-pointer text-ink"
              title="Refresh Airtable Data"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>REFRESH</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink/5 hover:bg-ink hover:text-paper text-[10px] uppercase font-normal tracking-widest transition-all rounded-xs cursor-pointer text-ink"
              title={isExpanded ? "Standard View" : "Expand View"}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isExpanded ? "COLLAPSE" : "EXPAND"}</span>
            </button>

            <a
              href="https://airtable.com/appU8lAjcTDz63elZ/shrmZ7W5eZ5FayORv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-zinc-800 text-[10px] uppercase font-normal tracking-widest transition-all rounded-xs cursor-pointer"
            >
              <span>OPEN AIRTABLE</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {/* Embed Container */}
      <div 
        className={`relative w-full rounded-sm border border-ink/15 overflow-hidden transition-all duration-300 bg-white shadow-xs ${
          isExpanded ? 'h-[850px]' : ''
        }`}
        style={{ height: isExpanded ? '850px' : `${defaultHeight}px` }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-paper/90 backdrop-blur-xs gap-3">
            <div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <p className="text-[11px] font-normal uppercase tracking-[0.16em] text-ink">
                CONNECTING TO AIRTABLE STOREFRONT...
              </p>
              <p className="text-[9px] font-normal text-ink/50 uppercase tracking-widest">
                FETCHING LIVE MEDIA ASSETS & PRODUCTS
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

      <div className="mt-2.5 flex items-center justify-between text-[9px] font-normal text-ink/50 uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Layers size={10} />
          AIRTABLE BASE: appU8lAjcTDz63elZ
        </span>
        <span className="flex items-center gap-1.5">
          <ImageIcon size={10} />
          HIGH RESOLUTION MEDIA SYNC
        </span>
      </div>
    </div>
  );
};
