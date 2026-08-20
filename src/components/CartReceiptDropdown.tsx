import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Check, 
  Tag, 
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { CartItem, DiscountCode } from '../types';
import { formatPrice } from '../utils/helpers';

interface CartReceiptDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string | number, size: string) => void;
  onCheckout: () => void;
  discount: DiscountCode | null;
  onApplyDiscount: (code: string) => void;
  onRemoveDiscount?: () => void;
  onUpdateQuantity: (id: string | number, size: string, quantity: number) => void;
  onUpdateSize: (id: string | number, oldSize: string, newSize: string) => void;
  onNavigateToCart: () => void;
  onNavigateToStore: () => void;
}

export const CartReceiptDropdown: React.FC<CartReceiptDropdownProps> = ({
  isOpen,
  onClose,
  items,
  onRemove,
  onCheckout,
  discount,
  onApplyDiscount,
  onRemoveDiscount,
  onUpdateQuantity,
  onUpdateSize,
  onNavigateToCart,
  onNavigateToStore,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountMessage, setDiscountMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if click was on shopping bag button
        const target = event.target as HTMLElement;
        if (target.closest('#shopping-bag-btn') || target.closest('#navbar-shopping-bag-container')) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, onClose]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discount 
    ? (discount.type === 'PERCENT' ? subtotal * (discount.value / 100) : discount.value) 
    : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;
    const cleanCode = discountCode.trim().toUpperCase();
    if (cleanCode === 'WELCOME10' || cleanCode === 'VIP10' || cleanCode === 'D3COMPOSURE') {
      onApplyDiscount(cleanCode);
      setDiscountMessage({ text: '10% DISCOUNT APPLIED', isError: false });
      setDiscountCode('');
    } else {
      setDiscountMessage({ text: 'INVALID DISCOUNT CODE', isError: true });
    }
  };

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeString = currentDate.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile devices to close on tap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={onClose}
          />

          {/* Receipt Dropdown Container */}
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-[380px] md:w-[400px] z-50 origin-top-right select-text font-mono"
            style={{
              filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.15)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))',
            }}
          >
            {/* Top Serrated Edge (Receipt Paper Cut) */}
            <div className="w-full h-2 overflow-hidden leading-none flex text-white fill-white">
              <svg
                viewBox="0 0 400 8"
                preserveAspectRatio="none"
                className="w-full h-2 fill-white block"
              >
                <path d="M0,8 L5,0 L10,8 L15,0 L20,8 L25,0 L30,8 L35,0 L40,8 L45,0 L50,8 L55,0 L60,8 L65,0 L70,8 L75,0 L80,8 L85,0 L90,8 L95,0 L100,8 L105,0 L110,8 L115,0 L120,8 L125,0 L130,8 L135,0 L140,8 L145,0 L150,8 L155,0 L160,8 L165,0 L170,8 L175,0 L180,8 L185,0 L190,8 L195,0 L200,8 L205,0 L210,8 L215,0 L220,8 L225,0 L230,8 L235,0 L240,8 L245,0 L250,8 L255,0 L260,8 L265,0 L270,8 L275,0 L280,8 L285,0 L290,8 L295,0 L300,8 L305,0 L310,8 L315,0 L320,8 L325,0 L330,8 L335,0 L340,8 L345,0 L350,8 L355,0 L360,8 L365,0 L370,8 L375,0 L380,8 L385,0 L390,8 L395,0 L400,8 Z" />
              </svg>
            </div>

            {/* Main Receipt Body */}
            <div className="bg-white text-black border-x border-black/10 px-4 sm:px-5 py-4 max-h-[82vh] overflow-y-auto flex flex-col justify-between">
              
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-black/25 relative">
                <button
                  onClick={onClose}
                  className="absolute right-0 top-0 p-1 text-black/50 hover:text-black transition-colors cursor-pointer"
                  title="Close receipt"
                  aria-label="Close receipt"
                >
                  <X size={14} />
                </button>

                <div 
                  style={{ fontFamily: '"Arial Black", "Impact", "Anton", sans-serif', letterSpacing: '-0.02em', fontWeight: 900 }}
                  className="text-[13px] uppercase text-black"
                >
                  D3COMPOSURE
                </div>
                <div className="text-[9px] uppercase tracking-widest text-black/60 mt-0.5">
                  OFFICIAL REGISTER RECEIPT
                </div>
                <div className="text-[8.5px] uppercase tracking-wider text-black/40 mt-1 flex items-center justify-center gap-2">
                  <span>DATE: {dateString}</span>
                  <span>•</span>
                  <span>TIME: {timeString}</span>
                </div>
                <div className="text-[8px] uppercase tracking-widest text-black/40 mt-0.5">
                  TRANS #{Math.abs(dateString.split('').reduce((a,b) => (a<<5)-a+b.charCodeAt(0), 0)).toString().slice(0, 6)} // TERM-01
                </div>
              </div>

              {/* Items List or Empty State */}
              {items.length === 0 ? (
                <div className="py-8 text-center space-y-2.5">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium tracking-wider uppercase text-black">
                      YOUR CART IS EMPTY
                    </p>
                    <p className="text-[9px] tracking-wide uppercase text-black/50">
                      NO ITEMS SCANNED TO THIS RECEIPT
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToStore();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <span>EXPLORE COLLECTION</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <div className="py-3 space-y-3">
                  {/* Table Header */}
                  <div className="flex items-center justify-between text-[8.5px] uppercase tracking-wider text-black/45 pb-1 border-b border-black/10">
                    <span className="w-8">QTY</span>
                    <span className="flex-1 px-2">ITEM / SIZE</span>
                    <span className="text-right w-16">AMOUNT</span>
                  </div>

                  {/* Item Rows */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {items.map((item) => {
                      const itemImg = (item.images?.[0] as any)?.url || item.images?.[0] || '';
                      return (
                        <div
                          key={`${item.id}-${item.selectedSize}`}
                          className="flex items-start justify-between text-[10px] tracking-tight group pt-1 pb-2 border-b border-dashed border-black/10 last:border-b-0"
                        >
                          {/* Qty Controls */}
                          <div className="w-8 flex flex-col items-center justify-start gap-1">
                            <span className="text-[10px] font-medium text-black">
                              {item.quantity}x
                            </span>
                            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    onUpdateQuantity(item.id, item.selectedSize, item.quantity - 1);
                                  } else {
                                    onRemove(item.id, item.selectedSize);
                                  }
                                }}
                                className="w-3.5 h-3.5 flex items-center justify-center bg-black/5 hover:bg-black hover:text-white rounded text-[8px] transition-colors cursor-pointer"
                                title="Decrease"
                              >
                                <Minus size={8} />
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateQuantity(item.id, item.selectedSize, item.quantity + 1);
                                }}
                                className="w-3.5 h-3.5 flex items-center justify-center bg-black/5 hover:bg-black hover:text-white rounded text-[8px] transition-colors cursor-pointer"
                                title="Increase"
                              >
                                <Plus size={8} />
                              </button>
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 px-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] uppercase font-medium text-black leading-tight truncate">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[8.5px] text-black/60">
                                <span>SIZE: {item.selectedSize || 'OS'}</span>
                                <span>•</span>
                                <span>{formatPrice(item.price)} EA</span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Delete */}
                          <div className="w-16 text-right flex flex-col items-end justify-between">
                            <span className="font-medium text-black text-[10.5px]">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => onRemove(item.id, item.selectedSize)}
                              className="text-black/30 hover:text-red-600 transition-colors p-0.5 cursor-pointer mt-1 opacity-0 group-hover:opacity-100"
                              title="Remove item"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Discount Promo Input */}
                  <div className="pt-2 border-t border-dashed border-black/20">
                    {discount ? (
                      <div className="flex items-center justify-between bg-black/5 px-2.5 py-1.5 rounded text-[9.5px]">
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Tag size={11} />
                          <span className="font-medium">CODE: {discount.code}</span>
                          <span>(-{discount.type === 'PERCENT' ? `${discount.value}%` : `$${discount.value}`})</span>
                        </div>
                        {onRemoveDiscount && (
                          <button
                            onClick={onRemoveDiscount}
                            className="text-black/40 hover:text-black transition-colors cursor-pointer"
                            title="Remove discount"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleApplyDiscountSubmit} className="flex gap-1">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value);
                            setDiscountMessage(null);
                          }}
                          placeholder="DISCOUNT CODE (e.g. WELCOME10)"
                          className="flex-1 bg-black/5 border border-black/15 px-2 py-1 text-[9px] uppercase tracking-wider placeholder:text-black/35 focus:outline-none focus:border-black/50"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-black text-white text-[9px] uppercase tracking-wider hover:bg-black/80 transition-colors cursor-pointer shrink-0"
                        >
                          APPLY
                        </button>
                      </form>
                    )}
                    {discountMessage && (
                      <p className={`text-[8.5px] mt-1 tracking-wider ${discountMessage.isError ? 'text-red-600' : 'text-emerald-600'}`}>
                        {discountMessage.text}
                      </p>
                    )}
                  </div>

                  {/* Ledger Calculations */}
                  <div className="pt-2 border-t border-black/15 space-y-1 text-[9.5px] text-black/80">
                    <div className="flex justify-between">
                      <span className="text-black/50 uppercase tracking-wider">SUBTOTAL</span>
                      <span className="font-medium text-black">{formatPrice(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span className="uppercase tracking-wider">DISCOUNT</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-black/50">
                      <span className="uppercase tracking-wider">EST. SHIPPING</span>
                      <span>{subtotal >= 200 ? 'FREE' : 'AT CHECKOUT'}</span>
                    </div>

                    <div className="flex justify-between text-black/50">
                      <span className="uppercase tracking-wider">EST. TAX</span>
                      <span>CALCULATED AT CHECKOUT</span>
                    </div>

                    {/* Total Line */}
                    <div className="pt-2 mt-1 border-t-2 border-dashed border-black flex justify-between items-baseline">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black">
                        TOTAL ESTIMATE
                      </span>
                      <span className="text-[14px] font-bold text-black tracking-tight">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout & Full Bag Actions */}
                  <div className="pt-3 space-y-1.5">
                    <button
                      onClick={() => {
                        onClose();
                        onCheckout();
                      }}
                      className="w-full py-2.5 px-4 bg-black text-white text-[10.5px] font-medium tracking-[0.15em] uppercase hover:bg-black/85 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      <Lock size={12} strokeWidth={2} />
                      <span>PROCEED TO CHECKOUT</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToCart();
                      }}
                      className="w-full py-1.5 px-3 border border-black/20 hover:border-black text-black text-[9.5px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1 cursor-pointer bg-white"
                    >
                      <span>VIEW FULL SHOPPING BAG ({totalItems})</span>
                      <ArrowUpRight size={11} />
                    </button>
                  </div>
                </div>
              )}

              {/* Receipt Footer Barcode & Thank You */}
              <div className="pt-3 mt-2 border-t border-dashed border-black/25 text-center space-y-2">
                <div className="text-[8px] uppercase tracking-widest text-black/50">
                  THANK YOU FOR SHOPPING // KEEP FOR YOUR RECORDS
                </div>

                {/* Simulated Barcode */}
                <div className="flex flex-col items-center justify-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-center gap-[1.5px] h-6 px-4">
                    {[
                      2, 1, 3, 1, 2, 4, 1, 3, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 2
                    ].map((w, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[7.5px] tracking-[0.25em] text-black/50 uppercase">
                    *D3-{totalItems}-{Math.round(total)}*
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Serrated Edge (Receipt Paper Cut) */}
            <div className="w-full h-2 overflow-hidden leading-none flex text-white fill-white rotate-180">
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
  );
};
