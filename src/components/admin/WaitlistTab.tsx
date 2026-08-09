import React from 'react';
import { motion } from 'motion/react';
import { UserCheck, Trash2, Mail, Clock, Search, Copy, Check } from 'lucide-react';
import { db, doc, deleteDoc, handleFirestoreError, OperationType } from '../../firebase';

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  created_at: any;
}

interface WaitlistTabProps {
  entries: WaitlistEntry[];
  onDelete: (id: string) => void;
}

export const WaitlistTab: React.FC<WaitlistTabProps> = ({ 
  entries, 
  onDelete 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const filteredEntries = React.useMemo(() => {
    return entries
      .filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const aDate = a.created_at?.toDate() || new Date(0);
        const bDate = b.created_at?.toDate() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
  }, [entries, searchQuery]);

  const copyEmails = () => {
    if (entries.length === 0) return;
    const emailList = entries.map(e => e.email).join(', ');
    navigator.clipboard.writeText(emailList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-ink/5 pb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-brand font-black tracking-tighter uppercase" style={{ fontWeight: 900 }}>
              WAITING LIST
            </h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">
              Review and export allocations & reservations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyEmails}
            disabled={entries.length === 0}
            className="flex items-center gap-2 px-5 py-3 border border-ink text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all disabled:opacity-30"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "COPIED" : `COPY EMAILS (${entries.length})`}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER BY NAME OR EMAIL..."
            className="w-full bg-ink/[0.02] border border-ink/10 p-4 pl-12 text-[10.5px] font-mono focus:outline-none focus:border-ink/30 transition-all placeholder:text-ink/20"
          />
        </div>

        <div className="border border-ink/5 overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="p-16 text-center text-ink/30 font-mono text-[10px] uppercase tracking-widest">
              No registration matches found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ink/5 bg-ink/[0.02] text-[8.5px] font-mono font-bold uppercase tracking-[0.2em] opacity-40 text-ink">
                    <th className="p-6">NAME</th>
                    <th className="p-6">EMAIL</th>
                    <th className="p-6">DATE REGISTERED</th>
                    <th className="p-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 text-[10.5px] font-mono text-ink">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-ink/[0.01] transition-all group">
                      <td className="p-6 font-bold uppercase tracking-wide">
                        {entry.name}
                      </td>
                      <td className="p-6 text-ink/70">
                        {entry.email}
                      </td>
                      <td className="p-6 text-ink/40 text-[9.5px]">
                        {entry.created_at?.toDate() 
                          ? entry.created_at.toDate().toLocaleString() 
                          : new Date().toLocaleDateString()}
                      </td>
                      <td className="p-6 text-right">
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="p-2 text-ink/30 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-none"
                          title="Delete Registration"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
