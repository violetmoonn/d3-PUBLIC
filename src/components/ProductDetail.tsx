import React from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Info, 
  ShieldCheck, 
  X, 
  Loader2, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Maximize2, 
  Check, 
  Share2, 
  Sparkles, 
  QrCode, 
  Ruler, 
  Lock,
  Link2,
  ChevronDown
} from 'lucide-react';
import { Product } from '../types';
import { MediaRenderer } from './MediaRenderer';
import { safeToFixed, convertGoogleDriveUrl, formatPrice, t } from '../utils/helpers';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
  setGlobalError: (msg: string | null) => void;
  isAdmin?: boolean;
  onUpdateProduct?: (updates: Partial<Product>) => Promise<boolean>;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  setGlobalError,
  isAdmin = false,
  onUpdateProduct
}) => {
  const [selectedSize, setSelectedSize] = React.useState('');
  const [activeImage, setActiveImage] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [showProvenance, setShowProvenance] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');
  const [isFullscreenMedia, setIsFullscreenMedia] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [showSizeGuide, setShowSizeGuide] = React.useState(false);
  const [openTab, setOpenTab] = React.useState<'specs' | 'fit' | 'provenance' | 'shipping'>('specs');
  const [addedToast, setAddedToast] = React.useState(false);

  const [uploadIndex, setUploadIndex] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (product && showProvenance) {
      const qrData = `${window.location.origin}/#provenance/${product.id}`;
      QRCode.toDataURL(qrData, {
        width: 320,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate product detail QR code:', err);
      });
    }
  }, [product, showProvenance]);

  React.useEffect(() => {
    setSelectedSize('');
    setActiveImage(0);
    setShowProvenance(false);
    setQrCodeUrl('');
    setIsFullscreenMedia(false);
    setCopiedLink(false);
    setAddedToast(false);
  }, [product]);

  // Keyboard Navigation for Media
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !product?.images || product.images.length === 0) return;
      if (e.key === 'ArrowLeft') {
        setActiveImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        if (isFullscreenMedia) setIsFullscreenMedia(false);
        else if (showProvenance) setShowProvenance(false);
        else if (showSizeGuide) setShowSizeGuide(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, product, isFullscreenMedia, showProvenance, showSizeGuide, onClose]);

  const handleImageDoubleClick = (e: React.MouseEvent, index?: number) => {
    if (isAdmin) {
      e.stopPropagation();
      setUploadIndex(index !== undefined ? index : activeImage);
      fileInputRef.current?.click();
    }
  };

  const handleAddMediaClick = (e: React.MouseEvent) => {
    if (isAdmin) {
      e.stopPropagation();
      setUploadIndex(null);
      fileInputRef.current?.click();
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent, index: number) => {
    if (!isAdmin || !product || !onUpdateProduct) return;
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to remove this asset?")) return;

    try {
      const currentImages = product.images || [];
      const updatedImages = currentImages.filter((_, i) => i !== index);
      
      const success = await onUpdateProduct({ id: product.id, images: updatedImages });
      if (success && activeImage >= updatedImages.length) {
        setActiveImage(Math.max(0, updatedImages.length - 1));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | { files: FileList | null }) => {
    const files = 'target' in e ? e.target.files : e.files;
    const file = files?.[0];
    if (!file || !onUpdateProduct || !product) return;

    try {
      setIsUploading(true);
      const { storage, ref, uploadBytes, getDownloadURL } = await import('../firebase');
      
      const fileRef = ref(storage, `products/${product.id}/gallery_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      const isVideo = file.type.startsWith('video/');
      const newAsset: any = {
        url,
        type: isVideo ? 'video' : 'image',
        uid: Math.random().toString(36).substring(7)
      };

      const currentImages = product.images || [];
      let updatedImages = [...currentImages];

      if (uploadIndex === null) {
        updatedImages.push(newAsset);
        setActiveImage(updatedImages.length - 1);
      } else {
        if (updatedImages.length > uploadIndex) {
          updatedImages[uploadIndex] = newAsset;
        } else {
          updatedImages.push(newAsset);
        }
      }
      
      await onUpdateProduct({ id: product.id, images: updatedImages });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setIsDragging(false);
      setUploadIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    if (!isAdmin) return;
    e.preventDefault();
    setIsDragging(true);
    if (index !== undefined) {
      setUploadIndex(index);
    } else {
      setUploadIndex(activeImage);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, index?: number) => {
    if (!isAdmin) return;
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (index !== undefined) {
        setUploadIndex(index);
      } else {
        setUploadIndex(activeImage);
      }
      handleFileChange({ files: e.dataTransfer.files });
      return;
    }

    const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (textData && product && onUpdateProduct) {
      const url = textData.trim().split('\n')[0];
      if (url.startsWith('http')) {
        setIsUploading(true);
        try {
          const convertedUrl = convertGoogleDriveUrl(url);
          const newAsset = {
            url: convertedUrl,
            type: 'image' as const,
            uid: Math.random().toString(36).substring(7)
          };

          const currentImages = product.images || [];
          let updatedImages = [...currentImages];
          const targetIdx = index !== undefined ? index : activeImage;

          if (targetIdx >= updatedImages.length) {
            updatedImages.push(newAsset);
          } else {
            updatedImages[targetIdx] = newAsset;
          }
          
          await onUpdateProduct({ id: product.id, images: updatedImages });
        } catch (error) {
          console.error("Link drop failed:", error);
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleShareProduct = () => {
    if (!product) return;
    const url = `${window.location.origin}/#product/${product.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddToCartClick = () => {
    if (!product) return;
    if (!selectedSize) {
      setGlobalError("PLEASE SELECT A SIZE BEFORE CONTINUING");
      return;
    }
    onAddToCart(product, selectedSize);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  if (!product) return null;

  const imagesList = product.images && product.images.length > 0 ? product.images : [{ url: product.provenanceImage || '', type: 'image' as const }];
  const currentAsset = imagesList[activeImage] || imagesList[0];
  const sizeOptions = product.sizes && product.sizes.length > 0 ? product.sizes : ['xs', 's', 'm', 'l', 'xl'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[100] transition-all"
          />

          {/* Full Screen High-Fashion Studio Modal Container */}
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="fixed inset-0 h-screen w-screen bg-[#08080c] text-white z-[110] flex flex-col overflow-hidden font-mono selection:bg-emerald-400 selection:text-black"
          >
            {/* Top Navigation Bar */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-white/10 bg-[#08080c]/90 backdrop-blur-md sticky top-0 z-30 select-none">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-xs font-bold tracking-widest text-white transition-all cursor-pointer group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-emerald-400" />
                  <span>RETURN TO ARCHIVE</span>
                </button>
                
                <span className="hidden md:inline-block text-[11px] text-white/40 tracking-widest font-mono">
                  [PRODUCT_ID: <span className="text-purple-400 font-bold">{product.id}</span>]
                </span>
              </div>

              {/* Title Header with Skewed 3 Logo */}
              <div className="text-center truncate max-w-[40%] px-2">
                <span className="font-brand font-bold text-base sm:text-lg md:text-xl uppercase tracking-wider text-white truncate block">
                  {(() => {
                    const titleText = product.name ? product.name.replace(/_/g, ' ') : 'PRODUCT DETAIL';
                    const parts = titleText.split('3');
                    return parts.map((part, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <span className="inline-block" style={{ transform: 'skewX(-15deg) translateY(-0.02em)' }}>
                            <motion.span 
                              className="font-sans font-black text-[0.85em] inline-block align-baseline mx-[1px] cursor-pointer text-emerald-400" 
                              style={{ fontFamily: '"Arial Black", "Impact", sans-serif', fontWeight: 900 }}
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6, ease: "easeInOut" }}
                            >
                              3
                            </motion.span>
                          </span>
                        )}
                        <span>{part}</span>
                      </React.Fragment>
                    ));
                  })()}
                </span>
              </div>

              {/* Top Right Action Icons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleShareProduct}
                  title="Share Artifact Link"
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 rounded-full transition-all cursor-pointer relative"
                >
                  {copiedLink ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
                  {copiedLink && (
                    <span className="absolute right-0 top-10 text-[9px] bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold px-2 py-0.5 rounded whitespace-nowrap z-50">
                      LINK COPIED
                    </span>
                  )}
                </button>

                <button 
                  onClick={onClose} 
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Main Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-4 sm:p-8 md:p-12 min-h-[calc(100vh-80px)]">
                
                {/* LEFT COLUMN: Ultra-Sleek High-Impact Media Stage (7 Columns) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  
                  {/* Main Media Container */}
                  <div 
                    className={`relative w-full aspect-[1/1.1] sm:aspect-square lg:aspect-[1/1.05] bg-[#0c0c12] border border-white/10 rounded-xl overflow-hidden group transition-all duration-300 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${isAdmin ? 'cursor-pointer' : ''} ${isDragging && uploadIndex !== null ? 'ring-4 ring-emerald-400 ring-inset' : ''}`}
                    onDoubleClick={handleImageDoubleClick}
                    onDragOver={(e) => handleDragOver(e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e)}
                  >
                    {/* Ambient Glow behind image */}
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-emerald-900/10 pointer-events-none" />

                    {/* Drag and Drop Admin Overlay */}
                    {isDragging && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md pointer-events-none">
                        <div className="flex gap-4">
                          <Plus size={48} className="text-emerald-400 animate-bounce" />
                          <Link2 size={48} className="text-blue-400 animate-bounce delay-75" />
                        </div>
                        <p className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em] mt-4">
                          DROP FILE OR LINK TO REPLACE ASSET
                        </p>
                      </div>
                    )}

                    {/* Uploading Spinner Overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                          <p className="text-xs font-mono text-white tracking-widest uppercase">
                            PROCESSING HIGH-RES MEDIA...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Main Media Element */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeImage}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full flex items-center justify-center p-4"
                      >
                        <MediaRenderer 
                          asset={currentAsset} 
                          fallbackUrl={product.provenanceImage}
                          className="w-full h-full object-contain max-h-[600px] filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Next / Prev Quick Arrows */}
                    {imagesList.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === 0 ? imagesList.length - 1 : prev - 1)); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white border border-white/10 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-10"
                          title="Previous Image"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === imagesList.length - 1 ? 0 : prev + 1)); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white border border-white/10 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-10"
                          title="Next Image"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Top Left Media Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
                      <span className="px-2.5 py-1 bg-black/70 border border-white/15 rounded text-[10px] font-bold text-emerald-400 tracking-wider backdrop-blur-md">
                        {activeImage + 1} / {imagesList.length}
                      </span>
                      {currentAsset?.type === 'video' && (
                        <span className="px-2.5 py-1 bg-red-950/80 border border-red-500/50 rounded text-[10px] font-bold text-red-400 tracking-wider backdrop-blur-md">
                          MOTION ASSET
                        </span>
                      )}
                    </div>

                    {/* Bottom Right Zoom Fullscreen Trigger */}
                    <button
                      onClick={() => setIsFullscreenMedia(true)}
                      className="absolute bottom-4 right-4 p-2 bg-black/70 hover:bg-black border border-white/20 rounded-lg text-white/80 hover:text-white backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100 flex items-center gap-1.5 text-[10px] font-bold tracking-wider"
                    >
                      <Maximize2 size={13} className="text-emerald-400" />
                      <span className="hidden sm:inline">FULLSCREEN DETAIL</span>
                    </button>

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

                  {/* Thumbnail Row */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {imagesList.map((img, idx) => (
                      <div key={img.uid || `${img.url}-${idx}`} className="relative group/thumb shrink-0">
                        <button 
                          onClick={() => setActiveImage(idx)}
                          onDoubleClick={(e) => handleImageDoubleClick(e, idx)}
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg transition-all overflow-hidden border-2 cursor-pointer bg-black/40 relative flex items-center justify-center ${
                            activeImage === idx 
                              ? 'border-emerald-400 ring-2 ring-emerald-500/30 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                              : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'
                          }`}
                        >
                          <MediaRenderer asset={img} className="w-full h-full object-cover" />
                          {img.type === 'video' && (
                            <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-[9px] font-bold text-red-400">
                              PLAY
                            </span>
                          )}
                        </button>
                        
                        {isAdmin && (
                          <button 
                            onClick={(e) => handleDeleteImage(e, idx)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg hover:bg-red-700 z-10"
                            title="Remove Asset"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {isAdmin && (
                      <button 
                        onClick={handleAddMediaClick}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setUploadIndex(null); setIsDragging(true); }}
                        onDrop={(e) => handleDrop(e, undefined)}
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1.5 transition-all text-white/50 hover:text-white hover:border-emerald-400 hover:bg-white/5 shrink-0 ${isDragging && uploadIndex === null ? 'bg-white/10 border-emerald-400 scale-105' : ''}`}
                      >
                        <Plus size={22} className="text-emerald-400" />
                        <span className="text-[9px] font-mono uppercase tracking-widest">{isDragging && uploadIndex === null ? 'DROP' : 'ADD MEDIA'}</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* RIGHT COLUMN: Seductive Editorial & Specs Panel (5 Columns) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-8 lg:sticky lg:top-24 self-start">
                  
                  {/* Product Header Information */}
                  <div className="space-y-5">
                    
                    {/* Top Category Badge */}
                    <div className="flex items-center justify-between text-xs select-none">
                      <span className="px-2.5 py-1 bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold rounded text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                        <Sparkles size={12} className="text-purple-400" />
                        <span>LIMITED ARCHIVAL RELEASE</span>
                      </span>

                      <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>IN STOCK ({product.stock || 12} UNITS)</span>
                      </div>
                    </div>

                    {/* Product Name Title */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-brand font-extrabold uppercase tracking-tight text-white leading-none">
                      {(() => {
                        const titleText = product.name ? product.name.replace(/_/g, ' ') : '';
                        const parts = titleText.split('3');
                        return parts.map((part, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && (
                              <span className="inline-block" style={{ transform: 'skewX(-15deg) translateY(-0.02em)' }}>
                                <motion.span 
                                  className="font-sans font-black text-[0.85em] inline-block align-baseline mx-[1px] cursor-pointer text-emerald-400" 
                                  style={{ fontFamily: '"Arial Black", "Impact", sans-serif', fontWeight: 900 }}
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6, ease: "easeInOut" }}
                                >
                                  3
                                </motion.span>
                              </span>
                            )}
                            <span>{part}</span>
                          </React.Fragment>
                        ));
                      })()}
                    </h1>

                    {/* Price Tag & Split Payments */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-xs text-white/40 font-mono">TAX INCLUDED</span>
                      </div>
                      <p className="text-[10px] text-white/60 font-mono leading-relaxed">
                        Or 4 interest-free installments of <strong className="text-white">${((product.price || 0) / 4).toFixed(2)}</strong> with Crypto / Card.
                      </p>
                    </div>

                    {/* Editorial Description Text */}
                    <p className="text-xs sm:text-sm font-mono text-white/80 leading-relaxed tracking-wide">
                      Crafted from 100% organic heavy-weight cotton with a brushed fleece interior. Features a relaxed boxy silhouette, structured drop shoulders, and custom D3COMPOSURE quantum hardware detailing. Made to order in Portugal.
                    </p>
                  </div>

                  {/* Size Selection Matrix */}
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-[11px]">
                        <Ruler size={13} className="text-blue-400" />
                        <span>SELECT SILHOUETTE SIZE</span>
                      </label>
                      <button
                        onClick={() => setShowSizeGuide(!showSizeGuide)}
                        className="text-emerald-400 hover:text-white underline text-[10px] font-bold tracking-widest uppercase cursor-pointer"
                      >
                        FIT & SIZE GUIDE
                      </button>
                    </div>

                    {/* Size Guide Info Dropdown */}
                    {showSizeGuide && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-blue-950/30 border border-blue-500/40 rounded-lg text-[11px] space-y-2 text-white/90"
                      >
                        <p className="font-bold text-blue-300">OVERSIZED ARCHIVAL CUT RECOMMENDATION:</p>
                        <p className="text-white/70">
                          - True to size for a relaxed drop-shoulder drape.
                          <br />- Size down for a classic structured fit.
                          <br />- Model is 6'1" (185 cm) wearing size <strong className="text-white">L</strong>.
                        </p>
                      </motion.div>
                    )}

                    {/* Size Selector Buttons */}
                    <div className="grid grid-cols-5 gap-2.5">
                      {sizeOptions.map(size => {
                        const isSelected = selectedSize === size;
                        return (
                          <button 
                            key={size}
                            onClick={() => setSelectedSize(prev => prev === size ? '' : size)}
                            className={`py-3 rounded-lg text-xs font-mono font-bold tracking-widest transition-all uppercase cursor-pointer relative overflow-hidden flex items-center justify-center border ${
                              isSelected 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' 
                                : 'bg-white/5 text-white border-white/10 hover:border-white/30 hover:bg-white/10'
                            }`}
                          >
                            <span>{size}</span>
                            {isSelected && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Action CTA Button */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleAddToCartClick}
                      className={`w-full py-4 px-8 rounded-xl font-mono font-bold text-xs uppercase tracking-[0.25em] transition-all cursor-pointer flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden ${
                        addedToast
                          ? 'bg-emerald-500 text-black border border-emerald-400 scale-[1.02]'
                          : 'bg-white text-black hover:bg-emerald-400 hover:text-black border border-white hover:border-emerald-400'
                      }`}
                      id="add-to-bag-btn"
                      aria-label="Select Product"
                    >
                      {addedToast ? (
                        <>
                          <Check size={18} className="text-black" />
                          <span>ADDED TO SELECTION</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          <span>+ SELECT PRODUCT</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Actions Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowProvenance(true)}
                        className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <QrCode size={14} className="text-purple-400" />
                        <span>SINGULARITY PROVENANCE</span>
                      </button>

                      <button
                        onClick={handleShareProduct}
                        className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Share2 size={14} className="text-blue-400" />
                        <span>{copiedLink ? 'COPIED LINK' : 'SHARE ARTIFACT'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Specifications & Craft Tabs */}
                  <div className="border-t border-white/10 pt-6 space-y-3">
                    
                    {/* Tab 1: Specs */}
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
                      <button
                        onClick={() => setOpenTab(openTab === 'specs' ? ('' as any) : 'specs')}
                        className="w-full p-3.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Info size={14} className="text-emerald-400" />
                          <span>01. MATERIALS & CRAFTSMANSHIP</span>
                        </span>
                        <ChevronDown size={14} className={`transition-transform ${openTab === 'specs' ? 'rotate-180' : ''}`} />
                      </button>
                      {openTab === 'specs' && (
                        <div className="p-4 border-t border-white/10 text-xs font-mono text-white/70 space-y-1.5 leading-relaxed bg-white/5">
                          <p>• 100% Certified Organic Heavyweight Cotton (500 GSM)</p>
                          <p>• Brushed fleece interior for thermal insulation</p>
                          <p>• Reinforced ribbing at cuffs & waist hem</p>
                          <p>• Pre-shrunk & custom garment dyed in Portugal</p>
                        </div>
                      )}
                    </div>

                    {/* Tab 2: Provenance */}
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
                      <button
                        onClick={() => setOpenTab(openTab === 'provenance' ? ('' as any) : 'provenance')}
                        className="w-full p-3.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-purple-400" />
                          <span>02. DIGITAL PROVENANCE & AUTHENTICITY</span>
                        </span>
                        <ChevronDown size={14} className={`transition-transform ${openTab === 'provenance' ? 'rotate-180' : ''}`} />
                      </button>
                      {openTab === 'provenance' && (
                        <div className="p-4 border-t border-white/10 text-xs font-mono text-white/70 space-y-2 leading-relaxed bg-white/5">
                          <p>Every piece is registered with a cryptographic serial hash on the D3COMPOSURE ledger.</p>
                          <p className="text-purple-300">SERIAL_HASH: 0x8F9A2B4C7D01010E</p>
                        </div>
                      )}
                    </div>

                    {/* Tab 3: Shipping */}
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
                      <button
                        onClick={() => setOpenTab(openTab === 'shipping' ? ('' as any) : 'shipping')}
                        className="w-full p-3.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Lock size={14} className="text-blue-400" />
                          <span>03. WORLDWIDE EXPRESS SHIPPING</span>
                        </span>
                        <ChevronDown size={14} className={`transition-transform ${openTab === 'shipping' ? 'rotate-180' : ''}`} />
                      </button>
                      {openTab === 'shipping' && (
                        <div className="p-4 border-t border-white/10 text-xs font-mono text-white/70 space-y-1.5 leading-relaxed bg-white/5">
                          <p>• Complimentary global express shipping on orders over $250 USD.</p>
                          <p>• Dispatched in signature tamper-evident vacuum-sealed packaging.</p>
                          <p>• 14-day archival return window.</p>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            </div>
          </motion.div>

          {/* Modal 1: Provenance QR Code Modal */}
          {showProvenance && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[120] flex items-center justify-center p-4"
              onClick={() => setShowProvenance(false)}
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0b0b12] border border-purple-500/40 p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center space-y-5 relative shadow-[0_0_50px_rgba(168,85,247,0.3)]"
              >
                <button 
                  onClick={() => setShowProvenance(false)}
                  className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
                >
                  <X size={16} />
                </button>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-purple-400 tracking-widest font-bold uppercase">
                    PROVENANCE CERTIFICATE
                  </span>
                  <h3 className="font-brand text-lg font-bold uppercase text-white">
                    {product.name}
                  </h3>
                </div>

                <div className="p-4 bg-white rounded-xl flex items-center justify-center mx-auto w-fit">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Provenance QR" className="w-48 h-48" />
                  ) : (
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
                  )}
                </div>

                <p className="text-[10px] font-mono text-white/60 leading-relaxed">
                  SCAN WITH ANY CAMERA TO VERIFY AUTHENTICITY ON THE SINGULARITY LEDGER
                </p>

                <button
                  onClick={() => setShowProvenance(false)}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-lg transition-all"
                >
                  CLOSE CERTIFICATE
                </button>
              </div>
            </motion.div>
          )}

          {/* Modal 2: Fullscreen Detail Lightbox */}
          {isFullscreenMedia && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[130] flex flex-col items-center justify-between p-6 select-none"
              onClick={() => setIsFullscreenMedia(false)}
            >
              <div className="w-full flex items-center justify-between text-xs text-white/70 font-mono">
                <span className="text-emerald-400 font-bold uppercase">HIGH-RES ARCHIVAL VIEW</span>
                <button 
                  onClick={() => setIsFullscreenMedia(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div 
                className="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <MediaRenderer 
                  asset={currentAsset} 
                  fallbackUrl={product.provenanceImage}
                  className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                />
              </div>

              <div className="text-center font-mono text-xs text-white/50">
                CLICK ANYWHERE OR ESC TO EXIT
              </div>
            </motion.div>
          )}

        </>
      )}
    </AnimatePresence>
  );
};
