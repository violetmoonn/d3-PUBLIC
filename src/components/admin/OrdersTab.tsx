import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, SortAsc, SortDesc, Eye, Trash2, ShoppingBag, Loader2, MapPin, Calendar, CreditCard, Shield, CheckCircle2, Clock, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { Order } from '../../types';

interface OrdersTabProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onDelete: (id: string) => void;
  onViewDetails: (order: Order) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ 
  orders, 
  onUpdateStatus, 
  onDelete, 
  onViewDetails 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Order['status'] | 'ALL'>('ALL');
  const [displayCount, setDisplayCount] = React.useState(20);

  const filteredOrders = React.useMemo(() => {
    return orders
      .filter(o => {
        const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            o.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aDate = a.created_at?.toDate() || new Date(0);
        const bDate = b.created_at?.toDate() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
  }, [orders, searchQuery, statusFilter]);

  const displayedOrders = React.useMemo(() => {
    return filteredOrders.slice(0, displayCount);
  }, [filteredOrders, displayCount]);

  const hasMore = filteredOrders.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return 'text-ink bg-ink/5 border-ink/10';
      case 'PROCESSING': return 'text-ink bg-ink/5 border-ink/10';
      case 'SHIPPED': return 'text-ink bg-ink/5 border-ink/10';
      case 'DELIVERED': return 'text-ink bg-ink/5 border-ink/10';
      case 'CANCELLED': return 'text-ink bg-ink/5 border-ink/10';
      default: return 'text-ink/40 bg-ink/5 border-ink/5';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return <Clock size={12} />;
      case 'PROCESSING': return <Loader2 size={12} className="animate-spin" />;
      case 'SHIPPED': return <ShoppingBag size={12} />;
      case 'DELIVERED': return <CheckCircle2 size={12} />;
      case 'CANCELLED': return <XCircle size={12} />;
      default: return <AlertCircle size={12} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">ORDER LOGS</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Track the flow of products across the store.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-ink/5 border border-ink/5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">LIVE MONITORING</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH ORDERS (ID, EMAIL, NAME)..."
            className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all uppercase appearance-none"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      <div className="border border-ink/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 border-b border-ink/5">
              <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ORDER ID</th>
              <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">CUSTOMER</th>
              <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">PRODUCTS</th>
              <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">TOTAL</th>
              <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">STATUS</th>
              <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {displayedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-ink/[0.02] transition-all group">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-ink' : 'bg-ink/40 animate-pulse'}`} />
                    <span className="text-[11px] font-mono font-bold uppercase">{order.id}</span>
                  </div>
                  <p className="text-[8px] font-mono opacity-40 uppercase mt-1">
                    {order.created_at?.toDate().toLocaleString() || 'UNKNOWN TIME'}
                  </p>
                </td>
                <td className="p-6">
                  <p className="text-[11px] font-mono font-bold uppercase">{order.customer_name}</p>
                  <p className="text-[9px] font-mono opacity-40 uppercase">{order.customer_email}</p>
                </td>
                <td className="p-6">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-8 h-8 bg-ink/5 border border-ink/5 overflow-hidden rounded-full ring-2 ring-white">
                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-all" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center rounded-full ring-2 ring-white text-[8px] font-mono font-bold">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-[11px] font-mono font-bold">{order.total_amount.toFixed(2)} USD</span>
                </td>
                <td className="p-6">
                  <select 
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['status'])}
                    className={`inline-flex items-center gap-2 px-3 py-1 border text-[9px] font-mono font-bold uppercase tracking-widest bg-transparent focus:ring-0 appearance-none cursor-pointer ${getStatusColor(order.status)}`}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onViewDetails(order)}
                      className="p-3 hover:bg-ink hover:text-paper transition-all"
                      title="VIEW ORDER"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(order.id)}
                      className="p-3 hover:bg-ink hover:text-paper transition-all"
                      title="DELETE RECORD"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div className="p-6 border-t border-ink/5 flex justify-center">
            <button 
              onClick={handleLoadMore}
              className="px-8 py-3 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              <RefreshCw size={12} />
              LOAD MORE ORDERS ({filteredOrders.length - displayCount} REMAINING)
            </button>
          </div>
        )}
        {filteredOrders.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <ShoppingBag size={48} className="mx-auto opacity-10" />
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-40">NO ORDERS FOUND</p>
              <p className="text-[10px] font-mono uppercase opacity-20 mt-2">The order flow is currently stagnant or filtered.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
