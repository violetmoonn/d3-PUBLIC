import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github, Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Terminal, FileCode, History } from 'lucide-react';

export const GitHubExport: React.FC = () => {
  const [status, setStatus] = React.useState<'idle' | 'authenticating' | 'exporting' | 'success' | 'error'>('idle');
  const [repoName, setRepoName] = React.useState('d3composure-v2');
  const [username, setUsername] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;
    
    setStatus('authenticating');
    setError(null);

    try {
      // 1. Authenticate with GitHub (Mocking the OAuth flow)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus('exporting');
      
      // 2. Export Codebase (Mocking the export process)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error(err);
      setError("GITHUB_PROTOCOL_FAILED. VERIFY_CREDENTIALS_AND_RETRY.");
      setStatus('error');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <Github size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">SOURCE ARCHIVE</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Archive the void's source code.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-ink/5 border border-ink/5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">GATEWAY_READY</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="p-8 bg-ink/5 border border-ink/5 space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">EXPORT_CONFIGURATION</span>
            </div>
            
            <form onSubmit={handleExport} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">GITHUB_USERNAME</label>
                <input 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ENTER_USERNAME"
                  className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all placeholder:opacity-20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">REPOSITORY_NAME</label>
                <input 
                  required
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="ENTER_REPO_NAME"
                  className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all placeholder:opacity-20"
                />
              </div>

              <button 
                type="submit"
                disabled={status !== 'idle'}
                className="w-full bg-ink text-paper py-5 text-[12px] font-mono font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:opacity-80 transition-all disabled:opacity-50 group"
              >
                {status === 'authenticating' || status === 'exporting' ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                )}
                {status === 'authenticating' ? 'AUTHENTICATING...' : status === 'exporting' ? 'EXPORTING_CODEBASE...' : 'INITIATE_EXPORT'}
              </button>
            </form>
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 bg-green-50 border border-green-100 flex items-center gap-6"
              >
                <div className="w-12 h-12 bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-700">EXPORT_SUCCESSFUL</p>
                  <p className="text-[8px] font-mono uppercase opacity-60 mt-1 text-green-600">The void's source has been archived to your repository.</p>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 bg-red-50 border border-red-100 flex items-center gap-6"
              >
                <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-700">PROTOCOL_ERROR</p>
                  <p className="text-[8px] font-mono uppercase opacity-60 mt-1 text-red-600">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          <div className="p-8 border border-ink/5 space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <Terminal size={16} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">EXPORT_LOGS</span>
            </div>
            
            <div className="space-y-4 font-mono text-[10px] uppercase">
              <div className="flex gap-4 opacity-40">
                <span className="text-ink/30">[19:48:19]</span>
                <span>INITIALIZING_EXPORT_ENGINE...</span>
              </div>
              <div className="flex gap-4 opacity-40">
                <span className="text-ink/30">[19:48:20]</span>
                <span>SCANNING_VOID_ASSETS...</span>
              </div>
              <div className="flex gap-4 opacity-40">
                <span className="text-ink/30">[19:48:21]</span>
                <span>PREPARING_SUBLIMATION_PAYLOAD...</span>
              </div>
              {status === 'authenticating' && (
                <div className="flex gap-4 text-blue-500">
                  <span className="opacity-40">[19:48:22]</span>
                  <span className="animate-pulse">AWAITING_GITHUB_OAUTH_SIGNAL...</span>
                </div>
              )}
              {status === 'exporting' && (
                <div className="flex gap-4 text-blue-500">
                  <span className="opacity-40">[19:48:23]</span>
                  <span className="animate-pulse">PUSHING_ARTIFACTS_TO_REMOTE...</span>
                </div>
              )}
              {status === 'success' && (
                <div className="flex gap-4 text-green-500 font-bold">
                  <span className="opacity-40">[19:48:25]</span>
                  <span>EXPORT_COMPLETE. VOID_ARCHIVED.</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 border border-ink/5 flex flex-col items-center justify-center text-center space-y-3">
              <FileCode className="opacity-20" size={32} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">SOURCE_FILES</span>
              <span className="text-2xl font-display tracking-tighter">142</span>
            </div>
            <div className="p-6 border border-ink/5 flex flex-col items-center justify-center text-center space-y-3">
              <History className="opacity-20" size={32} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">TOTAL_COMMITS</span>
              <span className="text-2xl font-display tracking-tighter">842</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
