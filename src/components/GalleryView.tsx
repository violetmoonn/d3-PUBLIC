import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { convertGoogleDriveUrl, t } from '../utils/helpers';
import { MediaRenderer } from './MediaRenderer';
import { Maximize2, Layers, Grid, Filter, Undo, X } from 'lucide-react';

interface GalleryViewProps {
  products: Product[];
}

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'model3d';
  productName: string;
  category: string;
}

export function GalleryView({ products }: GalleryViewProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Collect all unique media files across all products
  const productMedia: MediaItem[] = products.flatMap(product => 
    (product.images || []).map(img => ({
      url: img.url,
      type: (img.type === 'video' || img.type === 'model3d' ? img.type : 'image') as 'image' | 'video' | 'model3d',
      productName: product.name,
      category: product.category || 'ARTIFACT'
    }))
  );

  const galleryItems: MediaItem[] = productMedia;

  // Get unique categories for filtration
  const categories = ['ALL', ...Array.from(new Set(galleryItems.map(item => item.category.toUpperCase())))];

  // Filtered list
  const filteredItems = activeFilter === 'ALL' 
    ? galleryItems 
    : galleryItems.filter(item => item.category.toUpperCase() === activeFilter);

  return (
    <div className="max-w-[1440px] mx-auto px-[var(--spacing-phi-5)] sm:px-[var(--spacing-phi-6)] md:px-[var(--spacing-phi-7)] py-4 space-y-8 font-typewriter">
      
      {/* Filter Tabs */}
      <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`text-[14px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
              activeFilter === cat 
                ? 'text-ink font-bold' 
                : 'text-ink/40 hover:text-ink font-medium'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mosaic Bento Grid */}
      <motion.div 
        layout 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              layout
              key={`${item.url}-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onClick={() => setSelectedMedia(item)}
              className="group relative aspect-[3/4] rounded-[var(--radius-phi-1)] overflow-hidden bg-black/5 dark:bg-white/5 border border-ink/10 cursor-pointer"
            >
              <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-500">
                <MediaRenderer 
                  asset={{ url: item.url, type: item.type }} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {item.type === 'video' && (
                <div className="absolute top-2 left-2 z-10 bg-black/70 border border-white/20 px-2 py-0.5 text-[8px] font-mono font-bold text-white uppercase tracking-wider rounded-sm">
                  VIDEO
                </div>
              )}

              {/* Technical Monospaced Hover Overlay */}
              <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] text-paper/40 tracking-widest uppercase">
                    [ G_ID {index.toString().padStart(3, '0')} ]
                  </span>
                  <div className="p-1.5 border border-paper/20 rounded-full text-paper/60">
                    <Maximize2 size={10} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-mono text-[11px] font-bold tracking-wider text-paper uppercase">
                    {item.productName}
                  </p>
                  <p className="font-mono text-[8px] tracking-widest text-paper/50 uppercase">
                    CLASSIFICATION: {item.category}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Immersive Full-Screen Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 w-screen h-screen overflow-hidden"
          >
            {/* Safe Area Close Action at Top-Right */}
            <div className="absolute top-6 right-6 z-[101]">
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-white hover:opacity-50 transition-all p-2 cursor-pointer bg-black/40 backdrop-blur-md rounded-full border border-white/10"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Curated Visual Frame - True Fullscreen for Video & High-Res Images */}
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'video' ? (
                <video 
                  src={selectedMedia.url} 
                  autoPlay 
                  controls 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover sm:object-contain bg-black"
                />
              ) : (
                <MediaRenderer 
                  asset={{ url: selectedMedia.url, type: selectedMedia.type }} 
                  className="max-w-full max-h-full object-contain" 
                />
              )}
            </motion.div>

            {/* Bottom Meta Data Bar */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-6 left-6 z-[101] max-w-md p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm font-mono text-white"
            >
              <h3 className="text-xs tracking-widest font-bold uppercase">{selectedMedia.productName}</h3>
              <p className="text-[9px] tracking-widest uppercase opacity-40 mt-1">
                SERIES REF: {selectedMedia.category} | FULL SCREEN CAPTURE
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
