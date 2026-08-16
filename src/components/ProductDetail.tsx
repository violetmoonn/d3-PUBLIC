import React from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Eye, Info, ShieldCheck, X, Loader2, Plus, Trash2, ShoppingBag, Undo, CreditCard, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { MediaRenderer } from './MediaRenderer';
import { safeToFixed, convertGoogleDriveUrl, formatPrice, t } from '../utils/helpers';
import { Link2 } from 'lucide-react';
import { StripeBuyButton } from './StripeBuyButton';

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

  React.useEffect(() => {
    if (product && showProvenance) {
      const qrData = `${window.location.origin}/#provenance/${product.id}`;
      QRCode.toDataURL(qrData, {
        width: 300,
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
  const [uploadIndex, setUploadIndex] = React.useState<number | null>(null); // null = add, >=0 = replace
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        // Add new
        updatedImages.push(newAsset);
        setActiveImage(updatedImages.length - 1);
      } else {
        // Replace at index
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
    
    // Handle files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (index !== undefined) {
        setUploadIndex(index);
      } else {
        setUploadIndex(activeImage);
      }
      handleFileChange({ files: e.dataTransfer.files });
      return;
    }

    // Handle links
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

  React.useEffect(() => {
    setSelectedSize('');
    setActiveImage(0);
    setShowProvenance(false);
    setQrCodeUrl('');
  }, [product]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed inset-0 h-screen w-screen bg-paper z-[110] flex flex-col overflow-hidden tab-content font-typewriter"
          >
            <div className="p-4 sm:p-6 md:px-8 flex justify-between items-center border-b border-ink/5 bg-paper/80 backdrop-blur-md sticky top-0 z-20">
              <button 
                onClick={onClose}
                className="flex items-center gap-2 text-ink/70 hover:text-ink font-mono text-[11px] uppercase tracking-widest transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>BACK TO SHOP</span>
              </button>
              <button 
                onClick={onClose} 
                className="text-ink hover:opacity-50 transition-all p-2 cursor-pointer"
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 p-6 sm:p-10 md:p-16">
                {/* Left Side: Product Card Images */}
                <div className="w-full space-y-6">
                  <div 
                    className={`relative aspect-square sm:aspect-[1.1/1] lg:aspect-auto lg:h-[calc(100vh-220px)] lg:max-h-[650px] bg-soft overflow-hidden group transition-all duration-300 flex items-center justify-center ${isAdmin ? 'cursor-pointer' : ''} ${isDragging && uploadIndex !== null ? 'ring-4 ring-ink ring-inset' : ''}`}
                    onDoubleClick={handleImageDoubleClick}
                    onDragOver={(e) => handleDragOver(e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e)}
                  >
                    {isDragging && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/20 backdrop-blur-[2px] pointer-events-none">
                        <div className="flex gap-4">
                          <Plus size={48} className="text-ink animate-bounce" />
                          <Link2 size={48} className="text-ink animate-bounce delay-75" />
                        </div>
                        <p className="text-[10px] font-mono font-bold text-ink uppercase tracking-[0.2em] mt-4">DROP FILE OR LINK TO REPLACE</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                          <p className="text-[10px] font-mono text-white tracking-widest uppercase">UPLOADING IMAGES...</p>
                        </div>
                      </div>
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeImage}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <MediaRenderer 
                          asset={product.images?.[activeImage]} 
                          fallbackUrl={product.provenanceImage}
                          className="w-full h-full object-contain transition-all duration-700"
                        />
                      </motion.div>
                    </AnimatePresence>
                    
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

                  <div className="grid grid-cols-4 gap-4">
                    {product.images?.map((img, idx) => (
                      <div key={img.uid || `${img.url}-${idx}`} className="relative group/thumb">
                        <div 
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveImage(idx)}
                          onDoubleClick={(e) => handleImageDoubleClick(e, idx)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveImage(idx); }}
                          className={`w-full aspect-square transition-all overflow-hidden border cursor-pointer ${activeImage === idx ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <MediaRenderer asset={img} className="w-full h-full object-cover" />
                        </div>
                        
                        {isAdmin && (
                          <button 
                            onClick={(e) => handleDeleteImage(e, idx)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                            title="Remove Asset"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {isAdmin && (
                      <button 
                        onClick={handleAddMediaClick}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setUploadIndex(null); setIsDragging(true); }}
                        onDrop={(e) => handleDrop(e, undefined)}
                        className={`aspect-square border border-dashed border-ink/20 flex flex-col items-center justify-center gap-2 transition-all text-ink/40 hover:text-ink hover:border-ink hover:bg-ink/5 ${isDragging && uploadIndex === null ? 'bg-ink/10 border-ink scale-105' : ''}`}
                      >
                        <Plus size={20} />
                        <span className="text-[8px] font-mono uppercase tracking-widest">{isDragging && uploadIndex === null ? 'UPLOAD' : 'ADD'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side: Product Details & Description */}
                <div className="w-full flex flex-col gap-8 lg:sticky lg:top-8 self-start">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-brand font-bold uppercase tracking-tight text-ink mb-2">
                        {(() => {
                          const titleText = product.name ? product.name.replace(/_/g, ' ') : '';
                          const parts = titleText.split('3');
                          return parts.map((part, index) => (
                            <React.Fragment key={index}>
                              {index > 0 && (
                                <span className="inline-block" style={{ transform: 'skewX(-15deg) translateY(-0.02em)' }}>
                                  <motion.span 
                                    className="font-sans font-black text-[0.85em] inline-block align-baseline mx-[1px] cursor-pointer" 
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
                      </h2>
                      <div className="flex justify-between items-start mb-4">
                      </div>
                      <p className="text-[1.25rem] font-numbers font-bold tracking-tighter text-ink">{formatPrice(product.price)}</p>
                      <p className="mt-4 text-[10px] font-mono leading-relaxed opacity-40 uppercase max-w-md">
                        Crafted from 100% organic cotton with a brushed fleece interior. Features a relaxed fit and reinforced ribbing at the cuffs and hems. Made to order in Portugal. Please allow 2 weeks till delivery. The Graphics may be slightly different from the photo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 py-4">
                      <div className="space-y-2">
                        <p className="text-xs font-numbers font-bold uppercase text-ink">
                          IN STOCK
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                      <div className="space-y-4 flex-grow">
                        <div className="flex flex-wrap gap-6 pt-1">
                          {(product.sizes && product.sizes.length > 0 ? product.sizes : ['xs', 's', 'm', 'l', 'xl']).map(size => (
                            <button 
                              key={size}
                              onClick={() => setSelectedSize(prev => prev === size ? '' : size)}
                              className={`text-[12px] font-mono font-bold tracking-widest transition-all uppercase px-2 py-1 transition-colors ${
                                selectedSize === size 
                                  ? 'text-paper bg-black font-extrabold' 
                                  : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="w-full sm:w-auto shrink-0 flex flex-col gap-3">
                        {product.stripe_buy_button_id && product.stripe_publishable_key ? (
                          <div className="flex flex-col gap-2">
                            <div className="stripe-button-wrapper">
                              <StripeBuyButton 
                                buyButtonId={product.stripe_buy_button_id}
                                publishableKey={product.stripe_publishable_key}
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (!selectedSize) {
                                  setGlobalError("PLEASE SELECT A SIZE BEFORE CONTINUING");
                                  return;
                                }
                                onAddToCart(product, selectedSize);
                              }}
                              className="w-full sm:w-auto px-4 py-2 border border-ink/20 hover:border-ink text-ink/70 hover:text-ink text-[9px] font-mono uppercase tracking-widest transition-all text-center"
                            >
                              + OR ADD TO SHOPPING BAG
                            </button>
                          </div>
                        ) : product.stripe_payment_link ? (
                          <div className="flex flex-col gap-2">
                            <a
                              href={product.stripe_payment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto px-6 py-3 bg-ink text-paper text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all cursor-pointer hover:bg-black flex items-center justify-center gap-2"
                            >
                              <CreditCard size={14} /> BUY NOW WITH STRIPE
                            </a>
                            <button
                              onClick={() => {
                                if (!selectedSize) {
                                  setGlobalError("PLEASE SELECT A SIZE BEFORE CONTINUING");
                                  return;
                                }
                                onAddToCart(product, selectedSize);
                              }}
                              className="w-full sm:w-auto px-4 py-2 border border-ink/20 hover:border-ink text-ink/70 hover:text-ink text-[9px] font-mono uppercase tracking-widest transition-all text-center"
                            >
                              + OR ADD TO SHOPPING BAG
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!selectedSize) {
                                setGlobalError("PLEASE SELECT A SIZE BEFORE CONTINUING");
                                return;
                              }
                              onAddToCart(product, selectedSize);
                            }}
                            className="w-full sm:w-auto px-6 py-3 border border-ink/30 hover:border-ink text-ink text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all cursor-pointer hover:bg-ink/5 flex items-center justify-center gap-1.5"
                            id="add-to-bag-btn"
                            aria-label="Select Product"
                          >
                            + SELECT PRODUCT
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
