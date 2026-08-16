import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Globe, LayoutGrid, Menu, MonitorPlay, Moon, ShoppingBag, Sun, User, X, Plus, Clock, Search } from 'lucide-react';
import { AppSettings, CartItem, DiscountCode } from '../types';
import { getMathematicalFontSize, getMathematicalLetterTracking, t } from '../utils/helpers';
import { CartReceiptDropdown } from './CartReceiptDropdown';

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
  cart?: CartItem[];
  onRemoveFromCart?: (id: string | number, size: string) => void;
  onCheckout?: () => void;
  discount?: DiscountCode | null;
  onApplyDiscount?: (code: string) => void;
  onRemoveDiscount?: () => void;
  onUpdateQuantity?: (id: string | number, size: string, quantity: number) => void;
  onUpdateSize?: (id: string | number, oldSize: string, newSize: string) => void;
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
  cart = [],
  onRemoveFromCart,
  onCheckout,
  discount = null,
  onApplyDiscount,
  onRemoveDiscount,
  onUpdateQuantity,
  onUpdateSize,
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
  const [isCorporateHovered, setIsCorporateHovered] = React.useState(false);
  const [isCorporateOpen, setIsCorporateOpen] = React.useState(false);
  const [isLegalHovered, setIsLegalHovered] = React.useState(false);
  const [isLegalOpen, setIsLegalOpen] = React.useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

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
    { id: 'home', label: t('home') || 'Home' },
    { id: 'store', label: t('store') || 'Shop' },
    { id: 'gallery', label: t('gallery') || 'Gallery' },
  ].filter(link => !settings.sections || settings.sections[link.id] !== false);

  const corporateLinks = [
    { id: 'ethos', label: t('ethos') || 'About' },
    { id: 'sustainability', label: settings.tab_sustainability_label || t('sustainability') || 'Sustainability' },
    { id: 'contact', label: settings.tab_contact_label || 'Contact' },
    { id: 'affiliates', label: t('affiliates') || 'Affiliates' }
  ].filter(link => !settings.sections || settings.sections[link.id] !== false);

  const legalLinks = [
    { id: 'terms', label: settings.tab_terms_label || 'Terms of Service' },
    { id: 'privacy', label: settings.tab_privacy_label || 'Privacy Policy' },
    { id: 'shipping', label: settings.tab_shipping_label || 'Shipping Policy' },
    { id: 'refund', label: settings.tab_refund_label || 'Refund Policy' },
  ].filter(link => !settings.sections || settings.sections[link.id] !== false);

  return (
    <>
      <header 
        className={`fixed left-0 right-0 z-[60] bg-white text-black shadow-sm transition-all duration-500 ${
          hasAnnouncements ? 'top-0 sm:top-[38px]' : 'top-0'
        } ${
          isScrolled ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between relative select-none">
          {/* Top Left Corner Controls: THREE LINES MENU & SEARCH */}
          <div className="flex items-center gap-3.5 font-sans text-[12px] sm:text-[11px] font-normal text-black leading-none">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (isSearchOpen) setIsSearchOpen(false);
              }}
              className="hover:opacity-50 transition-opacity focus:outline-none flex items-center justify-center cursor-pointer text-black"
              aria-label={isMobileMenuOpen ? (t('close') || 'Back') : (t('menu') || 'Menu')}
              title={isMobileMenuOpen ? (t('close') || 'Back') : (t('menu') || 'Menu')}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 stroke-[1.5]" />
              ) : (
                <Menu className="w-4 h-4 stroke-[1.5]" />
              )}
            </button>

            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              className="hover:opacity-50 transition-opacity focus:outline-none flex items-center gap-1.5 cursor-pointer text-black text-[12px] sm:text-[11px]"
              aria-label={t('search') || 'Search'}
              title={t('search') || 'Search'}
            >
              <Search className="w-4 h-4 sm:hidden stroke-[1.5]" />
              <span className="hidden sm:inline">Search</span>
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
                fontSize: 'clamp(14px, 1.8vw, 19px)',
                fontFamily: '"Arial", "Helvetica Neue", Helvetica, sans-serif',
                letterSpacing: '0.12em',
                fontWeight: 600,
                color: '#111111'
              }}
              className="uppercase shrink-0 px-2 py-0.5 relative text-center leading-none select-none cursor-pointer opacity-85 hover:opacity-100 transition-opacity focus:outline-none tracking-widest"
              title={settings.site_title || 'D3COMPOSURE'}
              aria-label={settings.site_title || 'D3COMPOSURE'}
              id="navbar-d3composure-brand-btn"
            >
              {(settings.site_title ? settings.site_title.replace(/_/g, ' ') : 'D3COMPOSURE')}
            </button>
          </div>

          {/* Top Right Controls: SHOPPING BAG (n) + DROPDOWN RECEIPT */}
          <div className="flex items-center gap-3 relative" id="navbar-shopping-bag-container">
            <button
              onClick={() => {
                setIsReceiptOpen(prev => !prev);
              }}
              className="hover:opacity-50 transition-opacity focus:outline-none flex items-center gap-1.5 relative cursor-pointer text-black font-sans text-[12px] sm:text-[11px] font-normal leading-none"
              title={t('checkout_bag') || 'Shopping Bag'}
              aria-label={t('checkout_bag') || 'Shopping Bag'}
              id="shopping-bag-btn"
            >
              <div className="sm:hidden flex items-center gap-1">
                <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                {cartCount > 0 && (
                  <span className="text-[11px] font-mono font-medium leading-none">({cartCount})</span>
                )}
              </div>
              <span className="hidden sm:inline">
                Shopping Bag{cartCount > 0 ? ` (${cartCount})` : ''}
              </span>
            </button>

            {/* Dropdown Receipt-Like Form */}
            <CartReceiptDropdown 
              isOpen={isReceiptOpen}
              onClose={() => setIsReceiptOpen(false)}
              items={cart}
              onRemove={(id, size) => {
                if (onRemoveFromCart) onRemoveFromCart(id, size);
              }}
              onCheckout={() => {
                setIsReceiptOpen(false);
                if (onCheckout) onCheckout();
              }}
              discount={discount}
              onApplyDiscount={(code) => {
                if (onApplyDiscount) onApplyDiscount(code);
              }}
              onRemoveDiscount={onRemoveDiscount}
              onUpdateQuantity={(id, size, qty) => {
                if (onUpdateQuantity) onUpdateQuantity(id, size, qty);
              }}
              onUpdateSize={(id, oldSize, newSize) => {
                if (onUpdateSize) onUpdateSize(id, oldSize, newSize);
              }}
              onNavigateToCart={() => {
                setIsReceiptOpen(false);
                onNavigate('cart');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToStore={() => {
                setIsReceiptOpen(false);
                onNavigate('store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
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

            {/* Vertical banner on left half of screen */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="menu-drawer font-sans fixed left-0 top-0 bottom-0 z-[70] w-[250px] sm:w-[290px] max-w-[85vw] h-full bg-paper shadow-2xl flex flex-col justify-between p-4 sm:p-5 overflow-y-auto pointer-events-auto"
            >
              <div>
                {/* Navigation Links - Clean SSENSE Sans-Serif Font */}
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
                      className={`block w-full text-left font-sans text-[13px] tracking-wide transition-all py-1 px-1.5 rounded hover:bg-ink/5 ${
                        currentView === link.id ? 'text-ink font-semibold bg-ink/5' : 'text-ink/70 hover:text-ink font-normal'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}

                  {/* Merged Corporate Item with Hover / Expandable Sub-tabs */}
                  {corporateLinks.length > 0 && (
                    <div 
                      className="relative group/corporate pt-0.5"
                      onMouseEnter={() => setIsCorporateHovered(true)}
                      onMouseLeave={() => setIsCorporateHovered(false)}
                    >
                      <button
                        onClick={() => setIsCorporateOpen(!isCorporateOpen)}
                        className={`flex items-center justify-between w-full text-left font-sans text-[13px] tracking-wide transition-all py-1 px-1.5 rounded hover:bg-ink/5 cursor-pointer ${
                          ['ethos', 'sustainability', 'contact', 'affiliates'].includes(currentView) ? 'text-ink font-semibold bg-ink/5' : 'text-ink/70 hover:text-ink font-normal'
                        }`}
                      >
                        <span>Corporate</span>
                        <ChevronDown 
                          size={12} 
                          className={`transition-transform duration-200 opacity-60 ${
                            isCorporateHovered || isCorporateOpen ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>

                      {/* Sub-tabs container */}
                      <AnimatePresence>
                        {(isCorporateHovered || isCorporateOpen) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="pl-3 py-1 space-y-1 border-l border-ink/15 ml-2 mt-0.5 overflow-hidden"
                          >
                            {corporateLinks.map(subLink => (
                              <a
                                key={subLink.id}
                                href={`#${subLink.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onNavigate(subLink.id);
                                  setIsMobileMenuOpen(false);
                                  setIsCorporateOpen(false);
                                }}
                                className={`block w-full text-left font-sans text-[12px] tracking-wide py-0.5 px-1 rounded transition-colors ${
                                  currentView === subLink.id
                                    ? 'text-ink font-medium bg-ink/5'
                                    : 'text-ink/60 hover:text-ink'
                                }`}
                              >
                                {subLink.label}
                              </a>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Merged Legal Item with Hover / Expandable Sub-tabs directly below Corporate */}
                  {legalLinks.length > 0 && (
                    <div 
                      className="relative group/legal pt-0.5"
                      onMouseEnter={() => setIsLegalHovered(true)}
                      onMouseLeave={() => setIsLegalHovered(false)}
                    >
                      <button
                        onClick={() => setIsLegalOpen(!isLegalOpen)}
                        className={`flex items-center justify-between w-full text-left font-sans text-[13px] tracking-wide transition-all py-1 px-1.5 rounded hover:bg-ink/5 cursor-pointer ${
                          ['privacy', 'shipping', 'refund', 'terms'].includes(currentView) ? 'text-ink font-semibold bg-ink/5' : 'text-ink/70 hover:text-ink font-normal'
                        }`}
                      >
                        <span>Legal</span>
                        <ChevronDown 
                          size={12} 
                          className={`transition-transform duration-200 opacity-60 ${
                            isLegalHovered || isLegalOpen ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>

                      {/* Sub-tabs container */}
                      <AnimatePresence>
                        {(isLegalHovered || isLegalOpen) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="pl-3 py-1 space-y-1 border-l border-ink/15 ml-2 mt-0.5 overflow-hidden"
                          >
                            {legalLinks.map(subLink => (
                              <a
                                key={subLink.id}
                                href={`#${subLink.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onNavigate(subLink.id);
                                  setIsMobileMenuOpen(false);
                                  setIsLegalOpen(false);
                                }}
                                className={`block w-full text-left font-sans text-[11px] tracking-wide py-0.5 px-1 rounded transition-colors ${
                                  currentView === subLink.id
                                    ? 'text-ink font-medium'
                                    : 'text-ink/60 hover:text-ink'
                                }`}
                              >
                                {subLink.label}
                              </a>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Newsletter / Sign Up Button */}
                  <div className="pt-2 border-t border-ink/10 mt-2">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-subscribe-modal'));
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left font-sans text-[13px] tracking-wide text-ink/80 hover:text-ink transition-all py-1 px-1.5 rounded hover:bg-ink/5 cursor-pointer group"
                    >
                      <span className="font-normal">Newsletter Sign Up</span>
                      <span className="text-[9px] font-mono tracking-wider font-medium uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        10% OFF
                      </span>
                    </button>
                  </div>

                  {/* Account / Client Access Gateway Link */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        onOpenAdmin();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left font-sans text-[13px] tracking-wide text-ink/70 hover:text-ink transition-all py-1 px-1.5 rounded hover:bg-ink/5 cursor-pointer group"
                    >
                      <span className="font-normal">{isAdmin ? 'Admin Dashboard' : 'Account Login'}</span>
                      <span className="text-[9px] font-mono tracking-widest uppercase opacity-40 px-1.5 py-0.5 bg-ink/5 rounded group-hover:bg-ink group-hover:text-paper transition-all">
                        {isAdmin ? 'ACTIVE' : 'ACCESS'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3 flex items-center justify-between font-sans text-[11px] font-medium tracking-wide text-ink/50 border-t border-ink/5">
                <button
                  onClick={() => {
                    onOpenAdmin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="hover:text-ink transition-colors cursor-pointer"
                >
                  {isAdmin ? 'Admin Portal' : 'Account Login'}
                </button>
                <span>Est. 2026</span>
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
              className="search-drawer font-mono fixed left-0 top-0 bottom-0 z-[70] w-[280px] sm:w-[360px] max-w-[85vw] h-full bg-paper shadow-2xl flex flex-col justify-between p-6 sm:p-8 overflow-y-auto pointer-events-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-6">
                  <span className="text-[12px] font-semibold tracking-wider text-ink">Search</span>
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
                    placeholder="Enter query..."
                    className="w-full bg-transparent border-b border-ink text-[12px] font-mono tracking-wider text-ink focus:outline-none pb-2 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-0 top-0 text-[10px] font-mono font-medium tracking-wider text-ink/40 hover:text-ink cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Recent Searches Overlay Section */}
                {recentSearches.length > 0 && (
                  <div className="mt-4 pt-3 font-mono text-[12px]">
                    <div className="flex items-center justify-between text-ink/50 tracking-wider mb-3">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> Recent Searches</span>
                      <button 
                        onClick={clearRecentSearches}
                        className="hover:text-ink text-[10px] transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {recentSearches.map((term) => (
                        <div 
                          key={term}
                          className="flex items-center justify-between p-2 bg-ink/5 hover:bg-ink/10 text-ink text-[12px] tracking-wider transition-colors cursor-pointer group rounded"
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
              <div className="pt-6 flex items-center justify-between font-mono text-[12px] font-medium tracking-wider text-ink/50">
                <span>D3composure Search</span>
                <span>Archive</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
