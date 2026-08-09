import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Loader2, CheckCircle2, AlertCircle, Link, Plus, Trash2, Database, Sparkles, Search } from 'lucide-react';
import { convertGoogleDriveUrl } from '../../utils/helpers';

interface BulkDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: { original: string; converted: string }[]) => Promise<void>;
  onScanFolder?: (url: string) => Promise<void>;
}

export const BulkDriveImportModal: React.FC<BulkDriveImportModalProps> = ({ isOpen, onClose, onImport, onScanFolder }) => {
  const [mode, setMode] = React.useState<'manual' | 'smart'>('manual');
  const [urls, setUrls] = React.useState<string[]>(['']);
  const [folderUrl, setFolderUrl] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const handleAddUrl = () => setUrls(prev => [...prev, '']);
  const handleRemoveUrl = (index: number) => setUrls(prev => prev.filter((_, i) => i !== index));
  const handleUrlChange = (index: number, value: string) => {
    setUrls(prev => {
      const newUrls = [...prev];
      newUrls[index] = value;
      return newUrls;
    });
  };

  const processImport = async () => {
    if (mode === 'smart') {
      if (!folderUrl.trim() || !onScanFolder) return;
      setStatus('processing');
      setError(null);
      try {
        await onScanFolder(folderUrl);
        setStatus('success');
        setTimeout(() => {
          onClose();
          setFolderUrl('');
          setStatus('idle');
        }, 2000);
      } catch (err) {
        console.error(err);
        setError("FOLDER_SCAN_FAILED. ENSURE_FOLDER_IS_PUBLIC.");
        setStatus('error');
      }
      return;
    }

    const importData = urls
      .filter(u => u.trim() !== '')
      .map(u => ({
        original: u,
        converted: convertGoogleDriveUrl(u)
      }));

    if (importData.length === 0) return;

    setStatus('processing');
    setError(null);

    try {
      await onImport(importData);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setUrls(['']);
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("IMPORT_PROTOCOL_FAILED. VERIFY_LINKS_AND_RETRY.");
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-paper/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-paper border border-ink/5 w-full max-w-2xl h-[70vh] overflow-hidden relative shadow-2xl flex flex-col"
          >
            <div className="p-6 sm:p-8 border-b border-ink/5 flex justify-between items-center bg-paper sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-display tracking-tighter uppercase">BULK_DRIVE_IMPORT</h2>
                  <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Protocol: ASSET_INDUCTION</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-ink hover:text-paper transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 sm:p-12">
              {status === 'idle' ? (
                <div className="space-y-8">
                  {/* Mode Selector */}
                  <div className="flex border border-ink/10 p-1 bg-ink/5">
                    <button 
                      onClick={() => setMode('manual')}
                      className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-ink text-paper' : 'opacity-40 hover:opacity-100'}`}
                    >
                      MANUAL_LINKS
                    </button>
                    <button 
                      onClick={() => setMode('smart')}
                      className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${mode === 'smart' ? 'bg-ink text-paper' : 'opacity-40 hover:opacity-100'}`}
                    >
                      SMART_FOLDER_SCAN
                    </button>
                  </div>

                  {mode === 'manual' ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-ink/5 border border-ink/5 space-y-4">
                        <p className="text-[10px] font-mono uppercase leading-relaxed opacity-60">
                          * Enter individual Google Drive share links. The protocol will convert them to direct download URLs.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {urls.map((url, idx) => (
                          <div key={idx} className="flex gap-2">
                            <div className="relative flex-1">
                              <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                              <input 
                                value={url}
                                onChange={(e) => handleUrlChange(idx, e.target.value)}
                                placeholder="DRIVE_SHARE_LINK"
                                className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all placeholder:opacity-20"
                              />
                            </div>
                            {urls.length > 1 && (
                              <button 
                                onClick={() => handleRemoveUrl(idx)}
                                className="p-4 text-ink/40 hover:bg-ink/5 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={handleAddUrl}
                        className="w-full py-4 border border-dashed border-ink/10 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-ink/5 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} /> ADD_ANOTHER_LINK
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-6 bg-ink/5 border border-ink/10 space-y-4">
                        <div className="flex items-center gap-2 text-ink">
                          <Sparkles size={14} />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">AI_POWERED_EXTRACTION</span>
                        </div>
                        <p className="text-[10px] font-mono uppercase leading-relaxed opacity-60">
                          * Provide a Google Drive folder link. Gemini will scan the folder, extract all numbered or relevant artifact photos, and induct them automatically.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">FOLDER_URL</label>
                        <div className="relative">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                          <input 
                            value={folderUrl}
                            onChange={(e) => setFolderUrl(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full bg-ink/5 border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                  <AnimatePresence mode="wait">
                    {status === 'processing' ? (
                      <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="w-24 h-24 bg-ink text-paper flex items-center justify-center mx-auto">
                          <Loader2 className="animate-spin" size={48} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display tracking-tighter uppercase">PROCESSING_LINKS...</h3>
                          <p className="text-[10px] font-mono uppercase opacity-40 mt-2 tracking-widest">CONVERTING_PROTOCOLS</p>
                        </div>
                      </motion.div>
                    ) : status === 'success' ? (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="w-24 h-24 bg-ink text-paper flex items-center justify-center mx-auto">
                          <CheckCircle2 size={48} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display tracking-tighter uppercase">IMPORT_COMPLETE</h3>
                          <p className="text-[10px] font-mono uppercase opacity-40 mt-2 tracking-widest">ALL_ASSETS_SUBLIMATED</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="error" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="w-24 h-24 bg-ink/10 text-ink flex items-center justify-center mx-auto">
                          <AlertCircle size={48} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display tracking-tighter uppercase">PROTOCOL_ERROR</h3>
                          <p className="text-[10px] font-mono uppercase text-ink mt-2 tracking-widest">{error}</p>
                        </div>
                        <button onClick={() => setStatus('idle')} className="px-8 py-4 border border-ink/10 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all">RETRY_IMPORT</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {status === 'idle' && (mode === 'smart' ? folderUrl.trim() : urls.some(u => u.trim() !== '')) && (
              <div className="p-8 border-t border-ink/5 flex justify-end gap-4 bg-paper sticky bottom-0">
                <button 
                  onClick={() => mode === 'smart' ? setFolderUrl('') : setUrls([''])}
                  className="px-8 py-4 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                >
                  [ CLEAR_ALL ]
                </button>
                <button 
                  onClick={processImport}
                  className="px-12 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3"
                >
                  {mode === 'smart' ? <Sparkles size={14} /> : <Database size={14} />}
                  {mode === 'smart' ? 'INITIATE_SMART_SCAN' : `INITIATE_IMPORT (${urls.filter(u => u.trim() !== '').length})`}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
