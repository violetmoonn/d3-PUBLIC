/**
 * ============================================================================
 * !!! EDIT_PRODUCT_UI_HERE.tsx !!!
 * ============================================================================
 * This file dictates exactly HOW products look in your store.
 * Amateur coders: Edit this file to change the layout, colors, and design
 * of the product cards shown to your customers.
 * ============================================================================
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { MediaRenderer } from './MediaRenderer';
import { Image as ImageIcon, Link as LinkIcon, Loader2, Sparkles, Upload, CloudUpload, Link2, Plus, ShoppingBag, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { convertGoogleDriveUrl, safeToFixed, formatPrice } from '../utils/helpers';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart?: (product: Product, size: string) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => Promise<boolean>;
  onDuplicate?: (product: Product) => Promise<boolean>;
  onUpdateProduct?: (updates: Partial<Product>) => Promise<boolean>;
  onToggleVisibility?: () => Promise<boolean>;
  onToggleFeatured?: () => Promise<boolean>;
  onLinkUpload?: (url: string) => Promise<void>;
  isAdmin?: boolean;
  adminPassword?: string;
  index?: number;
  isCenterpiece?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onSelect, 
  onAddToCart, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onUpdateProduct,
  onToggleVisibility,
  onToggleFeatured,
  onLinkUpload,
  isAdmin = false,
  adminPassword,
  index,
  isCenterpiece = false
}) => {
  const [currentImageIdx, setCurrentImageIdx] = React.useState(0);
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [isEditingStock, setIsEditingStock] = React.useState(false);
  const [tempPrice, setTempPrice] = React.useState(product.price);
  const [tempStock, setTempStock] = React.useState(product.stock);
  const [isLinking, setIsLinking] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState<string>('');
  const [isAdded, setIsAdded] = React.useState(false);
  const [showSizePicker, setShowSizePicker] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const productPhotos = (product.images && product.images.length > 0)
    ? product.images
    : (product.provenanceImage ? [{ url: product.provenanceImage, type: 'image' as const }] : []);
  const totalPhotos = productPhotos.length;
  const safeIdx = Math.min(currentImageIdx, Math.max(0, totalPhotos - 1));
  const activeAsset = productPhotos[safeIdx];

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % totalPhotos);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  const availableSizes = (product.sizes && product.sizes.length > 0) 
    ? product.sizes 
    : ['xs', 's', 'm', 'l', 'xl'];
  
  const currentSize = selectedSize || availableSizes[0] || 'm';

  const handleQuickAdd = (e: React.MouseEvent, sizeToAdd?: string) => {
    e.stopPropagation();
    if (!onAddToCart) return;
    const finalSize = sizeToAdd || currentSize;
    onAddToCart(product, finalSize);
    setIsAdded(true);
    setShowSizePicker(false);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleImageDoubleClick = (e: React.MouseEvent) => {
    if (isAdmin) {
      e.stopPropagation();
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | { files: FileList | null }) => {
    const files = 'target' in e ? e.target.files : e.files;
    const file = files?.[0];
    if (!file || !onUpdateProduct) return;

    try {
      setIsUploading(true);
      const { storage, ref, uploadBytes, getDownloadURL } = await import('../firebase');
      
      const fileRef = ref(storage, `products/${product.id}/img_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      const isVideo = file.type.startsWith('video/');
      const newAsset: any = {
        url,
        type: isVideo ? 'video' : 'image',
        uid: Math.random().toString(36).substring(7)
      };

      // Replace the first image or add as first
      const currentImages = product.images || [];
      const updatedImages = [newAsset, ...currentImages.slice(1)];
      
      await onUpdateProduct({ id: product.id, images: updatedImages });
    } catch (error) {
      console.error("Replacement upload failed:", error);
    } finally {
      setIsUploading(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    setIsDragging(false);

    // Handle dropped files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange({ files: e.dataTransfer.files });
      return;
    }

    // Handle dropped links (strings)
    const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (textData && onUpdateProduct) {
      const url = textData.trim().split('\n')[0]; // Take first line if multiple
      if (url.startsWith('http')) {
        const convertedUrl = convertGoogleDriveUrl(url);
        setIsUploading(true);
        try {
          const newAsset = {
            url: convertedUrl,
            type: 'image' as const,
            uid: Math.random().toString(36).substring(7)
          };
          const currentImages = product.images || [];
          const updatedImages = [newAsset, ...currentImages.slice(1)];
          await onUpdateProduct({ id: product.id, images: updatedImages });
        } catch (error) {
          console.error("Link update failed:", error);
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleLinkUpload = async () => {
    if (!onLinkUpload) return;
    const url = window.prompt("ENTER_GOOGLE_DRIVE_LINK:");
    if (!url) return;
    
    setIsLinking(true);
    try {
      await onLinkUpload(url);
    } finally {
      setIsLinking(false);
    }
  };

  const handlePriceSave = async () => {
    if (tempPrice === product.price) {
      setIsEditingPrice(false);
      return;
    }
    const success = await onUpdateProduct?.({ id: product.id, price: tempPrice });
    if (success) setIsEditingPrice(false);
  };

  const handleStockSave = async () => {
    if (tempStock === product.stock) {
      setIsEditingStock(false);
      return;
    }
    const success = await onUpdateProduct?.({ id: product.id, stock: tempStock });
    if (success) setIsEditingStock(false);
  };

  const firstImage = product.images?.[0];

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      const success = await onDelete(String(product.id));
      if (!success) {
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.215, 0.610, 0.355, 1.000] }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex flex-col h-full dimension-card-no-outline rounded-[var(--radius-phi-2)] overflow-hidden"
    >
      <div 
        className={`relative ${isCenterpiece ? 'aspect-[1/1.4] sm:aspect-[1/1.5]' : 'aspect-[1/1.618]'} overflow-hidden cursor-pointer transition-all duration-300 ${isDragging ? 'ring-4 ring-ink ring-inset bg-ink/5' : ''}`}
        onClick={() => onSelect(product)}
        onDoubleClick={handleImageDoubleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/20 backdrop-blur-[2px] pointer-events-none">
            <div className="flex gap-[var(--spacing-phi-2)]">
              <CloudUpload className="w-10 h-10 text-ink animate-bounce" />
              <Link2 className="w-10 h-10 text-ink animate-bounce delay-75" />
            </div>
            <p className="text-[10px] font-mono font-bold text-ink uppercase tracking-wider mt-[var(--spacing-phi-4)]">DROP FILE OR LINK</p>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-[var(--spacing-phi-2)]">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <p className="text-[8px] font-mono text-white tracking-wider uppercase">UPLOADING...</p>
            </div>
          </div>
        )}
        {activeAsset ? (
          <div className="relative w-full h-full">
            <MediaRenderer 
              key={activeAsset.url || safeIdx}
              asset={activeAsset} 
              fallbackUrl={product.provenanceImage}
              className={`w-full h-full object-contain p-4 bg-transparent contrast-[1.05] transition-opacity duration-300 ${totalPhotos > 1 && safeIdx === 0 ? 'group-hover:opacity-0' : ''}`} 
            />
            {totalPhotos > 1 && safeIdx === 0 && productPhotos[1] && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <MediaRenderer 
                  key={productPhotos[1].url || 1}
                  asset={productPhotos[1]} 
                  fallbackUrl={product.provenanceImage}
                  className="w-full h-full object-contain p-4 bg-transparent contrast-[1.05]" 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full bg-ink/5 border-b border-ink/10 flex flex-col items-center justify-center p-4 text-center transition-colors">
            <div className="w-10 h-10 border border-ink/15 flex items-center justify-center text-ink/20 rounded-[var(--radius-phi-2)]">
              <ImageIcon size={20} />
            </div>
          </div>
        )}
        
        {/* Sold Out logic removed - everything in stock */}

        {/* Multi-photo Indicators */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1">
            {productPhotos.map((_, i) => (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx(i);
                }}
                className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${
                  i === safeIdx ? 'bg-ink scale-125' : 'bg-ink/30 hover:bg-ink/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Card Actions overlay */}
        {isAdmin && (
          <div className="absolute top-[var(--spacing-phi-3)] right-[var(--spacing-phi-3)] z-20 flex flex-col items-end gap-[var(--spacing-phi-2)]">
            <div className="flex flex-col gap-[var(--spacing-phi-1)] opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(); }}
                className={`p-[var(--spacing-phi-1)] backdrop-blur-md border border-ink/10 transition-colors rounded-[var(--radius-phi-1)] ${product.is_visible ? 'bg-ink text-paper' : 'bg-paper/80 text-ink'}`}
                title={product.is_visible ? 'Hide Artifact' : 'Show Artifact'}
              >
                <ImageIcon size={14} className={product.is_visible ? 'opacity-100' : 'opacity-40'} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleFeatured?.(); }}
                className={`p-[var(--spacing-phi-1)] backdrop-blur-md border border-ink/10 transition-colors rounded-[var(--radius-phi-1)] ${product.is_featured ? 'bg-ink text-paper' : 'bg-paper/80 text-ink'}`}
                title={product.is_featured ? 'Unfeature Artifact' : 'Feature Artifact'}
              >
                <Sparkles size={14} className={product.is_featured ? 'text-gold' : 'opacity-40'} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="p-[var(--spacing-phi-1)] bg-paper/80 text-ink backdrop-blur-md border border-ink/10 hover:bg-ink hover:text-paper transition-colors rounded-[var(--radius-phi-1)]"
                title="Replace Image"
              >
                <Upload size={14} />
              </button>
            </div>
          </div>
        )}

        {isAdmin && (
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*"
          />
        )}
      </div>

      <div className={`p-3.5 flex flex-col flex-grow items-center justify-center text-center space-y-2 ${isCenterpiece ? 'min-h-[140px] py-6' : 'min-h-[120px]'}`}>
        {/* Product Name */}
        <h3 
          onClick={() => onSelect(product)}
          className={`font-mono font-medium uppercase tracking-[0.14em] text-ink cursor-pointer hover:opacity-70 transition-opacity line-clamp-2 text-center w-full ${isCenterpiece ? 'text-sm sm:text-base md:text-lg' : 'text-[11px]'}`}
        >
          {product.name}
        </h3>

        {/* Price & Admin Stock */}
        <div className="flex flex-col items-center justify-center text-center gap-0.5 w-full">
          {isAdmin && isEditingPrice ? (
            <div className="flex items-center gap-1 justify-center w-full">
              <input 
                autoFocus
                type="number"
                value={tempPrice}
                onChange={(e) => setTempPrice(parseFloat(e.target.value))}
                onBlur={handlePriceSave}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceSave()}
                className="w-16 bg-ink/5 border-none p-0 font-mono text-xs text-center focus:ring-0 font-medium"
              />
              <span className="font-mono text-xs font-normal">USD</span>
            </div>
          ) : (
            <span 
              className={`font-mono font-medium text-center ${isCenterpiece ? 'text-sm sm:text-base md:text-lg' : 'text-xs'} ${isAdmin ? 'cursor-pointer hover:bg-ink/5 px-2 py-0.5 rounded' : ''}`}
              onClick={(e) => {
                if (isAdmin) {
                  e.stopPropagation();
                  setIsEditingPrice(true);
                }
              }}
            >
              {formatPrice(product.price)}
            </span>
          )}

          {isAdmin && (
            <span className="text-[8px] font-mono font-medium text-ink/60 uppercase tracking-widest text-center">
              IN STOCK ({product.stock})
            </span>
          )}
        </div>
      </div>
  </motion.div>
  );
};
