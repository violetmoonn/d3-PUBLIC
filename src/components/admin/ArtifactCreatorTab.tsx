import React from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Upload, Plus, Trash2, Loader2, Sparkles, Image as ImageIcon, 
  DollarSign, Globe, CheckCircle2, Copy, GripVertical, ArrowUp, 
  ArrowDown, ShieldCheck, Link, Eye, Star, Package, RefreshCw, X
} from 'lucide-react';
import { Product, ProductAsset } from '../../types';
import { GoogleGenAI, Type as GenAIType } from "@google/genai";
import { convertGoogleDriveUrl, generateUid } from '../../utils/helpers';
import { storage, ref, getDownloadURL } from '../../firebase';
import { uploadBytesResumable } from 'firebase/storage';
import { StripeBuyButton } from '../StripeBuyButton';

interface ArtifactCreatorTabProps {
  onSave: (product: Partial<Product>) => Promise<boolean | void>;
  adminPassword?: string;
  setGlobalError?: (error: string | null) => void;
  setSuccessMessage?: (message: string | null) => void;
  onNavigateToProducts?: () => void;
}

export const ArtifactCreatorTab: React.FC<ArtifactCreatorTabProps> = ({
  onSave,
  adminPassword,
  setGlobalError,
  setSuccessMessage,
  onNavigateToProducts
}) => {
  const [formData, setFormData] = React.useState<Partial<Product>>({
    name: '',
    price: 0,
    stripe_payment_link: '',
    stripe_buy_button_id: '',
    stripe_publishable_key: '',
    description: '',
    images: [],
    category: 'TOPS',
    stock: 10,
    is_visible: true,
    is_featured: false,
    sizes: ['xs', 's', 'm', 'l', 'xl'],
    button_logic: 'add_to_bag'
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = React.useState(false);
  const [isUploadingMultiple, setIsUploadingMultiple] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [showAdvancedStripe, setShowAdvancedStripe] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Multi-photo upload handler supporting N files
  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingMultiple(true);
    setUploadProgress(10);
    const newAssets: ProductAsset[] = [];

    try {
      // 1. Try server-side fast storage upload (/api/admin/upload)
      const formDataUpload = new FormData();
      let validFilesCount = 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
        formDataUpload.append('image', file);
        validFilesCount++;
      }

      if (validFilesCount > 0) {
        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formDataUpload
          });
          if (res.ok) {
            const results = await res.json();
            const list = Array.isArray(results) ? results : [results];
            list.forEach((r: any) => {
              if (r.url) {
                newAssets.push({
                  uid: generateUid(),
                  url: r.url,
                  type: r.type || 'image'
                });
              }
            });
            setUploadProgress(90);
          }
        } catch (serverErr) {
          console.warn("Local upload fallback:", serverErr);
        }
      }

      // 2. Fallback to Firebase Storage if server didn't process
      if (newAssets.length === 0) {
        let uploadedCount = 0;
        const total = Array.from(files).length;
        for (const file of Array.from(files)) {
          if (!file.type.startsWith('image/')) continue;
          const path = `products/induction/${generateUid()}_${file.name}`;
          const fileRef = ref(storage, path);
          const uploadTask = uploadBytesResumable(fileRef, file);

          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', null, (err) => reject(err), () => resolve(null));
          });

          const downloadURL = await getDownloadURL(fileRef);
          newAssets.push({
            uid: generateUid(),
            url: downloadURL,
            type: 'image'
          });
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / total) * 100));
        }
      }

      if (newAssets.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newAssets]
        }));
        if (setSuccessMessage) {
          setSuccessMessage(`UPLOADED ${newAssets.length} ARTIFACT PHOTOS SUCCESSFULLY`);
        }
      }
    } catch (err) {
      console.error("Multi-upload failed:", err);
      if (setGlobalError) setGlobalError("PHOTO UPLOAD FAILED. PLEASE RETRY.");
    } finally {
      setIsUploadingMultiple(false);
      setUploadProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleAddImageSlot = () => {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), { uid: generateUid(), url: '', type: 'image' }]
    }));
  };

  const handleAddImageUrl = () => {
    const url = window.prompt("Enter Image / Video URL or Google Drive Link:");
    if (url && url.trim()) {
      const converted = convertGoogleDriveUrl(url.trim());
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), { uid: generateUid(), url: converted, type: 'image' }]
      }));
      if (setSuccessMessage) setSuccessMessage("PHOTO ASSET LINK ADDED");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (index: number, field: keyof ProductAsset, value: string) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      newImages[index] = { ...newImages[index], [field]: value };
      if (field === 'url') {
        newImages[index].url = convertGoogleDriveUrl(value);
      }
      return { ...prev, images: newImages };
    });
  };

  const handleMakeCover = (index: number) => {
    setFormData(prev => {
      const images = [...(prev.images || [])];
      if (index >= images.length) return prev;
      const [moved] = images.splice(index, 1);
      return { ...prev, images: [moved, ...images] };
    });
    if (setSuccessMessage) setSuccessMessage("COVER PHOTO SET (POSITION 1)");
  };

  const handleReorder = (newImages: ProductAsset[]) => {
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // AI Description Generator
  const generateAIDescription = async () => {
    if (!formData.name && (!formData.images || formData.images.length === 0)) {
      if (setGlobalError) setGlobalError("PLEASE ENTER A TITLE OR UPLOAD A PHOTO FIRST");
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_FOUND");
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      let contents: any[] = [];
      const coverUrl = formData.images?.[0]?.url;

      if (coverUrl && (coverUrl.startsWith('http') || coverUrl.startsWith('data:'))) {
        try {
          const imgResponse = await fetch(coverUrl);
          const blob = await imgResponse.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const base64Data = base64.split(',')[1];
          contents = [
            {
              parts: [
                { text: `Generate a sleek, minimalist, and luxury product description for this high-concept archival artifact. Style: avant-garde, refined, poetic yet precise. Keep it under 60 words. Title: "${formData.name || 'Archival Piece'}", Price: $${formData.price || 0}.` },
                { inlineData: { mimeType: blob.type, data: base64Data } }
              ]
            }
          ];
        } catch {
          contents = [`Generate a sleek, minimalist, and luxury product description for an archival artifact named "${formData.name}". Style: avant-garde, refined, poetic yet precise. Keep it under 60 words. Price: $${formData.price || 0}.`];
        }
      } else {
        contents = [`Generate a sleek, minimalist, and luxury product description for an archival artifact named "${formData.name}". Style: avant-garde, refined, poetic yet precise. Keep it under 60 words. Price: $${formData.price || 0}.`];
      }

      const response = await ai.models.generateContent({ model, contents });
      if (response.text) {
        setFormData(prev => ({ ...prev, description: response.text.trim() }));
        if (setSuccessMessage) setSuccessMessage("AI DESCRIPTION CRAFTED");
      }
    } catch (err) {
      console.error(err);
      if (setGlobalError) setGlobalError("FAILED TO GENERATE AI DESCRIPTION");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      if (setGlobalError) setGlobalError("PLEASE ENTER AN ARTIFACT TITLE");
      return;
    }
    setIsLoading(true);
    try {
      const success = await onSave(formData);
      if (success !== false) {
        if (setSuccessMessage) setSuccessMessage(`ARTIFACT "${formData.name}" PUBLISHED TO STORE`);
        // Reset form for next artifact induction
        setFormData({
          name: '',
          price: 0,
          stripe_payment_link: '',
          stripe_buy_button_id: '',
          stripe_publishable_key: '',
          description: '',
          images: [],
          category: 'TOPS',
          stock: 10,
          is_visible: true,
          is_featured: false,
          sizes: ['xs', 's', 'm', 'l', 'xl'],
          button_logic: 'add_to_bag'
        });
        if (onNavigateToProducts) onNavigateToProducts();
      }
    } catch (err) {
      console.error(err);
      if (setGlobalError) setGlobalError("FAILED TO SAVE ARTIFACT");
    } finally {
      setIsLoading(false);
    }
  };

  const photoCount = formData.images?.length || 0;

  return (
    <div className="space-y-8 font-mono max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-black text-white p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white text-black font-black text-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-white">
              NEW ARTIFACT INDUCTION
            </h2>
            <p className="text-[11px] text-white/60 uppercase tracking-widest mt-0.5">
              Fill in blanks top-to-bottom: Title → Price & Stripe Link → Description → Upload N Photos
            </p>
          </div>
        </div>

        {onNavigateToProducts && (
          <button
            type="button"
            onClick={onNavigateToProducts}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 transition-all self-start md:self-auto cursor-pointer"
          >
            ← View Catalog ({photoCount} Photos Ready)
          </button>
        )}
      </div>

      {/* Main Vertical Form */}
      <form onSubmit={handleSubmit} className="bg-paper border border-ink/15 p-6 sm:p-10 space-y-10 shadow-xl">
        
        {/* ========================================================================= */}
        {/* 1. TITLE BLANK (TOP) */}
        {/* ========================================================================= */}
        <div className="space-y-3 border-b border-ink/10 pb-8">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">1</span>
              ARTIFACT TITLE / ITEM NAME *
            </label>
            <span className="text-[9px] opacity-40 uppercase tracking-wider">Required blank</span>
          </div>
          <input
            required
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. D3-001 SUBLIMATION ARCHIVAL HOODIE"
            className="w-full bg-ink/5 border border-ink/20 p-4 text-[13px] font-mono focus:outline-none focus:border-ink transition-all uppercase placeholder:normal-case placeholder:text-ink/30"
          />
        </div>

        {/* ========================================================================= */}
        {/* 2. PRICE & STRIPE LINK BLANKS */}
        {/* ========================================================================= */}
        <div className="space-y-6 border-b border-ink/10 pb-8">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">2</span>
              PRICE ($ USD) & STRIPE PAYMENT LINK
            </label>
            <span className="text-[9px] opacity-40 uppercase tracking-wider">Direct Checkout Integration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Blank */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Item Price ($ USD) *
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 font-bold" />
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price ?? 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full bg-ink/5 border border-ink/20 p-4 pl-10 text-[13px] font-mono focus:outline-none focus:border-ink transition-all font-bold"
                />
              </div>
            </div>

            {/* Stripe Payment Link Blank */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center justify-between">
                <span>Stripe Payment Link URL</span>
                <span className="text-[8px] opacity-50">buy.stripe.com/...</span>
              </label>
              <div className="relative">
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="url"
                  value={formData.stripe_payment_link || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, stripe_payment_link: e.target.value }))}
                  placeholder="https://buy.stripe.com/..."
                  className="w-full bg-ink/5 border border-ink/20 p-4 pl-10 text-[12px] font-mono focus:outline-none focus:border-ink transition-all placeholder:text-ink/30"
                />
              </div>
            </div>
          </div>

          {/* Advanced Stripe Buy Button Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedStripe(!showAdvancedStripe)}
              className="text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink flex items-center gap-1.5 cursor-pointer underline"
            >
              <span>{showAdvancedStripe ? '[-] Hide Stripe Buy Button Settings' : '[+] Advanced: Stripe Buy Button ID & Publishable Key'}</span>
            </button>

            {showAdvancedStripe && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-5 bg-ink/5 border border-ink/15 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Stripe Buy Button ID</label>
                    <input
                      type="text"
                      value={formData.stripe_buy_button_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stripe_buy_button_id: e.target.value }))}
                      placeholder="buy_btn_1Qt..."
                      className="w-full bg-paper border border-ink/15 p-2.5 text-[11px] font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-60">Stripe Publishable Key</label>
                    <input
                      type="text"
                      value={formData.stripe_publishable_key || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                      placeholder="pk_live_51P..."
                      className="w-full bg-paper border border-ink/15 p-2.5 text-[11px] font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {formData.stripe_buy_button_id && formData.stripe_publishable_key && (
                  <div className="pt-3 border-t border-ink/10 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Live Stripe Button Preview:</span>
                    <StripeBuyButton
                      buyButtonId={formData.stripe_buy_button_id}
                      publishableKey={formData.stripe_publishable_key}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DESCRIPTION BLANK */}
        {/* ========================================================================= */}
        <div className="space-y-3 border-b border-ink/10 pb-8">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">3</span>
              ARTIFACT DESCRIPTION *
            </label>
            <button
              type="button"
              onClick={generateAIDescription}
              disabled={isGeneratingDescription}
              className="text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-1.5 bg-ink/5 hover:bg-ink hover:text-paper px-3 py-1.5 border border-ink/15 transition-all cursor-pointer disabled:opacity-40"
              title="Generate poetic / archival description using Gemini AI"
            >
              {isGeneratingDescription ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              <span>AI Auto-Craft Description</span>
            </button>
          </div>
          <textarea
            required
            rows={5}
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the artifact: material composition, craftsmanship, archival edition notes, silhouette & fit..."
            className="w-full bg-ink/5 border border-ink/20 p-4 text-[12px] font-mono focus:outline-none focus:border-ink transition-all resize-y placeholder:text-ink/30 leading-relaxed"
          />
        </div>

        {/* ========================================================================= */}
        {/* 4. UPLOAD N PHOTOS (MULTI-PHOTO ASSETS) */}
        {/* ========================================================================= */}
        <div className="space-y-6 border-b border-ink/10 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">4</span>
              UPLOAD N PHOTOS OF ARTIFACT ({photoCount} UPLOADED)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="text-[10px] font-bold uppercase tracking-widest text-ink/70 hover:text-ink flex items-center gap-1 bg-ink/5 px-2.5 py-1.5 border border-ink/15 transition-colors cursor-pointer"
              >
                <Link size={12} /> Add Direct URL
              </button>
              <button
                type="button"
                onClick={handleAddImageSlot}
                className="text-[10px] font-bold uppercase tracking-widest text-paper bg-ink flex items-center gap-1 px-3 py-1.5 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus size={12} /> Add Empty Slot
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone for N Photos */}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files) handleMultipleFilesUpload(e.target.files);
            }}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-pointer group ${
              isDraggingOver 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-ink/20 hover:border-ink hover:bg-ink/5'
            }`}
          >
            <div className="w-14 h-14 bg-ink text-paper flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              {isUploadingMultiple ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-bold uppercase tracking-widest text-ink">
                {isUploadingMultiple ? 'UPLOADING PHOTOS TO PERMANENT STORAGE...' : 'CLICK OR DRAG & DROP N PHOTOS HERE'}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-ink/50">
                Supports unlimited photos (PNG, JPG, WEBP, MP4). Sequence: Photo 1 = Front Cover, Photo 2 = Back Hover, Photo 3+ = Garment Details.
              </p>
            </div>

            {uploadProgress !== null && (
              <div className="w-full max-w-xs bg-ink/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-ink h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Reorderable List of All N Photos */}
          {photoCount > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider opacity-60 pb-1">
                <span>Sequence & Layout of Artifact Photos:</span>
                <span>Drag handle or use buttons to reorder</span>
              </div>

              <Reorder.Group
                axis="y"
                values={formData.images || []}
                onReorder={handleReorder}
                className="space-y-3"
              >
                {formData.images?.map((img, idx) => {
                  const isFrontCover = idx === 0;
                  const isBackHover = idx === 1;

                  return (
                    <Reorder.Item
                      key={img.uid || `${img.url}-${idx}`}
                      value={img}
                      className="p-4 border border-ink/15 bg-ink/5 space-y-3 cursor-default"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <GripVertical size={16} className="text-ink/30 cursor-grab active:cursor-grabbing hover:text-ink" />
                          <span className="text-[11px] font-bold opacity-60 font-mono">#{idx + 1}</span>
                          
                          {isFrontCover && (
                            <span className="text-[9px] font-bold bg-ink text-paper px-2.5 py-0.5 uppercase tracking-wider">
                              1. FRONT COVER (PRIMARY)
                            </span>
                          )}
                          {isBackHover && (
                            <span className="text-[9px] font-bold bg-blue-600 text-white px-2.5 py-0.5 uppercase tracking-wider">
                              2. BACK VIEW (HOVER)
                            </span>
                          )}
                          {!isFrontCover && !isBackHover && (
                            <span className="text-[9px] font-bold bg-ink/15 text-ink px-2 py-0.5 uppercase tracking-wider">
                              {idx + 1}. DETAIL PHOTO
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isFrontCover && (
                            <button
                              type="button"
                              onClick={() => handleMakeCover(idx)}
                              className="text-[9px] font-bold uppercase tracking-wider bg-paper border border-ink/20 hover:bg-ink hover:text-paper px-2.5 py-1 transition-colors cursor-pointer"
                              title="Promote this photo to Front Cover"
                            >
                              Make Cover
                            </button>
                          )}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(formData.images || [])];
                                const temp = list[idx - 1];
                                list[idx - 1] = list[idx];
                                list[idx] = temp;
                                setFormData(prev => ({ ...prev, images: list }));
                              }}
                              className="p-1.5 text-ink/50 hover:text-ink bg-paper border border-ink/20 transition-colors cursor-pointer"
                              title="Move photo up"
                            >
                              <ArrowUp size={13} />
                            </button>
                          )}
                          {idx < (formData.images?.length || 0) - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(formData.images || [])];
                                const temp = list[idx + 1];
                                list[idx + 1] = list[idx];
                                list[idx] = temp;
                                setFormData(prev => ({ ...prev, images: list }));
                              }}
                              className="p-1.5 text-ink/50 hover:text-ink bg-paper border border-ink/20 transition-colors cursor-pointer"
                              title="Move photo down"
                            >
                              <ArrowDown size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (img.url) {
                                navigator.clipboard.writeText(img.url);
                                if (setSuccessMessage) setSuccessMessage("PHOTO URL COPIED");
                              }
                            }}
                            className="p-1.5 text-ink/50 hover:text-ink bg-paper border border-ink/20 transition-colors cursor-pointer"
                            title="Copy photo URL"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 bg-paper border border-red-200 transition-colors cursor-pointer"
                            title="Delete this photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Photo Asset URL and Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[8.5px] font-bold uppercase opacity-50 tracking-wider">Asset URL / Path</label>
                          <input
                            type="text"
                            value={img.url || ''}
                            onChange={(e) => handleImageChange(idx, 'url', e.target.value)}
                            placeholder="https://... or /uploads/..."
                            className="w-full bg-paper border border-ink/15 p-2 text-[11px] font-mono focus:outline-none focus:border-ink"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8.5px] font-bold uppercase opacity-50 tracking-wider">Asset Type</label>
                          <select
                            value={img.type || 'image'}
                            onChange={(e) => handleImageChange(idx, 'type', e.target.value as any)}
                            className="w-full bg-paper border border-ink/15 p-2 text-[11px] font-mono focus:outline-none uppercase"
                          >
                            <option value="image">IMAGE</option>
                            <option value="video">VIDEO</option>
                            <option value="model3d">3D MODEL</option>
                          </select>
                        </div>
                      </div>

                      {/* Live Thumbnail Preview */}
                      {img.url ? (
                        <div className="h-36 bg-paper border border-ink/10 overflow-hidden relative flex items-center justify-center p-2">
                          {img.type === 'video' ? (
                            <video src={img.url} className="w-full h-full object-contain" muted controls />
                          ) : (
                            <img
                              src={img.url}
                              alt={`Artifact Asset ${idx + 1}`}
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-16 bg-paper/50 border border-dashed border-ink/10 flex items-center justify-center text-[10px] uppercase text-ink/30">
                          Empty Asset Slot - Paste URL or Upload Photo
                        </div>
                      )}
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. INVENTORY & ATTRIBUTES (BOTTOM CONTROLS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              Artifact Category
            </label>
            <select
              value={formData.category || 'TOPS'}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-ink/5 border border-ink/20 p-3.5 text-[12px] font-mono focus:outline-none uppercase"
            >
              <option value="TOPS">TOPS</option>
              <option value="BOTTOMS">BOTTOMS</option>
              <option value="ACCESSORIES">ACCESSORIES</option>
              <option value="ARCHIVE">ARCHIVE</option>
            </select>
          </div>

          {/* Stock Units */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              Inventory Units (Stock)
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock ?? 10}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
              className="w-full bg-ink/5 border border-ink/20 p-3.5 text-[12px] font-mono focus:outline-none font-bold"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              Storefront Status
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_visible: !prev.is_visible }))}
              className={`w-full p-3.5 text-[12px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                formData.is_visible
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : 'bg-neutral-500/10 border-neutral-300 text-neutral-600'
              }`}
            >
              <Eye size={14} />
              <span>{formData.is_visible ? 'PUBLISHED (LIVE)' : 'DRAFT (HIDDEN)'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBMIT ACTION BUTTON */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-wider opacity-50">
            Publishing updates the catalog in real-time across storefront & checkout.
          </p>

          <button
            type="submit"
            disabled={isLoading || isUploadingMultiple}
            className="w-full sm:w-auto px-10 py-4 bg-black text-white hover:bg-neutral-800 text-[12px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-2xl disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>PUBLISHING ARTIFACT...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>COMPLETE ARTIFACT INDUCTION</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
