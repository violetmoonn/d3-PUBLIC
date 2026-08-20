import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Globe, LayoutGrid, Menu, MonitorPlay, Moon, Sun, User, X, Plus, Clock, Search, ArrowRight, Tag, Lock, Sparkles } from 'lucide-react';
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
  onOpenAirtable?: () => void;
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
  onOpenAirtable,
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
          hasAnnouncements ? 'top-[36px] sm:top-[38px]' : 'top-0'
        } ${
          isScrolled ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-8 h-16 sm:h-20 flex items-center justify-between relative select-none">
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
              className="hover:opacity-50 transition-opacity focus:outline-none flex items-center gap-1.5 cursor-pointer text-black text-[12px] sm:text-[11px] font-normal leading-none"
              aria-label={t('search') || 'Search'}
              title={t('search') || 'Search'}
            >
              <Search className="w-4 h-4 sm:hidden stroke-[1.5]" />
              <span className="hidden sm:inline lowercase">search</span>
            </button>
          </div>

          {/* Top Center Branding: D3COMPOSURE */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center transition-opacity duration-300 ${
              isHideLogos ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <button 
              onClick={() => {
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ 
                fontSize: 'clamp(15px, 2vw, 20px)',
                fontFamily: '"Arial Black", "Impact", "Anton", sans-serif',
                letterSpacing: '-0.025em',
                fontWeight: 900,
                color: '#000000'
              }}
              className="uppercase shrink-0 px-3 py-1 relative text-center leading-none select-none cursor-pointer opacity-95 hover:opacity-100 transition-opacity focus:outline-none"
              title={settings.site_title || 'D3COMPOSURE'}
              aria-label={settings.site_title || 'D3COMPOSURE'}
              id="navbar-d3composure-brand-btn"
            >
              {(settings.site_title ? settings.site_title.replace(/_/g, ' ') : 'D3COMPOSURE')}
            </button>
          </div>

          {/* Top Right Controls: SHOPPING CART (n) + DROPDOWN RECEIPT */}
          <div className="flex items-center gap-3 relative" id="navbar-shopping-bag-container">
            <button
              onClick={() => {
                setIsReceiptOpen(prev => !prev);
              }}
              className="hover:opacity-50 transition-opacity focus:outline-none flex items-center relative cursor-pointer text-black font-sans text-[12px] sm:text-[11px] font-normal lowercase tracking-normal leading-none"
              title={t('checkout_bag') || 'Shopping Cart'}
              aria-label={t('checkout_bag') || 'Shopping Cart'}
              id="shopping-bag-btn"
            >
              <span>
                cart{cartCount > 0 ? ` (${cartCount})` : ''}
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

            {/* Vertical receipt drawer on left of screen */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="menu-drawer font-mono fixed left-0 top-0 bottom-0 z-[70] w-[290px] sm:w-[330px] max-w-[85vw] h-full bg-white text-black shadow-2xl flex flex-col justify-between overflow-y-auto pointer-events-auto select-text border-r border-black/10"
              style={{
                filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.15)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))',
              }}
            >
              {/* Top Serrated Edge (Receipt Paper Cut) */}
              <div className="w-full h-2 overflow-hidden leading-none flex text-white fill-white shrink-0">
                <svg
                  viewBox="0 0 400 8"
                  preserveAspectRatio="none"
                  className="w-full h-2 fill-white block"
                >
                  <path d="M0,8 L5,0 L10,8 L15,0 L20,8 L25,0 L30,8 L35,0 L40,8 L45,0 L50,8 L55,0 L60,8 L65,0 L70,8 L75,0 L80,8 L85,0 L90,8 L95,0 L100,8 L105,0 L110,8 L115,0 L120,8 L125,0 L130,8 L135,0 L140,8 L145,0 L150,8 L155,0 L160,8 L165,0 L170,8 L175,0 L180,8 L185,0 L190,8 L195,0 L200,8 L205,0 L210,8 L215,0 L220,8 L225,0 L230,8 L235,0 L240,8 L245,0 L250,8 L255,0 L260,8 L265,0 L270,8 L275,0 L280,8 L285,0 L290,8 L295,0 L300,8 L305,0 L310,8 L315,0 L320,8 L325,0 L330,8 L335,0 L340,8 L345,0 L350,8 L355,0 L360,8 L365,0 L370,8 L375,0 L380,8 L385,0 L390,8 L395,0 L400,8 Z" />
                </svg>
              </div>

              {/* Main Receipt Body */}
              <div className="px-4 sm:px-5 py-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Receipt Header */}
                  <div className="text-center pb-3 border-b border-dashed border-black/25 relative">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="absolute right-0 top-0 p-1 text-black/50 hover:text-black transition-colors cursor-pointer"
                      title="Close menu"
                      aria-label="Close menu"
                    >
                      <X size={14} />
                    </button>

                    <div 
                      style={{ fontFamily: '"Arial Black", "Impact", "Anton", sans-serif', letterSpacing: '-0.02em', fontWeight: 900 }}
                      className="text-[13px] uppercase text-black"
                    >
                      {settings.site_title || 'D3COMPOSURE'}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-black/60 mt-0.5">
                      SITE DIRECTORY // INDEX
                    </div>
                    <div className="text-[8.5px] uppercase tracking-wider text-black/40 mt-1 flex items-center justify-center gap-2">
                      <span>DATE: {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
                      <span>•</span>
                      <span>DEPT: ARCHIVE</span>
                    </div>
                    <div className="text-[8px] uppercase tracking-widest text-black/40 mt-0.5">
                      INDEX REF #D3-DIR // REV-01
                    </div>
                  </div>

                  {/* Receipt Column Headers */}
                  <div className="flex items-center justify-between text-[8.5px] uppercase tracking-wider text-black/45 pt-2.5 pb-1 mb-2 border-b border-black/10">
                    <span className="w-8">IDX</span>
                    <span className="flex-1 px-1">DESTINATION</span>
                    <span className="text-right">STATUS</span>
                  </div>

                  {/* Navigation List Items */}
                  <div className="space-y-1">
                    {primaryLinks.map((link) => {
                      const isActive = currentView === link.id;
                      return (
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
                          className={`flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xs transition-all text-[11px] tracking-tight group cursor-pointer ${
                            isActive 
                              ? 'bg-black text-white font-bold' 
                              : 'text-black/80 hover:text-black hover:bg-black/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="uppercase tracking-wide font-medium">
                              {link.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {isActive ? (
                              <span className="text-[7.5px] uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded-xs">
                                CURRENT
                              </span>
                            ) : (
                              <ArrowRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                            )}
                          </div>
                        </a>
                      );
                    })}

                    {/* Expandable Corporate Manifest Group */}
                    {corporateLinks.length > 0 && (
                      <div className="pt-0.5">
                        <button
                          onClick={() => setIsCorporateOpen(!isCorporateOpen)}
                          className={`flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xs transition-all text-[11px] tracking-tight group cursor-pointer ${
                            ['ethos', 'sustainability', 'contact', 'affiliates'].includes(currentView)
                              ? 'bg-black/5 text-black font-semibold'
                              : 'text-black/80 hover:text-black hover:bg-black/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="uppercase tracking-wide font-medium">
                              CORPORATE
                            </span>
                            <span className="text-[8px] text-black/40 font-mono">
                              ({corporateLinks.length})
                            </span>
                          </div>

                          <ChevronDown 
                            size={12} 
                            className={`transition-transform duration-200 opacity-60 ${
                              isCorporateOpen ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>

                        {/* Corporate Sub-Links */}
                        <AnimatePresence>
                          {isCorporateOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="pl-3 py-1 space-y-0.5 border-l border-dashed border-black/20 ml-4 my-1 overflow-hidden"
                            >
                              {corporateLinks.map((subLink) => {
                                const isSubActive = currentView === subLink.id;
                                return (
                                  <a
                                    key={subLink.id}
                                    href={`#${subLink.id}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onNavigate(subLink.id);
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-between w-full text-left py-1 px-1.5 text-[10px] uppercase tracking-wide transition-colors ${
                                      isSubActive
                                        ? 'text-black font-bold bg-black/10'
                                        : 'text-black/60 hover:text-black hover:bg-black/5'
                                    }`}
                                  >
                                    <span>{subLink.label}</span>
                                    {isSubActive && <span className="text-[7.5px] bg-black text-white px-1 py-0.2">ACTIVE</span>}
                                  </a>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Expandable Legal Manifest Group */}
                    {legalLinks.length > 0 && (
                      <div className="pt-0.5">
                        <button
                          onClick={() => setIsLegalOpen(!isLegalOpen)}
                          className={`flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xs transition-all text-[11px] tracking-tight group cursor-pointer ${
                            ['privacy', 'shipping', 'refund', 'terms'].includes(currentView)
                              ? 'bg-black/5 text-black font-semibold'
                              : 'text-black/80 hover:text-black hover:bg-black/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="uppercase tracking-wide font-medium">
                              LEGAL
                            </span>
                            <span className="text-[8px] text-black/40 font-mono">
                              ({legalLinks.length})
                            </span>
                          </div>

                          <ChevronDown 
                            size={12} 
                            className={`transition-transform duration-200 opacity-60 ${
                              isLegalOpen ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>

                        {/* Legal Sub-Links */}
                        <AnimatePresence>
                          {isLegalOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="pl-3 py-1 space-y-0.5 border-l border-dashed border-black/20 ml-4 my-1 overflow-hidden"
                            >
                              {legalLinks.map((subLink) => {
                                const isSubActive = currentView === subLink.id;
                                return (
                                  <a
                                    key={subLink.id}
                                    href={`#${subLink.id}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onNavigate(subLink.id);
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-between w-full text-left py-1 px-1.5 text-[10px] uppercase tracking-wide transition-colors ${
                                      isSubActive
                                        ? 'text-black font-bold bg-black/10'
                                        : 'text-black/60 hover:text-black hover:bg-black/5'
                                    }`}
                                  >
                                    <span>{subLink.label}</span>
                                    {isSubActive && <span className="text-[7.5px] bg-black text-white px-1 py-0.2">ACTIVE</span>}
                                  </a>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Section Divider for Special Utilities */}
                  <div className="pt-2 mt-2 border-t border-dashed border-black/20 space-y-1">
                    {/* Newsletter / Discount Voucher */}
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-subscribe-modal'));
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xs text-[10.5px] text-black/80 hover:text-black hover:bg-black/5 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Tag size={11} className="text-black/50" />
                        <span className="uppercase tracking-tight font-medium">VIP NEWSLETTER</span>
                      </div>
                      <span className="text-[8px] font-mono tracking-wider font-bold uppercase text-black border border-dashed border-black/30 px-1 py-0.5">
                        10% OFF
                      </span>
                    </button>

                    {/* Account Access Gateway */}
                    <button
                      onClick={() => {
                        onOpenAdmin();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xs text-[10.5px] text-black/80 hover:text-black hover:bg-black/5 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Lock size={11} className="text-black/50" />
                        <span className="uppercase tracking-tight font-medium">
                          {isAdmin ? 'ADMIN PORTAL' : 'ACCOUNT LOGIN'}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono tracking-widest uppercase bg-black/5 px-1.5 py-0.5 text-black/70 group-hover:bg-black group-hover:text-white transition-colors">
                        {isAdmin ? 'ACTIVE' : 'ACCESS'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Receipt Footer Archival Stamp */}
                <div className="pt-3 mt-3 border-t border-dashed border-black/25 text-center space-y-1">
                  <div className="text-[8px] uppercase tracking-widest text-black/50">
                    OFFICIAL DIRECTORY // KEEP FOR ARCHIVES
                  </div>
                  <div className="text-[7.5px] tracking-[0.2em] text-black/35 font-mono uppercase">
                    VERIFIED ARTIFACT CATALOG
                  </div>
                </div>
              </div>

              {/* Bottom Serrated Edge (Receipt Paper Cut) */}
              <div className="w-full h-2 overflow-hidden leading-none flex text-white fill-white rotate-180 shrink-0">
                <svg
                  viewBox="0 0 400 8"
                  preserveAspectRatio="none"
                  className="w-full h-2 fill-white block"
                >
                  <path d="M0,8 L5,0 L10,8 L15,0 L20,8 L25,0 L30,8 L35,0 L40,8 L45,0 L50,8 L55,0 L60,8 L65,0 L70,8 L75,0 L80,8 L85,0 L90,8 L95,0 L100,8 L105,0 L110,8 L115,0 L120,8 L125,0 L130,8 L135,0 L140,8 L145,0 L150,8 L155,0 L160,8 L165,0 L170,8 L175,0 L180,8 L185,0 L190,8 L195,0 L200,8 L205,0 L210,8 L215,0 L220,8 L225,0 L230,8 L235,0 L240,8 L245,0 L250,8 L255,0 L260,8 L265,0 L270,8 L275,0 L280,8 L285,0 L290,8 L295,0 L300,8 L305,0 L310,8 L315,0 L320,8 L325,0 L330,8 L335,0 L340,8 L345,0 L350,8 L355,0 L360,8 L365,0 L370,8 L375,0 L380,8 L385,0 L390,8 L395,0 L400,8 Z" />
                </svg>
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
