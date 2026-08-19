import React from 'react';
import { motion } from 'motion/react';
import { Globe, Trash2, ExternalLink, Copy, Check, Search, Database, Link as LinkIcon, RefreshCw, UploadCloud, Sparkles } from 'lucide-react';
import { DriveLink, Product } from '../../types';

interface DriveLinksTabProps {
  driveLinks: DriveLink[];
  products: Product[];
  onDelete: (id: string) => Promise<void>;
  onAdd: (url: string, productId?: string) => Promise<void>;
  onBulkImport: () => void;
  onOpenDrivePublisher?: () => void;
}

export const DriveLinksTab: React.FC<DriveLinksTabProps> = ({ driveLinks, products, onDelete, onAdd, onBulkImport, onOpenDrivePublisher }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [newUrl, setNewUrl] = React.useState('');
  const [selectedProductId, setSelectedProductId] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredLinks = React.useMemo(() => {
    return driveLinks.filter(link => 
      link.original_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.converted_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.file_id.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const dateA = a.created_at?.seconds || 0;
      const dateB = b.created_at?.seconds || 0;
      return dateB - dateA;
    });
  }, [driveLinks, searchQuery]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    
    setIsProcessing(true);
    try {
      await onAdd(newUrl, selectedProductId || undefined);
      setNewUrl('');
      setSelectedProductId('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">DRIVE LINK REPOSITORY</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Access Google Drive photos, manage links, and publish to storefront.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onOpenDrivePublisher && (
            <button 
              onClick={onOpenDrivePublisher}
              className="px-6 py-3 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm"
            >
              <UploadCloud size={14} /> DRIVE PHOTO PUBLISHER
            </button>
          )}
          <button 
            onClick={onBulkImport}
            className="px-6 py-3 border border-ink/20 text-ink text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all flex items-center gap-2"
          >
            <Database size={14} /> BULK IMPORT
          </button>
        </div>
      </div>

      {/* Google Drive Direct Access Hero Banner */}
      {onOpenDrivePublisher && (
        <div className="p-6 bg-ink/[0.03] border border-ink/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-ink font-bold text-xs font-mono tracking-wider uppercase">
              <Sparkles size={14} />
              <span>LIVE GOOGLE DRIVE PHOTO INTEGRATION & PUBLISHING</span>
            </div>
            <p className="text-[10px] font-mono opacity-60 uppercase">
              Browse photos directly from your connected Google Drive or upload new files to instantly generate storefront product cards.
            </p>
          </div>
          <button
            onClick={onOpenDrivePublisher}
            className="px-6 py-3 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shrink-0 flex items-center gap-2"
          >
            <UploadCloud size={14} /> OPEN DRIVE PHOTOS
          </button>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH CONVERTED LINKS..."
          className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
        />
      </div>

      <div className="bg-paper border border-ink/10 p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center">
            <LinkIcon size={14} />
          </div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest">CONVERT SINGLE LINK</h3>
        </div>
        
        <form onSubmit={handleAddLink} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="PASTE GOOGLE DRIVE URL HERE..."
              className="flex-1 bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
            />
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all min-w-[200px]"
            >
              <option value="" className="bg-paper">ASSOCIATE WITH PRODUCT (OPTIONAL)</option>
              <option value="CREATE_NEW_PRODUCT" className="font-bold bg-paper">++ CREATE NEW PRODUCT ++</option>
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-paper">{p.name}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit"
            disabled={isProcessing || !newUrl.trim()}
            className="w-full md:w-auto self-end px-8 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                PROCESSING...
              </>
            ) : (
              'CONVERT & STORE'
            )}
          </button>
        </form>
        <p className="text-[9px] font-mono uppercase opacity-30 leading-relaxed">
          The system will extract the file ID and generate a direct download URL. 
          The result will be stored in the repository below.
        </p>
      </div>

      <div className="space-y-4">
        {filteredLinks.map((link) => (
          <motion.div 
            layout
            key={link.id}
            className="p-6 border border-ink/10 bg-paper hover:border-ink/20 transition-all group shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ink/5 flex items-center justify-center">
                    <LinkIcon size={14} className="opacity-40" />
                  </div>
                  <div>
                    <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">FILE ID: {link.file_id}</p>
                    <p className="text-[10px] font-mono font-bold uppercase truncate max-w-md">{link.original_url}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono font-bold uppercase opacity-30">ORIGINAL SOURCE</label>
                    <div className="flex items-center gap-2">
                      <input 
                        readOnly
                        value={link.original_url || ''}
                        className="flex-1 bg-ink/5 border-none p-2 text-[9px] font-mono truncate"
                      />
                      <button 
                        onClick={() => handleCopy(link.original_url, `${link.id}-orig`)}
                        className="p-2 hover:bg-ink hover:text-paper transition-all"
                      >
                        {copiedId === `${link.id}-orig` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono font-bold uppercase opacity-30">CONVERTED DIRECT URL</label>
                    <div className="flex items-center gap-2">
                      <input 
                        readOnly
                        value={link.converted_url || ''}
                        className="flex-1 bg-ink/5 border-none p-2 text-[9px] font-mono truncate"
                      />
                      <button 
                        onClick={() => handleCopy(link.converted_url, `${link.id}-conv`)}
                        className="p-2 bg-ink text-paper hover:bg-zinc-800 transition-all"
                      >
                        {copiedId === `${link.id}-conv` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <a 
                        href={link.converted_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-ink/10 text-ink hover:bg-ink/5 transition-all"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex lg:flex-col gap-2">
                <button 
                  onClick={() => onDelete(link.id)}
                  className="p-4 text-ink/40 hover:bg-ink/5 transition-all border border-transparent hover:border-ink/10"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredLinks.length === 0 && (
          <div className="p-20 text-center space-y-4 border border-dashed border-ink/10">
            <Globe size={48} className="mx-auto opacity-10" />
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-40">NO DRIVE LINKS FOUND</p>
              <p className="text-[10px] font-mono uppercase opacity-20 mt-2">The repository is currently empty or filtered.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
