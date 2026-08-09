import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

export const ContactForm: React.FC = () => {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');

    try {
      const response = await fetch('/api/transmissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("TRANSMISSION_FAILED");
      }

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-24 px-8 space-y-8 font-mono">
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-center">CONTACT</h1>
        <div className="space-y-2 text-[12px] font-mono opacity-70 leading-relaxed uppercase">
          <p className="lowercase">
            <a href="mailto:inquire@d3composure.com" className="transition-all hover:text-zinc-600 underline">inquire@d3composure.com</a>
          </p>
          <p className="pt-4 max-w-md mx-auto">
            IF THERE IS A PROBLEM WITH YOUR ORDER, CONTACT US AND WE WILL TAKE FULL RESPONSIBILITY
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid grid-cols-1 gap-12">
          <div className="relative group">
            <input 
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-transparent border-b border-ink/10 py-4 text-[11px] font-mono focus:ring-0 focus:border-ink transition-all placeholder:text-ink/20 uppercase"
              placeholder="NAME"
              id="name"
            />
          </div>

          <div className="relative group">
            <input 
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-transparent border-b border-ink/10 py-4 text-[11px] font-mono focus:ring-0 focus:border-ink transition-all placeholder:text-ink/20 uppercase"
              placeholder="EMAIL"
              id="email"
            />
          </div>

          <div className="relative group">
            <textarea 
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full bg-transparent border-b border-ink/10 py-4 text-[11px] font-mono focus:ring-0 focus:border-ink transition-all placeholder:text-ink/20 uppercase resize-none"
              placeholder="MESSAGE"
              id="message"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <p className="text-[8.5px] font-mono uppercase tracking-wider text-ink/40 text-center leading-relaxed max-w-sm">
            By using it, you agree to our Terms & Privacy Policy. Data may be used to improve our products.
          </p>

          <button 
            type="submit"
            disabled={status === 'loading'}
            className="group relative px-12 py-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-ink translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative flex items-center gap-4 text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-ink group-hover:text-paper transition-colors duration-500">
              <AnimatePresence mode="wait">
                {status === 'loading' ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 className="animate-spin" size={16} />
                  </motion.div>
                ) : status === 'success' ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>SUBMITTED</span>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <span>Submit Request</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-ink/20 group-hover:bg-transparent transition-colors" />
          </button>

          {status === 'error' && (
            <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest animate-pulse">
              ERROR SUBMITTING MESSAGE. PLEASE RETRY.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
