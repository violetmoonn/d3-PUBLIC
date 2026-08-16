import React from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  X, Plus, Trash2, Loader2, Sparkles, Image as ImageIcon, Video, Box, 
  ExternalLink, Globe, DollarSign, Tag, Info, Package, ShieldCheck, 
  Copy, Check, Search, Trash, Eye, EyeOff, Star, StarOff, RefreshCw, 
  Upload, Download, FileText, LayoutGrid, Grid2X2, Square, MonitorPlay, 
  ChevronLeft, ChevronRight, MessageSquare, Send, User, Bot, ShoppingBag, 
  ArrowRight, CheckCircle2, XCircle, MapPin, Calendar, CreditCard, Shield, 
  LogIn, Lock, Instagram, Facebook, Twitter, Github, Mail, Phone, Settings, 
  Activity, Database, Terminal, FileCode, History, MessageCircle, Megaphone, 
  Ticket, Layers, Zap, Globe2, Palette, Type as TypeIcon, Link, Share2,
  GripVertical, ArrowUp, ArrowDown, UserCheck
} from 'lucide-react';
import { Product, ProductAsset } from '../../types';
import { GoogleGenAI, Type as GenAIType } from "@google/genai";
import { convertGoogleDriveUrl, generateUid } from '../../utils/helpers';
import { storage, ref, getDownloadURL } from '../../firebase';
import { uploadBytesResumable } from 'firebase/storage';
import { StripeBuyButton } from '../StripeBuyButton';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  initialProduct?: Partial<Product> | null;
  adminPassword?: string;
  setGlobalError?: (error: string | null) => void;
  setSuccessMessage?: (message: string | null) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialProduct, 
  adminPassword,
  setGlobalError,
  setSuccessMessage
}) => {
  const [formData, setFormData] = React.useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    images: [],
    category: 'TOPS',
    stock: 0,
    is_visible: true,
    is_featured: false,
    sizes: ['xs', 's', 'm', 'l', 'xl'],
    stripe_payment_link: '',
    stripe_buy_button_id: '',
    stripe_publishable_key: '',
    external_payment_link: '',
    button_logic: 'add_to_bag'
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = React.useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  const [isSyncingStripe, setIsSyncingStripe] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [isUploadingMultiple, setIsUploadingMultiple] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    if (!files.length) return;
    setIsUploadingMultiple(true);
    const newAssets: ProductAsset[] = [];
    
    try {
      // First attempt fast local server upload (/api/admin/upload)
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
          }
        } catch (serverErr) {
          console.warn("Local upload fallback to cloud storage:", serverErr);
        }
      }

      // If server upload didn't yield assets, fallback to Firebase Storage
      if (newAssets.length === 0) {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith('image/')) continue;
          
          const path = `products/${formData.id || 'unsorted'}/${generateUid()}_${file.name}`;
          const fileRef = ref(storage, path);
          const uploadTask = uploadBytesResumable(fileRef, file);
          
          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
              null, 
              (error) => reject(error), 
              () => resolve(null)
            );
          });
          
          const downloadURL = await getDownloadURL(fileRef);
          newAssets.push({
            uid: generateUid(),
            url: downloadURL,
            type: 'image'
          });
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newAssets]
      }));
      
      if (setSuccessMessage) setSuccessMessage(`SUCCESSFULLY_UPLOADED_${newAssets.length}_IMAGES`);
    } catch (err) {
      console.error("Upload failed:", err);
      if (setGlobalError) setGlobalError("UPLOAD_FAILED: CHECK_PERMISSIONS_OR_FILE_SIZE");
    } finally {
      setIsUploadingMultiple(false);
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

  const handleProvenanceUpload = async (file: File) => {
    try {
      const path = `products/${formData.id || 'unsorted'}/provenance_${generateUid()}_${file.name}`;
      const fileRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, (error) => reject(error), () => resolve(null));
      });
      
      const downloadURL = await getDownloadURL(fileRef);
      setFormData(prev => ({ ...prev, provenanceImage: downloadURL }));
      if (setSuccessMessage) setSuccessMessage("PROVENANCE_IMAGE_UPLOADED");
    } catch (err) {
      console.error(err);
      if (setGlobalError) setGlobalError("PROVENANCE_UPLOAD_FAILED");
    }
  };

  const syncWithStripe = async () => {
    if (isSyncingStripe) return;
    setIsSyncingStripe(true);
    try {
      const response = await fetch('/api/admin/stripe-data', {
        headers: { 'x-admin-password': adminPassword || '' }
      });
      if (!response.ok) throw new Error("STRIPE_FETCH_FAILED");
      const stripeProducts = await response.json();
      
      if (stripeProducts.length === 0) {
        if (setGlobalError) setGlobalError("NO_STRIPE_PRODUCTS_FOUND");
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_FOUND");
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const imageUrl = formData.images?.[0]?.url;
      if (!imageUrl) {
        if (setGlobalError) setGlobalError("PLEASE_ADD_IMAGE_FIRST");
        return;
      }

      const prompt = `
        I have an image of a product and a list of Stripe products with their names and descriptions.
        Please identify which Stripe product best matches the image.
        
        Current Product Name: ${formData.name}
        
        Stripe Products:
        ${stripeProducts.map((p: any, i: number) => `${i}: ${p.name} - ${p.description}`).join('\n')}
        
        Return ONLY the index of the matching product as a number. If no match is found, return -1.
      `;

      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const base64Data = base64.split(',')[1];

      const result = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: blob.type, data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.OBJECT,
            properties: {
              matchIndex: { type: GenAIType.INTEGER }
            }
          }
        }
      });

      const json = JSON.parse(result.text);
      if (json.matchIndex >= 0 && json.matchIndex < stripeProducts.length) {
        const matched = stripeProducts[json.matchIndex];
        setFormData(prev => ({
          ...prev,
          name: prev.name || matched.name,
          description: prev.description || matched.description,
          price: prev.price || matched.price,
          stripe_payment_link: matched.payment_link,
          stripe_buy_button_id: matched.buy_button_id
        }));
        if (setSuccessMessage) setSuccessMessage(`MATCHED_WITH: ${matched.name}`);
      } else {
        if (setGlobalError) setGlobalError("NO_MATCH_FOUND_IN_STRIPE");
      }
    } catch (err) {
      console.error(err);
      if (setGlobalError) setGlobalError("STRIPE_SYNC_FAILED");
    } finally {
      setIsSyncingStripe(false);
    }
  };

  React.useEffect(() => {
    if (initialProduct) {
      const normalizedImages = (initialProduct.images || []).map(img => ({
        ...img,
        uid: img.uid || generateUid()
      }));
      setFormData({
        ...initialProduct,
        images: normalizedImages
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        images: [],
        category: 'TOPS',
        stock: 0,
        is_visible: true,
        is_featured: false,
        sizes: ['xs', 's', 'm', 'l', 'xl'],
        stripe_payment_link: '',
        stripe_buy_button_id: '',
        stripe_publishable_key: '',
        external_payment_link: '',
        button_logic: 'add_to_bag'
      });
    }
  }, [initialProduct, isOpen]);

  const handleAddImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), { uid: generateUid(), url: '', type: 'image' }]
    }));
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
        // If this is the first image being added, or if it's the first slot, 
        // it's naturally the cover, but we ensure it's at index 0 if it's the first one.
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
    if (setSuccessMessage) setSuccessMessage("COVER_IMAGE_UPDATED");
  };

  const handleReorder = (newImages: ProductAsset[]) => {
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const generateAIDescription = async () => {
    if ((!formData.name && !formData.images?.[0]?.url) || isGeneratingDescription) return;
    setIsGeneratingDescription(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_FOUND");
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      let contents: any[] = [];
      const imageUrl = formData.images?.[0]?.url;
      
      if (imageUrl) {
        const imgResponse = await fetch(imageUrl);
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
              { text: `Generate a minimalist, professional, and mysterious product description for this artifact. Use terminology like "sublimation", "void", "artifact", "inference". Keep it under 50 words. Current Name: ${formData.name || 'Unknown'}` },
              { inlineData: { mimeType: blob.type, data: base64Data } }
            ]
          }
        ];
      } else {
        contents = [`Generate a minimalist, professional, and mysterious product description for an artifact named "${formData.name}". Use terminology like "sublimation", "void", "artifact", "inference". Keep it under 50 words.`];
      }

      const response = await ai.models.generateContent({
        model,
        contents,
      });
      setFormData(prev => ({ ...prev, description: response.text || '' }));
      if (setSuccessMessage) setSuccessMessage("DESCRIPTION_SUBLIMATED");
    } catch (err) {
      console.error(err);
      if (setGlobalError) setGlobalError("DESCRIPTION_GENERATION_FAILED");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const generateAIImage = async () => {
    if (!formData.name || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_FOUND");
      const ai = new GoogleGenAI({ apiKey });
      
      // Use gemini-2.5-flash-image for image generation
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A high-end, professional product photograph of a minimalist artifact named "${formData.name}". The style should be avant-garde, dark, and mysterious, with dramatic lighting and a clean background. Terminology: "void", "sublimation", "artifact".`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newImage = { uid: generateUid(), url: imageUrl, type: 'image' as const };
        setFormData(prev => ({
          ...prev,
          images: [newImage, ...(prev.images || [])]
        }));
        if (setSuccessMessage) setSuccessMessage("VISUAL_INFERENCE_GENERATED");
      }
    } catch (err) {
      console.error(err);
      if (setGlobalError) setGlobalError("IMAGE_GENERATION_FAILED");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-paper/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-paper border border-ink/5 w-full max-w-5xl h-[90vh] overflow-hidden relative shadow-2xl flex flex-col"
          >
            <div className="p-6 sm:p-8 border-b border-ink/5 flex justify-between items-center bg-paper sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-display tracking-tighter uppercase">{initialProduct ? 'Edit Product' : 'New Product Induction'}</h2>
                  <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">System: Product Management</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-ink hover:text-paper transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar">
              {/* 1. ARTIFACT TITLE / NAME */}
              <div className="space-y-2.5 border-b border-ink/10 pb-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-ink flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">1</span>
                    ARTIFACT TITLE / ITEM NAME *
                  </label>
                  <span className="text-[8px] font-mono opacity-40 uppercase">Required Blank</span>
                </div>
                <input 
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. D3-001 SUBLIMATION ARCHIVAL HOODIE"
                  className="w-full bg-ink/5 border border-ink/15 p-3.5 text-[12px] font-mono focus:ring-0 focus:border-ink/40 transition-all uppercase placeholder:normal-case placeholder:text-ink/30"
                />
              </div>

              {/* 2. PRICE & STRIPE PAYMENT LINK */}
              <div className="space-y-4 border-b border-ink/10 pb-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-ink flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">2</span>
                    PRICE ($ USD) & STRIPE PAYMENT LINK
                  </label>
                  <button
                    type="button"
                    onClick={syncWithStripe}
                    disabled={isSyncingStripe}
                    className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink/70 hover:text-ink flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSyncingStripe ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    Sync Stripe Catalog
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-60">Price ($ USD) *</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 font-bold" />
                      <input 
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price ?? 0}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-ink/5 border border-ink/15 p-3 pl-9 text-[12px] font-mono focus:ring-0 focus:border-ink/40 transition-all font-bold"
                      />
                    </div>
                  </div>

                  {/* Stripe Payment Link */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-60 flex items-center justify-between">
                      <span>Stripe Payment Link URL</span>
                      <span className="text-[8px] opacity-40">buy.stripe.com/...</span>
                    </label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                      <input 
                        value={formData.stripe_payment_link || ''}
                        onChange={(e) => setFormData({ ...formData, stripe_payment_link: e.target.value })}
                        placeholder="https://buy.stripe.com/..."
                        className="w-full bg-ink/5 border border-ink/15 p-3 pl-9 text-[11px] font-mono focus:ring-0 focus:border-ink/40 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Stripe Buy Button Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono font-bold uppercase tracking-widest opacity-40">Stripe Buy Button ID (Optional)</label>
                    <input 
                      value={formData.stripe_buy_button_id || ''}
                      onChange={(e) => setFormData({ ...formData, stripe_buy_button_id: e.target.value })}
                      placeholder="buy_btn_1Qt..."
                      className="w-full bg-paper border border-ink/10 p-2 text-[10px] font-mono focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono font-bold uppercase tracking-widest opacity-40">Stripe Publishable Key (Optional)</label>
                    <input 
                      value={formData.stripe_publishable_key || ''}
                      onChange={(e) => setFormData({ ...formData, stripe_publishable_key: e.target.value })}
                      placeholder="pk_live_51P..."
                      className="w-full bg-paper border border-ink/10 p-2 text-[10px] font-mono focus:ring-0"
                    />
                  </div>
                </div>

                {/* Live Stripe Buy Button Preview */}
                {formData.stripe_buy_button_id && formData.stripe_publishable_key && (
                  <div className="p-3 border border-blue-500/20 bg-blue-500/5 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <ShieldCheck size={12} /> Live Stripe Buy Button Active Preview
                    </span>
                    <StripeBuyButton
                      buyButtonId={formData.stripe_buy_button_id}
                      publishableKey={formData.stripe_publishable_key}
                    />
                  </div>
                )}
              </div>

              {/* 3. ARTIFACT DESCRIPTION */}
              <div className="space-y-2.5 border-b border-ink/10 pb-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-ink flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">3</span>
                    ARTIFACT DESCRIPTION *
                  </label>
                  <button 
                    type="button"
                    onClick={generateAIDescription}
                    disabled={isGeneratingDescription || (!formData.name && (!formData.images || formData.images.length === 0))}
                    className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink flex items-center gap-1.5 bg-ink/5 hover:bg-ink hover:text-paper px-2.5 py-1 border border-ink/10 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    {isGeneratingDescription ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    AI Generate Description
                  </button>
                </div>
                <textarea 
                  required
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the artifact: material composition, craftsmanship, archival edition notes, silhouette & fit..."
                  className="w-full bg-ink/5 border border-ink/15 p-3 text-[11px] font-mono focus:ring-0 focus:border-ink/40 transition-all resize-y placeholder:text-ink/30 leading-relaxed"
                />
              </div>

              {/* 4. UPLOAD N PHOTOS (MULTI-PHOTO ASSETS) */}
              <div className="space-y-4 border-b border-ink/10 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-ink flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center font-bold">4</span>
                    UPLOAD N PHOTOS ({(formData.images || []).length} ASSETS READY)
                  </label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const url = window.prompt("Enter Image or Google Drive Link:");
                        if (url && url.trim()) {
                          const converted = convertGoogleDriveUrl(url.trim());
                          setFormData(prev => ({
                            ...prev,
                            images: [...(prev.images || []), { uid: generateUid(), url: converted, type: 'image' }]
                          }));
                          if (setSuccessMessage) setSuccessMessage("PHOTO ASSET ADDED");
                        }
                      }}
                      className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink flex items-center gap-1 border border-ink/10 px-2 py-1 hover:bg-ink/5 bg-paper cursor-pointer"
                    >
                      <Link size={11} /> Add Direct Link
                    </button>
                    <button 
                      type="button"
                      onClick={handleAddImage}
                      className="text-[9px] font-mono font-bold uppercase tracking-widest text-paper bg-ink flex items-center gap-1 px-2.5 py-1 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Plus size={11} /> Add Slot
                    </button>
                  </div>
                </div>

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
                  className={`border-2 border-dashed p-8 flex flex-col items-center justify-center text-center space-y-3 transition-all cursor-pointer group ${
                    isDraggingOver ? 'border-blue-500 bg-blue-500/10' : 'border-ink/15 hover:border-ink hover:bg-ink/5'
                  }`}
                >
                  <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center group-hover:scale-105 transition-all shadow-md">
                    {isUploadingMultiple ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest">
                      {isUploadingMultiple ? 'UPLOADING ASSETS TO STORAGE...' : 'CLICK OR DRAG & DROP N PHOTOS / VIDEOS HERE'}
                    </p>
                    <p className="text-[8px] font-mono uppercase opacity-40 mt-0.5">
                      Uploads unlimited files. Sequence: #1 = Front Cover, #2 = Back Hover, #3+ = Details.
                    </p>
                  </div>
                </div>

                {/* Photo List */}
                {(formData.images || []).length > 0 && (
                  <Reorder.Group 
                    axis="y" 
                    values={formData.images || []} 
                    onReorder={handleReorder}
                    className="space-y-3 pt-2"
                  >
                    {formData.images?.map((img, idx) => {
                      const isFrontCover = idx === 0;
                      const isBackHover = idx === 1;
                      const isGarment = idx >= 2;

                      return (
                        <Reorder.Item 
                          key={img.uid || `${img.url}-${idx}`} 
                          value={img}
                          className="p-3.5 border border-ink/10 bg-ink/5 space-y-2.5 cursor-default"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <GripVertical size={14} className="text-ink/30 cursor-grab active:cursor-grabbing hover:text-ink" />
                              <span className="text-[10px] font-mono font-bold opacity-40">#{idx + 1}</span>
                              {isFrontCover && (
                                <span className="text-[8px] font-mono font-bold bg-ink text-paper px-2 py-0.5 uppercase tracking-wider">
                                  1. FRONT COVER (PRIMARY)
                                </span>
                              )}
                              {isBackHover && (
                                <span className="text-[8px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 uppercase tracking-wider">
                                  2. BACK VIEW (HOVER)
                                </span>
                              )}
                              {isGarment && (
                                <span className="text-[8px] font-mono font-bold bg-ink/20 text-ink px-2 py-0.5 uppercase tracking-wider">
                                  {idx + 1}. DETAIL PHOTO
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {!isFrontCover && (
                                <button 
                                  type="button"
                                  onClick={() => handleMakeCover(idx)}
                                  className="text-[8px] font-mono font-bold bg-paper hover:bg-ink hover:text-paper px-2 py-0.5 border border-ink/10 uppercase transition-colors cursor-pointer"
                                  title="Set as Front Cover"
                                >
                                  Make Cover
                                </button>
                              )}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImgs = [...(formData.images || [])];
                                    const temp = newImgs[idx - 1];
                                    newImgs[idx - 1] = newImgs[idx];
                                    newImgs[idx - 1] = temp;
                                    setFormData(prev => ({ ...prev, images: newImgs }));
                                  }}
                                  className="p-1 text-ink/40 hover:text-ink transition-colors border border-ink/10 bg-paper cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp size={11} />
                                </button>
                              )}
                              {idx < (formData.images?.length || 0) - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImgs = [...(formData.images || [])];
                                    const temp = newImgs[idx + 1];
                                    newImgs[idx + 1] = newImgs[idx];
                                    newImgs[idx] = temp;
                                    setFormData(prev => ({ ...prev, images: newImgs }));
                                  }}
                                  className="p-1 text-ink/40 hover:text-ink transition-colors border border-ink/10 bg-paper cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown size={11} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (img.url) {
                                    navigator.clipboard.writeText(img.url);
                                    if (setSuccessMessage) setSuccessMessage("LINK_COPIED");
                                  }
                                }}
                                className="p-1 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                                title="Copy Link"
                              >
                                <Copy size={11} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-3 space-y-0.5">
                              <label className="text-[8px] font-mono font-bold uppercase opacity-40">Asset URL / Path</label>
                              <input 
                                value={img.url || ''}
                                onChange={(e) => handleImageChange(idx, 'url', e.target.value)}
                                placeholder="https://... or /uploads/..."
                                className="w-full bg-paper border border-ink/10 p-2 text-[10px] font-mono focus:ring-0"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-mono font-bold uppercase opacity-40">Type</label>
                              <select 
                                value={img.type}
                                onChange={(e) => handleImageChange(idx, 'type', e.target.value as any)}
                                className="w-full bg-paper border border-ink/10 p-2 text-[10px] font-mono focus:ring-0 uppercase"
                              >
                                <option value="image">IMAGE</option>
                                <option value="video">VIDEO</option>
                                <option value="model3d">3D MODEL</option>
                              </select>
                            </div>
                          </div>

                          {img.url ? (
                            <div className="h-28 bg-paper border border-ink/5 overflow-hidden relative flex items-center justify-center p-2">
                              {img.type === 'video' ? (
                                <video src={img.url} className="w-full h-full object-contain" muted controls />
                              ) : (
                                <img src={img.url} alt={`Asset ${idx + 1}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              )}
                            </div>
                          ) : null}
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                )}
              </div>

              {/* 5. INVENTORY & STORE ATTRIBUTES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-60">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-ink/5 border border-ink/15 p-2.5 text-[11px] font-mono focus:ring-0 uppercase"
                  >
                    <option value="TOPS">TOPS</option>
                    <option value="BOTTOMS">BOTTOMS</option>
                    <option value="ACCESSORIES">ACCESSORIES</option>
                    <option value="ARCHIVE">ARCHIVE</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-60">Stock Units</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    value={formData.stock ?? 10}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-ink/5 border border-ink/15 p-2.5 text-[11px] font-mono focus:ring-0 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-60">Visibility Status</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, is_visible: !formData.is_visible })}
                    className={`w-full p-2.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.is_visible 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' 
                        : 'bg-neutral-500/10 border-neutral-300 text-neutral-600'
                    }`}
                  >
                    <Eye size={12} />
                    <span>{formData.is_visible ? 'LIVE IN STORE' : 'DRAFT (HIDDEN)'}</span>
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-6 border-t border-ink/10 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all cursor-pointer"
                >
                  [ CANCEL ]
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3.5 bg-ink text-paper text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={13} /> : <ShieldCheck size={13} />}
                  {initialProduct ? 'UPDATE ARTIFACT' : 'PUBLISH ARTIFACT'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
