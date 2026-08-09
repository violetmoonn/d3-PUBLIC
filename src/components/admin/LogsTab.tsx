import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Search, Filter, Trash2, Clock, AlertCircle, CheckCircle2, Info, Shield, ShieldAlert, ShieldCheck, ShieldX, Database, Activity, History, Loader2, RefreshCw } from 'lucide-react';
import { LogEntry } from '../../types';

interface LogsTabProps {
  logs: LogEntry[];
  onClear: () => void;
  onRefresh: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ 
  logs, 
  onClear, 
  onRefresh 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [levelFilter, setLevelFilter] = React.useState<LogEntry['level'] | 'ALL'>('ALL');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [displayCount, setDisplayCount] = React.useState(50);

  const filteredLogs = React.useMemo(() => {
    return logs
      .filter(l => {
        const matchesSearch = l.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (l.user?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchesLevel = levelFilter === 'ALL' || l.level === levelFilter;
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => {
        const aDate = a.timestamp?.toDate() || new Date(0);
        const bDate = b.timestamp?.toDate() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
  }, [logs, searchQuery, levelFilter]);

  const displayedLogs = React.useMemo(() => {
    return filteredLogs.slice(0, displayCount);
  }, [filteredLogs, displayCount]);

  const hasMore = filteredLogs.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 50);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO': return 'text-ink bg-ink/5 border-ink/10';
      case 'WARNING': return 'text-ink bg-ink/5 border-ink/10';
      case 'ERROR': return 'text-ink bg-ink/5 border-ink/10';
      case 'SUCCESS': return 'text-ink bg-ink/5 border-ink/10';
      default: return 'text-ink/40 bg-ink/5 border-ink/5';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO': return <Info size={12} />;
      case 'WARNING': return <AlertCircle size={12} />;
      case 'ERROR': return <ShieldX size={12} />;
      case 'SUCCESS': return <ShieldCheck size={12} />;
      default: return <Terminal size={12} />;
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <Terminal size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">ACTIVITY LOGS</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Audit the store's internal state changes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-6 py-3 border border-ink/10 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <History size={14} />}
            REFRESH LOGS
          </button>
          <button 
            onClick={onClear}
            className="px-6 py-3 border border-ink/10 text-ink text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all flex items-center gap-2"
          >
            <Trash2 size={14} /> CLEAR LOGS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH ACTIVITY..."
            className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all uppercase appearance-none"
          >
            <option value="ALL">ALL LEVELS</option>
            <option value="INFO">INFO</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      <div className="border border-ink/10 bg-paper shadow-sm">
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-paper shadow-sm">
              <tr className="bg-ink/5 border-b border-ink/10">
                <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">TIMESTAMP</th>
                <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">LEVEL</th>
                <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ACTION</th>
                <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">USER</th>
                <th className="p-6 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">MESSAGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {displayedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-ink/[0.02] transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <Clock size={12} className="opacity-30" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">
                        {log.timestamp?.toDate().toLocaleString() || 'UNKNOWN TIME'}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 border text-[9px] font-mono font-bold uppercase tracking-widest ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      {log.level}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-[11px] font-mono font-bold uppercase">{log.action}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-[11px] font-mono font-bold uppercase opacity-60">{log.user}</span>
                  </td>
                  <td className="p-6">
                    <p className="text-[11px] font-mono uppercase opacity-80 max-w-md truncate" title={log.message}>
                      {log.message}
                    </p>
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
                LOAD MORE EVENTS ({filteredLogs.length - displayCount} REMAINING)
              </button>
            </div>
          )}
          {filteredLogs.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <Terminal size={48} className="mx-auto opacity-10" />
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-40">NO ACTIVITY LOGGED</p>
                <p className="text-[10px] font-mono uppercase opacity-20 mt-2">The history is currently blank or filtered.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 border border-ink/5 bg-ink/5 flex flex-col items-center justify-center text-center space-y-4">
          <Activity className="opacity-20" size={32} />
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">TOTAL EVENTS</p>
            <p className="text-3xl font-display tracking-tighter">{logs.length}</p>
          </div>
        </div>
        <div className="p-8 border border-ink/5 bg-ink/5 flex flex-col items-center justify-center text-center space-y-4">
          <ShieldAlert className="opacity-20 text-ink" size={32} />
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ERRORS</p>
            <p className="text-3xl font-display tracking-tighter text-ink">{logs.filter(l => l.level === 'ERROR').length}</p>
          </div>
        </div>
        <div className="p-8 border border-ink/5 bg-ink/5 flex flex-col items-center justify-center text-center space-y-4">
          <Database className="opacity-20" size={32} />
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">STORAGE STATUS</p>
            <p className="text-3xl font-display tracking-tighter uppercase">OPTIMAL</p>
          </div>
        </div>
      </div>
    </div>
  );
};
