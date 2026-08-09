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
  GripVertical
} from 'lucide-react';
import { Product, ProductAsset } from '../../types';
import { GoogleGenAI, Type as GenAIType } from "@google/genai";
import { convertGoogleDriveUrl, generateUid } from '../../utils/helpers';
import { storage, ref, getDownloadURL } from '../../firebase';
import { uploadBytesResumable } from 'firebase/storage';

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
      for (const file of Array.from(files)) {
        // Only accept images
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 opacity-40">
                      <Info size={14} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Core Data</span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Product Name</label>
                      <input 
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter Name"
                        className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Stripe Payment Link</label>
                      <input 
                        value={formData.stripe_payment_link || ''}
                        onChange={(e) => setFormData({ ...formData, stripe_payment_link: e.target.value })}
                        placeholder="https://buy.stripe.com/..."
                        className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Quick Photo Link</label>
                        <span className="text-[8px] font-mono opacity-20 uppercase">Adds to assets</span>
                      </div>
                      <input 
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData(prev => ({
                              ...prev,
                              images: [{ url: e.target.value, type: 'image' }, ...(prev.images || [])]
                            }));
                            e.target.value = '';
                          }
                        }}
                        placeholder="Paste image URL..."
                        className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Price (USD)</label>
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                          <input 
                            required
                            type="number"
                            value={formData.price || 0}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            className="w-full bg-ink/5 border border-ink/10 p-4 pl-10 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Stock Units</label>
                        <input 
                          required
                          type="number"
                          value={formData.stock || 0}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                          className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Product Description</label>
                        <button 
                          type="button"
                          onClick={generateAIDescription}
                          disabled={isGeneratingDescription || !formData.name}
                          className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink disabled:opacity-30 flex items-center gap-2"
                        >
                          {isGeneratingDescription ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          AI Generate
                        </button>
                      </div>
                      <textarea 
                        required
                        rows={4}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the product..."
                        className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all uppercase"
                        >
                          <option value="TOPS">TOPS</option>
                          <option value="BOTTOMS">BOTTOMS</option>
                          <option value="ACCESSORIES">ACCESSORIES</option>
                          <option value="ARCHIVE">ARCHIVE</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Button Logic</label>
                        <select 
                          value={formData.button_logic}
                          onChange={(e) => setFormData({ ...formData, button_logic: e.target.value as any })}
                          className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all uppercase"
                        >
                          <option value="add_to_bag">Add to Shopping Bag (Cart)</option>
                          <option value="buy_now">Buy Now (Direct)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 opacity-40">
                        <Globe size={14} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Stripe Metadata (Optional)</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Stripe Buy Button ID</label>
                          <input 
                            value={formData.stripe_buy_button_id || ''}
                            onChange={(e) => setFormData({ ...formData, stripe_buy_button_id: e.target.value })}
                            placeholder="buy_btn_..."
                            className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Stripe Publishable Key</label>
                          <input 
                            value={formData.stripe_publishable_key || ''}
                            onChange={(e) => setFormData({ ...formData, stripe_publishable_key: e.target.value })}
                            placeholder="pk_live_..."
                            className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Stripe Cover Fallback (Provenance Image)</label>
                        </div>
                        <input 
                          value={formData.provenanceImage || ''}
                          onChange={(e) => setFormData({ ...formData, provenanceImage: e.target.value })}
                          placeholder="Paste Google Drive link..."
                          className="w-full bg-ink/5 border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                          onBlur={(e) => {
                            if (e.target.value) {
                              const converted = convertGoogleDriveUrl(e.target.value);
                              setFormData(prev => ({ ...prev, provenanceImage: converted }));
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 opacity-40">
                          <ImageIcon size={14} />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Visual Assets</span>
                        </div>
                        <div className="flex gap-4">
                          <button 
                            type="button"
                            onClick={() => {
                              const url = window.prompt("Enter Google Drive Link:");
                              if (url) {
                                const converted = convertGoogleDriveUrl(url);
                                setFormData(prev => ({
                                  ...prev,
                                  images: [...(prev.images || []), { url: converted, type: 'image' }]
                                }));
                              }
                            }}
                            className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink flex items-center gap-2"
                          >
                            <Link size={12} /> Drive Import
                          </button>
                          <button 
                            type="button"
                            onClick={generateAIImage}
                            disabled={isGeneratingImage || !formData.name}
                            className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink disabled:opacity-30 flex items-center gap-2"
                          >
                            {isGeneratingImage ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI Generate Visual
                          </button>
                          <button 
                            type="button"
                            onClick={handleAddImage}
                            className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink flex items-center gap-2"
                          >
                            <Plus size={12} /> Add Asset
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <input 
                          type="file"
                          multiple
                          accept="image/*"
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
                          className={`border-2 border-dashed p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-pointer group ${isDraggingOver ? 'border-blue-500 bg-blue-500/5' : 'border-ink/10 hover:bg-ink/5'}`}
                        >
                          <div className="flex flex-col items-center gap-6">
                            <div className="flex gap-4">
                              <div 
                                className="w-16 h-16 bg-ink text-paper flex flex-col items-center justify-center group-hover:scale-110 transition-all shadow-xl"
                              >
                                {isUploadingMultiple ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                              </div>
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const url = window.prompt("ENTER_GOOGLE_DRIVE_LINK:");
                                  if (url) {
                                    const converted = convertGoogleDriveUrl(url);
                                    setFormData(prev => ({
                                      ...prev,
                                      images: [...(prev.images || []), { uid: generateUid(), url: converted, type: 'image' }]
                                    }));
                                  }
                                }}
                                className="w-16 h-16 bg-ink/5 border border-ink/10 flex flex-col items-center justify-center group-hover:scale-105 transition-all hover:bg-blue-600 hover:text-white cursor-pointer"
                              >
                                <Link size={20} />
                                <span className="text-[8px] font-mono mt-1">DRIVE</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-mono font-bold uppercase tracking-widest">
                                {isUploadingMultiple ? 'UPLOADING_PROTOCOLS...' : 'ADD_ASSETS_VIA_DRAG_OR_CLICK'}
                              </p>
                              <p className="text-[8px] font-mono uppercase opacity-30 mt-2">Multiple files supported. Local upload & Drive integration active.</p>
                            </div>
                          </div>
                        </div>

                      <Reorder.Group 
                        axis="y" 
                        values={formData.images || []} 
                        onReorder={handleReorder}
                        className="space-y-4"
                      >
                        {formData.images?.map((img, idx) => (
                          <Reorder.Item 
                            key={img.uid || `${img.url}-${idx}`} 
                            value={img}
                            className="p-4 border border-ink/10 bg-ink/5 space-y-4 cursor-default"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <GripVertical size={14} className="text-ink/20 cursor-grab active:cursor-grabbing" />
                                <span className="text-[10px] font-mono font-bold opacity-30">ASSET_0{idx + 1}</span>
                                {idx === 0 ? (
                                  <span className="text-[8px] font-mono bg-ink text-paper px-2 py-0.5 uppercase">COVER_IMAGE</span>
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => handleMakeCover(idx)}
                                    className="text-[8px] font-mono text-ink/40 hover:text-ink uppercase"
                                  >
                                    SET_AS_COVER
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(img.url);
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `artifact_${formData.name || 'unnamed'}_${idx + 1}`;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                      if (setSuccessMessage) setSuccessMessage("DOWNLOAD_STARTED");
                                    } catch (err) {
                                      if (setGlobalError) setGlobalError("DOWNLOAD_FAILED");
                                    }
                                  }}
                                  className="text-ink/40 hover:text-ink transition-colors"
                                  title="Download Image"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(img.url);
                                    if (setSuccessMessage) setSuccessMessage("LINK_COPIED");
                                  }}
                                  className="text-ink/40 hover:text-ink transition-colors"
                                  title="Copy Link"
                                >
                                  <Copy size={14} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2 space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-[8px] font-mono font-bold uppercase opacity-40">SOURCE_URL</label>
                                </div>
                                <input 
                                  value={img.url || ''}
                                  onChange={(e) => handleImageChange(idx, 'url', e.target.value)}
                                  placeholder="URL_OR_DRIVE_LINK"
                                  className="w-full bg-paper border border-ink/10 p-2 text-[10px] font-mono focus:ring-0"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[8px] font-mono font-bold uppercase opacity-40">TYPE</label>
                                <select 
                                  value={img.type}
                                  onChange={(e) => handleImageChange(idx, 'type', e.target.value as any)}
                                  className="w-full bg-paper border border-ink/10 p-2 text-[10px] font-mono focus:ring-0"
                                >
                                  <option value="image">IMAGE</option>
                                  <option value="video">VIDEO</option>
                                  <option value="model3d">3D_MODEL</option>
                                </select>
                              </div>
                            </div>
                            {img.url ? (
                              <div className="aspect-video bg-paper border border-ink/5 overflow-hidden relative">
                                {img.url ? (
                                  <>
                                    {img.type === 'video' ? (
                                      <video src={img.url} className="w-full h-full object-cover" muted />
                                    ) : (
                                      <img src={img.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    )}
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 opacity-40">
                      <Tag size={14} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">ATTRIBUTES</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-ink/10">
                        <div className="flex items-center gap-3">
                          <Eye size={16} className="opacity-40" />
                          <span className="text-[10px] font-mono font-bold uppercase">VISIBLE_IN_VOID</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, is_visible: !formData.is_visible })}
                          className={`w-12 h-6 rounded-full transition-all relative ${formData.is_visible ? 'bg-ink' : 'bg-ink/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-paper transition-all ${formData.is_visible ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-ink/10">
                        <div className="flex items-center gap-3">
                          <Star size={16} className="opacity-40" />
                          <span className="text-[10px] font-mono font-bold uppercase">FEATURED_ARTIFACT</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                          className={`w-12 h-6 rounded-full transition-all relative ${formData.is_featured ? 'bg-ink' : 'bg-ink/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-paper transition-all ${formData.is_featured ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-12 border-t border-ink/5 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                >
                  [ CANCEL_INDUCTION ]
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-12 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                  {initialProduct ? 'UPDATE_ARTIFACT' : 'COMPLETE_INDUCTION'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
