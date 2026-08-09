import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutGrid, Save, Loader2, Plus, Trash2, ArrowUp, ArrowDown, 
  Image as ImageIcon, Video, Link, ExternalLink, CloudUpload
} from 'lucide-react';
import { AppSettings, ProductAsset } from '../../types';
import { convertGoogleDriveUrl } from '../../utils/helpers';

interface HeroTabProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

export const HeroTab: React.FC<HeroTabProps> = ({ 
  settings, 
  onSave 
}) => {
  const [slides, setSlides] = React.useState<ProductAsset[]>(settings.hero_slides || []);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null); // null = add new
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSlides(settings.hero_slides || []);
  }, [settings.hero_slides]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({ hero_slides: slides });
    } finally {
      setIsLoading(false);
    }
  };

  const addSlide = () => {
    setSlides([...slides, { url: '', type: 'image' }]);
  };

  const removeSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
  };

  const updateSlide = (index: number, updates: Partial<ProductAsset>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < slides.length) {
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
      setSlides(newSlides);
    }
  };

  const handleFileUpload = async (files: FileList | null, index?: number | null) => {
    const file = files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { storage, ref, uploadBytes, getDownloadURL } = await import('../../firebase');
      const fileRef = ref(storage, `site/hero_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      
      if (index === null || index === undefined) {
        setSlides([...slides, { url, type }]);
      } else {
        const newSlides = [...slides];
        newSlides[index] = { url, type };
        setSlides(newSlides);
      }
    } catch (error) {
      console.error("Hero tab upload failed:", error);
    } finally {
      setIsUploading(false);
      setIsDragging(false);
      setDragIndex(null);
    }
  };

  const onDragOver = (e: React.DragEvent, index: number | null) => {
    e.preventDefault();
    setIsDragging(true);
    setDragIndex(index);
  };

  const onDragLeave = () => {
    setIsDragging(false);
    setDragIndex(null);
  };

  const onDrop = (e: React.DragEvent, index: number | null) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files, index);
  };

  const repairSlideshow = () => {
    const requestedUrl = 'https://lh3.googleusercontent.com/d/1zdsMKzx2eky-W9GxjtogLdB8CFu6a46g';
    // Check if it already exists
    if (slides.some(s => s.url === requestedUrl)) {
      alert("ASSET ALREADY PRESENT IN SEQUENCE");
      return;
    }
    const newSlides = [{ url: requestedUrl, type: 'image' as const }, ...slides];
    setSlides(newSlides);
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">HERO SLIDESHOW</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Manage the visual sequence of the storefront hero section.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={repairSlideshow}
            className="px-6 py-4 border border-ink text-ink text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all flex items-center gap-3"
          >
            <CloudUpload size={16} />
            SYNC_REQUESTED_ASSET
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="px-12 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            SAVE SEQUENCE
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {slides.map((slide, index) => (
            <motion.div 
              key={index}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-8 bg-ink/5 border border-ink/5 flex flex-col md:flex-row gap-8 relative group"
            >
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => moveSlide(index, 'up')}
                  disabled={index === 0}
                  className="p-2 hover:bg-ink/10 disabled:opacity-10 transition-all"
                >
                  <ArrowUp size={14} />
                </button>
                <div className="flex-1 flex items-center justify-center font-mono text-[10px] font-bold opacity-20">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <button 
                  onClick={() => moveSlide(index, 'down')}
                  disabled={index === slides.length - 1}
                  className="p-2 hover:bg-ink/10 disabled:opacity-10 transition-all"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ASSET TYPE</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateSlide(index, { type: 'image' })}
                        className={`flex-1 p-4 border text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${slide.type === 'image' ? 'bg-ink text-paper border-ink' : 'bg-paper/50 border-ink/10 hover:border-ink/30'}`}
                      >
                        <ImageIcon size={14} />
                        IMAGE
                      </button>
                      <button 
                        onClick={() => updateSlide(index, { type: 'video' })}
                        className={`flex-1 p-4 border text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${slide.type === 'video' ? 'bg-ink text-paper border-ink' : 'bg-paper/50 border-ink/10 hover:border-ink/30'}`}
                      >
                        <Video size={14} />
                        VIDEO
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ASSET URL</label>
                    <div className="relative">
                      <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                      <input 
                        value={slide.url}
                        onChange={(e) => updateSlide(index, { url: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value) {
                            const converted = convertGoogleDriveUrl(e.target.value);
                            updateSlide(index, { url: converted });
                          }
                        }}
                        placeholder="URL OR DRIVE LINK"
                        className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div 
                onDragOver={(e) => onDragOver(e, index)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, index)}
                className={`w-full md:w-48 aspect-video bg-ink/5 border border-ink/5 overflow-hidden relative transition-all duration-300 ${isDragging && dragIndex === index ? 'ring-2 ring-ink ring-inset scale-105 z-10' : ''}`}
              >
                {isDragging && dragIndex === index && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/20 backdrop-blur-[2px]">
                    <CloudUpload className="text-ink animate-bounce" size={24} />
                  </div>
                )}
                {isUploading && dragIndex === index && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
                    <Loader2 className="animate-spin text-ink" size={24} />
                  </div>
                )}
                {slide.url ? (
                  slide.type === 'video' ? (
                    <video src={slide.url} className="w-full h-full object-cover opacity-60" muted />
                  ) : (
                    <img src={slide.url} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <ImageIcon size={24} />
                  </div>
                )}
                {slide.url && (
                  <a 
                    href={slide.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 bg-ink text-paper opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>

              <button 
                onClick={() => removeSlide(index)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <button 
          onClick={addSlide}
          onDragOver={(e) => onDragOver(e, null)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, null)}
          className={`w-full p-8 border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 group ${isDragging && dragIndex === null ? 'border-ink bg-ink/5 scale-[1.01]' : 'border-ink/10 hover:border-ink/30'}`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isDragging && dragIndex === null ? 'bg-ink text-paper' : 'bg-ink/5 group-hover:bg-ink group-hover:text-paper'}`}>
            {isUploading && dragIndex === null ? <Loader2 size={24} className="animate-spin" /> : isDragging && dragIndex === null ? <CloudUpload size={24} /> : <Plus size={24} />}
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100">
            {isDragging && dragIndex === null ? 'DROP_TO_UPLOAD' : 'ADD NEW SLIDE'}
          </span>
        </button>
      </div>
    </div>
  );
};
