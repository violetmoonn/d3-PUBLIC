import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Globe, LayoutGrid, Menu, MonitorPlay, Moon, ShoppingBag, Sun, User, X, Plus, Clock, Search } from 'lucide-react';
import { AppSettings } from '../types';
import { getMathematicalFontSize, getMathematicalLetterTracking, t } from '../utils/helpers';

const RECENT_SEARCHES_KEY = 'd3_recent_searches';

interface Preferences {
  region: string;
  currency: string;
  language: string;
  units: 'metric' | 'imperial';
}

interface NavbarProps {
  isCartOpen?: boolean;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenSubmission: () => void;
  isAdmin: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onNavigate: (view: any) => void;
  settings: AppSettings;
  currentView: string;
  hasAnnouncements: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onAddProduct?: () => void;
  preferences: Preferences;
  onChangePreferences: (prefs: Preferences) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  isCartOpen = false,
  cartCount, 
  onOpenCart, 
  onOpenAdmin, 
  onOpenSubmission,
  isAdmin, 
  searchTerm, 
  onSearchChange, 
  onNavigate, 
  settings,
  currentView,
  hasAnnouncements,
  theme,
  onToggleTheme,
  onAddProduct,
  preferences,
  onChangePreferences
}) => {
  const [scrollY, setScrollY] = React.useState(0);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isCustomerCareOpen, setIsCustomerCareOpen] = React.useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = React.useState(false);

  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((item: any) => typeof item === 'string');
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
    return [];
  });

  const addRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches:', e);
      }
      return updated;
    });
  };

  const removeRecentSearch = (termToRemove: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item.toLowerCase() !== termToRemove.toLowerCase());
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update recent searches:', e);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
  };

  const handleSelectRecentSearch = (term: string) => {
    onSearchChange(term);
    addRecentSearch(term);
    if (currentView !== 'store') {
      onNavigate('store');
    }
  };

  const isHideLogos = isMobileMenuOpen || isLogoMenuOpen || isCartOpen || isSearchOpen;

  React.useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 20 && currentScrollY > lastScrollY) {
        setIsScrolled(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 20) {
        setIsScrolled(false);
      }
      setScrollY(currentScrollY);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const primaryLinks = [
    { id: 'home', label: t('home') || 'HOME' },
    { id: 'store', label: t('store') },
    { id: 'playground', label: t('playground') || 'PLAYGROUND' },
    { id: 'gallery', label: t('gallery') },
    { id: 'ethos', label: t('ethos') },
    { id: 'sustainability', label: settings.tab_sustainability_label || t('sustainability') },
  ].filter(link => !settings.sections || settings.sections[link.id] !== false);

  const customerCareLinks = [
    { id: 'shipping', label: settings.tab_shipping_label || 'SHIPPING POLICY' },
    { id: 'privacy', label: settings.tab_privacy_label || 'PRIVACY POLICY' },
    { id: 'refund', label: settings.tab_refund_label || 'REFUND POLICY' },
    { id: 'contact', label: settings.tab_contact_label || 'CONTACT' },
    { id: 'affiliates', label: t('affiliates') },
    { id: 'live-chat', label: 'CHAT WITH A LIVE ASSISTANT' }
  ].filter(link => !settings.sections || settings.sections[link.id] !== false);

  return (
    <>
      <header 
        className={`fixed left-0 right-0 z-[60] bg-white text-black border-b border-black/10 shadow-sm transition-all duration-500 ${
          hasAnnouncements ? 'top-0 sm:top-[38px]' : 'top-0'
        } ${
          isScrolled ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between relative select-none">
          {/* Top Left Corner Controls: THREE LINES MENU & SEARCH */}
          <div className="flex items-center gap-3.5 font-sans text-[12px] sm:text-[10.5px] font-semibold tracking-wider text-black leading-none">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (isSearchOpen) setIsSearchOpen(false);
              }}
              className="hover:opacity-50 transition-opacity uppercase focus:outline-none flex items-center justify-center cursor-pointer text-black"
              aria-label={isMobileMenuOpen ? (t('close') || 'CLOSE') : (t('menu') || 'MENU')}
              title={isMobileMenuOpen ? (t('close') || 'CLOSE') : (t('menu') || 'MENU')}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 stroke-[2.25]" />
              ) : (
                <Menu className="w-4 h-4 stroke-[2.25]" />
              )}
            </button>

            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              className="hover:opacity-50 transition-opacity uppercase focus:outline-none flex items-center gap-1.5 cursor-pointer text-black text-[12px] sm:text-[10.5px]"
              aria-label={t('search') || 'SEARCH'}
              title={t('search') || 'SEARCH'}
            >
              <Search className="w-4 h-4 sm:hidden stroke-[2.25]" />
              <span className="hidden sm:inline">SEARCH</span>
            </button>
          </div>

          {/* Top Center Branding: D3COMPOSURE */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity duration-300 ${
              isHideLogos ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <button 
              onClick={() => {
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ 
                fontSize: 'clamp(18px, 2.8vw, 32px)',
                fontFamily: '"Arial Black", "Impact", "Anton", sans-serif',
                letterSpacing: '-0.035em',
                fontWeight: 900,
                color: '#000000'
              }}
              className="font-black uppercase shrink-0 px-2 py-0.5 relative text-center leading-none select-none cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
              title={settings.site_title || 'D3COMPOSURE'}
            >
              {(settings.site_title ? settings.site_title.replace(/_/g, ' ') : 'D3COMPOSURE')}
            </button>
          </div>

          {/* Top Right Controls: SHOPPING BAG (n) */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCart}
              className="hover:opacity-50 transition-opacity uppercase focus:outline-none flex items-center gap-1.5 relative cursor-pointer text-black font-sans text-[12px] sm:text-[10.5px] font-semibold tracking-wider leading-none"
              title={t('checkout_bag')}
              aria-label={t('checkout_bag')}
              id="shopping-bag-btn"
            >
              <div className="sm:hidden flex items-center gap-1">
                <ShoppingBag className="w-4 h-4 stroke-[2.25]" />
                <span className="text-[11px] font-mono font-bold leading-none">({cartCount})</span>
              </div>
              <span className="hidden sm:inline">SHOPPING BAG ({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[65] pointer-events-auto"
            />

            {/* Centered Menu Drawer / Overlay */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="menu-drawer font-sans fixed left-1/2 top-16 sm:top-20 -translate-x-1/2 z-[70] w-[280px] sm:w-[320px] max-w-[90vw] max-h-[82vh] bg-paper border border-ink/15 shadow-2xl rounded-xl flex flex-col justify-between p-5 overflow-y-auto pointer-events-auto text-center"
            >
              <div>
                {/* Search Bar inside Menu */}
                <div className="relative mb-4 pb-2 border-b border-ink/10">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-ink shrink-0">SEARCH:</span>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          onSearchChange(e.target.value);
                          if (currentView !== 'store') {
                            onNavigate('store');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchTerm.trim()) {
                            addRecentSearch(searchTerm);
                          }
                        }}
                        placeholder=""
                        className="w-full bg-transparent text-xs font-mono tracking-[0.15em] text-ink focus:outline-none pb-1 uppercase transition-colors border-b border-ink/20 focus:border-ink text-center"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => onSearchChange('')}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                          aria-label="Clear search"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recent Searches in Drawer */}
                  {recentSearches.length > 0 && (
                    <div className="mt-2.5 font-mono text-[9px] uppercase tracking-wider">
                      <div className="flex items-center justify-between text-ink/40 mb-1">
                        <span className="flex items-center gap-1"><Clock size={9} /> RECENT</span>
                        <button 
                          onClick={clearRecentSearches}
                          className="hover:text-ink transition-colors cursor-pointer text-[8.5px]"
                        >
                          CLEAR
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {recentSearches.map((term) => (
                          <span
                            key={term}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-ink/5 hover:bg-ink/10 text-ink/80 hover:text-ink rounded-none cursor-pointer transition-colors group"
                          >
                            <span onClick={() => {
                              handleSelectRecentSearch(term);
                              setIsMobileMenuOpen(false);
                            }}>
                              {term}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecentSearch(term);
                              }}
                              className="text-ink/30 hover:text-ink transition-colors"
                              title="Remove"
                            >
                              <X size={9} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Links - Clean Center Aligned */}
                <div className="space-y-1.5 mb-4">
                  {primaryLinks.map(link => (
                    <a 
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (link.id === 'size-chart') {
                          window.dispatchEvent(new CustomEvent('open-size-chart'));
                        } else {
                          onNavigate(link.id); 
                        }
                        setIsMobileMenuOpen(false); 
                      }}
                      className={`block w-full text-center font-sans text-[13px] tracking-wide uppercase transition-all py-1.5 px-2 rounded hover:bg-ink/5 ${
                        currentView === link.id ? 'text-ink font-extrabold bg-ink/5' : 'text-ink/70 hover:text-ink font-medium'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}

                  <div className="my-2 border-t border-ink/10 pt-1" />

                  {customerCareLinks.map(link => (
                    <a 
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (link.id === 'live-chat') {
                          window.dispatchEvent(new CustomEvent('open-live-chat'));
                        } else {
                          onNavigate(link.id); 
                        }
                        setIsMobileMenuOpen(false); 
                      }}
                      className={`block w-full text-center font-sans text-[12px] tracking-wide uppercase transition-all py-1 px-2 rounded hover:bg-ink/5 ${
                        currentView === link.id ? 'text-ink font-extrabold bg-ink/5' : 'text-ink/60 hover:text-ink font-medium'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3 border-t border-ink/10 flex items-center justify-center gap-3 font-sans text-[11px] font-medium uppercase tracking-widest text-ink/50 text-center">
                <span>D3COMPOSURE ARCHIVE</span>
                <span>•</span>
                <span>EST. 2026</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Drawer Panel (Left Horizontal Pull) */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[65] pointer-events-auto"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="search-drawer font-mono fixed left-0 top-0 bottom-0 z-[70] w-[280px] sm:w-[360px] max-w-[85vw] h-full bg-paper border-r border-ink/10 shadow-2xl flex flex-col justify-between p-6 sm:p-8 overflow-y-auto pointer-events-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-ink/10 mb-6">
                  <span className="text-[12px] font-bold tracking-[0.2em] text-ink uppercase">SEARCH</span>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 text-ink/70 hover:text-ink transition-colors cursor-pointer"
                    aria-label="Close search"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="relative mb-6">
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => {
                      onSearchChange(e.target.value);
                      if (currentView !== 'store') {
                        onNavigate('store');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchTerm.trim()) {
                        addRecentSearch(searchTerm);
                      }
                    }}
                    placeholder="ENTER QUERY..."
                    className="w-full bg-transparent border-b border-ink text-[12px] font-mono tracking-[0.15em] text-ink focus:outline-none pb-2 uppercase transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-0 top-0 text-[10px] font-mono font-bold tracking-widest text-ink/40 hover:text-ink uppercase cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Recent Searches Overlay Section */}
                {recentSearches.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-ink/10 font-mono text-[12px]">
                    <div className="flex items-center justify-between text-ink/50 tracking-[0.15em] uppercase mb-3">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> RECENT SEARCHES</span>
                      <button 
                        onClick={clearRecentSearches}
                        className="hover:text-ink text-[10px] transition-colors cursor-pointer"
                      >
                        CLEAR ALL
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {recentSearches.map((term) => (
                        <div 
                          key={term}
                          className="flex items-center justify-between p-2 bg-ink/5 hover:bg-ink/10 text-ink text-[12px] tracking-wider uppercase transition-colors cursor-pointer border border-ink/10 group"
                          onClick={() => {
                            handleSelectRecentSearch(term);
                            setIsSearchOpen(false);
                          }}
                        >
                          <span>{term}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(term);
                            }}
                            className="text-ink/30 hover:text-ink transition-colors p-1"
                            title="Remove search term"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 flex items-center justify-between font-mono text-[12px] font-medium uppercase tracking-widest text-ink/50">
                <span>D3COMPOSURE SEARCH</span>
                <span>ARCHIVE</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
