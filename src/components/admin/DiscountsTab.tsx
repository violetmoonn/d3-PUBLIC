import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Plus, Trash2, Edit, CheckCircle2, XCircle, Clock, Tag, Percent, DollarSign, Loader2 } from 'lucide-react';
import { DiscountCode } from '../../types';

interface DiscountsTabProps {
  discounts: DiscountCode[];
  onAdd: (discount: Partial<DiscountCode>) => Promise<void>;
  onDelete: (id: string) => void;
  onToggleActive: (discount: DiscountCode) => void;
}

export const DiscountsTab: React.FC<DiscountsTabProps> = ({ 
  discounts, 
  onAdd, 
  onDelete, 
  onToggleActive 
}) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<DiscountCode>>({
    code: '',
    type: 'PERCENT',
    value: 0,
    min_purchase: 0,
    active: true,
    usage_limit: 0,
    usage_count: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAdd(formData);
      setIsAdding(false);
      setFormData({
        code: '',
        type: 'PERCENT',
        value: 0,
        min_purchase: 0,
        active: true,
        usage_limit: 0,
        usage_count: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <Ticket size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">DISCOUNT MANAGEMENT</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Manage discount codes and price adjustments.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-8 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3"
        >
          <Plus size={16} /> NEW DISCOUNT
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-8 bg-ink/5 border border-ink/5 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">DISCOUNT CODE</label>
                  <input 
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">DISCOUNT TYPE</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all font-bold"
                  >
                    <option value="PERCENT" className="bg-paper">PERCENTAGE (%)</option>
                    <option value="FIXED" className="bg-paper">FIXED AMOUNT ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">VALUE</label>
                  <div className="relative">
                    {formData.type === 'PERCENT' ? <Percent size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" /> : <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />}
                    <input 
                      required
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      className="w-full bg-paper border border-ink/10 p-4 pl-10 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">MIN PURCHASE</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      type="number"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) })}
                      className="w-full bg-paper border border-ink/10 p-4 pl-10 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-4 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                >
                  [ CANCEL ]
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-12 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:opacity-80 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  ACTIVATE DISCOUNT
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {discounts.map((discount) => (
          <motion.div 
            key={discount.id}
            layout
            className={`p-8 border transition-all relative group ${discount.active ? 'bg-paper border-ink/10 shadow-sm' : 'bg-ink/[0.02] border-ink/5 opacity-60'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${discount.active ? 'bg-ink' : 'bg-ink/20'}`} />
                <span className="text-2xl font-display tracking-tighter uppercase">{discount.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onToggleActive(discount)}
                  className={`p-2 transition-all ${discount.active ? 'text-ink' : 'text-ink/20 hover:text-ink'}`}
                  title={discount.active ? 'DEACTIVATE' : 'ACTIVATE'}
                >
                  {discount.active ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </button>
                <button 
                  onClick={() => onDelete(discount.id)}
                  className="p-2 text-ink/20 hover:text-ink transition-all"
                  title="DELETE DISCOUNT"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-ink/5 pb-4">
                <span className="text-[10px] font-mono font-bold uppercase opacity-40">DISCOUNT VALUE</span>
                <span className="text-lg font-display tracking-tighter">
                  {discount.type === 'PERCENT' ? `${discount.value}%` : `$${discount.value}`}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-ink/5 pb-4">
                <span className="text-[10px] font-mono font-bold uppercase opacity-40">MIN THRESHOLD</span>
                <span className="text-[11px] font-mono font-bold">${discount.min_purchase || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase opacity-40">USAGE COUNT</span>
                <span className="text-[11px] font-mono font-bold">{discount.usage_count || 0} {discount.usage_limit ? `/ ${discount.usage_limit}` : ''}</span>
              </div>
            </div>

            {!discount.active && (
              <div className="absolute inset-0 bg-paper/20 backdrop-grayscale pointer-events-none" />
            )}
          </motion.div>
        ))}
        {discounts.length === 0 && (
          <div className="col-span-full p-20 text-center space-y-4 border border-dashed border-ink/10">
            <Ticket size={48} className="mx-auto opacity-10" />
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-40">NO DISCOUNTS ACTIVE</p>
              <p className="text-[10px] font-mono uppercase opacity-20 mt-2">No active discount codes found.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
