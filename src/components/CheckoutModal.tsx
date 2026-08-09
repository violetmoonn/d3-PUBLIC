import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CreditCard, Globe, Loader2, Mail, MapPin, Phone, ShieldCheck, Square, User, X } from 'lucide-react';
import { CartItem, DiscountCode } from '../types';
import { safeToFixed, formatPrice, t } from '../utils/helpers';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  form: any;
  setForm: (form: any) => void;
  cart: CartItem[];
  total: number;
  discount: DiscountCode | null;
  onOrderSuccess: (orderId: string) => void;
  setOrderStatus: (status: 'idle' | 'processing' | 'success' | 'error') => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  form, 
  setForm, 
  cart, 
  total, 
  discount,
  onOrderSuccess,
  setOrderStatus
}) => {
  const [step, setStep] = React.useState<'info' | 'payment'>('info');
  const [isLoading, setIsLoading] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const stripePromise = React.useMemo(() => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_live_51T8ECtQ4FdRda8h8nfdJSUR7txP58VE5Gpt3eqzVkBY7yHIhagkM85zML8BMqfHkseITaVI72Dwm1RzOUJmYjPqQ00irFfM8FW"), []);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 1 && (cart[0] as any).stripeBuyButtonId) {
      // Single item with buy button - handled separately or via link
      return;
    }
    
    setIsLoading(true);
    try {
      // Create Stripe Checkout Session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.selectedSize
          })),
          customer: form,
          discount: discount ? { code: discount.code, type: discount.type, value: discount.value } : null
        })
      });

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
      setStep('payment');
    } catch (err) {
      console.error(err);
      setOrderStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setOrderStatus('processing');
    try {
      const orderData = {
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_address: `${form.address}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, selectedSize: i.selectedSize })),
        total_amount: total,
        status: 'pending',
        payment_method: 'STRIPE_SECURE',
        created_at: serverTimestamp(),
        discount_code: discount?.code || null
      };

      // Create order via server API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "ORDER_CREATION_FAILED");
      }

      const { orderId } = await response.json();
      onOrderSuccess(orderId);
    } catch (err) {
      console.error(err);
      setOrderStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8 bg-paper/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-paper border border-ink/5 w-full max-w-4xl overflow-hidden relative shadow-2xl flex flex-col sm:flex-row"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 hover:bg-ink hover:text-paper transition-all"
            >
              <X size={20} />
            </button>

            <div className="w-full sm:w-1/2 p-8 sm:p-12 border-b sm:border-b-0 sm:border-r border-ink/5 overflow-y-auto">
              <div className="mb-12">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-2 block">{step === 'info' ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}</span>
                <h2 className="text-4xl sm:text-6xl font-display tracking-tighter">CHECKOUT</h2>
                <p className="text-xs font-mono uppercase opacity-40 mt-4 leading-relaxed">
                  {step === 'info' ? 'Enter your contact and shipping details below.' : 'Complete your payment via Stripe secure checkout.'}
                </p>
              </div>

              <div className="flex gap-4 mb-8">
                <div className={`flex-1 h-1 transition-all ${step === 'info' ? 'bg-ink' : 'bg-ink/10'}`} />
                <div className={`flex-1 h-1 transition-all ${step === 'payment' ? 'bg-ink' : 'bg-ink/10'}`} />
              </div>

              {step === 'info' ? (
                <form onSubmit={handleInfoSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <input 
                      required
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="FULL NAME"
                      className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Mail size={12} className="absolute left-0 top-1/2 -translate-y-1/2 opacity-30" />
                        <input 
                          required
                          type="email"
                          value={form.email || ''}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="EMAIL ADDRESS"
                          className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 pl-6 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                        />
                      </div>
                      <div className="relative">
                        <Phone size={12} className="absolute left-0 top-1/2 -translate-y-1/2 opacity-30" />
                        <input 
                          required
                          value={form.phone || ''}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="PHONE NUMBER"
                          className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 pl-6 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input 
                      required
                      value={form.address || ''}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="STREET ADDRESS"
                      className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        required
                        value={form.city || ''}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="CITY"
                        className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                      />
                      <input 
                        required
                        value={form.state || ''}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        placeholder="STATE / PROVINCE"
                        className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        required
                        value={form.zip || ''}
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        placeholder="ZIP / POSTAL CODE"
                        className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                      />
                      <div className="relative">
                        <Globe size={12} className="absolute left-0 top-1/2 -translate-y-1/2 opacity-30" />
                        <input 
                          required
                          value={form.country || ''}
                          onChange={(e) => setForm({ ...form, country: e.target.value })}
                          placeholder="COUNTRY"
                          className="w-full bg-transparent border-b border-ink/20 focus:border-ink py-3 pl-6 text-[11px] font-mono focus:ring-0 transition-all placeholder:text-ink/20 uppercase focus:outline-none rounded-none border-t-0 border-l-0 border-r-0"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[8.5px] font-mono uppercase tracking-wider text-ink/40 text-center leading-relaxed">
                    By placing your order, you agree to our Terms of Service & Privacy Policy.
                  </p>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-ink text-paper py-5 text-[12px] font-mono font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50 group cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    CONTINUE TO PAYMENT
                  </button>
                </form>
              ) : (
                <div className="space-y-8">
                  {clientSecret ? (
                    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  ) : (
                    <div className="p-12 border border-ink/5 bg-ink/5 flex flex-col items-center justify-center text-center space-y-4">
                      <Loader2 className="animate-spin opacity-20" size={32} />
                      <p className="text-[10px] font-mono uppercase opacity-40">LOADING SECURE CHECKOUT...</p>
                    </div>
                  )}

                  <p className="text-[8.5px] font-mono uppercase tracking-wider text-ink/40 text-center leading-relaxed">
                    By placing your order, you agree to our Terms of Service & Privacy Policy.
                  </p>

                  <button 
                    onClick={handleFinalSubmit}
                    className="w-full bg-ink text-paper py-5 text-[12px] font-mono font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all group cursor-pointer"
                  >
                    PLACE ORDER
                  </button>
                  
                  <button 
                    onClick={() => setStep('info')}
                    className="w-full text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity text-center cursor-pointer"
                  >
                    [ RETURN TO SHIPPING INFORMATION ]
                  </button>
                </div>
              )}
            </div>

            <div className="w-full sm:w-1/2 p-8 sm:p-12 bg-soft flex flex-col">
              <div className="flex items-center gap-3 mb-12">
                <ShieldCheck size={20} className="text-ink opacity-40" />
                <h3 className="text-2xl font-display tracking-tighter uppercase">ORDER SUMMARY</h3>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] pr-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 group">
                    <div className="w-16 h-16 bg-paper border border-ink/5 overflow-hidden flex-shrink-0">
                      <img 
                        src={(item.images?.[0] as any)?.url || item.images?.[0]} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-mono font-bold uppercase truncate pr-4">{item.name}</h4>
                        <span className="text-xs font-numbers font-bold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <p className="text-[8px] font-mono uppercase opacity-40 mt-1">SIZE: {item.selectedSize} | QTY: <span className="font-numbers font-bold">{item.quantity}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-ink/10 space-y-4">
                <div className="flex justify-between text-[10px] font-numbers font-bold uppercase opacity-40">
                  <span className="font-mono">{t('subtotal')}</span>
                  <span>{formatPrice(cart.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-[10px] font-numbers font-bold uppercase text-ink">
                    <span className="font-mono">DISCOUNT ({discount.code})</span>
                    <span>-{formatPrice(discount.type === 'PERCENT' ? cart.reduce((s, i) => s + i.price * i.quantity, 0) * (discount.value / 100) : discount.value)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-mono uppercase opacity-40">
                  <span>{t('shipping')}</span>
                  <span className="text-ink">{t('complimentary')}</span>
                </div>
                <div className="flex justify-between text-[10px] font-numbers font-bold uppercase opacity-40">
                  <span className="font-mono">ESTIMATED TAX (8.25%)</span>
                  <span>{formatPrice((cart.reduce((s, i) => s + i.price * i.quantity, 0) - (discount ? (discount.type === 'PERCENT' ? cart.reduce((s, i) => s + i.price * i.quantity, 0) * (discount.value / 100) : discount.value) : 0)) * 0.0825)}</span>
                </div>
                <div className="flex justify-between text-3xl font-display font-black tracking-tighter pt-4 border-t border-ink/5">
                  <span className="uppercase tracking-tighter">Total Due</span>
                  <span className="font-numbers">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-ink/10 text-ink/50 text-[9px] font-mono uppercase tracking-wider leading-relaxed">
                <p>
                  All transactions are encrypted and processed securely via Stripe. D3COMPOSURE does not store payment card details.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
