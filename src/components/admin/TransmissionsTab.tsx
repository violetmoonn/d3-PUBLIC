import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Trash2, Mail, User, Clock, CheckCircle2, AlertCircle, Search, Filter, Eye } from 'lucide-react';

interface Transmission {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: any;
  status?: 'NEW' | 'READ' | 'ARCHIVED';
}

interface TransmissionsTabProps {
  transmissions: Transmission[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Transmission['status']) => void;
}

export const TransmissionsTab: React.FC<TransmissionsTabProps> = ({ 
  transmissions, 
  onDelete, 
  onUpdateStatus 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTransmission, setSelectedTransmission] = React.useState<Transmission | null>(null);

  const filteredTransmissions = React.useMemo(() => {
    return transmissions
      .filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        const aDate = a.created_at?.toDate() || new Date(0);
        const bDate = b.created_at?.toDate() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
  }, [transmissions, searchQuery]);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">INBOUND MESSAGES</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Monitor communications from customers.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-ink/5 border border-ink/5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">STATUS: CONNECTED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER MESSAGES..."
              className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
            />
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredTransmissions.map((t) => (
              <button 
                key={t.id}
                onClick={() => {
                  setSelectedTransmission(t);
                  if (t.status !== 'READ') onUpdateStatus(t.id, 'READ');
                }}
                className={`w-full text-left p-6 border transition-all relative group ${selectedTransmission?.id === t.id ? 'bg-ink text-paper border-ink' : 'bg-paper border-ink/5 hover:border-ink/20'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">{t.name}</span>
                  {t.status !== 'READ' && (
                    <div className="w-2 h-2 bg-ink rounded-full animate-pulse" />
                  )}
                </div>
                <p className={`text-[11px] font-mono font-bold uppercase truncate ${selectedTransmission?.id === t.id ? 'text-paper' : 'text-ink'}`}>{t.email}</p>
                <p className={`text-[9px] font-mono uppercase mt-2 line-clamp-2 opacity-40 ${selectedTransmission?.id === t.id ? 'text-paper/60' : 'text-ink/40'}`}>{t.message}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-[8px] font-mono opacity-30">{t.created_at?.toDate().toLocaleDateString()}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(t.id);
                      if (selectedTransmission?.id === t.id) setSelectedTransmission(null);
                    }}
                    className={`p-2 transition-all ${selectedTransmission?.id === t.id ? 'text-paper/40 hover:text-paper' : 'text-ink/20 hover:text-ink'}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </button>
            ))}
            {filteredTransmissions.length === 0 && (
              <div className="p-12 text-center space-y-4 border border-dashed border-ink/10">
                <MessageSquare size={32} className="mx-auto opacity-10" />
                <p className="text-[10px] font-mono uppercase opacity-20">NO MESSAGES FOUND</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedTransmission ? (
              <motion.div 
                key={selectedTransmission.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-paper border border-ink/10 p-12 space-y-12 h-full shadow-sm"
              >
                <div className="flex justify-between items-start border-b border-ink/5 pb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display tracking-tighter uppercase">{selectedTransmission.name}</h3>
                        <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">CUSTOMER_ID</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-ink/60">
                      <Mail size={14} />
                      <span className="text-[11px] font-mono font-bold">{selectedTransmission.email}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center justify-end gap-2 text-ink/40">
                      <Clock size={14} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{selectedTransmission.created_at?.toDate().toLocaleString()}</span>
                    </div>
                    <span className="inline-block px-3 py-1 bg-ink/5 border border-ink/5 text-[9px] font-mono font-bold uppercase tracking-widest opacity-40">MESSAGE_ID: {selectedTransmission.id}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 opacity-40">
                    <Eye size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">MESSAGE_CONTENT</span>
                  </div>
                  <div className="p-8 bg-ink/5 border border-ink/5">
                    <p className="text-[12px] font-mono uppercase leading-relaxed tracking-wide whitespace-pre-wrap">
                      {selectedTransmission.message}
                    </p>
                  </div>
                </div>

                <div className="pt-12 border-t border-ink/5 flex justify-end gap-4">
                  <button 
                    onClick={() => onUpdateStatus(selectedTransmission.id, 'ARCHIVED')}
                    className="px-8 py-4 border border-ink/10 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                  >
                    [ ARCHIVE ]
                  </button>
                  <a 
                    href={`mailto:${selectedTransmission.email}`}
                    className="px-12 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3"
                  >
                    <Mail size={14} />
                    REPLY_NOW
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-ink/10 p-20">
                <div className="w-20 h-20 bg-ink/5 flex items-center justify-center">
                  <MessageSquare size={40} className="opacity-10" />
                </div>
                <div>
                  <h3 className="text-xl font-display tracking-tighter uppercase opacity-40">SELECT A MESSAGE</h3>
                  <p className="text-[10px] font-mono uppercase opacity-20 mt-2">Select a message from the list to read.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
