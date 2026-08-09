import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Minus, Search, Filter, SortAsc, SortDesc, Package, Globe, Upload, Sparkles, 
  Zap, RefreshCw, LayoutGrid, Table, Trash2, Edit2, Copy, Eye, EyeOff, ExternalLink, 
  CreditCard, DollarSign, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Product } from '../../types';
import { AdminProductCard } from './AdminProductCard';
import { convertGoogleDriveUrl, formatPrice, generateUid } from '../../utils/helpers';

interface ProductsTabProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<boolean>;
  onToggleVisibility: (product: Product) => Promise<boolean>;
  onToggleFeatured: (product: Product) => Promise<boolean>;
  onUpdateProduct: (product: Partial<Product>) => Promise<boolean>;
  onDuplicate: (product: Product) => Promise<boolean>;
  onAddNew: (data?: Partial<Product>) => void;
  onBulkImport: () => void;
  onFocusProduct: (id: string) => void;
  onSyncStripe: () => Promise<void>;
  onRepoSync: () => Promise<void>;
  onLinkUpload?: (productId: string, url: string) => Promise<void>;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ 
  products, 
  onEdit, 
  onDelete, 
  onToggleVisibility, 
  onToggleFeatured,
  onUpdateProduct,
  onDuplicate,
  onAddNew,
  onBulkImport,
  onFocusProduct,
  onSyncStripe,
  onRepoSync,
  onLinkUpload
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Product; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [viewMode, setViewMode] = React.useState<'GRID' | 'TABLE'>('TABLE');
  
  // POS Quick Add Form State
  const [quickAddName, setQuickAddName] = React.useState('');
  const [quickAddPrice, setQuickAddPrice] = React.useState<number>(0);
  const [quickAddStock, setQuickAddStock] = React.useState<number>(10);
  const [quickAddCategory, setQuickAddCategory] = React.useState<string>('TOPS');
  const [quickAddStripe, setQuickAddStripe] = React.useState('');
  const [quickAddPhoto, setQuickAddPhoto] = React.useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const quickFileInputRef = React.useRef<HTMLInputElement>(null);

  const [displayCount, setDisplayCount] = React.useState(24);
  const [isRepoSyncing, setIsRepoSyncing] = React.useState(false);

  // Statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_visible).length;
  const lowStockProducts = products.filter(p => (p.stock || 0) < 5).length;
  const totalCatalogValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 1)), 0);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('image', files[0]);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('UPLOAD_FAILED');

      const results = await response.json();
      const uploadedUrl = Array.isArray(results) ? results[0]?.url : results.url;
      if (uploadedUrl) {
        setQuickAddPhoto(uploadedUrl);
      }
    } catch (err) {
      console.error("Quick photo upload failed:", err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;
    
    const images = quickAddPhoto.trim() ? [{ url: quickAddPhoto.trim(), type: 'image' as const }] : [];
    
    onAddNew({ 
      name: quickAddName, 
      price: quickAddPrice || 0, 
      stock: quickAddStock || 0, 
      category: quickAddCategory || 'TOPS', 
      is_visible: true,
      stripe_payment_link: quickAddStripe.trim(),
      images: images
    });
    
    // Reset form
    setQuickAddName('');
    setQuickAddPrice(0);
    setQuickAddStock(10);
    setQuickAddStripe('');
    setQuickAddPhoto('');
  };

  const handleConfirmChanges = async () => {
    setIsRepoSyncing(true);
    try {
      await onRepoSync();
    } finally {
      setIsRepoSyncing(false);
    }
  };

  const filteredProducts = React.useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, searchQuery, categoryFilter, sortConfig]);

  const displayedProducts = React.useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const hasMore = filteredProducts.length > displayCount;

  return (
    <div className="space-y-8 font-mono">
      {/* POS Terminal Summary Bar */}
      <div className="bg-black text-white p-6 sm:p-8 rounded-none border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/15 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white text-black font-black text-xl flex items-center justify-center tracking-tighter">
              POS
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl sm:text-3xl font-display tracking-tight text-white uppercase font-bold">
                  POS INVENTORY TERMINAL
                </h2>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  PIN: 00736121 VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-white/60 uppercase tracking-widest">
                Real-time Point of Sale item catalog control, photo uploading & Stripe payment link embedding.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setViewMode(prev => prev === 'TABLE' ? 'GRID' : 'TABLE')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              {viewMode === 'TABLE' ? <LayoutGrid size={15} /> : <Table size={15} />}
              <span>{viewMode === 'TABLE' ? 'GRID VIEW' : 'POS TABLE VIEW'}</span>
            </button>

            <button 
              onClick={() => onAddNew()}
              className="px-6 py-3 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus size={16} /> NEW ITEM
            </button>
          </div>
        </div>

        {/* POS Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">TOTAL ITEMS</span>
            <span className="text-2xl font-black text-white mt-2">{totalProducts}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">PUBLISHED ON STORE</span>
            <span className="text-2xl font-black text-emerald-400 mt-2">{activeProducts} / {totalProducts}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">LOW STOCK WARNING (&lt;5)</span>
            <span className={`text-2xl font-black mt-2 ${lowStockProducts > 0 ? 'text-amber-400' : 'text-white'}`}>
              {lowStockProducts}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">EST. CATALOG VALUE</span>
            <span className="text-2xl font-black text-white mt-2">{formatPrice(totalCatalogValue)}</span>
          </div>
        </div>
      </div>

      {/* POS Quick Add Item Terminal */}
      <div className="bg-paper border border-ink/15 text-ink p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Zap size={18} className="text-ink" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink">
              QUICK ADD NEW PRODUCT (POS TERMINAL ENTRY)
            </h3>
          </div>
          <span className="text-[10px] opacity-50 uppercase tracking-widest">INSTANT PUBLISH</span>
        </div>
        
        <form onSubmit={handleQuickAdd} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Title */}
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                ITEM NAME / TITLE *
              </label>
              <input 
                required
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                placeholder="e.g. ARCHIVAL HOODIE 01"
                className="w-full bg-ink/5 border border-ink/15 p-3.5 text-[12px] font-mono focus:outline-none focus:border-ink transition-all uppercase"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                PRICE ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 font-bold">$</span>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={quickAddPrice || ''}
                  onChange={(e) => setQuickAddPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-ink/5 border border-ink/15 p-3.5 pl-8 text-[12px] font-mono focus:outline-none focus:border-ink transition-all"
                />
              </div>
            </div>

            {/* Stock with POS Buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                INITIAL STOCK COUNT
              </label>
              <div className="flex items-center bg-ink/5 border border-ink/15">
                <button
                  type="button"
                  onClick={() => setQuickAddStock(prev => Math.max(0, prev - 1))}
                  className="px-3.5 py-3 hover:bg-ink/10 transition-colors cursor-pointer text-ink font-bold"
                >
                  <Minus size={14} />
                </button>
                <input 
                  type="number"
                  min="0"
                  value={quickAddStock}
                  onChange={(e) => setQuickAddStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-center text-[12px] font-mono font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuickAddStock(prev => prev + 1)}
                  className="px-3.5 py-3 hover:bg-ink/10 transition-colors cursor-pointer text-ink font-bold"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                CATEGORY
              </label>
              <select
                value={quickAddCategory}
                onChange={(e) => setQuickAddCategory(e.target.value)}
                className="w-full bg-ink/5 border border-ink/15 p-3.5 text-[12px] font-mono focus:outline-none focus:border-ink uppercase appearance-none"
              >
                <option value="TOPS">TOPS</option>
                <option value="BOTTOMS">BOTTOMS</option>
                <option value="ACCESSORIES">ACCESSORIES</option>
                <option value="ARTIFACT">ARTIFACT</option>
                <option value="USER_SUBMISSION">USER SUBMISSION</option>
                <option value="ARCHIVE">ARCHIVE</option>
              </select>
            </div>

            {/* Embedded Stripe Link */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest flex items-center gap-1.5">
                  <CreditCard size={12} /> EMBEDDED STRIPE PAYMENT LINK
                </label>
                <span className="text-[9px] text-ink/40">https://buy.stripe.com/...</span>
              </div>
              <input 
                value={quickAddStripe}
                onChange={(e) => setQuickAddStripe(e.target.value)}
                placeholder="https://buy.stripe.com/your_stripe_checkout_id"
                className="w-full bg-ink/5 border border-ink/15 p-3.5 text-[12px] font-mono focus:outline-none focus:border-ink transition-all"
              />
            </div>
          </div>

          {/* Photo Upload Options */}
          <div className="space-y-2 pt-2 border-t border-ink/10">
            <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest flex items-center gap-1.5">
              <ImageIcon size={12} /> PRODUCT PHOTO (FILE UPLOAD OR DRIVE URL)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="file"
                ref={quickFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
              />

              <button
                type="button"
                onClick={() => quickFileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="w-full sm:w-auto px-6 py-3 bg-ink/10 hover:bg-ink hover:text-paper text-ink text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-ink/15"
              >
                {isUploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{isUploadingPhoto ? 'UPLOADING...' : 'UPLOAD PHOTO FILE'}</span>
              </button>

              <div className="w-full flex items-center gap-2">
                <input 
                  value={quickAddPhoto}
                  onChange={(e) => setQuickAddPhoto(e.target.value)}
                  placeholder="PASTE IMAGE URL OR GOOGLE DRIVE SHARE LINK..."
                  className="w-full bg-ink/5 border border-ink/15 p-3 text-[11px] font-mono focus:outline-none focus:border-ink"
                  onBlur={(e) => {
                    if (e.target.value) {
                      setQuickAddPhoto(convertGoogleDriveUrl(e.target.value));
                    }
                  }}
                />
                {quickAddPhoto && (
                  <div className="w-10 h-10 border border-ink/20 shrink-0 overflow-hidden bg-black/5 flex items-center justify-center">
                    <img src={quickAddPhoto} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              type="submit"
              disabled={!quickAddName.trim()}
              className="w-full py-4 bg-black text-white text-[12px] font-mono font-bold uppercase tracking-[0.25em] hover:bg-neutral-800 transition-all cursor-pointer shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>SAVE ITEM TO STOREFRONT (POS DIRECT PUBLISH)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH BY TITLE, ID, OR CATEGORY..."
            className="w-full bg-ink/5 border border-ink/15 p-3.5 pl-12 text-[11px] font-mono focus:outline-none focus:border-ink uppercase"
          />
        </div>

        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-ink/5 border border-ink/15 p-3.5 pl-12 text-[11px] font-mono focus:outline-none focus:border-ink uppercase appearance-none cursor-pointer"
          >
            <option value="ALL">ALL CATEGORIES ({products.length})</option>
            <option value="ARTIFACT">ARTIFACT</option>
            <option value="USER_SUBMISSION">USER SUBMISSION</option>
            <option value="TOPS">TOPS</option>
            <option value="BOTTOMS">BOTTOMS</option>
            <option value="ACCESSORIES">ACCESSORIES</option>
            <option value="ARCHIVE">ARCHIVE</option>
          </select>
        </div>

        <button 
          onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
          className="bg-ink/5 border border-ink/15 p-3.5 text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-ink/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {sortConfig.direction === 'asc' ? <SortAsc size={15} /> : <SortDesc size={15} />}
          <span>SORT ({sortConfig.direction.toUpperCase()})</span>
        </button>
      </div>

      {/* Display Modes */}
      {viewMode === 'TABLE' ? (
        /* POS TABLE / REGISTER VIEW */
        <div className="border border-ink/15 overflow-x-auto shadow-md bg-paper">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-[10px] font-bold tracking-widest border-b border-ink/20">
                <th className="p-3.5">PHOTO</th>
                <th className="p-3.5">ITEM NAME</th>
                <th className="p-3.5">CATEGORY</th>
                <th className="p-3.5 text-center">PRICE ($)</th>
                <th className="p-3.5 text-center">STOCK (POS CONTROL)</th>
                <th className="p-3.5">STRIPE LINK</th>
                <th className="p-3.5 text-center">STATUS</th>
                <th className="p-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {displayedProducts.map((product) => {
                const coverImage = (product.images?.[0] as any)?.url || product.images?.[0] || '';
                return (
                  <tr key={product.id} className="hover:bg-ink/5 transition-colors">
                    {/* Cover Thumbnail */}
                    <td className="p-3.5">
                      <div className="w-12 h-12 bg-black/5 border border-ink/15 relative overflow-hidden group">
                        {coverImage ? (
                          <img src={coverImage} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink/30">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                          <Upload size={12} />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const formData = new FormData();
                                formData.append('image', e.target.files[0]);
                                fetch('/api/admin/upload', { method: 'POST', body: formData })
                                  .then(r => r.json())
                                  .then(res => {
                                    const url = Array.isArray(res) ? res[0]?.url : res.url;
                                    if (url) {
                                      const updatedImages = [{ url, type: 'image' as const }, ...(product.images || []).slice(1)];
                                      onUpdateProduct({ id: product.id, images: updatedImages });
                                    }
                                  });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="p-3.5 font-bold uppercase tracking-wide max-w-[180px] truncate">
                      {product.name}
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="px-2 py-1 bg-ink/5 border border-ink/10 text-[9px] font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>

                    {/* Inline Price */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1 border border-ink/15 px-2 py-1 bg-ink/5">
                        <span className="opacity-40 font-bold">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={product.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onUpdateProduct({ id: product.id, price: val });
                          }}
                          className="w-16 bg-transparent text-center font-bold focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Stock POS Incrementer */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center border border-ink/20 bg-ink/5">
                        <button
                          onClick={() => onUpdateProduct({ id: product.id, stock: Math.max(0, (product.stock || 0) - 1) })}
                          className="px-2 py-1 hover:bg-ink/10 transition-colors cursor-pointer font-bold text-ink"
                          title="Decrease Stock"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 font-bold min-w-[32px] text-center">
                          {product.stock || 0}
                        </span>
                        <button
                          onClick={() => onUpdateProduct({ id: product.id, stock: (product.stock || 0) + 1 })}
                          className="px-2 py-1 hover:bg-ink/10 transition-colors cursor-pointer font-bold text-ink"
                          title="Increase Stock"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Stripe Payment Link */}
                    <td className="p-3.5 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="text"
                          value={product.stripe_payment_link || ''}
                          placeholder="https://buy.stripe.com/..."
                          onChange={(e) => onUpdateProduct({ id: product.id, stripe_payment_link: e.target.value })}
                          className="w-full bg-ink/5 border border-ink/10 p-1.5 text-[10px] focus:outline-none focus:border-ink truncate"
                        />
                        {product.stripe_payment_link && (
                          <a 
                            href={product.stripe_payment_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20 shrink-0"
                            title="Test Embedded Stripe Payment Link"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Visibility Toggle */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onToggleVisibility(product)}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                          product.is_visible 
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-700 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {product.is_visible ? 'PUBLISHED' : 'HIDDEN'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(product)}
                          className="p-2 hover:bg-black hover:text-white transition-colors border border-ink/15 cursor-pointer"
                          title="Edit Full Product Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDuplicate(product)}
                          className="p-2 hover:bg-black hover:text-white transition-colors border border-ink/15 cursor-pointer"
                          title="Duplicate Item"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`ARE YOU SURE YOU WANT TO DELETE "${product.name.toUpperCase()}"? THIS CANNOT BE UNDONE.`)) {
                              await onDelete(product.id);
                            }
                          }}
                          className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors border border-rose-500/20 cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* POS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <AdminProductCard 
              key={product.id}
              product={product}
              onFocusProduct={onFocusProduct}
              index={products.indexOf(product)}
              onEdit={onEdit}
              onUpdateProduct={(id, updates) => onUpdateProduct({ id, ...updates })}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onToggleVisibility={() => onToggleVisibility(product)}
              onToggleFeatured={() => onToggleFeatured(product)}
              onLinkUpload={(url) => onLinkUpload?.(product.id, url)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-6">
          <button 
            onClick={() => setDisplayCount(prev => prev + 24)}
            className="px-10 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>LOAD MORE ITEMS ({filteredProducts.length - displayCount} REMAINING)</span>
          </button>
        </div>
      )}

      {/* Sync All & Finalize POS Changes */}
      <div className="pt-12 pb-12 border-t border-ink/10 mt-12 flex flex-col items-center gap-4 bg-black/5 p-8">
        <div className="text-center space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
            POS REPOSITORY SYNC & COMMIT
          </p>
          <p className="text-[10px] text-ink/60 uppercase max-w-md mx-auto">
            Synchronizes changes directly with cloud database storage and updates the master inventory manifest.
          </p>
        </div>
        
        <button 
          onClick={handleConfirmChanges}
          disabled={isRepoSyncing}
          className="px-16 py-5 bg-black text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-neutral-800 transition-all cursor-pointer shadow-xl disabled:opacity-50 flex items-center gap-3"
        >
          {isRepoSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
          <span>{isRepoSyncing ? 'SYNCHRONIZING...' : 'CONFIRM & SYNC ALL POS CHANGES'}</span>
        </button>
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-16 text-center space-y-4 border border-dashed border-ink/20">
          <Package size={40} className="mx-auto opacity-20" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">NO MATCHING PRODUCTS</p>
            <p className="text-[10px] opacity-40 mt-1">Try adjusting your search query or category filter above.</p>
          </div>
        </div>
      )}
    </div>
  );
};
