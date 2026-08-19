import React from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Eye, Info, ShieldCheck, X, Loader2, Plus, Trash2, Undo, CreditCard, ExternalLink } from 'lucide-react';
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
            className="fixed inset-0 h-screen w-screen bg-paper z-[110] flex flex-col overflow-hidden font-sans"
          >
            <div className="p-4 sm:p-6 md:px-8 flex justify-between items-center border-b border-ink/5 bg-paper/80 backdrop-blur-md sticky top-0 z-20">
              <button 
                onClick={onClose}
                className="flex items-center gap-2 text-ink/70 hover:text-ink font-sans text-[11px] font-medium uppercase tracking-widest transition-colors cursor-pointer"
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
              <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)]">
                {/* Left Page: Product Card Imagery & Media Gallery */}
                <div className="w-full p-6 sm:p-10 lg:p-12 lg:border-r border-ink/10 flex flex-col justify-between space-y-6">
                  <div 
                    className={`relative w-full aspect-square sm:aspect-[1.1/1] lg:aspect-auto lg:h-[calc(100vh-240px)] lg:max-h-[640px] bg-soft overflow-hidden group transition-all duration-300 flex items-center justify-center rounded-sm ${isAdmin ? 'cursor-pointer' : ''} ${isDragging && uploadIndex !== null ? 'ring-4 ring-ink ring-inset' : ''}`}
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
                        <p className="text-[10px] font-sans font-bold text-ink uppercase tracking-[0.2em] mt-4">DROP FILE OR LINK TO REPLACE</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                          <p className="text-[10px] font-sans text-white tracking-widest uppercase">UPLOADING IMAGES...</p>
                        </div>
                      </div>
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeImage}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex items-center justify-center p-2 sm:p-4"
                      >
                        <MediaRenderer 
                          asset={product.images?.[activeImage]} 
                          fallbackUrl={product.provenanceImage || '/assets/images/IMG_4800_1_3.png'}
                          className="w-full h-full object-contain transition-all duration-500"
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Image navigation controls if multiple images */}
                    {product.images && product.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-ink rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-ink rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          aria-label="Next image"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
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

                  {/* Thumbnail gallery */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {product.images?.map((img, idx) => (
                      <div key={img.uid || `${img.url}-${idx}`} className="relative group/thumb">
                        <div 
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveImage(idx)}
                          onDoubleClick={(e) => handleImageDoubleClick(e, idx)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveImage(idx); }}
                          className={`w-full aspect-square transition-all overflow-hidden border cursor-pointer rounded-xs ${activeImage === idx ? 'border-ink ring-1 ring-ink' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <MediaRenderer asset={img} className="w-full h-full object-cover" />
                        </div>
                        
                        {isAdmin && (
                          <button 
                            onClick={(e) => handleDeleteImage(e, idx)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
                            title="Remove Asset"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {isAdmin && (
                      <button 
                        onClick={handleAddMediaClick}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setUploadIndex(null); setIsDragging(true); }}
                        onDrop={(e) => handleDrop(e, undefined)}
                        className={`aspect-square border border-dashed border-ink/20 flex flex-col items-center justify-center gap-1.5 transition-all text-ink/40 hover:text-ink hover:border-ink hover:bg-ink/5 rounded-xs ${isDragging && uploadIndex === null ? 'bg-ink/10 border-ink scale-105' : ''}`}
                      >
                        <Plus size={16} />
                        <span className="text-[8px] font-sans uppercase tracking-widest font-medium">{isDragging && uploadIndex === null ? 'UPLOAD' : 'ADD'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Page: Product Details, Price, Size Selection & Buy Buttons */}
                <div className="w-full p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-sans font-normal uppercase tracking-[0.16em] text-ink mb-1.5">
                        {product.name ? product.name.replace(/_/g, ' ') : ''}
                      </h2>

                      <p className="text-sm font-sans font-normal text-ink/75 tracking-wider mt-0.5">
                        {formatPrice(product.price)}
                      </p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span className="text-[10px] font-sans font-normal uppercase tracking-wider text-ink/70">
                          IN STOCK • READY TO DISPATCH
                        </span>
                      </div>

                      <p className="mt-5 text-[11px] font-sans leading-relaxed text-ink/70 uppercase max-w-lg border-t border-ink/10 pt-4">
                        Crafted from 100% organic cotton with a brushed fleece interior. Features a relaxed fit and reinforced ribbing at the cuffs and hems. Made to order in Portugal. Please allow 2 weeks till delivery. The Graphics may be slightly different from the photo.
                      </p>
                    </div>
                  </div>

                  {/* Size selector & Action Buttons */}
                  <div className="space-y-6 border-t border-ink/10 pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-sans uppercase tracking-widest text-ink/60 font-medium">
                        <span>SELECT SIZE</span>
                        {selectedSize && <span className="text-ink font-bold">SELECTED: {selectedSize}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {(product.sizes && product.sizes.length > 0 ? product.sizes : ['xs', 's', 'm', 'l', 'xl']).map(size => (
                          <button 
                            key={size}
                            onClick={() => setSelectedSize(prev => prev === size ? '' : size)}
                            className={`min-w-[44px] h-[40px] text-[12px] font-sans font-bold tracking-widest uppercase px-3 py-1 transition-all rounded-xs border cursor-pointer ${
                              selectedSize === size 
                                ? 'text-white bg-black border-black shadow-sm scale-105' 
                                : 'text-ink border-ink/20 hover:border-ink hover:bg-black/5'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full flex flex-col gap-3 pt-2">
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
                            className="w-full py-3 border border-ink/20 hover:border-ink text-ink/80 hover:text-ink text-[11px] font-sans font-bold uppercase tracking-widest transition-all text-center rounded-xs cursor-pointer hover:bg-black/5"
                          >
                            + ADD TO SHOPPING BAG
                          </button>
                        </div>
                      ) : product.stripe_payment_link ? (
                        <div className="flex flex-col gap-2">
                          <a
                            href={product.stripe_payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 bg-ink text-paper text-[12px] font-sans font-bold uppercase tracking-[0.2em] transition-all cursor-pointer hover:bg-black flex items-center justify-center gap-2 rounded-xs shadow-sm"
                          >
                            <CreditCard size={15} /> BUY NOW WITH STRIPE
                          </a>
                          <button
                            onClick={() => {
                              if (!selectedSize) {
                                setGlobalError("PLEASE SELECT A SIZE BEFORE CONTINUING");
                                return;
                              }
                              onAddToCart(product, selectedSize);
                            }}
                            className="w-full py-3 border border-ink/20 hover:border-ink text-ink/80 hover:text-ink text-[11px] font-sans font-bold uppercase tracking-widest transition-all text-center rounded-xs cursor-pointer hover:bg-black/5"
                          >
                            + ADD TO SHOPPING BAG
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
                          className="w-full py-3.5 bg-black text-white hover:bg-black/80 text-[12px] font-sans font-bold uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-sm active:scale-[0.99]"
                          id="add-to-bag-btn"
                          aria-label="Select Product"
                        >
                          <span>+ SELECT PRODUCT</span>
                        </button>
                      )}
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
