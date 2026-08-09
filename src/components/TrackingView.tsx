import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, CheckCircle2, Clock, AlertCircle, MapPin, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { safeToFixed } from '../utils/helpers';

export const TrackingView: React.FC = () => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = orderIdInput.trim();
    if (!trimmedId) return;

    setIsLoading(true);
    setError(null);
    setOrder(null);

    try {
      const orderRef = doc(db, 'orders', trimmedId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const data = orderSnap.data();
        setOrder({
          id: orderSnap.id,
          ...data,
        } as Order);
      } else {
        setError('Order artifact not found in database registry. Please check your Order ID.');
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setError('A secure gateway connection error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine active status step index (0: Placed, 1: Processing, 2: Shipped, 3: Delivered)
  const getStatusIndex = (status: string = ''): number => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) return 3;
    if (s.includes('shipped') || s.includes('transit')) return 2;
    if (s.includes('processing')) return 1;
    return 0; // Placed / Pending
  };

  const steps = [
    { label: 'ORDER PLACED', desc: 'Secure transaction logged.', icon: Clock },
    { label: 'PROCESSING', desc: 'Artifact selection & package prep.', icon: Package },
    { label: 'SHIPPED OUT', desc: 'Dispatched through secure transit.', icon: Truck },
    { label: 'DELIVERED', desc: 'Artifact successfully sublimated.', icon: CheckCircle2 },
  ];

  const statusIndex = order ? getStatusIndex(order.status) : 0;

  return (
    <div className="relative min-h-[85vh] w-full flex flex-col items-center justify-center py-20 px-6 overflow-hidden">
      
      {/* 
        GIANT GHOST LOGO BACKGROUND WATERMARK (5x larger than standard product card)
        Product card is ~250px-300px. 5x size is ~1250px-1500px wide/high.
      */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="w-[1250px] h-[1250px] sm:w-[1400px] sm:h-[1400px] opacity-[0.03] text-ink dark:opacity-[0.02]"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Massive Circular Outline */}
            <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Giant Ghost Logo Shape */}
            <path 
              d="M 50 20
                 C 34 20, 26 31, 26 48
                 C 26 65, 24 78, 31 78
                 C 34 78, 36 72, 40 72
                 C 44 72, 46 78, 50 78
                 C 54 78, 56 72, 60 72
                 C 64 72, 66 78, 69 78
                 C 76 78, 74 65, 74 48
                 C 74 31, 66 20, 50 20 Z" 
              fill="currentColor" 
              stroke="currentColor" 
              strokeWidth="0.5" 
              strokeLinejoin="round" 
            />
            {/* Eyes */}
            <circle cx="41" cy="44" r="3" fill="currentColor" />
            <circle cx="59" cy="44" r="3" fill="currentColor" />
          </svg>
        </motion.div>
      </div>

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 font-mono space-y-3"
        >
          <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-ink">
            ORDER STATUS TRACER
          </h1>
          <p className="text-[12px] font-mono opacity-70 leading-relaxed uppercase text-ink">
            GATEWAY SECURE INFERENCE & ORDER TRACKING
          </p>
        </motion.div>

        {/* Search input bar */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleTrackOrder}
          className="w-full max-w-xl border-b border-ink/20 focus-within:border-ink transition-all py-3 flex items-center gap-4 mb-10"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ENTER UNIQUE ORDER ID (e.g., ORD-1A2B3C...)"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full px-2 bg-transparent text-[11px] font-mono tracking-wider text-ink focus:outline-none focus:ring-0 uppercase placeholder:text-ink/20 border-none p-0"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-ink hover:opacity-75 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 bg-transparent p-0 border-none"
          >
            {isLoading ? 'TRACING...' : 'TRACE ORDER'}
            <ArrowRight size={14} />
          </button>
        </motion.form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-xl bg-red-500/5 border border-red-500/20 p-4 flex items-start gap-3 mb-10"
            >
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] font-mono text-red-500 uppercase tracking-wider">{error}</p>
            </motion.div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              {/* Order Status Summary Header */}
              <div className="border border-ink/10 bg-paper p-6 sm:p-8 flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[9px] font-mono tracking-widest text-ink/40 uppercase">REGISTRY ID</span>
                  <p className="text-sm font-mono font-bold text-ink uppercase select-all">{order.id}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-mono tracking-widest text-ink/40 uppercase">CURRENT STATUS</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-mono font-bold text-emerald-500 uppercase">{order.status || 'PROCESSING'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-mono tracking-widest text-ink/40 uppercase">TIMESTAMP</span>
                  <p className="text-sm font-mono font-bold text-ink uppercase">
                    {order.created_at ? new Date(order.created_at.seconds * 1000).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Status Step Indicators (Timeline) */}
              <div className="border border-ink/10 bg-paper p-6 sm:p-8 space-y-8">
                <h3 className="text-[10px] font-mono tracking-[0.3em] text-ink/50 uppercase">SUBLIMATION PIPELINE</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
                  {/* Step connectors for desktop */}
                  <div className="absolute top-[18px] left-[12.5%] right-[12.5%] h-[1px] bg-ink/10 hidden md:block z-0">
                    <div 
                      className="h-full bg-ink transition-all duration-500" 
                      style={{ width: `${(statusIndex / (steps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {steps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx <= statusIndex;
                    const isActive = idx === statusIndex;

                    return (
                      <div key={idx} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 relative z-10">
                        {/* Step Circle Indicator */}
                        <div 
                          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-ink text-paper border-ink' 
                              : 'bg-paper text-ink/30 border-ink/15'
                          } ${isActive ? 'ring-4 ring-ink/10' : ''}`}
                        >
                          <StepIcon size={14} />
                        </div>

                        <div className="space-y-1">
                          <p className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isCompleted ? 'text-ink' : 'text-ink/30'}`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] font-mono text-ink/40 max-w-[160px]">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid of Order Items and Shipping details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Items Summary (Left/Center Column) */}
                <div className="md:col-span-2 border border-ink/10 bg-paper p-6 sm:p-8 space-y-6">
                  <h3 className="text-[10px] font-mono tracking-[0.3em] text-ink/50 uppercase">PACKED ARTIFACTS</h3>
                  
                  <div className="divide-y divide-ink/10">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                        <div className="w-16 h-16 bg-ink/[0.02] border border-ink/5 overflow-hidden flex items-center justify-center p-1 shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package size={20} className="text-ink/20" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-[11px] font-mono font-bold uppercase text-ink">{item.name}</h4>
                          <div className="flex flex-wrap gap-x-4 text-[9px] font-mono text-ink/50 uppercase">
                            <span>SIZE: {item.selectedSize || 'N/A'}</span>
                            <span>QTY: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-ink">{safeToFixed((item.price || 0) * (item.quantity || 1))} USD</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-ink/10 flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/40">SECURE TOTAL INFERRED</span>
                    <span className="text-lg font-mono font-black text-ink">{safeToFixed(order.total_amount)} USD</span>
                  </div>
                </div>

                {/* Shipping & Delivery Info (Right Column) */}
                <div className="border border-ink/10 bg-paper p-6 sm:p-8 space-y-6">
                  <h3 className="text-[10px] font-mono tracking-[0.3em] text-ink/50 uppercase">SHIPPING MANIFEST</h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                      <MapPin size={14} className="text-ink/40 mt-1 shrink-0" />
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono tracking-widest text-ink/40 uppercase block">RECIPIENT ADDRESS</span>
                        <p className="text-[10px] font-mono font-bold text-ink uppercase leading-relaxed">{order.customer_name}</p>
                        <p className="text-[10px] font-mono text-ink/60 uppercase leading-relaxed whitespace-pre-wrap">{order.customer_address}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start pt-2 border-t border-ink/5">
                      <Truck size={14} className="text-ink/40 mt-1 shrink-0" />
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono tracking-widest text-ink/40 uppercase block">TRANSIT PROVIDER</span>
                        <p className="text-[10px] font-mono font-bold text-ink uppercase">D3COMPOSURE VIP SECURE DISPATCH</p>
                      </div>
                    </div>

                    {order.tracking_number && (
                      <div className="flex gap-3 items-start pt-2 border-t border-ink/5">
                        <Package size={14} className="text-ink/40 mt-1 shrink-0" />
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono tracking-widest text-ink/40 uppercase block">TRACKING NUMBER</span>
                          <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase select-all">{order.tracking_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
