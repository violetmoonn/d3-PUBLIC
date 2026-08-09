import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X, Check, Building2, Globe } from 'lucide-react';

export interface StoreLocation {
  id: string;
  city: string;
  name: string;
  address: string;
  region: string;
  currency: string;
  language: string;
  timezone: string;
  status: string;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  { id: 'NEW YORK', city: 'NEW YORK', name: '5TH AVE FLAGSHIP', address: '712 5TH AVE, NY 10019', region: 'US', currency: 'USD', language: 'EN', timezone: 'EST', status: 'OPEN 10-19' },
  { id: 'TOKYO', city: 'TOKYO', name: 'SHINJUKU ATELIER', address: '3-14-1 SHINJUKU, TOKYO', region: 'JP', currency: 'JPY', language: 'JA', timezone: 'JST', status: 'OPEN 11-20' },
  { id: 'LONDON', city: 'LONDON', name: 'MAYFAIR BOUTIQUE', address: '28 MOUNT ST, LONDON W1K 2SX', region: 'UK', currency: 'GBP', language: 'EN', timezone: 'GMT', status: 'OPEN 10-18' },
  { id: 'PARIS', city: 'PARIS', name: 'LE MARAIS STUDIO', address: '14 RUE VIEILLE DU TEMPLE, 75004', region: 'EU', currency: 'EUR', language: 'FR', timezone: 'CET', status: 'OPEN 11-19' },
  { id: 'SEOUL', city: 'SEOUL', name: 'SEONGSU ARCHIVE', address: '26 Yeonmujang-gil, Seongdong-gu', region: 'KR', currency: 'KRW', language: 'KO', timezone: 'KST', status: 'OPEN 11-20' },
  { id: 'LOS ANGELES', city: 'LOS ANGELES', name: 'ARTS DISTRICT', address: '830 E 3RD ST, LA 90013', region: 'US', currency: 'USD', language: 'EN', timezone: 'PST', status: 'OPEN 11-19' },
  { id: 'ONLINE', city: 'ONLINE', name: 'GLOBAL DIRECT HUB', address: 'WORLDWIDE EXPRESS DISPATCH', region: 'GLOBAL', currency: 'USD', language: 'EN', timezone: 'UTC', status: '24/7 LIVE' }
];

interface StoreLocationSelectorProps {
  currentLocationId: string;
  onSelectLocation: (location: StoreLocation) => void;
}

export function StoreLocationSelector({ currentLocationId, onSelectLocation }: StoreLocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeStore = STORE_LOCATIONS.find(loc => loc.id === currentLocationId) || STORE_LOCATIONS[0];

  return (
    <div className="fixed bottom-4 left-4 z-[80] font-typewriter pointer-events-auto">
      {/* Floating Flyout Box */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing when clicking outside on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-xs z-[79] sm:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-12 left-0 mb-2 w-[calc(100vw-2rem)] sm:w-80 max-h-[80vh] bg-paper border border-ink/20 shadow-2xl rounded-lg overflow-hidden flex flex-col z-[80]"
            >
              {/* Header */}
              <div className="p-3 bg-ink/5 border-b border-ink/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 size={12} className="text-ink opacity-70" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink">
                    SELECT STORE LOCATION
                  </span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-ink/50 hover:text-ink transition-colors cursor-pointer rounded"
                  title="Close"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Location List */}
              <div className="p-2 overflow-y-auto space-y-1 divide-y divide-ink/5 max-h-[60vh]">
                {STORE_LOCATIONS.map((loc) => {
                  const isSelected = loc.id === activeStore.id;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded transition-all cursor-pointer flex items-start justify-between gap-2 group ${
                        isSelected 
                          ? 'bg-ink text-paper font-bold shadow-sm' 
                          : 'hover:bg-ink/5 text-ink'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {loc.city}
                          </span>
                          <span className={`text-[7px] px-1 py-[1px] rounded uppercase ${
                            isSelected ? 'bg-paper/20 text-paper' : 'bg-ink/10 text-ink/70'
                          }`}>
                            {loc.timezone}
                          </span>
                        </div>
                        <p className={`text-[8px] uppercase tracking-wide ${
                          isSelected ? 'text-paper/80' : 'text-ink/60'
                        }`}>
                          {loc.name} • {loc.address}
                        </p>
                        <p className={`text-[7px] uppercase font-mono ${
                          isSelected ? 'text-paper/60' : 'text-ink/40'
                        }`}>
                          REGION: {loc.region} | STATUS: {loc.status}
                        </p>
                      </div>

                      {isSelected && (
                        <Check size={12} className="shrink-0 mt-0.5 text-paper" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer status note */}
              <div className="p-2.5 bg-ink/5 border-t border-ink/10 text-[7.5px] text-ink/60 uppercase tracking-widest text-center">
                Inventory & Taxes sync with selected boutique
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent Bottom-Left Corner Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-paper/90 backdrop-blur-md border border-ink/20 shadow-lg hover:border-ink/60 text-ink transition-all rounded-md cursor-pointer select-none group"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="flex items-center gap-1 text-[8.5px] font-bold tracking-wider uppercase">
          <span className="text-ink/50">LOCATION:</span>
          <span className="text-ink underline underline-offset-2 decoration-ink/40 group-hover:decoration-ink">
            {activeStore.city}
          </span>
        </div>
        <span className="text-[7.5px] font-mono text-ink/40 group-hover:text-ink transition-colors">
          [{isOpen ? 'CLOSE' : 'CHANGE'}]
        </span>
      </motion.button>
    </div>
  );
}
