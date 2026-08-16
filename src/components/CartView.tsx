import React from 'react';
import { motion } from 'motion/react';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Tag, 
  X, 
  Lock
} from 'lucide-react';
import { CartItem, DiscountCode } from '../types';
import { formatPrice, t } from '../utils/helpers';

interface CartViewProps {
  items: CartItem[];
  onRemove: (id: string | number, size: string) => void;
  onCheckout: () => void;
  discount: DiscountCode | null;
  onApplyDiscount: (code: string) => void;
  onRemoveDiscount?: () => void;
  onUpdateSize: (id: string | number, oldSize: string, newSize: string) => void;
  onUpdateQuantity: (id: string | number, size: string, quantity: number) => void;
  onNavigate: (view: string) => void;
}

const FREE_SHIPPING_THRESHOLD = 200;

export const CartView: React.FC<CartViewProps> = ({
  items,
  onRemove,
  onCheckout,
  discount,
  onApplyDiscount,
  onRemoveDiscount,
  onUpdateSize,
  onUpdateQuantity,
  onNavigate
}) => {
  const [discountInput, setDiscountInput] = React.useState('');
  const [discountError, setDiscountError] = React.useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discount 
    ? (discount.type === 'PERCENT' ? subtotal * (discount.value / 100) : discount.value) 
    : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountInput.trim()) return;
    setDiscountError('');
    onApplyDiscount(discountInput.trim());
    setDiscountInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="max-w-[1000px] mx-auto px-4 sm:px-6 py-4 font-mono text-ink"
    >
      {/* Title Header stacked vertically & tight (Left-aligned) */}
      <div className="border-b border-ink/10 pb-3 mb-4 flex flex-col items-start justify-start text-left gap-1">
        <h1 className="text-[12px] font-bold uppercase tracking-[0.15em] text-ink">
          {totalItems > 0 ? `SHOPPING BAG (${totalItems})` : 'SHOPPING BAG'}
        </h1>

        <button
          onClick={() => {
            onNavigate('store');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition-colors cursor-pointer group"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO CATALOG</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-left" />
      ) : (
        /* Populated Cart Layout - Compact & Space-Efficient */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Cart Items (Spans 7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Cart Table Headers */}
            <div className="border-b border-ink/10 pb-1.5 hidden sm:grid grid-cols-12 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">SIZE</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-2 text-right">TOTAL</span>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-ink/10 border-t border-b border-ink/10 bg-paper">
              {items.map((item) => {
                const coverUrl = (item.images?.[0] as any)?.url || item.images?.[0] || '';
                const availableSizes = item.sizes && item.sizes.length > 0 ? item.sizes : ['XS', 'S', 'M', 'L', 'XL', 'OS'];

                return (
                  <div key={`${item.id}-${item.selectedSize}`} className="py-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
                      
                      {/* Product Thumbnail & Details */}
                      <div className="sm:col-span-6 flex items-center gap-2.5">
                        <div className="w-12 h-12 bg-ink/5 border border-ink/10 overflow-hidden shrink-0">
                          {coverUrl ? (
                            <img 
                              src={coverUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ink/30 text-[9px]">
                              NO MEDIA
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink truncate">
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-ink/60 uppercase">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>

                      {/* Size Selector */}
                      <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                        <span className="text-[10px] text-ink/40 sm:hidden">SIZE:</span>
                        <select
                          value={item.selectedSize}
                          onChange={(e) => onUpdateSize(item.id, item.selectedSize, e.target.value)}
                          className="bg-ink/5 border border-ink/15 text-[10px] font-bold uppercase px-1.5 py-0.5 focus:outline-none focus:border-ink cursor-pointer text-center"
                        >
                          {availableSizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                        <span className="text-[10px] text-ink/40 sm:hidden">QTY:</span>
                        <div className="inline-flex items-center border border-ink/15 bg-ink/5">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, Math.max(1, item.quantity - 1))}
                            className="px-1 py-0.5 hover:bg-ink/10 transition-colors cursor-pointer text-ink font-bold"
                            title="Decrease quantity"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-1.5 text-[10px] font-bold min-w-[18px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                            className="px-1 py-0.5 hover:bg-ink/10 transition-colors cursor-pointer text-ink font-bold"
                            title="Increase quantity"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal & Remove Action */}
                      <div className="sm:col-span-2 flex sm:flex-col sm:items-end justify-between items-center gap-0.5">
                        <span className="text-[11px] font-bold font-mono text-ink">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => onRemove(item.id, item.selectedSize)}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-800 uppercase flex items-center gap-0.5 cursor-pointer transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 size={10} />
                          <span className="hidden sm:inline">REMOVE</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="pt-1 flex justify-between items-center">
              <button
                onClick={() => {
                  onNavigate('store');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft size={12} />
                <span>CONTINUE SHOPPING</span>
              </button>
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout Card (Spans 5 cols on lg) */}
          <div className="lg:col-span-5 bg-paper border border-ink/10 p-4 space-y-3 shadow-xs sticky top-20">
            
            <div className="border-b border-ink/10 pb-2 text-left">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink text-left">
                ORDER SUMMARY
              </h2>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 text-[11px] uppercase tracking-wider font-mono">
              <div className="flex justify-between items-center">
                <span className="text-ink/60">SUBTOTAL</span>
                <span className="font-bold text-ink">{formatPrice(subtotal)}</span>
              </div>

              {discount && (
                <div className="flex justify-between items-center text-emerald-800 font-bold bg-emerald-500/10 p-1.5 border border-emerald-500/20 text-[10px]">
                  <div className="flex items-center gap-1">
                    <Tag size={11} />
                    <span>PROMO ({discount.code})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>-{formatPrice(discountAmount)}</span>
                    {onRemoveDiscount && (
                      <button 
                        onClick={onRemoveDiscount} 
                        className="p-0.5 hover:bg-emerald-500/20 rounded cursor-pointer"
                        title="Remove discount"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-ink/60">SHIPPING</span>
                <span className="text-ink/60 text-[10px]">CALCULATED AT CHECKOUT</span>
              </div>
            </div>

            {/* Promo Code Form */}
            <form onSubmit={handleApply} className="space-y-1.5 pt-2 border-t border-ink/10 text-left">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE"
                  className="w-full bg-ink/5 border border-ink/15 p-2 text-[10px] font-mono focus:outline-none focus:border-ink uppercase text-left placeholder:text-left"
                />
                <button
                  type="submit"
                  disabled={!discountInput.trim()}
                  className="px-3 py-2 bg-ink text-paper font-bold text-[10px] uppercase tracking-wider hover:opacity-85 transition-opacity disabled:opacity-30 cursor-pointer shrink-0"
                >
                  APPLY
                </button>
              </div>
              {discountError && (
                <p className="text-[9px] text-rose-600 uppercase font-bold">{discountError}</p>
              )}
            </form>

            {/* Total Display */}
            <div className="border-t border-ink/10 pt-2 flex justify-between items-baseline">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink">TOTAL</span>
              <span className="text-base font-bold text-ink">{formatPrice(total)}</span>
            </div>

            {/* Main Proceed to Checkout Action */}
            <button
              onClick={onCheckout}
              className="w-full py-3 bg-ink text-paper text-[11px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-ink/85 transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Minimal Trust Signal */}
            <div className="pt-2 border-t border-ink/10 text-left">
              <div className="flex items-center justify-start gap-1 text-ink/50 text-[9px] font-mono uppercase tracking-wider">
                <Lock size={10} className="shrink-0 text-ink/60" />
                <span>256-BIT SSL ENCRYPTED CHECKOUT</span>
              </div>
            </div>

          </div>

        </div>
      )}
    </motion.div>
  );
};

