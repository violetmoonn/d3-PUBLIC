import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Edit2, Trash2, Copy, Eye, EyeOff, Star, 
  Package, DollarSign, Tag, ExternalLink, 
  MoreVertical, Upload, Loader2, Link as LinkIcon, Target,
  CheckCircle2, XCircle, Clock, X, ChevronLeft, ChevronRight,
  GripHorizontal, AlertTriangle
} from 'lucide-react';
import { Product, ProductAsset } from '../../types';
import { MediaRenderer } from '../MediaRenderer';
import { ConfirmModal } from '../modals/ConfirmModal';
import { generateUid, convertGoogleDriveUrl } from '../../utils/helpers';
import { Link2 } from 'lucide-react';

interface AdminProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<boolean>;
  onDuplicate: (product: Product) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  onFocusProduct: (id: string) => void;
  onToggleVisibility: () => Promise<boolean>;
  onToggleFeatured: () => Promise<boolean>;
  onLinkUpload?: (url: string) => Promise<void>;
  index?: number;
}

export const AdminProductCard: React.FC<AdminProductCardProps> = React.memo(({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateProduct,
  onFocusProduct,
  onToggleVisibility,
  onToggleFeatured,
  onLinkUpload,
  index
}) => {
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [isEditingStock, setIsEditingStock] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [isEditingStripe, setIsEditingStripe] = React.useState(false);
  const [tempPrice, setTempPrice] = React.useState(product.price);
  const [tempStock, setTempStock] = React.useState(product.stock);
  const [tempName, setTempName] = React.useState(product.name);
  const [tempStripe, setTempStripe] = React.useState(product.stripe_payment_link || '');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isLinking, setIsLinking] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleCoverFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
      const headers: Record<string, string> = {};
      const savedPass = localStorage.getItem('d3_admin_password') || sessionStorage.getItem('d3_admin_password');
      if (savedPass) headers['x-admin-password'] = savedPass;

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        const results = await response.json();
        const newAssets: ProductAsset[] = (Array.isArray(results) ? results : [results]).map((r: any) => ({
          url: r.url,
          type: r.type || 'image',
          uid: generateUid()
        }));

        if (newAssets.length > 0) {
          const currentImages = product.images || [];
          const updatedImages = [newAssets[0], ...currentImages.slice(1)];
          await onUpdateProduct(product.id, { 
            images: updatedImages
          });
          return;
        }
      }

      // Fallback: Firebase Storage
      try {
        const { storage, ref, uploadBytes, getDownloadURL } = await import('../../firebase');
        if (storage) {
          const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const fileRef = ref(storage, `products/cover_${product.id}_${Date.now()}_${safeName}`);
          await uploadBytes(fileRef, file);
          const dlUrl = await getDownloadURL(fileRef);
          if (dlUrl) {
            const newAsset: ProductAsset = { url: dlUrl, type: 'image', uid: generateUid() };
            const currentImages = product.images || [];
            const updatedImages = [newAsset, ...currentImages.slice(1)];
            await onUpdateProduct(product.id, { images: updatedImages });
            return;
          }
        }
      } catch (fbErr) {
        console.warn("Cover firebase upload note:", fbErr);
      }
    } catch (err) {
      console.warn("Cover upload fallback note:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCoverFileUpload(e.target.files);
  };

  const handleCoverDriveLinkSwap = async () => {
    const url = window.prompt("PASTE GOOGLE DRIVE OR STATIC IMAGE LINK TO SET AS COVER PHOTO:");
    if (!url) return;
    
    setIsLinking(true);
    try {
      const convertedUrl = convertGoogleDriveUrl(url);
      const newAsset: ProductAsset = {
        url: convertedUrl,
        type: 'image',
        uid: generateUid()
      };
      
      const currentImages = product.images || [];
      const updatedImages = [newAsset, ...currentImages.slice(1)];
      await onUpdateProduct(product.id, { 
        images: updatedImages
      });
    } catch (err) {
      console.error("Cover link swap failed:", err);
    } finally {
      setIsLinking(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('image', files[i]);
    }

    try {
      const headers: Record<string, string> = {};
      const savedPass = localStorage.getItem('d3_admin_password') || sessionStorage.getItem('d3_admin_password');
      if (savedPass) headers['x-admin-password'] = savedPass;

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        const results = await response.json();
        const newAssets: ProductAsset[] = (Array.isArray(results) ? results : [results]).map((r: any) => ({
          url: r.url,
          type: r.type || 'image',
          uid: generateUid()
        }));

        const currentImages = product.images || [];
        await onUpdateProduct(product.id, { 
          images: [...currentImages, ...newAssets]
        });
        return;
      }

      // Fallback: Firebase Storage
      try {
        const { storage, ref, uploadBytes, getDownloadURL } = await import('../../firebase');
        if (storage) {
          const newAssets: ProductAsset[] = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const fileRef = ref(storage, `products/${product.id}_${Date.now()}_${i}_${safeName}`);
            await uploadBytes(fileRef, file);
            const dlUrl = await getDownloadURL(fileRef);
            if (dlUrl) {
              newAssets.push({ url: dlUrl, type: 'image', uid: generateUid() });
            }
          }
          if (newAssets.length > 0) {
            const currentImages = product.images || [];
            await onUpdateProduct(product.id, { images: [...currentImages, ...newAssets] });
            return;
          }
        }
      } catch (fbErr) {
        console.warn("Upload firebase fallback note:", fbErr);
      }
    } catch (err) {
      console.warn("Upload fallback note:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Handle dropped files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
      return;
    }

    // Handle dropped links
    const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (textData) {
      const url = textData.trim().split('\n')[0];
      if (url.startsWith('http')) {
        setIsLinking(true);
        try {
          const convertedUrl = convertGoogleDriveUrl(url);
          const newAsset: ProductAsset = {
            url: convertedUrl,
            type: 'image',
            uid: generateUid()
          };
          const currentImages = product.images || [];
          await onUpdateProduct(product.id, { 
            images: [newAsset, ...currentImages] // Add as cover
          });
        } catch (err) {
          console.error("Link drop failed:", err);
        } finally {
          setIsLinking(false);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const removeImage = async (asset: ProductAsset) => {
    const currentImages = product.images || [];
    const newImages = currentImages.filter(img => (img.uid || img.url) !== (asset.uid || asset.url));
    await onUpdateProduct(product.id, { images: newImages });
  };

  const setAsCover = async (asset: ProductAsset) => {
    const currentImages = product.images || [];
    const index = currentImages.findIndex(img => (img.uid || img.url) === (asset.uid || asset.url));
    if (index <= 0) return;

    const newImages = [...currentImages];
    const [img] = newImages.splice(index, 1);
    newImages.unshift(img);
    await onUpdateProduct(product.id, { images: newImages });
  };

  const moveImage = async (asset: ProductAsset, direction: 'left' | 'right') => {
    const currentImages = product.images || [];
    const index = currentImages.findIndex(img => (img.uid || img.url) === (asset.uid || asset.url));
    if (index === -1) return;

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentImages.length) return;

    const newImages = [...currentImages];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    await onUpdateProduct(product.id, { images: newImages });
  };

  const handleLinkUpload = async () => {
    if (!onLinkUpload) return;
    const url = window.prompt("ENTER DRIVE LINK:");
    if (!url) return;
    
    setIsLinking(true);
    try {
      await onLinkUpload(url);
    } finally {
      setIsLinking(false);
    }
  };

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      await onUpdateProduct(product.id, { status: 'approved', is_visible: true, category: 'ARTIFACT' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      await onUpdateProduct(product.id, { status: 'rejected', is_visible: false });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriceSave = async () => {
    if (tempPrice === product.price) {
      setIsEditingPrice(false);
      return;
    }
    setIsUpdating(true);
    const success = await onUpdateProduct(product.id, { price: tempPrice });
    if (success) setIsEditingPrice(false);
    setIsUpdating(false);
  };

  const handlePriceCancel = () => {
    setTempPrice(product.price);
    setIsEditingPrice(false);
  };

  const handleStockSave = async () => {
    if (tempStock === product.stock) {
      setIsEditingStock(false);
      return;
    }
    setIsUpdating(true);
    const success = await onUpdateProduct(product.id, { stock: tempStock });
    if (success) setIsEditingStock(false);
    setIsUpdating(false);
  };

  const handleStockCancel = () => {
    setTempStock(product.stock);
    setIsEditingStock(false);
  };

  const handleNameSave = async () => {
    if (!tempName.trim() || tempName === product.name) {
      setTempName(product.name);
      setIsEditingName(false);
      return;
    }
    setIsUpdating(true);
    const success = await onUpdateProduct(product.id, { name: tempName });
    if (success) setIsEditingName(false);
    setIsUpdating(false);
  };

  const handleNameCancel = () => {
    setTempName(product.name);
    setIsEditingName(false);
  };

  const handleStripeSave = async () => {
    if (tempStripe === (product.stripe_payment_link || '')) {
      setIsEditingStripe(false);
      return;
    }
    setIsUpdating(true);
    const success = await onUpdateProduct(product.id, { stripe_payment_link: tempStripe });
    if (success) setIsEditingStripe(false);
    setIsUpdating(false);
  };

  const handleStripeCancel = () => {
    setTempStripe(product.stripe_payment_link || '');
    setIsEditingStripe(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(product.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="ERASE_ARTIFACT"
        message={`ARE YOU CERTAIN YOU WISH TO PURGE "${product.name}" FROM THE PERMANENT RECORD? THIS ACTION CANNOT BE REVERSED.`}
        confirmText={isDeleting ? 'PURGING...' : 'ERASE_DATA'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-paper group transition-all"
      data-product-id={product.id}
    >
      <div className="flex items-start p-4 gap-4">
        {/* Thumbnail */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-24 h-32 bg-ink/5 overflow-hidden flex-shrink-0 transition-all duration-300 ${isDragging ? 'ring-2 ring-ink ring-inset' : ''}`}
        >
          <MediaRenderer 
            asset={product.images?.[0]} 
            fallbackUrl={product.provenanceImage}
            className="w-full h-full object-cover"
          />
          {(product.stock ?? 0) === 0 ? (
            <div className="absolute top-1 left-1 bg-rose-600 text-white text-[7px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-black z-10 shadow-sm flex items-center gap-1">
              <AlertTriangle size={7} /> OUT OF STOCK
            </div>
          ) : (product.stock ?? 0) < 5 ? (
            <div className="absolute top-1 left-1 bg-amber-500 text-black text-[7px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-bold z-10 shadow-sm flex items-center gap-1">
              <AlertTriangle size={7} /> LOW: {product.stock}
            </div>
          ) : product.images && product.images.length > 0 ? (
            <div className="absolute top-1 left-1 bg-ink text-paper text-[7px] font-mono px-1 py-0.5 uppercase tracking-tighter font-bold z-10">
              UPLOADED
            </div>
          ) : null}
          {product.stripe_payment_link && (
            <div className="absolute top-1 right-1 bg-ink text-paper text-[7px] font-mono px-1 py-0.5 uppercase tracking-tighter font-bold z-10">
              STRIPE LINKED
            </div>
          )}
          {!product.is_visible && (
            <div className="absolute inset-0 bg-paper/60 backdrop-blur-[1px] flex items-center justify-center">
              <EyeOff size={16} className="text-ink/40" />
            </div>
          )}
          <div className={`absolute inset-0 bg-ink/60 flex flex-col items-center justify-center gap-2 transition-opacity ${isLinking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isLinking ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={20} className="text-paper animate-spin" />
                <span className="text-[8px] font-mono text-paper font-bold uppercase tracking-widest animate-pulse">
                  LINKING...
                </span>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleLinkUpload}
                  disabled={isLinking}
                  className="p-2 bg-paper/10 hover:bg-paper/20 rounded-full transition-colors flex items-center justify-center text-paper"
                  title="Add Google Drive Link"
                >
                  <LinkIcon size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = product.images?.[0]?.url;
                    if (url) {
                      navigator.clipboard.writeText(url);
                    }
                  }}
                  className="p-2 bg-paper/10 hover:bg-paper/20 rounded-full transition-colors flex items-center justify-center text-paper"
                  title="Copy Main Image Link"
                >
                  <Copy size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={(e) => {
                      // Only save if we didn't click the save button
                      if (!e.relatedTarget?.closest('.save-btn')) handleNameSave();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave();
                      if (e.key === 'Escape') handleNameCancel();
                    }}
                    className="flex-1 bg-ink/10 border-none p-1 font-serif font-bold text-lg focus:ring-0 italic text-ink"
                  />
                  <div className="flex gap-1">
                    <button 
                      onClick={handleNameSave}
                      className="save-btn p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Save Name"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button 
                      onClick={handleNameCancel}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Discard Changes"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <h3 
                  onClick={() => setIsEditingName(true)}
                  className="font-serif font-bold text-lg truncate leading-tight cursor-pointer hover:bg-ink/5 p-1 -ml-1 rounded transition-colors italic text-ink group/name flex items-center gap-2"
                >
                  {index !== undefined ? `---- ${index + 1}` : ''}
                  <Edit2 size={10} className="opacity-0 group-hover/name:opacity-20" />
                </h3>
              )}
              <div className="flex items-center gap-1 group/id">
                <p className="text-[9px] font-mono opacity-30 uppercase tracking-tighter truncate">ID: {product.id}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(product.id);
                    // Could add a toast here
                  }}
                  className="opacity-0 group-hover/id:opacity-100 transition-opacity text-ink/20 hover:text-ink"
                  title="Copy ID"
                >
                  <Copy size={8} />
                </button>
              </div>
              {product.is_user_submitted && (
                <div className="mt-1 flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest border ${
                    product.status === 'approved' ? 'bg-ink text-paper border-ink' :
                    product.status === 'rejected' ? 'bg-ink/10 text-ink/40 border-ink/20' :
                    'bg-ink/5 text-ink/60 border-ink/10'
                  }`}>
                    {product.status || 'PENDING'}
                  </span>
                  {product.status === 'pending' && (
                    <div className="flex gap-1">
                      <button 
                        onClick={handleApprove}
                        disabled={isUpdating}
                        className="p-1 text-ink hover:bg-ink/5 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 size={12} />
                      </button>
                      <button 
                        onClick={handleReject}
                        disabled={isUpdating}
                        className="p-1 text-ink/40 hover:bg-ink/5 transition-colors"
                        title="Reject"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => onEdit(product)}
                className="p-1.5 text-ink/20 hover:text-ink hover:bg-ink/5 transition-all"
                title="Edit Full Details"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={onToggleVisibility}
                className={`p-1.5 transition-colors ${product.is_visible ? 'text-ink hover:bg-ink/5' : 'text-ink/20 hover:bg-ink/5'}`}
                title={product.is_visible ? 'Visible' : 'Hidden'}
              >
                {product.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button 
                onClick={onToggleFeatured}
                className={`p-1.5 transition-colors ${product.is_featured ? 'text-ink hover:bg-ink/5' : 'text-ink/20 hover:bg-ink/5'}`}
                title={product.is_featured ? 'Featured' : 'Standard'}
              >
                {product.is_featured ? <Star size={14} fill={product.is_featured ? 'currentColor' : 'none'} /> : <Star size={14} />}
              </button>
              <button 
                onClick={() => onFocusProduct(product.id)}
                className="p-1.5 text-ink/20 hover:text-ink hover:bg-ink/5 transition-all"
                title="Focus for Upload"
              >
                <Target size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div className="space-y-1">
              <label className="text-[8px] font-mono opacity-40 uppercase tracking-widest flex items-center gap-1">
                <DollarSign size={8} /> PRICE
              </label>
              {isEditingPrice ? (
                <div className="flex items-center gap-1">
                  <input 
                    autoFocus
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(parseFloat(e.target.value))}
                    onBlur={(e) => {
                      if (!e.relatedTarget?.closest('.save-btn')) handlePriceSave();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePriceSave();
                      if (e.key === 'Escape') handlePriceCancel();
                    }}
                    className="w-20 bg-ink/5 border-none p-1 font-mono text-xs focus:ring-0"
                  />
                  <button 
                    onClick={handlePriceSave}
                    className="save-btn p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <CheckCircle2 size={12} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingPrice(true)}
                  className="font-mono text-xs font-bold cursor-pointer hover:bg-ink/5 p-1 -ml-1 rounded transition-colors flex items-center gap-1 group/price"
                >
                  {product.price.toFixed(2)} USD
                  <Edit2 size={8} className="opacity-0 group-hover/price:opacity-20" />
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-mono opacity-40 uppercase tracking-widest flex items-center gap-1">
                  <Package size={8} /> STOCK
                </label>
                {(product.stock ?? 0) === 0 ? (
                  <span className="px-1 py-0.2 bg-rose-600 text-white text-[7px] font-mono font-black uppercase tracking-wider flex items-center gap-0.5">
                    <AlertTriangle size={7} /> OUT
                  </span>
                ) : (product.stock ?? 0) < 5 ? (
                  <span className="px-1 py-0.2 bg-amber-500/20 text-amber-900 border border-amber-500/40 text-[7px] font-mono font-bold uppercase tracking-wider flex items-center gap-0.5">
                    <AlertTriangle size={7} /> LOW
                  </span>
                ) : null}
              </div>
              {isEditingStock ? (
                <div className="flex items-center gap-1">
                  <input 
                    autoFocus
                    type="number"
                    value={tempStock}
                    onChange={(e) => setTempStock(parseInt(e.target.value))}
                    onBlur={(e) => {
                      if (!e.relatedTarget?.closest('.save-btn')) handleStockSave();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStockSave();
                      if (e.key === 'Escape') handleStockCancel();
                    }}
                    className="w-20 bg-ink/5 border-none p-1 font-mono text-xs focus:ring-0"
                  />
                  <button 
                    onClick={handleStockSave}
                    className="save-btn p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <CheckCircle2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div 
                    onClick={() => setIsEditingStock(true)}
                    className={`font-mono text-xs font-bold cursor-pointer hover:bg-ink/5 p-1 -ml-1 rounded transition-colors flex items-center gap-1 group/stock ${
                      (product.stock ?? 0) === 0 
                        ? 'text-rose-600 font-black' 
                        : (product.stock ?? 0) < 5 
                          ? 'text-amber-800 font-black' 
                          : ''
                    }`}
                  >
                    {product.stock ?? 0} UNITS
                    <Edit2 size={8} className="opacity-0 group-hover/stock:opacity-20" />
                  </div>
                  {(product.stock ?? 0) < 5 && (
                    <button
                      onClick={() => onUpdateProduct(product.id, { stock: (product.stock || 0) + 5 })}
                      className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-900 hover:text-black font-mono font-bold text-[8px] border border-amber-500/40 transition-colors cursor-pointer"
                      title="Quick add +5 stock"
                    >
                      +5
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 bg-ink/5 text-[9px] font-mono uppercase tracking-widest text-ink/60">
              {product.category}
            </span>
          </div>

          {/* QUICK_SWAP_PROTOCOL DASHBOARD */}
          <div className="bg-ink/[0.02] border border-ink/5 p-3 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-ink/65">
                <CheckCircle2 size={10} className="text-green-600 animate-pulse" />
                <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em]">
                  QUICK_SWAP_PROTOCOL
                </span>
              </div>
              <span className="text-[6px] font-mono opacity-30 uppercase">EASY_EDIT</span>
            </div>

            {/* Quick Photo Swap Row */}
            <div className="space-y-1">
              <label className="text-[7px] font-mono font-bold uppercase tracking-[0.15em] opacity-40 flex items-center gap-1">
                <Upload size={8} /> SWAP COVER PHOTO
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 border border-ink/10 bg-paper hover:bg-ink hover:text-paper font-mono text-[8.5px] font-bold uppercase tracking-widest transition-all"
                  title="Upload a local image file to immediately set as cover image"
                >
                  📁 UPLOAD FILE
                </button>
                <button
                  type="button"
                  onClick={handleCoverDriveLinkSwap}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 border border-ink/10 bg-paper hover:bg-ink hover:text-paper font-mono text-[8.5px] font-bold uppercase tracking-widest transition-all"
                  title="Paste a Google Drive or external link to immediately set as cover image"
                >
                  🔗 PASTE LINK
                </button>
              </div>
              <input 
                type="file"
                ref={coverFileInputRef}
                onChange={handleCoverFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Quick Stripe Link Input Row */}
            <div className="space-y-1 pt-1.5 border-t border-ink/5">
              <div className="flex justify-between items-center">
                <label className="text-[7px] font-mono font-bold uppercase tracking-[0.15em] opacity-40 flex items-center gap-1">
                  <LinkIcon size={8} /> STRIPE PAYMENT LINK
                </label>
                {product.stripe_payment_link ? (
                  <a 
                    href={product.stripe_payment_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[6px] font-mono font-bold text-green-600 uppercase tracking-widest hover:underline flex items-center gap-0.5"
                    title="Test checkout link in new tab"
                  >
                    CONNECTED <ExternalLink size={6} />
                  </a>
                ) : (
                  <span className="text-[6px] font-mono font-bold text-ink/30 uppercase tracking-widest">
                    NOT LINKED
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 items-center bg-paper border border-ink/10 p-1.5">
                <input 
                  value={tempStripe}
                  onChange={(e) => setTempStripe(e.target.value)}
                  placeholder="https://buy.stripe.com/..."
                  className="flex-1 bg-transparent border-none p-0 text-[10px] font-mono focus:ring-0 focus:outline-none placeholder:opacity-25 text-ink outline-none"
                  onBlur={handleStripeSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                />
                {tempStripe !== (product.stripe_payment_link || '') && (
                  <button 
                    type="button"
                    onClick={handleStripeSave}
                    className="save-btn p-1 px-2.5 bg-ink text-paper text-[8px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                    title="Confirm direct payment link change"
                  >
                    SAVE
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Asset Collection / Image Management */}
          <div className="pt-4 border-t border-ink/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload size={10} className="opacity-40" />
                <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] opacity-40">
                  ASSET_COLLECTION ({product.images?.length || 0}/20)
                </span>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 border border-ink/10 hover:bg-ink hover:text-paper transition-all"
              >
                + ADD_ASSET
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Drag Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative h-20 border border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer
                ${isDragging ? 'border-ink bg-ink/5' : 'border-ink/10 bg-ink/[0.02] hover:bg-ink/[0.05]'}
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 size={12} className="animate-spin opacity-40" />
                  <span className="text-[7px] font-mono uppercase tracking-[0.2em] opacity-40 animate-pulse">UPLOADING...</span>
                </div>
              ) : (
                <>
                <Upload size={14} className={`opacity-20 ${isDragging ? 'scale-110 opacity-60' : ''} transition-all`} />
                <div className="flex gap-2">
                  <Link2 size={10} className={`opacity-20 ${isDragging ? 'animate-bounce' : ''}`} />
                  <span className="text-[7px] font-mono uppercase tracking-[0.3em] opacity-30 italic">FILE_OR_LINK</span>
                </div>
                <span className="text-[7px] font-mono uppercase tracking-[0.3em] opacity-30">DROP_FOR_COVER</span>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <AnimatePresence mode="popLayout">
                {product.images?.map((asset, idx) => (
                  <motion.div 
                    key={`card-thumb-${asset.uid || asset.url || idx}-${idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative aspect-[3/4] bg-ink/5 border ${idx === 0 ? 'border-ink ring-1 ring-ink/20' : 'border-ink/10'} group/img overflow-hidden`}
                  >
                    <MediaRenderer 
                      asset={asset}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Index Label */}
                    <div className="absolute top-0 left-0 bg-ink text-paper text-[6px] font-mono px-1 py-0.5 uppercase tracking-tighter font-bold z-10">
                      {idx === 0 ? 'COVER' : `#${idx + 1}`}
                    </div>

                    {/* Controls */}
                    <div className="absolute inset-0 bg-ink/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                      <div className="flex gap-1 justify-center w-full">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveImage(asset, 'left'); }}
                          className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-20"
                          disabled={idx === 0}
                        >
                          <ChevronLeft size={10} className="text-white" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveImage(asset, 'right'); }}
                          className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-20"
                          disabled={idx === (product.images?.length || 0) - 1}
                        >
                          <ChevronRight size={10} className="text-white" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAsCover(asset); }}
                        className={`text-[5px] font-mono font-bold uppercase tracking-widest px-1 py-0.5 border border-white/20 hover:bg-white hover:text-ink transition-all ${idx === 0 ? 'bg-white text-ink border-white' : 'text-white'}`}
                      >
                        {idx === 0 ? 'PRIMARY' : 'SET AS COVER'}
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeImage(asset); }}
                        className="absolute top-0 right-0 p-1 hover:bg-red-500/80 transition-colors"
                      >
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="border-t border-ink/5 flex divide-x divide-ink/5">
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all"
          title="Delete"
        >
          <Trash2 size={12} /> DELETE PRODUCT
        </button>
      </div>
    </motion.div>
  </>
);
});
