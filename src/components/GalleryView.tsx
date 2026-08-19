import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { MediaRenderer } from './MediaRenderer';
import { AirtableStorefront } from './AirtableStorefront';
import { Maximize2, Grid, ChevronLeft, ChevronRight, X, Sparkles, ArrowRight, Eye, Layers } from 'lucide-react';

interface GalleryViewProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
}

interface LookbookItem {
  url: string;
  type: 'image' | 'video' | 'model3d';
  productName: string;
  category: string;
  product?: Product;
  sequenceLabel?: string;
  sequenceIndex?: number;
}

export function GalleryView({ products, onSelectProduct }: GalleryViewProps) {
  const [viewMode, setViewMode] = useState<'lookbook' | 'grid' | 'airtable'>('lookbook');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Sequence label generator based on order in product
  const getSequenceLabel = (index: number) => {
    switch (index) {
      case 0:
        return 'Model Front';
      case 1:
        return 'Model Back';
      case 2:
        return 'Garment Detail';
      default:
        return `Angle ${index + 1}`;
    }
  };

  // Collect media items with product mapping and sequence labels
  const galleryItems: LookbookItem[] = products.flatMap(product => 
    (product.images || []).map((img, idx) => ({
      url: img.url,
      type: (img.type === 'video' || img.type === 'model3d' ? img.type : 'image') as 'image' | 'video' | 'model3d',
      productName: product.name,
      category: product.category || 'Artifact',
      product: product,
      sequenceLabel: getSequenceLabel(idx),
      sequenceIndex: idx
    }))
  );

  // Categories
  const categories = ['ALL', ...Array.from(new Set(galleryItems.map(item => item.category.toUpperCase())))];

  // Filtered
  const filteredItems = activeFilter === 'ALL'
    ? galleryItems
    : galleryItems.filter(item => item.category.toUpperCase() === activeFilter);

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedMediaIndex === null) return;
      if (e.key === 'Escape') {
        setSelectedMediaIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedMediaIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setSelectedMediaIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMediaIndex, filteredItems.length]);

  const currentLightboxItem = selectedMediaIndex !== null ? filteredItems[selectedMediaIndex] : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 font-sans">
      
      {/* Top Header & Layout Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-ink">
            Lookbook & Editorial
          </h1>
          <p className="text-xs text-ink/60 mt-0.5">
            Full-bleed high-definition campaign visuals and garment sequence
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-ink/5 rounded">
            <button
              onClick={() => setViewMode('lookbook')}
              className={`px-3 py-1 text-xs font-medium transition-all rounded cursor-pointer ${
                viewMode === 'lookbook'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Lookbook
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs font-medium transition-all rounded cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('airtable')}
              className={`px-3 py-1 text-xs font-medium transition-all rounded cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'airtable'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Layers size={12} />
              <span>Airtable Catalog</span>
            </button>
          </div>

          {/* Filter Categories */}
          {viewMode !== 'airtable' && categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`text-xs transition-colors cursor-pointer ${
                    activeFilter === cat 
                      ? 'text-ink font-semibold' 
                      : 'text-ink/40 hover:text-ink font-normal'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 0. AIRTABLE STOREFRONT MODE */}
      {viewMode === 'airtable' && (
        <div className="py-2">
          <AirtableStorefront 
            defaultHeight={700}
            title="Airtable Storefront & High-Resolution Assets"
            subtitle="Explore high-definition product imagery, inventory batches, and lookbook media directly synced with Airtable"
          />
        </div>
      )}

      {/* 1. LOOKBOOK EDITORIAL SPREAD MODE */}
      {viewMode === 'lookbook' && (
        <div className="space-y-16">
          {products.map((product) => {
            const productImages = product.images || [];
            if (productImages.length === 0) return null;

            return (
              <div key={product.id || product.name} className="space-y-6">
                {/* Product Editorial Header */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ink/50 tracking-wider">
                        {product.category || 'Artifact'}
                      </span>
                      <span className="text-[11px] text-ink/30">•</span>
                      <span className="text-[11px] text-ink/50">
                        {productImages.length} Editorial Angles
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink mt-0.5">
                      {product.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-mono text-ink">
                      ${product.price}
                    </span>
                    {onSelectProduct && (
                      <button
                        onClick={() => onSelectProduct(product)}
                        className="px-4 py-2 bg-ink text-paper text-xs font-medium rounded hover:bg-ink/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Shop Artifact</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Editorial Photo Spread (Front -> Back -> Garment) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {productImages.map((img, idx) => {
                    const globalIdx = galleryItems.findIndex(item => item.url === img.url);
                    const label = getSequenceLabel(idx);

                    return (
                      <motion.div
                        key={`${img.url}-${idx}`}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="group relative flex flex-col cursor-pointer"
                        onClick={() => setSelectedMediaIndex(globalIdx >= 0 ? globalIdx : 0)}
                      >
                        {/* Image Container with high-end editorial aspect ratio */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 rounded">
                          <div className="w-full h-full transform group-hover:scale-103 transition-transform duration-700 ease-out">
                            <MediaRenderer
                              asset={{ url: img.url, type: img.type || 'image' }}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Hover Action Badge */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs text-white p-2 rounded-full shadow-sm">
                            <Maximize2 size={13} />
                          </div>

                          {/* Sequence pill badge on image */}
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded">
                            {idx + 1} / {productImages.length} • {label}
                          </div>
                        </div>

                        {/* Caption below image */}
                        <div className="mt-2.5 flex items-center justify-between text-xs text-ink/70">
                          <span className="font-medium text-ink">{label}</span>
                          <span className="text-[11px] text-ink/40">Click to expand</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. BENTO / MOSAIC GRID MODE */}
      {viewMode === 'grid' && (
        <motion.div 
          layout 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                layout
                key={`${item.url}-${index}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedMediaIndex(index)}
                className="group relative aspect-[3/4] rounded overflow-hidden bg-black/5 cursor-pointer"
              >
                <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-500">
                  <MediaRenderer 
                    asset={{ url: item.url, type: item.type }} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Hover Details Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono bg-black/60 px-1.5 py-0.5 rounded">
                      {item.sequenceLabel}
                    </span>
                    <div className="p-1.5 bg-black/60 rounded-full">
                      <Maximize2 size={11} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold">
                      {item.productName}
                    </p>
                    <p className="text-[10px] opacity-70">
                      {item.category}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 3. FULLSCREEN IMMERSIVE LIGHTBOX */}
      <AnimatePresence>
        {currentLightboxItem && selectedMediaIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-0 w-screen h-screen overflow-hidden backdrop-blur-md"
            onClick={() => setSelectedMediaIndex(null)}
          >
            {/* Top Toolbar */}
            <div 
              className="absolute top-4 left-4 right-4 z-[102] flex items-center justify-between pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-white">
                <p className="text-sm font-medium">{currentLightboxItem.productName}</p>
                <p className="text-[11px] text-white/60 font-mono">
                  {currentLightboxItem.sequenceLabel} • {selectedMediaIndex + 1} of {filteredItems.length}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {currentLightboxItem.product && onSelectProduct && (
                  <button
                    onClick={() => {
                      if (currentLightboxItem.product) {
                        onSelectProduct(currentLightboxItem.product);
                        setSelectedMediaIndex(null);
                      }
                    }}
                    className="px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    View Product Details
                  </button>
                )}

                <button
                  onClick={() => setSelectedMediaIndex(null)}
                  className="text-white/80 hover:text-white transition-all p-2 cursor-pointer bg-white/10 rounded-full"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Left Prev Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMediaIndex(prev => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[102] p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer pointer-events-auto"
              aria-label="Previous"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Right Next Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMediaIndex(prev => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[102] p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer pointer-events-auto"
              aria-label="Next"
            >
              <ChevronRight size={22} />
            </button>

            {/* Center High-Res Image Display */}
            <motion.div
              key={currentLightboxItem.url}
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full h-full flex items-center justify-center p-6 sm:p-12 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {currentLightboxItem.type === 'video' ? (
                <video 
                  src={currentLightboxItem.url} 
                  autoPlay 
                  controls 
                  loop 
                  playsInline 
                  className="max-w-full max-h-[85vh] object-contain rounded"
                />
              ) : (
                <img 
                  src={currentLightboxItem.url} 
                  alt={currentLightboxItem.productName}
                  className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl" 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
