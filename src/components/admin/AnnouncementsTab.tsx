import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, Plus, Trash2, Edit, CheckCircle2, XCircle, Clock, Tag, Percent, DollarSign, Loader2, Link, Type, Palette } from 'lucide-react';
import { Announcement } from '../../types';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  onAdd: (announcement: Partial<Announcement>) => Promise<void>;
  onDelete: (id: string) => void;
  onToggleActive: (announcement: Announcement) => void;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({ 
  announcements, 
  onAdd, 
  onDelete, 
  onToggleActive 
}) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Announcement>>({
    text: '',
    link: '',
    active: true,
    background_color: '#000000',
    text_color: '#FFFFFF'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAdd(formData);
      setIsAdding(false);
      setFormData({
        text: '',
        link: '',
        active: true,
        background_color: '#000000',
        text_color: '#FFFFFF'
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
            <Megaphone size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">ANNOUNCEMENTS</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Manage site-wide announcements and banners.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-8 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3"
        >
          <Plus size={16} /> NEW ANNOUNCEMENT
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ANNOUNCEMENT TEXT</label>
                  <div className="relative">
                    <Type size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      required
                      value={formData.text}
                      onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      placeholder="ENTER MESSAGE"
                      className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">LINK (OPTIONAL)</label>
                  <div className="relative">
                    <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">BACKGROUND COLOR</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-12 h-12 bg-paper border border-ink/10 p-1 cursor-pointer"
                    />
                    <input 
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="flex-1 bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">TEXT COLOR</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-12 h-12 bg-paper border border-ink/10 p-1 cursor-pointer"
                    />
                    <input 
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="flex-1 bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border border-ink/5 bg-paper space-y-2">
                <label className="text-[8px] font-mono font-bold uppercase opacity-40">PREVIEW</label>
                <div 
                  className="p-3 text-center text-[10px] font-mono font-bold uppercase tracking-widest"
                  style={{ backgroundColor: formData.background_color, color: formData.text_color }}
                >
                  {formData.text || 'PREVIEW MESSAGE'}
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
                  ACTIVATE ANNOUNCEMENT
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {announcements.map((announcement) => (
          <motion.div 
            key={announcement.id}
            layout
            className={`p-6 border transition-all relative group flex items-center justify-between gap-8 ${announcement.active ? 'bg-paper border-ink/10 shadow-sm' : 'bg-ink/[0.02] border-ink/5 opacity-60'}`}
          >
              <div className="flex-1 flex items-center gap-6">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${announcement.active ? 'bg-ink' : 'bg-ink/20'}`} />
                <div 
                  className="flex-1 p-4 text-[10px] font-mono font-bold uppercase tracking-widest text-center"
                  style={{ backgroundColor: announcement.background_color, color: announcement.text_color }}
                >
                  {announcement.text}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-mono font-bold uppercase opacity-40">STATUS</p>
                  <p className={`text-[11px] font-mono font-bold ${announcement.active ? 'text-ink' : 'text-ink/40'}`}>
                    {announcement.active ? 'ACTIVE' : 'INACTIVE'}
                  </p>
                </div>
              <div className="h-10 w-px bg-ink/5" />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onToggleActive(announcement)}
                  className={`p-3 transition-all ${announcement.active ? 'text-ink' : 'text-ink/20 hover:text-ink'}`}
                  title={announcement.active ? 'DEACTIVATE' : 'ACTIVATE'}
                >
                  {announcement.active ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </button>
                <button 
                  onClick={() => onDelete(announcement.id)}
                  className="p-3 text-ink/20 hover:text-ink transition-all"
                  title="DELETE"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {announcements.length === 0 && (
          <div className="p-20 text-center space-y-4 border border-dashed border-ink/10">
            <Megaphone size={48} className="mx-auto opacity-10" />
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-40">NO ANNOUNCEMENTS ACTIVE</p>
              <p className="text-[10px] font-mono uppercase opacity-20 mt-2">The store is currently silent.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
