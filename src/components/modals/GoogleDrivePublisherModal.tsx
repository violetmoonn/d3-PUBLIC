import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UploadCloud, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  RefreshCw, 
  Search, 
  Plus, 
  Check, 
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { Product } from '../../types';
import { signInWithGoogleDrive, getGoogleDriveAccessToken, signOutGoogleDrive, auth } from '../../firebase';
import { fetchGoogleDrivePhotos, uploadImageToGoogleDrive, GoogleDrivePhoto } from '../../services/googleDriveService';
import { generateUid } from '../../utils/helpers';

interface GoogleDrivePublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onPublishNewProduct: (productData: {
    name: string;
    description: string;
    price: number;
    category: string;
    images: { url: string; type: string; created_at: string; uid: string }[];
  }) => Promise<void>;
  onAttachToProduct: (productId: string, images: { url: string; type: string; created_at: string; uid: string }[], setAsCover?: boolean) => Promise<void>;
  onAddDriveLink?: (url: string, productId?: string) => Promise<void>;
  targetProductId?: string;
}

export const GoogleDrivePublisherModal: React.FC<GoogleDrivePublisherModalProps> = ({
  isOpen,
  onClose,
  products,
  onPublishNewProduct,
  onAttachToProduct,
  targetProductId
}) => {
  // Auth state
  const [accessToken, setAccessToken] = useState<string | null>(getGoogleDriveAccessToken());
  const [user, setUser] = useState<any>(auth.currentUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<GoogleDrivePhoto[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<GoogleDrivePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Publishing config state
  const [publishAction, setPublishAction] = useState<'attach' | 'new_product' | 'set_cover'>('new_product');
  const [selectedTargetProdId, setSelectedTargetProdId] = useState<string>(targetProductId || (products[0]?.id || ''));
  
  // New Product fields
  const [newProductName, setNewProductName] = useState('D3 ARTIFACT');
  const [newProductDesc, setNewProductDesc] = useState('High-fidelity technical garment artifact published directly from Google Drive.');
  const [newProductPrice, setNewProductPrice] = useState(350);
  const [newProductCategory, setNewProductCategory] = useState('ARTIFACT');

  // Execution state
  const [status, setStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync token on open
  useEffect(() => {
    if (isOpen) {
      const currentToken = getGoogleDriveAccessToken();
      setAccessToken(currentToken);
      setUser(auth.currentUser);
      if (currentToken) {
        loadPhotos(currentToken);
      }
      if (targetProductId) {
        setSelectedTargetProdId(targetProductId);
        setPublishAction('attach');
      }
    }
  }, [isOpen, targetProductId]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage('');
    try {
      const res = await signInWithGoogleDrive();
      setAccessToken(res.accessToken);
      setUser(res.user);
      await loadPhotos(res.accessToken);
    } catch (err: any) {
      console.error('Google Drive sign-in failed:', err);
      setErrorMessage(err.message || 'Google Drive authentication could not be completed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleDrive();
    setAccessToken(null);
    setUser(null);
    setPhotos([]);
    setSelectedPhotos([]);
  };

  const loadPhotos = async (token: string, search?: string) => {
    setIsLoadingPhotos(true);
    setErrorMessage('');
    try {
      const res = await fetchGoogleDrivePhotos(token, search);
      setPhotos(res.files);
    } catch (err: any) {
      console.error('Failed to fetch Drive photos:', err);
      if (err.message?.includes('401') || err.message?.includes('Invalid Credentials') || err.message?.includes('token')) {
        setAccessToken(null);
      } else {
        setErrorMessage(err.message || 'Could not load photos from Google Drive.');
      }
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleToggleSelectPhoto = (photo: GoogleDrivePhoto) => {
    setSelectedPhotos(prev => {
      const exists = prev.some(p => p.id === photo.id);
      if (exists) {
        return prev.filter(p => p.id !== photo.id);
      } else {
        return [...prev, photo];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos([...photos]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !accessToken) return;

    setUploadingFiles(true);
    setErrorMessage('');
    try {
      const uploadedPhotos: GoogleDrivePhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Uploading ${i + 1}/${files.length}: ${file.name}...`);
        const result = await uploadImageToGoogleDrive(accessToken, file);
        uploadedPhotos.push(result);
      }

      // Add uploaded photos to top of photos list and select them
      setPhotos(prev => [...uploadedPhotos, ...prev]);
      setSelectedPhotos(prev => [...uploadedPhotos, ...prev]);
      setStatusMessage(`Successfully uploaded ${uploadedPhotos.length} photo(s) to Google Drive`);
    } catch (err: any) {
      console.error('Upload to Drive failed:', err);
      setErrorMessage(err.message || 'Failed to upload photo to Google Drive.');
    } finally {
      setUploadingFiles(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (selectedPhotos.length === 0) return;

    setStatus('publishing');
    setErrorMessage('');

    try {
      const now = Date.now();
      const formattedAttachments = selectedPhotos.map((p, idx) => ({
        uid: generateUid(),
        url: p.directUrl,
        type: 'image',
        created_at: p.createdTime || new Date(now + idx * 1000).toISOString()
      }));

      // Sort attachments chronologically
      formattedAttachments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (publishAction === 'new_product') {
        setStatusMessage(`Publishing "${newProductName}" to storefront...`);
        await onPublishNewProduct({
          name: newProductName,
          description: newProductDesc,
          price: Number(newProductPrice) || 350,
          category: newProductCategory,
          images: formattedAttachments
        });
        setStatusMessage('Storefront Product Card successfully created & published!');
      } else if (publishAction === 'attach') {
        setStatusMessage(`Attaching ${formattedAttachments.length} photo(s) to product card...`);
        await onAttachToProduct(selectedTargetProdId, formattedAttachments, false);
        setStatusMessage('Photos successfully embedded into product card!');
      } else if (publishAction === 'set_cover') {
        setStatusMessage('Setting cover photo on storefront product card...');
        await onAttachToProduct(selectedTargetProdId, formattedAttachments, true);
        setStatusMessage('Storefront cover photo updated!');
      }

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setErrorMessage(err.message || 'Storefront publishing protocol encountered an error.');
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-paper/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="bg-paper border border-ink/10 w-full max-w-5xl h-[88vh] overflow-hidden relative shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-ink/10 flex justify-between items-center bg-paper sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center">
                <UploadCloud size={20} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-display tracking-tight uppercase">GOOGLE DRIVE STOREFRONT PUBLISHING</h2>
                <p className="text-[9px] font-mono uppercase opacity-50 tracking-widest">
                  ACCESS YOUR DRIVE PHOTOS & PUBLISH FOR VISIBILITY IN STOREFRONT
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-ink/5 border border-ink/10 text-[10px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="opacity-70 truncate max-w-[140px]">{user.email || user.displayName || 'Connected'}</span>
                  <button 
                    onClick={handleSignOut} 
                    title="Sign out of Google Drive" 
                    className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              )}
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-ink hover:text-paper transition-all border border-transparent hover:border-ink/10"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Step 1: Authentication if not logged in */}
            {!accessToken ? (
              <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-ink/10 bg-ink/[0.02]">
                <div className="w-16 h-16 bg-ink text-paper flex items-center justify-center mb-6">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-2xl font-display uppercase tracking-tight mb-2">CONNECT YOUR GOOGLE DRIVE</h3>
                <p className="text-xs font-mono opacity-60 max-w-md uppercase tracking-wider mb-8 leading-relaxed">
                  Allow D3COMPOSURE to access your Google Drive photos so you can select, upload, and publish them directly onto your storefront cards.
                </p>

                {errorMessage && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-mono max-w-md text-left flex items-center gap-3">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="px-8 py-4 bg-ink text-paper text-xs font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 shadow-lg disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      AUTHORIZING GOOGLE DRIVE...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      SIGN IN WITH GOOGLE DRIVE
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Action Bar: Search, Upload, Refresh */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-ink/10 pb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        loadPhotos(accessToken, e.target.value);
                      }}
                      placeholder="SEARCH PHOTOS IN GOOGLE DRIVE..."
                      className="w-full bg-ink/5 border border-ink/10 py-2.5 pl-10 pr-4 text-xs font-mono focus:border-ink/40 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFiles}
                      className="px-4 py-2.5 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingFiles ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          UPLOADING...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={12} />
                          UPLOAD TO DRIVE & PUBLISH
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => loadPhotos(accessToken, searchQuery)}
                      disabled={isLoadingPhotos}
                      title="Refresh photos"
                      className="p-2.5 border border-ink/10 hover:bg-ink hover:text-paper transition-all"
                    >
                      <RefreshCw size={14} className={isLoadingPhotos ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {uploadProgressText && (
                  <div className="p-3 bg-ink/5 border border-ink/10 text-xs font-mono flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-ink" />
                    <span>{uploadProgressText}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-mono flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Photos Grid */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest opacity-60">
                    <span>
                      GOOGLE DRIVE PHOTOS ({photos.length}) — {selectedPhotos.length} SELECTED
                    </span>
                    {photos.length > 0 && (
                      <button onClick={handleSelectAll} className="hover:underline font-bold text-ink">
                        {selectedPhotos.length === photos.length ? 'DESELECT ALL' : 'SELECT ALL'}
                      </button>
                    )}
                  </div>

                  {isLoadingPhotos ? (
                    <div className="h-60 flex flex-col items-center justify-center border border-dashed border-ink/10">
                      <Loader2 size={32} className="animate-spin mb-3 opacity-40" />
                      <p className="text-xs font-mono uppercase tracking-widest opacity-40">LOADING PHOTOS FROM GOOGLE DRIVE...</p>
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center border border-dashed border-ink/10 p-6 text-center space-y-4">
                      <ImageIcon size={32} className="opacity-20 mx-auto" />
                      <div>
                        <p className="text-xs font-mono uppercase tracking-widest opacity-60">NO PHOTOS FOUND IN DRIVE</p>
                        <p className="text-[10px] font-mono opacity-40 mt-1">Upload a photo using the button above to store in Drive and publish to storefront.</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 border border-ink text-xs font-mono uppercase tracking-widest hover:bg-ink hover:text-paper transition-all"
                      >
                        UPLOAD FIRST PHOTO
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto p-1 border border-ink/10 bg-ink/[0.01]">
                      {photos.map((photo) => {
                        const isSelected = selectedPhotos.some(p => p.id === photo.id);
                        const selectIndex = selectedPhotos.findIndex(p => p.id === photo.id);

                        return (
                          <div
                            key={photo.id}
                            onClick={() => handleToggleSelectPhoto(photo)}
                            className={`group relative aspect-square cursor-pointer border transition-all overflow-hidden bg-zinc-100 flex flex-col ${
                              isSelected ? 'border-ink ring-2 ring-ink ring-offset-1' : 'border-ink/10 hover:border-ink/40'
                            }`}
                          >
                            <img
                              src={photo.thumbnailUrl}
                              alt={photo.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              loading="lazy"
                            />

                            {/* Selection badge */}
                            <div className="absolute top-2 right-2 z-10">
                              {isSelected ? (
                                <div className="w-5 h-5 bg-ink text-paper text-[10px] font-mono font-bold flex items-center justify-center shadow-md">
                                  {selectIndex + 1}
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-paper/80 backdrop-blur-sm border border-ink/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Plus size={12} />
                                </div>
                              )}
                            </div>

                            {/* Caption overlay */}
                            <div className="absolute inset-x-0 bottom-0 bg-ink/80 text-paper p-1.5 text-[8px] font-mono truncate backdrop-blur-sm">
                              {photo.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 2: Storefront Publishing Target Configuration */}
                {selectedPhotos.length > 0 && (
                  <div className="border border-ink/10 bg-ink/[0.02] p-5 space-y-5">
                    <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
                      <Sparkles size={16} />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-widest">
                        STOREFRONT PUBLISHING DESTINATION ({selectedPhotos.length} PHOTO{selectedPhotos.length > 1 ? 'S' : ''})
                      </h4>
                    </div>

                    {/* Target Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPublishAction('new_product')}
                        className={`p-3 text-left border transition-all ${
                          publishAction === 'new_product'
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-paper text-ink border-ink/10 hover:border-ink/30'
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider">NEW PRODUCT CARD</p>
                        <p className="text-[8px] font-mono uppercase opacity-60 mt-1">Publish brand new artifact card</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublishAction('attach')}
                        className={`p-3 text-left border transition-all ${
                          publishAction === 'attach'
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-paper text-ink border-ink/10 hover:border-ink/30'
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider">ATTACH TO PRODUCT</p>
                        <p className="text-[8px] font-mono uppercase opacity-60 mt-1">Append to existing product gallery</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublishAction('set_cover')}
                        className={`p-3 text-left border transition-all ${
                          publishAction === 'set_cover'
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-paper text-ink border-ink/10 hover:border-ink/30'
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider">SET COVER PHOTO</p>
                        <p className="text-[8px] font-mono uppercase opacity-60 mt-1">Make primary thumbnail on storefront</p>
                      </button>
                    </div>

                    {/* Conditional Settings */}
                    {publishAction === 'new_product' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1">
                            PRODUCT NAME
                          </label>
                          <input
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            placeholder="e.g. D3 02"
                            className="w-full bg-paper border border-ink/15 p-2.5 text-xs font-mono focus:border-ink/50"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1">
                            PRICE (USD)
                          </label>
                          <input
                            type="number"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(Number(e.target.value))}
                            placeholder="350"
                            className="w-full bg-paper border border-ink/15 p-2.5 text-xs font-mono focus:border-ink/50"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1">
                            DESCRIPTION
                          </label>
                          <textarea
                            rows={2}
                            value={newProductDesc}
                            onChange={(e) => setNewProductDesc(e.target.value)}
                            placeholder="Product details and garment specs..."
                            className="w-full bg-paper border border-ink/15 p-2.5 text-xs font-mono focus:border-ink/50 resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1">
                          SELECT TARGET PRODUCT CARD
                        </label>
                        <select
                          value={selectedTargetProdId}
                          onChange={(e) => setSelectedTargetProdId(e.target.value)}
                          className="w-full bg-paper border border-ink/15 p-2.5 text-xs font-mono focus:border-ink/50 uppercase"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ${p.price} ({p.images?.length || 0} existing photos)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-ink/10 bg-paper flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
            <div className="text-[10px] font-mono uppercase opacity-50 tracking-wider">
              {status === 'publishing' ? (
                <span className="flex items-center gap-2 text-ink">
                  <Loader2 size={12} className="animate-spin" /> {statusMessage}
                </span>
              ) : status === 'success' ? (
                <span className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 size={12} /> {statusMessage}
                </span>
              ) : status === 'error' ? (
                <span className="flex items-center gap-2 text-red-600 font-bold">
                  <AlertCircle size={12} /> {errorMessage}
                </span>
              ) : (
                <span>{selectedPhotos.length} photo(s) queued for storefront publishing</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-6 py-3 border border-ink/10 text-[10px] font-mono uppercase tracking-widest hover:bg-ink/5 transition-all"
              >
                CANCEL
              </button>

              {accessToken && selectedPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={status === 'publishing'}
                  className="flex-1 sm:flex-initial px-8 py-3 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {status === 'publishing' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      PUBLISHING...
                    </>
                  ) : (
                    <>
                      <span>PUBLISH TO STOREFRONT</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
