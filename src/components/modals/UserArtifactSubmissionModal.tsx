import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2, AlertCircle, Plus, Image as ImageIcon, Link2, HelpCircle } from 'lucide-react';
import { auth } from '../../firebase';
import { generateUid, convertGoogleDriveUrl } from '../../utils/helpers';

interface UserArtifactSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserArtifactSubmissionModal: React.FC<UserArtifactSubmissionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('0');
  const [stripeLink, setStripeLink] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [driveUrl, setDriveUrl] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  // Auto-convert Google Drive links on the fly to get instant previews
  const previewUrl = React.useMemo(() => {
    if (!driveUrl) return null;
    return convertGoogleDriveUrl(driveUrl) || driveUrl;
  }, [driveUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl || !name || status !== 'idle') return;

    setStatus('uploading');
    setError(null);

    try {
      const imageUrl = convertGoogleDriveUrl(driveUrl) || driveUrl;

      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error("COULD_NOT_RESOLVE_VISUAL_RESOURCE_URL");
      }

      const parsedPrice = parseFloat(price) || 0;

      // Save to Firestore via Public Submission API
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            name: name.trim(),
            description: description.trim(),
            price: parsedPrice,
            stripe_payment_link: stripeLink.trim(),
            images: [{ url: imageUrl, type: 'image', uid: generateUid() }],
            category: 'USER_SUBMISSION',
            stock: 99,
            is_visible: false,
            author_uid: auth.currentUser?.uid || 'ANONYMOUS'
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "SUBMISSION_FAILED");
      }

      setStatus('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setDriveUrl('');
        setName('');
        setPrice('0');
        setStripeLink('');
        setDescription('');
        setStatus('idle');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "SUBMISSION_FAILED. PROTOCOL_ERROR.");
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
            className="bg-paper border border-ink/5 w-full max-w-3xl h-auto max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-ink/5 flex justify-between items-center bg-paper sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-display tracking-tighter uppercase">SUBMIT_CO_DESIGN</h2>
                  <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Protocol: VISITOR_PRODUCT_INDUCTION</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-ink hover:text-paper transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10">
              {status === 'idle' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Two Column Layout: Form Fields vs Live Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="space-y-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Artifact Title / Product name</label>
                        <input 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Composure Wool Scarf"
                          className="w-full bg-ink/5 border border-ink/10 p-3 text-[11px] font-mono focus:ring-1 focus:ring-ink/30 focus:border-ink/30 transition-all placeholder:opacity-20"
                        />
                      </div>

                      {/* Price & Stripe Link Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2 sm:col-span-1">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Price (USD)</label>
                          <input 
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-ink/5 border border-ink/10 p-3 text-[11px] font-mono focus:ring-1 focus:ring-ink/30 focus:border-ink/30 transition-all placeholder:opacity-20"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Stripe Payment Link (Optional)</label>
                          <input 
                            value={stripeLink}
                            onChange={(e) => setStripeLink(e.target.value)}
                            placeholder="https://buy.stripe.com/..."
                            className="w-full bg-ink/5 border border-ink/10 p-3 text-[11px] font-mono focus:ring-1 focus:ring-ink/30 focus:border-ink/30 transition-all placeholder:opacity-20"
                          />
                        </div>
                      </div>

                      {/* Photo Cover URL */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 flex items-center justify-between">
                          <span>PHOTO COVER LINK</span>
                          <span className="text-[8px] opacity-60">Drive Share or Direct Image URL</span>
                        </label>
                        <input 
                          required
                          value={driveUrl}
                          onChange={(e) => setDriveUrl(e.target.value)}
                          placeholder="Paste a direct image URL or Google Drive link"
                          className="w-full bg-ink/5 border border-ink/10 p-3 text-[11px] font-mono focus:ring-1 focus:ring-ink/30 focus:border-ink/30 transition-all placeholder:opacity-20"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Product Description</label>
                        <textarea 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Tell us about the composition, craftsmanship, and materials."
                          rows={4}
                          className="w-full bg-ink/5 border border-ink/10 p-3 text-[11px] font-mono focus:ring-1 focus:ring-ink/30 focus:border-ink/30 transition-all resize-none placeholder:opacity-20"
                        />
                      </div>
                    </div>

                    {/* Pre-visualization card on right column */}
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-ink/10 bg-ink/[0.01]">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                        <ImageIcon size={12} /> LIVE PRE_VISUALIZATION
                      </span>

                      {previewUrl ? (
                        <div className="relative w-full max-w-[210px] aspect-[1/1.618] bg-black border border-ink/10 overflow-hidden shadow-xl flex flex-col justify-end p-4 group">
                          {/* Image rendering with Referrer policy */}
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                            onError={(e) => {
                              // Fallback on link fail
                              (e.target as HTMLElement).setAttribute('style', 'display: none');
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-[1]" />
                          
                          {/* Card details mockup */}
                          <div className="relative z-10 text-white space-y-1">
                            <span className="text-[8px] font-mono bg-white/20 px-1 py-0.5 uppercase tracking-widest">USER_SUBMISSION</span>
                            <h4 className="text-sm font-display font-black uppercase truncate">{name || 'UNTITLED_CO_DESIGN'}</h4>
                            <p className="text-xs font-mono font-bold text-gray-300">{parseFloat(price || '0').toFixed(2)} USD</p>
                            {stripeLink && <span className="text-[6px] font-mono text-green-400 flex items-center gap-1"><Link2 size={8}/> STRIPE MERCHANT ACTIVE</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-[210px] aspect-[1/1.618] border border-dashed border-ink/10 flex flex-col items-center justify-center text-center p-4 text-ink/20">
                          <ImageIcon size={32} className="opacity-10 mb-2" />
                          <p className="text-[9px] font-mono uppercase tracking-widest">PASTE COVERS LINK ABOVE FOR IMMEDIATE RENDERING PREVIEW</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-widest flex items-center gap-3">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  <p className="text-[8.5px] font-mono uppercase tracking-wider text-ink/40 text-center leading-relaxed">
                    By using it, you agree to our Terms & Privacy Policy. Data may be used to improve our products.
                  </p>

                  <button 
                    type="submit"
                    disabled={!driveUrl || !name}
                    className="w-full py-5 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-md"
                  >
                    <Plus size={14} />
                    TRANSMIT ARTIFACT FOR REVIEW
                  </button>
                </form>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-8">
                  <AnimatePresence mode="wait">
                    {status === 'uploading' ? (
                      <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="w-24 h-24 bg-ink text-paper flex items-center justify-center mx-auto relative">
                          <Loader2 className="animate-spin" size={48} />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold">...</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-display tracking-tighter uppercase">TRANSMITTING_ARTIFACT...</h3>
                          <p className="text-[10px] font-mono uppercase opacity-40 mt-2 tracking-widest animate-pulse">SECURE_UPLOAD_IN_PROGRESS</p>
                        </div>
                      </motion.div>
                    ) : status === 'success' ? (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="w-24 h-24 bg-green-500 text-white flex items-center justify-center mx-auto">
                          <CheckCircle2 size={48} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display tracking-tighter uppercase">INDUCTION_SUCCESSFUL</h3>
                          <p className="text-[10px] font-mono uppercase text-green-600 mt-2 tracking-widest font-bold">ARTIFACT SAVED TO PUBLIC REVIEW QUEUE</p>
                          <p className="text-[8px] font-mono uppercase opacity-40 mt-4 max-w-sm mx-auto leading-relaxed">
                            YOUR DESIGN HAS BEEN TRANSLATED AND STORED AS A PENDING MERCHANT ITEM. AN ADMINISTRATOR CAN INSTANTLY APPROVE IT VIA THE ASSET REGISTRY WITH A SINGLE CLICK!
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="error" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="w-24 h-24 bg-red-500 text-white flex items-center justify-center mx-auto">
                          <AlertCircle size={48} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display tracking-tighter uppercase">PROTOCOL_ERROR</h3>
                          <p className="text-[10px] font-mono uppercase text-red-500 mt-2 tracking-widest">{error}</p>
                        </div>
                        <button onClick={() => setStatus('idle')} className="px-8 py-4 border border-ink/10 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all">RETRY_SUBMISSION</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
