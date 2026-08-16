import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Minus, Plus, Trash2, X, Undo, ShieldCheck, Lock, Truck, RotateCcw, CheckCircle2, Award } from 'lucide-react';
import { CartItem, DiscountCode } from '../types';
import { formatPrice, t } from '../utils/helpers';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string | number, size: string) => void;
  onCheckout: () => void;
  discount: DiscountCode | null;
  onApplyDiscount: (code: string) => void;
  onUpdateSize: (id: string | number, oldSize: string, newSize: string) => void;
  onUpdateQuantity: (id: string | number, size: string, quantity: number) => void;
  onNavigate?: (view: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onCheckout, 
  discount, 
  onApplyDiscount,
  onUpdateSize,
  onUpdateQuantity,
  onNavigate
}) => {
  const [discountInput, setDiscountInput] = React.useState('');
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discount ? (discount.type === 'PERCENT' ? subtotal * (discount.value / 100) : discount.value) : 0;
  const total = subtotal - discountAmount;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          
          {/* Left Drawer Panel (Horizontal Pull) */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 h-full w-full sm:w-[460px] bg-paper border-r border-ink/10 z-[110] shadow-2xl flex flex-col font-mono"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-ink/10 relative">
              <span className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-ink text-left flex-1">
                {totalItems > 0 ? `SHOPPING BAG (${totalItems})` : 'SHOPPING BAG'}
              </span>

              <button 
                onClick={onClose}
                className="text-ink hover:opacity-50 transition-opacity cursor-pointer p-1"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Content Area */}
            {items.length === 0 ? (
              /* Empty Bag Screen with minimized empty space, aligned to the top */
              <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto" />
            ) : (
              /* Populated Bag Screen with maximized space utilization */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable list of items filling top space */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <motion.div 
                        key={`${item.id}-${item.selectedSize}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex gap-3 items-center justify-between group py-1 border-b border-ink/5"
                      >
                        {/* Image & details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 bg-soft border border-ink/5 overflow-hidden flex-shrink-0">
                            <img 
                              src={(item.images?.[0] as any)?.url || item.images?.[0]} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink truncate max-w-[140px] sm:max-w-[170px]">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 font-mono text-[8px] uppercase tracking-wider text-ink/55">
                              {/* Size adjustment */}
                              <div className="flex items-center gap-1">
                                <span>SZ:</span>
                                <select 
                                  value={item.selectedSize}
                                  onChange={(e) => onUpdateSize(item.id, item.selectedSize, e.target.value)}
                                  className="bg-transparent border-none p-0 text-[8.5px] font-mono font-bold uppercase focus:ring-0 cursor-pointer text-ink hover:opacity-85"
                                >
                                  {(item.sizes && item.sizes.length > 0 ? item.sizes : ['xs', 's', 'm', 'l', 'xl']).map(s => (
                                    <option key={s} value={s} className="bg-paper text-ink uppercase">
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {/* Quantity adjustment */}
                              <div className="flex items-center gap-1 border border-ink/10 px-1 py-0.5 rounded-full bg-soft">
                                <button 
                                  onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity - 1)} 
                                  className="hover:text-ink/100 active:scale-95 transition-transform"
                                >
                                  <Minus size={8} />
                                </button>
                                <span className="font-bold text-[8.5px] px-0.5">{item.quantity}</span>
                                <button 
                                  onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity + 1)} 
                                  className="hover:text-ink/100 active:scale-95 transition-transform"
                                >
                                  <Plus size={8} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price & Remove */}
                        <div className="text-right flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[10px] font-mono font-bold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button 
                            onClick={() => onRemove(item.id, item.selectedSize)}
                            className="text-[7.5px] font-mono font-bold uppercase tracking-widest text-ink/30 hover:text-ink/100 transition-all flex items-center gap-0.5"
                          >
                            <Trash2 size={8} /> {t('remove') || 'REMOVE'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Fixed bottom checkout panel */}
                <div className="border-t border-ink/5 bg-paper/95 p-4 space-y-2.5 shrink-0">
                  {/* Promo Code Input */}
                  <div className="border-b border-ink/20 focus-within:border-ink transition-all py-1 flex items-center gap-2">
                    <input 
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="PROMO CODE"
                      className="flex-1 bg-transparent border-none p-0 text-[9px] font-mono focus:ring-0 placeholder:opacity-25 uppercase focus:outline-none text-ink tracking-wider text-left placeholder:text-left"
                    />
                    <button 
                      onClick={() => onApplyDiscount(discountInput)}
                      className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink hover:opacity-75 transition-opacity"
                    >
                      APPLY
                    </button>
                  </div>
                  {discount && (
                    <div className="flex justify-between items-center text-[8.5px] text-ink font-bold uppercase tracking-wider pl-1.5 border-l-2 border-ink">
                      <span>PROMO: <span className="underline">{discount.code}</span></span>
                      <span>-{discount.type === 'PERCENT' ? `${discount.value}%` : formatPrice(discount.value)}</span>
                    </div>
                  )}

                  {/* Calculations summary */}
                  <div className="space-y-1.5 font-mono text-[9.5px] uppercase tracking-wider text-ink border-b border-ink/5 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="opacity-40">Subtotal</span>
                      <span className="font-bold">{formatPrice(subtotal)}</span>
                    </div>
                    {discount && (
                      <div className="flex justify-between items-center font-bold">
                        <span>Discount ({discount.code})</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="opacity-40">Shipping</span>
                      <span className="text-[8px] font-semibold opacity-60">Calculated at Checkout</span>
                    </div>
                  </div>

                  {/* Total Line */}
                  <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-wider font-bold">
                    <span>Total</span>
                    <span className="text-xs font-black">{formatPrice(total)}</span>
                  </div>

                  {/* Checkout CTA button */}
                  <div className="pt-1">
                    <button 
                      onClick={onCheckout}
                      className="w-full bg-ink text-paper py-2.5 text-[9.5px] font-mono font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      <span>CHECKOUT</span>
                      <ArrowRight size={10} className="text-paper" />
                    </button>
                  </div>

                  {/* Minimal Trust Signal */}
                  <div className="pt-1 text-left">
                    <div className="flex items-center justify-start gap-1 text-ink/50 text-[8.5px] font-mono uppercase tracking-wider">
                      <Lock size={9} className="shrink-0 text-ink/60" />
                      <span>256-BIT SSL ENCRYPTED CHECKOUT</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
