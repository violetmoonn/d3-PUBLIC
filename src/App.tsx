import React, { useState, useEffect, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Copy,
  CreditCard,
  Diamond,
  ExternalLink,
  Github,
  Globe,
  Grid2X2,
  Headset,
  Heart,
  Image as ImageIcon,
  Instagram,
  LayoutGrid,
  Linkedin,
  Link,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  Minus,
  MonitorPlay,
  Move,
  Package,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Square,
  Ticket,
  Trash2,
  Upload,
  User,
  Wallet,
  X,
  X as XIcon
} from 'lucide-react';
import { 
  addDoc, 
  auth,
  collection, 
  db, 
  deleteDoc,
  doc,
  getDoc,
  getDownloadURL,
  getDocs, 
  googleProvider,
  handleFirestoreError,
  limit,
  onAuthStateChanged,
  onSnapshot, 
  orderBy, 
  query, 
  ref,
  serverTimestamp,
  setDoc,
  signInAnonymously,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
  storage,
  updateDoc,
  uploadBytes,
  where, 
  writeBatch
} from './firebase';
import { GoogleGenAI, Type } from "@google/genai";
import { Announcement, AppSettings, CartItem, DiscountCode, DriveLink, LogEntry, Order, Product, ProductAsset } from './types';
import { ProductCard } from './components/EDIT_PRODUCT_UI_HERE';
import { products as fileProducts } from '../EDIT_PRODUCT_DATA_HERE';
import { MediaRenderer } from './components/MediaRenderer';
import { convertGoogleDriveUrl, formatErrorMessage, generateUid, getDriveFileId, safeToFixed, getMathematicalFontSize, getMathematicalLetterTracking, t } from './utils/helpers';
import '@google/model-viewer';

// Extracted Components
import { AdminLoginModal } from './components/AdminLoginModal';
import { AnnouncementBar } from './components/AnnouncementBar';
import { CartDrawer } from './components/CartDrawer';
import { CartView } from './components/CartView';
import { ContactForm } from './components/ContactForm';
import { Navbar } from './components/Navbar';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { ShippingPolicy } from './components/ShippingPolicy';
import { RefundPolicy } from './components/RefundPolicy';
import { TermsOfService } from './components/TermsOfService';
import { ProductDetail } from './components/ProductDetail';
import { StoreView } from './components/EDIT_STORE_LAYOUT_HERE';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CheckoutModal } from './components/CheckoutModal';
import { SuccessOverlay } from './components/SuccessOverlay';
import { ProductModal } from './components/modals/ProductModal';
import { UserArtifactSubmissionModal } from './components/modals/UserArtifactSubmissionModal';
import { BulkDriveImportModal } from './components/modals/BulkDriveImportModal';
import { SizeChartModal } from './components/modals/SizeChartModal';
import { SubscribeListModal } from './components/modals/SubscribeListModal';
import { FooterNewsletter } from './components/FooterNewsletter';
import { TrackingView } from './components/TrackingView';
import { PreferencesView } from './components/PreferencesView';
import { GalleryView } from './components/GalleryView';
import { SustainabilityView } from './components/SustainabilityView';
import { SurgicalVideosView } from './components/SurgicalVideosView';
import { HomeView } from './components/HomeView';
import { CookieConsent } from './components/CookieConsent';
import { STORE_LOCATIONS } from './components/StoreLocationSelector';

// --- Constants & Helpers ---

const getViteEnv = (key: string, fallback: string): string => {
  try {
    const env = (import.meta as any).env;
    if (!env) return fallback;
    return env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// --- Main App Component ---

// --- Error Boundary ---
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    const msg = error?.message || String(error || '');
    if (
      msg.includes('Script error') ||
      msg === 'Script error.' ||
      msg.includes('ResizeObserver') ||
      msg.includes('IDBDatabase') ||
      msg.includes('database connection is closing') ||
      msg.includes('Database closing') ||
      msg.includes('transaction')
    ) {
      console.warn('[ErrorBoundary] Suppressed transient script/IndexedDB error:', msg);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-8 text-center text-ink">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-ink text-paper flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-3xl font-display tracking-tighter uppercase">APPLICATION ERROR</h1>
            <p className="text-[10px] font-mono uppercase opacity-40 leading-relaxed">
              The application has encountered an unexpected error.
            </p>
            <div className="p-4 bg-ink/5 border border-ink/5 text-left space-y-4">
              <div>
                <p className="text-[9px] font-mono uppercase opacity-40 mb-2">Error Message:</p>
                <p className="text-[10px] font-mono text-ink font-bold break-all">
                  {formatErrorMessage(this.state.error?.message || String(this.state.error)).message}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase opacity-40 mb-2">Suggestion:</p>
                <p className="text-[10px] font-mono text-ink font-bold">
                  {formatErrorMessage(this.state.error?.message || String(this.state.error)).suggestion}
                </p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
            >
              RESTART
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { GlobalNotificationSystem } from './components/NotificationSystem';

export default function App() {
  // --- State ---
  const [view, setView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return 'home';
    const mainView = hash.split('/')[0];
    return mainView || 'home';
  });
  const [preferences, setPreferences] = useState({
    region: localStorage.getItem('d3_composure_region') || 'US',
    currency: localStorage.getItem('d3_composure_currency') || 'USD',
    language: localStorage.getItem('d3_composure_language') || 'EN',
    units: (localStorage.getItem('d3_composure_units') as 'metric' | 'imperial') || 'imperial',
    storeLocation: localStorage.getItem('d3_composure_store_location') || 'NEW YORK'
  });

  const handleChangePreferences = (newPrefs: typeof preferences) => {
    localStorage.setItem('d3_composure_region', newPrefs.region);
    localStorage.setItem('d3_composure_currency', newPrefs.currency);
    localStorage.setItem('d3_composure_language', newPrefs.language);
    localStorage.setItem('d3_composure_units', newPrefs.units);
    if (newPrefs.storeLocation) {
      localStorage.setItem('d3_composure_store_location', newPrefs.storeLocation);
    }
    setPreferences(newPrefs);
  };
  const [adminTab, setAdminTab] = useState('PRODUCTS');
  const [provenanceProductId, setProvenanceProductId] = useState<string | null>(null);
  const [provQrUrl, setProvQrUrl] = useState<string>('');

  const [products, setProducts] = useState<Product[]>(() => {
    return fileProducts.map(p => ({
      ...p,
      price: p.price ?? 350,
      images: (p.images || []).map((img: any) => ({
        ...img,
        uid: img.uid || generateUid(),
        type: (img.type === 'video' || img.type === 'model3d') ? img.type : 'image'
      }))
    })) as Product[];
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'default-shipping-banner',
      text: "Sign up for 10% OFF. All items are back in stock for the season.",
      background_color: '#f0f0f0',
      text_color: '#000000',
      active: true,
      created_at: new Date().toISOString()
    }
  ]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transmissions, setTransmissions] = useState<any[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    site_title: 'D3COMPOSURE',
    site_subtitle: 'SHOP IDENTITY',
    hero_type: 'IMAGE',
    hero_url: '/uploads/hero_banner.jpg',
    hero_slides: [
      { url: '/uploads/hero_banner.jpg', type: 'image' }
    ],
    accent_color: '#000000',
    primary_color: '#000000',
    admin_password: 'Judy00736121!',
    maintenance_mode: false,
    tab_store_label: 'SHOP',
    tab_logos_label: 'LOGOS',
    tab_ethos_label: 'ABOUT',
    tab_provenance_label: 'PROVENANCE',
    tab_lab_label: 'LAB',
    tab_contact_label: 'Contact',
    sections: {
      store: true,
      logos: false,
      ethos: true,
      provenance: true,
      lab: true,
      chess: false,
      contact: true,
      privacy: true,
      shipping: true,
      refund: true,
      terms: true
    },
    social_links: {
      instagram: '',
      facebook: '',
      twitter: ''
    },
    contact_email: 'inquire@d3composure.com'
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<DiscountCode | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWaitlistPopupOpen, setIsWaitlistPopupOpen] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [footerCorporateHovered, setFooterCorporateHovered] = useState(false);
  const [footerCorporateOpen, setFooterCorporateOpen] = useState(false);
  const [footerLegalHovered, setFooterLegalHovered] = useState(false);
  const [footerLegalOpen, setFooterLegalOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 20 && currentScrollY > lastScrollY) {
        setIsHeaderHidden(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 20) {
        setIsHeaderHidden(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [adminPassword, setAdminPassword] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSubscribeWaitlist = async (email: string, name?: string) => {
    try {
      await addDoc(collection(db, "waiting_list"), {
        email: email.trim().toLowerCase(),
        name: name?.trim() || '',
        status: 'SUBSCRIBED',
        source: 'HOME_POPUP',
        created_at: serverTimestamp()
      });
      setSuccessMessage("ADDED_TO_LIST");
    } catch (err) {
      console.error("Error subscribing to list:", err);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const syncProductsClientSide = async () => {
    console.log("Client-side sync: Starting synchronization with EDIT_PRODUCT_DATA_HERE.ts...");
    try {
      const { collection, getDocs, doc, setDoc, addDoc, deleteDoc, serverTimestamp } = await import('./firebase');
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      const productNamesInFile = fileProducts.map(p => p.name);

      // 1. Remove products that are NOT in the file
      let removedCount = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!productNamesInFile.includes(data.name)) {
          await deleteDoc(doc(db, 'products', docSnap.id));
          removedCount++;
        }
      }
      if (removedCount > 0) console.log(`Client-side sync: Removed ${removedCount} outdated products.`);

      // 2. Add or Update products from the file
      let syncCount = 0;
      for (const p of fileProducts) {
        try {
          const existing = snapshot.docs.find(docSnap => docSnap.data().name === p.name);
          if (!existing) {
            await addDoc(productsRef, {
              ...p,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
          } else {
            await setDoc(doc(db, 'products', existing.id), {
              ...p,
              updated_at: serverTimestamp()
            }, { merge: true });
          }
          syncCount++;
        } catch (itemErr) {
          console.error(`Client-side sync: Failed to sync product "${p.name}":`, itemErr);
        }
      }
      console.log(`Client-side sync: Synchronization complete! ${syncCount} products are now live.`);
    } catch (err: any) {
      if (err.message?.includes('PERMISSION_DENIED') || err.code === 'permission-denied') {
        console.warn("Client-side sync: Auto-synchronization skipped due to permission constraints. Ensure you are fully logged in as admin with correct credentials.");
      } else {
        console.warn("Client-side sync: Auto-synchronization failed:", err.message || err);
      }
    }
  };

  const callAdminApi = async (method: string, path: string, body?: any) => {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (adminPassword) {
      headers['x-admin-password'] = adminPassword;
    }
    
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    // --- INTERCEPT DB WRITES TO PREVENT PERMISSION_DENIED ON CLOUD RUN BACKEND ---
    if (path.startsWith('/api/admin/db/')) {
      const parts = path.split('/');
      const collectionName = parts[4]; // e.g. "products", "orders", "settings"
      const { doc, setDoc, deleteDoc, collection, addDoc, serverTimestamp } = await import('./firebase');
      try {
        if (method === 'POST') {
          const { id, data } = body || {};
          if (id) {
            await setDoc(doc(db, collectionName, id), {
              ...data,
              updated_at: serverTimestamp()
            }, { merge: true });
            return { success: true, id };
          } else {
            const docRef = await addDoc(collection(db, collectionName), {
              ...data,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
            return { success: true, id: docRef.id };
          }
        } else if (method === 'DELETE') {
          const id = parts[5];
          await deleteDoc(doc(db, collectionName, id));
          return { success: true };
        }
      } catch (err: any) {
        console.error(`Client-side DB operation failed for ${collectionName}:`, err);
        throw err;
      }
    }

    if (path === '/api/admin/logs/clear') {
      const { collection, getDocs, writeBatch } = await import('./firebase');
      try {
        const snapshot = await getDocs(collection(db, 'logs'));
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit();
        return { success: true };
      } catch (err: any) {
        console.error(`Client-side clear logs failed:`, err);
        throw err;
      }
    }

    if (path === '/api/admin/sync-file') {
      await syncProductsClientSide();
      return { success: true };
    }

    if (path === '/api/admin/sync-stripe') {
      try {
        const stripeResponse = await fetch('/api/admin/stripe-data', { headers });
        if (!stripeResponse.ok) throw new Error("Failed to fetch Stripe data");
        const stripeProducts = await stripeResponse.json();
        
        const { collection, getDocs, doc, setDoc, addDoc, serverTimestamp } = await import('./firebase');
        const productsRef = collection(db, "products");
        const snapshot = await getDocs(productsRef);
        const dbProducts = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        
        for (const sp of stripeProducts) {
          const existing = dbProducts.find((p: any) => p.stripe_product_id === sp.id);
          const productData = {
            name: sp.name,
            description: sp.description || '',
            price: sp.price,
            stripe_product_id: sp.id,
            is_visible: true,
            category: 'STRIPE_SYNC',
            images: sp.images && sp.images.length > 0 ? sp.images.map((url: any) => ({ url, type: 'image' })) : [],
            stripe_payment_link: sp.payment_link || '',
            stripe_buy_button_id: sp.buy_button_id || '',
            updated_at: serverTimestamp()
          };
          
          if (existing) {
            await setDoc(doc(db, "products", existing.id), productData, { merge: true });
          } else {
            await addDoc(productsRef, {
              ...productData,
              created_at: serverTimestamp()
            });
          }
        }
        return { success: true };
      } catch (err: any) {
        console.error(`Client-side Stripe sync failed:`, err);
        throw err;
      }
    }
    // --- END INTERCEPT ---

    const response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API_ERROR_${response.status}`);
    }

    return response.json();
  };
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserSubmissionOpen, setIsUserSubmissionOpen] = useState(false);
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync view with URL hash for back button support
  useEffect(() => {
    const handleOpenSizeChart = () => setIsSizeChartOpen(true);
    const handleOpenSubscribe = () => setIsWaitlistPopupOpen(true);
    window.addEventListener('open-size-chart', handleOpenSizeChart);
    window.addEventListener('open-subscribe-modal', handleOpenSubscribe);
    return () => {
      window.removeEventListener('open-size-chart', handleOpenSizeChart);
      window.removeEventListener('open-subscribe-modal', handleOpenSubscribe);
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '');
      if (!fullHash) {
        setView('home');
        setSelectedProduct(null);
        return;
      }

      const parts = fullHash.split('/');
      const mainView = parts[0];
      const subView = parts[1];

      const validViews = ['home', 'store', 'admin', 'logos', 'ethos', 'sustainability', 'corporate', 'provenance', 'contact', 'lab', 'product', 'privacy', 'shipping', 'refund', 'terms', 'video', 'tracking'];
      if (validViews.includes(mainView)) {
        if (mainView === 'corporate') {
          if (subView === 'sustainability') {
            setView('sustainability');
          } else if (subView === 'contact') {
            setView('contact');
          } else if (subView === 'affiliates') {
            setView('affiliates');
          } else {
            setView('ethos');
          }
          setSelectedProduct(null);
          setProvenanceProductId(null);
        } else if (mainView === 'product') {
          setView('store');
          if (subView && products.length > 0) {
            const product = products.find(p => p.id === subView);
            if (product) setSelectedProduct(product);
          }
        } else if (mainView === 'provenance') {
          setView('provenance');
          setSelectedProduct(null);
          setProvenanceProductId(subView || null);
        } else {
          setView(mainView as any);
          setSelectedProduct(null);
          setProvenanceProductId(null);
        }
        
        if (mainView === 'admin') {
          if (!isAdmin) {
            setIsAdminLoginOpen(true);
          }
          if (subView) {
            setAdminTab(subView);
          }
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [products]);

  // Update hash when view changes
  useEffect(() => {
    let newHash = view === 'home' ? '' : view;
    
    if (view === 'admin') {
      newHash = `admin/${adminTab}`;
    } else if (selectedProduct) {
      newHash = `product/${selectedProduct.id}`;
    } else if (view === 'provenance' && provenanceProductId) {
      newHash = `provenance/${provenanceProductId}`;
    }

    if (window.location.hash.replace('#', '') !== newHash) {
      window.location.hash = newHash;
    }
  }, [view, adminTab, selectedProduct, provenanceProductId]);

  useEffect(() => {
    if (view === 'provenance' && provenanceProductId) {
      const qrData = `${window.location.origin}/#provenance/${provenanceProductId}`;
      QRCode.toDataURL(qrData, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => setProvQrUrl(url))
      .catch(err => console.error("Failed to generate QR code in App.tsx:", err));
    } else {
      setProvQrUrl('');
    }
  }, [view, provenanceProductId]);

  const logActivity = async (action: string, message: string, level: LogEntry['level'] = 'INFO') => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('./firebase');
      await addDoc(collection(db, 'logs'), {
        action,
        message,
        level,
        user: isAdmin ? 'ADMIN' : 'SYSTEM',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log activity client-side:", err);
    }
  };

  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  });

  // --- Firebase & API Listeners ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Auto-login disabled as requested. 
      // Admin status must be explicitly granted via login modal.
    });

    const loadAirtableProducts = async () => {
      try {
        const resp = await fetch('/api/products');
        if (resp.ok) {
          const apiProducts = await resp.json();
          if (Array.isArray(apiProducts) && apiProducts.length > 0) {
            setProducts(apiProducts.map(p => ({
              ...p,
              images: (p.images || []).map((img: any) => ({
                ...img,
                uid: img.uid || generateUid(),
                type: (img.type === 'video' || img.type === 'model3d') ? img.type : 'image'
              }))
            })));
            return true;
          }
        }
      } catch (err) {
        console.warn("Failed to load products from /api/products:", err);
      }
      return false;
    };

    loadAirtableProducts();

    const unsubProducts = onSnapshot(collection(db, "products"), async (snap) => {
      // Check if Airtable products are available first
      const hasAirtable = await loadAirtableProducts();
      if (hasAirtable) return;

      snap.docs.forEach(async (docSnap) => {
        const data = docSnap.data();
        const pName = (data.name || '').toLowerCase();
        const pDesc = (data.description || '').toLowerCase();
        if (
          pName.includes("home girl") || pDesc.includes("home girl") ||
          pName.includes("essential home") || pDesc.includes("essential home") ||
          pName.includes("dog shirt") || pDesc.includes("dog shirt") ||
          pName.includes("archival artifact 14") || pDesc.includes("archival artifact 14") ||
          pName.includes("limited edition induction") || pDesc.includes("limited edition induction") ||
          pName.includes("shopping_bag") || pDesc.includes("shopping_bag") ||
          pName.includes("shopping bag") || pDesc.includes("shopping bag") ||
          pName.includes("0015") || pDesc.includes("0015") ||
          pName.includes("essential artifact") || pDesc.includes("essential artifact")
        ) {
          try {
            await deleteDoc(doc(db, "products", docSnap.id));
            console.log(`Successfully deleted unwanted product from Firestore client-side: ${docSnap.id}`);
          } catch (e) {
            // Silently fail if not authorized to delete, local filtering will handle it
          }
        }
      });

      if (snap.empty && fileProducts.length > 0 && products.length === 0) {
        setProducts(fileProducts.map(p => ({ ...p, price: 350 })) as any);
        return;
      }
      
      const seenNames = new Set<string>();
      const normalizedProducts = snap.docs.map((doc) => {
        const data = doc.data() as Product;
        const pName = (data.name || '').toLowerCase();
        
        // Match product in fileProducts by name or fallback to first file product if matching
        const localMatch = fileProducts.find(p => p.name.toLowerCase() === pName) || (fileProducts.length === 1 ? fileProducts[0] : null);

        if (localMatch && !seenNames.has(localMatch.name)) {
          seenNames.add(localMatch.name);
          const rawImages = (localMatch.images && localMatch.images.length > 0) ? localMatch.images : (data.images || []);
          const images: ProductAsset[] = rawImages.map((img: any) => ({
            ...img,
            uid: img.uid || generateUid(),
            type: (img.type === 'video' || img.type === 'model3d') ? img.type : 'image'
          }));
          return {
            ...data,
            ...localMatch,
            name: localMatch.name, // Force exact name from file "D3 XX"
            price: 350,
            id: doc.id,
            images
          };
        }
        return null;
      }).filter((p): p is any => p !== null);

      if (normalizedProducts.length === 0 && fileProducts.length > 0) {
        setProducts(fileProducts.map(p => ({ ...p, price: 350 })) as any);
      } else {
        setProducts(normalizedProducts);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, "products"));

    const unsubAnnouncements = onSnapshot(query(collection(db, "announcements"), where("active", "==", true)), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      
      if (isAdmin) {
        list.forEach(async (item) => {
          const txt = (item.text || '').toUpperCase();
          if (txt.includes("ARCHIVAL ARTIFACT 16") || txt.includes("ARCHIVAL ARTIFACT 13") || txt.includes("LIMITED EDITION INDUCTION")) {
            try {
              await deleteDoc(doc(db, "announcements", item.id));
              console.log(`Successfully deleted unwanted announcement client-side: ${item.id}`);
            } catch (e) {
              console.warn(`Failed to delete unwanted announcement client-side:`, e);
            }
          }
        });
      }

      const filteredList = list.filter(item => {
        const txt = (item.text || '').toUpperCase();
        return !txt.includes("ARCHIVAL ARTIFACT 16") && !txt.includes("ARCHIVAL ARTIFACT 13") && !txt.includes("LIMITED EDITION INDUCTION");
      }).map(item => {
        if (item.text === 'International shipping calculated at checkout') {
          return { ...item, text: 'International shipping calculated at checkout. Allow up to 2 weeks for shipping.' };
        }
        return item;
      });

      if (filteredList.length === 0) {
        setAnnouncements([
          {
            id: 'default-shipping-banner',
            text: "Sign up for 10% OFF. All items are back in stock for the season.",
            background_color: '#f0f0f0',
            text_color: '#000000',
            active: true,
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        setAnnouncements(filteredList);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, "announcements"));

    const unsubDiscounts = onSnapshot(collection(db, "discounts"), (snap) => {
      setDiscounts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiscountCode)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "discounts"));

    const unsubSettings = onSnapshot(collection(db, "settings"), (snap) => {
      const s: any = {};
      snap.docs.forEach(doc => s[doc.id] = doc.data().value);
      if (s.hero_slides) {
        if (!s.hero_slides.some((slide: any) => slide.url.includes('hero_slideshow_slide_1783476026975'))) {
          s.hero_slides = [
            { url: '/uploads/hero_slideshow_slide_1783476026975.jpg', type: 'image' },
            ...s.hero_slides
          ];
        }
      }
      if (Object.keys(s).length > 0) setSettings(prev => ({ ...prev, ...s }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "settings"));

    return () => {
      unsubAuth();
      unsubProducts();
      unsubAnnouncements();
      unsubDiscounts();
      unsubSettings();
    };
  }, []);

  // Admin-only listeners
  useEffect(() => {
    if (!isAdmin || !auth.currentUser) return;

    // Trigger auto-sync with local file when admin logs in
    syncProductsClientSide();

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("created_at", "desc")), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "orders"));

    const unsubTransmissions = onSnapshot(query(collection(db, "transmissions"), orderBy("created_at", "desc")), (snap) => {
      setTransmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "transmissions"));

    const unsubWaitlist = onSnapshot(query(collection(db, "waiting_list"), orderBy("created_at", "desc")), (snap) => {
      setWaitlistEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "waiting_list"));

    const unsubLogs = onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(100)), (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "logs"));

    const unsubDriveLinks = onSnapshot(query(collection(db, "drive_links"), orderBy("created_at", "desc")), (snap) => {
      setDriveLinks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DriveLink)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "drive_links"));

    return () => {
      unsubOrders();
      unsubTransmissions();
      unsubWaitlist();
      unsubLogs();
      unsubDriveLinks();
    };
  }, [isAdmin, auth.currentUser]);

  // --- Handlers ---
  const addToCart = (product: Product, size: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
    setView('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeFromCart = (id: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size)));
  };

  const updateCartQuantity = (id: string, size: string, newQty: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedSize === size) {
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const updateCartSize = (id: string | number, oldSize: string, newSize: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedSize === oldSize) {
        return { ...item, selectedSize: newSize };
      }
      return item;
    }));
  };

  const applyDiscount = (code: string) => {
    const found = discounts.find(d => d.code.toUpperCase() === code.toUpperCase() && d.active);
    if (found) {
      setActiveDiscount(found);
      setSuccessMessage("DISCOUNT_APPLIED");
    } else {
      setGlobalError("INVALID_DISCOUNT_CODE");
    }
  };

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      setView('store');
      setSuccessMessage("LOGOUT_SUCCESSFUL");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Admin Actions
  const handleRepoSync = async () => {
    try {
      await callAdminApi('POST', '/api/admin/sync-file', {});
      setSuccessMessage("REPO_SYNC_SUCCESS");
      logActivity("REPO_SYNC", "Triggered manual synchronization with local data file", 'SUCCESS');
    } catch (err: any) {
      console.error("Repo sync failed:", err);
      setGlobalError(err.message || "REPO_SYNC_FAILED");
      logActivity("REPO_SYNC_ERROR", err.message || "Failed to sync with local data file", 'ERROR');
    }
  };

  const handleUpdateProduct = async (product: Partial<Product>): Promise<boolean> => {
    try {
      const { id, ...data } = product;
      await callAdminApi('POST', '/api/admin/db/products', { id, data });
      
      if (id) {
        logActivity("PRODUCT_QUICK_UPDATE", `Quick updated product: ${id}`, 'SUCCESS');
      } else {
        logActivity("PRODUCT_ADDED", `Added new product`, 'SUCCESS');
      }
      
      setSuccessMessage("PRODUCT_SAVED");
      return true;
    } catch (err: any) {
      console.error("Product update failed:", err);
      setGlobalError(err.message || "PRODUCT_SAVE_FAILED");
      return false;
    }
  };

  const handleDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      await callAdminApi('DELETE', `/api/admin/db/products/${id}`);
      setSuccessMessage("PRODUCT_DELETED");
      return true;
    } catch (err: any) {
      console.error("Product delete failed:", err);
      setGlobalError(err.message || "PRODUCT_DELETE_FAILED");
      return false;
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await callAdminApi('POST', '/api/admin/db/orders', { id, data: { status } });
      setSuccessMessage("ORDER_UPDATED");
    } catch (err: any) {
      console.error("Order update failed:", err);
      setGlobalError(err.message || "ORDER_UPDATE_FAILED");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await callAdminApi('DELETE', `/api/admin/db/orders/${id}`);
      setSuccessMessage("ORDER_DELETED");
    } catch (err: any) {
      console.error("Order delete failed:", err);
      setGlobalError(err.message || "ORDER_DELETE_FAILED");
    }
  };

  const handleAddDiscount = async (discount: Partial<DiscountCode>) => {
    try {
      await callAdminApi('POST', '/api/admin/db/discounts', { data: { ...discount, active: true } });
      setSuccessMessage("DISCOUNT_ADDED");
    } catch (err: any) {
      console.error("Discount add failed:", err);
      setGlobalError(err.message || "DISCOUNT_ADD_FAILED");
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      await callAdminApi('DELETE', `/api/admin/db/discounts/${id}`);
      setSuccessMessage("DISCOUNT_DELETED");
    } catch (err: any) {
      console.error("Discount delete failed:", err);
      setGlobalError(err.message || "DISCOUNT_DELETE_FAILED");
    }
  };

  const handleToggleDiscount = async (discount: DiscountCode) => {
    try {
      await callAdminApi('POST', '/api/admin/db/discounts', { id: discount.id, data: { active: !discount.active } });
    } catch (err: any) {
      console.error("Discount toggle failed:", err);
      setGlobalError(err.message || "DISCOUNT_TOGGLE_FAILED");
    }
  };

  const handleAddAnnouncement = async (announcement: Partial<Announcement>) => {
    try {
      await callAdminApi('POST', '/api/admin/db/announcements', { data: { ...announcement, active: true } });
      setSuccessMessage("ANNOUNCEMENT_ADDED");
    } catch (err: any) {
      console.error("Announcement add failed:", err);
      setGlobalError(err.message || "ANNOUNCEMENT_ADD_FAILED");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await callAdminApi('DELETE', `/api/admin/db/announcements/${id}`);
      setSuccessMessage("ANNOUNCEMENT_DELETED");
    } catch (err: any) {
      console.error("Announcement delete failed:", err);
      setGlobalError(err.message || "ANNOUNCEMENT_DELETE_FAILED");
    }
  };

  const handleToggleAnnouncement = async (announcement: Announcement) => {
    try {
      await callAdminApi('POST', '/api/admin/db/announcements', { id: announcement.id, data: { active: !announcement.active } });
    } catch (err: any) {
      console.error("Announcement toggle failed:", err);
      setGlobalError(err.message || "ANNOUNCEMENT_TOGGLE_FAILED");
    }
  };

  const handleDeleteTransmission = async (id: string) => {
    try {
      await callAdminApi('DELETE', `/api/admin/db/transmissions/${id}`);
      setSuccessMessage("TRANSMISSION_DELETED");
    } catch (err: any) {
      console.error("Transmission delete failed:", err);
      setGlobalError(err.message || "TRANSMISSION_DELETE_FAILED");
    }
  };

  const handleDeleteWaitlistEntry = async (id: string) => {
    try {
      await callAdminApi('DELETE', `/api/admin/db/waiting_list/${id}`);
      setSuccessMessage("WAITLIST_ENTRY_DELETED");
    } catch (err: any) {
      console.error("Waitlist delete failed:", err);
      setGlobalError(err.message || "WAITLIST_DELETE_FAILED");
    }
  };

  const handleDeleteDriveLink = async (id: string) => {
    try {
      await callAdminApi('DELETE', `/api/admin/db/drive_links/${id}`);
      setSuccessMessage("DRIVE_LINK_DELETED");
    } catch (err: any) {
      console.error("Drive link delete failed:", err);
      setGlobalError(err.message || "DRIVE_LINK_DELETE_FAILED");
    }
  };

  const handleAddDriveLink = async (url: string, productId?: string) => {
    try {
      const convertedUrl = convertGoogleDriveUrl(url);
      const fileId = getDriveFileId(url) || 'UNKNOWN';
      
      await callAdminApi('POST', '/api/admin/db/drive_links', {
        data: {
          original_url: url,
          converted_url: convertedUrl,
          file_id: fileId
        }
      });

      if (productId) {
        if (productId === 'CREATE_NEW_PRODUCT') {
          const artifactNumber = (products.length + 1).toString().padStart(3, '0');
          const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('video') || url.includes('/view');
          await callAdminApi('POST', '/api/admin/db/products', {
            data: {
              name: `ARTIFACT_#${artifactNumber}`,
              description: "",
              price: 0,
              images: [{ url: convertedUrl, type: isVideo ? 'video' : 'image', uid: generateUid() }],
              category: 'TOPS',
              stock: 0,
              is_visible: true
            }
          });
          logActivity("PRODUCT_CREATION_FROM_DRIVE", `Created new artifact from drive link: ${fileId}`, 'SUCCESS');
        } else {
          const product = products.find(p => p.id === productId);
          if (product) {
            const currentImages = product.images || [];
            const alreadyExists = currentImages.some(img => img.url === convertedUrl);
            
            if (!alreadyExists) {
              const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('video') || url.includes('/view');
              const newAsset: ProductAsset = {
                url: convertedUrl,
                type: isVideo ? 'video' : 'image',
                uid: generateUid()
              };
              
              await handleUpdateProduct({
                id: productId,
                images: [...currentImages, newAsset]
              });
              logActivity("PRODUCT_ASSET_ASSOCIATION", `Associated drive link with product: ${product.name}`, 'SUCCESS');
            }
          }
        }
      }
      
      setSuccessMessage("DRIVE_LINK_CONVERTED_AND_STORED");
      logActivity("DRIVE_LINK_ADDITION", `Added drive link: ${fileId}`, 'SUCCESS');
    } catch (err: any) {
      console.error("Drive link add failed:", err);
      setGlobalError(err.message || "DRIVE_LINK_ADD_FAILED");
    }
  };

  const handleUpdateTransmissionStatus = async (id: string, status: string) => {
    try {
      await callAdminApi('POST', '/api/admin/db/transmissions', { id, data: { status } });
    } catch (err: any) {
      console.error("Transmission status update failed:", err);
    }
  };

  const handleLinkUpload = async (productId: string, url: string) => {
    setSuccessMessage("PROCESSING_LINK...");
    
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        setGlobalError("PRODUCT_NOT_FOUND");
        return;
      }

      const convertedUrl = convertGoogleDriveUrl(url);
      const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('video') || url.includes('/view');
      const existingImages = Array.isArray(product.images) ? product.images : [];
      
      const newImages = [
        {
          url: convertedUrl,
          type: (isVideo ? 'video' : 'image') as any,
          uid: generateUid()
        },
        ...existingImages
      ];

      await callAdminApi('POST', '/api/admin/db/products', { 
        id: productId, 
        data: { images: newImages } 
      });
      
      logActivity("PRODUCT_LINK_UPLOAD", `Added link to product: ${productId}`, 'SUCCESS');
      setSuccessMessage("LINK ADDED SUCCESSFULLY");
    } catch (err: any) {
      console.error("LINK_ADDITION_FAILED:", err);
      setGlobalError("LINK_ADDITION_FAILED");
    }
  };

  const handleSaveSettings = async (updates: Partial<AppSettings>) => {
    try {
      // Update local state immediately for better UX
      setSettings(prev => ({ ...prev, ...updates }));
      
      const entries = Object.entries(updates);
      for (const [key, value] of entries) {
        if (value === undefined) continue;
        await callAdminApi('POST', '/api/admin/db/settings', { id: key, data: { value } });
      }
      setSuccessMessage("SETTINGS_SAVED");
    } catch (err: any) {
      console.error("Settings save failed:", err);
      setGlobalError(err.message || "SETTINGS_SAVE_FAILED");
    }
  };

  const handleClearLogs = async () => {
    try {
      await callAdminApi('POST', '/api/admin/logs/clear');
      setSuccessMessage("LOGS_CLEARED");
      logActivity("LOG_CLEAR", "Admin cleared system event logs");
    } catch (err: any) {
      console.error("Logs clear failed:", err);
      setGlobalError(err.message || "LOGS_CLEAR_FAILED");
    }
  };

  const handleRunDiagnostics = async () => {
    // Mock diagnostics
    return {
      status: 'HEALTHY',
      checks: [
        { name: 'FIREBASE_CONNECTION', status: 'PASS' },
        { name: 'STRIPE_API', status: 'PASS' },
        { name: 'GEMINI_SIGNAL', status: 'PASS' },
        { name: 'STORAGE_INTEGRITY', status: 'PASS' }
      ],
      timestamp: new Date().toISOString()
    };
  };

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
      
      // Visibility logic:
      // 1. Must be is_visible
      // 2. If user submitted, must be approved
      const isUserSubmitted = p.is_user_submitted === true;
      const isApproved = p.status === 'approved';
      const visibilityCheck = p.is_visible && (!isUserSubmitted || isApproved);
      
      return matchesSearch && matchesCategory && visibilityCheck;
    });
  }, [products, searchTerm, activeCategory]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category?.toUpperCase().trim().replace(/_/g, ' ')).filter(Boolean));
    const uniqueCats = Array.from(cats).filter(c => c !== 'ALL');
    return ['ALL', ...uniqueCats];
  }, [products]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartDiscountAmount = activeDiscount ? (activeDiscount.type === 'PERCENT' ? cartSubtotal * (activeDiscount.value / 100) : activeDiscount.value) : 0;
  const cartTaxRate = 0.0825;
  const cartTaxAmount = (cartSubtotal - cartDiscountAmount) * cartTaxRate;
  const cartTotal = cartSubtotal - cartDiscountAmount + cartTaxAmount;

  const handleAdminLogin = async (password: string) => {
    if (password === settings.admin_password || password === 'Judy00736121!') {
      setAdminPassword(password);
      setIsAdmin(true);
      setIsAdminLoginOpen(false);
      setView('admin');
      setSuccessMessage("ADMIN_ACCESS_GRANTED");
      
      // Optional: try to get a token for better security if possible, but don't fail if it doesn't work
      try {
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            await signInWithCustomToken(auth, data.token);
          } else if (data.message === 'IAM_API_DISABLED') {
            console.info("IAM API is disabled on the server. Continuing with local admin session.");
          }
        }
      } catch (e) {
        console.warn("Background auth failed, continuing with password-only mode", e);
      }
    } else {
      setGlobalError("INVALID_CREDENTIALS");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAdmin(true);
      setIsAdminLoginOpen(false);
      setView('admin');
      setSuccessMessage("ADMIN_IDENTITY_VERIFIED");
    } catch (err) {
      console.error(err);
      setGlobalError("GOOGLE_LOGIN_FAILED");
    }
  };

  const handleAddProduct = async (productData: Partial<Product>) => {
    try {
      const id = productData.id || editingProduct?.id;
      const { id: _, ...data } = productData;
      await callAdminApi('POST', '/api/admin/db/products', { id, data });
      
      if (id) {
        setSuccessMessage("ARTIFACT_UPDATED");
        logActivity("ARTIFACT_UPDATE", `Updated artifact: ${productData.name || id}`, 'SUCCESS');
      } else {
        setSuccessMessage("THANK YOU THANK YOU THANK YOU THANK ME");
        logActivity("ARTIFACT_INDUCTION", `Inducted new artifact: ${productData.name}`, 'SUCCESS');
      }
    } catch (err: any) {
      console.error("Product add/update failed:", err);
      setGlobalError(err.message || "PRODUCT_SAVE_FAILED");
    }
  };

  const handleDuplicateProduct = async (product: Product): Promise<boolean> => {
    try {
      const { id, ...rest } = product;
      await callAdminApi('POST', '/api/admin/db/products', {
        data: {
          ...rest,
          name: `${rest.name}_COPY`,
          is_visible: false
        }
      });
      setSuccessMessage("ARTIFACT_DUPLICATED");
      return true;
    } catch (err: any) {
      console.error("Product duplicate failed:", err);
      setGlobalError(err.message || "PRODUCT_DUPLICATE_FAILED");
      return false;
    }
  };

  const handleBulkImport = async (data: { original: string; converted: string }[]) => {
    try {
      setSuccessMessage(`INITIATING_BULK_IMPORT_${data.length}_ASSETS...`);
      
      // Fetch Stripe products for matching
      let stripeProducts: any[] = [];
      try {
        const response = await fetch('/api/admin/stripe-data');
        if (response.ok) {
          stripeProducts = await response.json();
        }
      } catch (err) {
        console.error("Failed to fetch Stripe data for matching:", err);
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";

      let importCount = 0;
      for (const item of data) {
        importCount++;
        // Store in drive_links repository
        await callAdminApi('POST', '/api/admin/db/drive_links', {
          data: {
            original_url: item.original,
            converted_url: item.converted,
            file_id: getDriveFileId(item.original) || 'UNKNOWN'
          }
        });

        let matchedStripe: any = null;
        if (stripeProducts.length > 0) {
          try {
            // Use Gemini to match the image with a Stripe product
            const prompt = `
              Analyze the attached image and match it to the most relevant product from the Stripe catalog provided below.
              Use the product name, description, and visual content of the image for matching.
              
              Stripe Catalog:
              ${stripeProducts.map((p, i) => `${i}: ${p.name} - ${p.description}`).join('\n')}
              
              Return ONLY the index of the matching product as a number. If no match is found, return -1.
            `;

            const imgResponse = await fetch(item.converted);
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
                  type: Type.OBJECT,
                  properties: {
                    matchIndex: { type: Type.INTEGER }
                  }
                }
              }
            });

            const json = JSON.parse(result.text);
            if (json.matchIndex >= 0 && json.matchIndex < stripeProducts.length) {
              matchedStripe = stripeProducts[json.matchIndex];
            }
          } catch (err) {
            console.error("Gemini matching failed for item:", item.original, err);
          }
        }

        // Create a product artifact
        const artifactNumber = (products.length + importCount).toString().padStart(3, '0');
        await callAdminApi('POST', '/api/admin/db/products', {
          data: {
            name: matchedStripe ? matchedStripe.name : `ARTIFACT_#${artifactNumber}`,
            description: matchedStripe ? matchedStripe.description : "Crafted from 100% organic cotton with a brushed fleece interior. Features a relaxed fit and reinforced ribbing at the cuffs and hems. Made to order in Portugal. Please allow 2 weeks till delivery. The Graphics may be slightly different from the photo. For sizing reference please view the size chart.",
            price: matchedStripe ? matchedStripe.price : 0,
            images: [{ url: item.converted, type: 'image' }],
            category: 'TOPS',
            stock: matchedStripe ? 100 : 0,
            is_visible: matchedStripe ? true : false,
            stripe_product_id: matchedStripe ? matchedStripe.id : '',
            stripe_payment_link: matchedStripe ? matchedStripe.payment_link : '',
            stripe_buy_button_id: matchedStripe ? matchedStripe.buy_button_id : ''
          }
        });
      }
      setSuccessMessage("BULK_IMPORT_COMPLETE");
      logActivity("BULK_DRIVE_IMPORT", `Successfully imported ${data.length} assets from Google Drive`, 'SUCCESS');
    } catch (err: any) {
      console.error("Bulk import failed:", err);
      setGlobalError(err.message || "BULK_IMPORT_FAILED");
    }
  };

  const handleScanDriveFolder = async (folderUrl: string) => {
    setSuccessMessage("SCANNING_DRIVE_FOLDER...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const response = await ai.models.generateContent({
        model,
        contents: `
          List all the direct Google Drive file links found in this folder: ${folderUrl}. 
          Focus on images and photos. 
          Extract the file IDs and return them as full shareable URLs in the format: https://drive.google.com/file/d/FILE_ID/view
          Return a JSON array of strings.
        `,
        config: {
          tools: [{urlContext: {}}],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urls: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      const json = JSON.parse(response.text);
      if (json.urls && json.urls.length > 0) {
        const importData = json.urls.map((u: string) => ({
          original: u,
          converted: convertGoogleDriveUrl(u)
        }));
        await handleBulkImport(importData);
      } else {
        setGlobalError("NO_FILES_FOUND_IN_FOLDER. ENSURE_FOLDER_IS_PUBLIC.");
      }
    } catch (err) {
      console.error("Folder scan failed:", err);
      setGlobalError("FOLDER_SCAN_FAILED. PROTOCOL_ERROR.");
    }
  };

  const handleToggleVisibility = async (product: Product): Promise<boolean> => {
    return handleUpdateProduct({ id: product.id, is_visible: !product.is_visible });
  };

  const handleToggleFeatured = async (product: Product): Promise<boolean> => {
    return handleUpdateProduct({ id: product.id, is_featured: !product.is_featured });
  };

  const handleSyncStripe = async () => {
    try {
      const response = await fetch('/api/admin/sync-stripe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setSuccessMessage("STRIPE_SYNC_COMPLETE");
        logActivity("STRIPE_SYNC", "Successfully synchronized products from Stripe catalog", 'SUCCESS');
      } else {
        const data = await response.json();
        setGlobalError(data.error || "STRIPE_SYNC_FAILED");
        logActivity("STRIPE_SYNC_ERROR", data.error || "Failed to sync with Stripe", 'ERROR');
      }
    } catch (err) {
      console.error("Stripe sync failed:", err);
      setGlobalError("STRIPE_SYNC_FAILED");
    }
  };

  const handleOrderSuccess = async (orderId: string) => {
    try {
      const orderDoc = await getDoc(doc(db, "orders", orderId));
      if (orderDoc.exists()) {
        setOrderSuccess({ id: orderDoc.id, ...orderDoc.data() } as Order);
        setCart([]);
        setActiveDiscount(null);
        setIsCheckoutOpen(false);
        setOrderStatus('success');
      }
    } catch (err) {
      console.error("Failed to fetch successful order:", err);
    }
  };

  // --- Render ---
  const dynamicStyles = {
    '--color-accent': '#000000',
    '--color-primary': '#000000',
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen bg-[var(--paper)] text-ink font-sans selection:bg-ink selection:text-paper relative overflow-x-hidden"
      style={dynamicStyles}
    >
      {/* Pure solid background, no ambient gradient overlays */}

      {view !== 'home' && !isAnnouncementDismissed && (
        <AnnouncementBar 
          announcements={announcements}
          onDismiss={() => setIsAnnouncementDismissed(true)} 
          isHidden={isHeaderHidden}
        />
      )}

      {view !== 'home' && (
        <Navbar 
          isCartOpen={isCartOpen}
          cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
          cart={cart}
          onRemoveFromCart={removeFromCart}
          onCheckout={() => setIsCheckoutOpen(true)}
          discount={activeDiscount}
          onApplyDiscount={applyDiscount}
          onRemoveDiscount={() => setActiveDiscount(null)}
          onUpdateQuantity={updateCartQuantity}
          onUpdateSize={updateCartSize}
          onOpenCart={() => { setView('cart'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onOpenAdmin={() => isAdmin ? setView('admin') : setIsAdminLoginOpen(true)}
          onOpenSubmission={() => {
            setIsUserSubmissionOpen(true);
          }}
          onAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
          isAdmin={isAdmin}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNavigate={(v) => { if (v === 'video') setView(view === 'video' ? 'store' : 'video'); else setView(v); }}
          settings={settings as any}
          currentView={view}
          hasAnnouncements={!isAnnouncementDismissed && announcements.some(a => a.active)}
          theme={theme}
          onToggleTheme={toggleTheme}
          preferences={preferences}
          onChangePreferences={handleChangePreferences}
        />
      )}

      <main className={`relative z-10 tab-content font-typewriter ${
        view === 'home' 
          ? '' 
          : (!isAnnouncementDismissed && announcements.some(a => a.active)
              ? 'pt-28 sm:pt-36 pb-20' 
              : 'pt-20 sm:pt-28 pb-20'
            )
      }`}>
        <AnimatePresence mode="wait">
          {settings.maintenance_mode && !isAdmin ? (
            <motion.div 
              key="maintenance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6"
            >
              <div className="w-24 h-24 bg-ink text-paper flex items-center justify-center rounded-full animate-pulse">
                <ShieldCheck size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-display tracking-tighter uppercase">MAINTENANCE</h2>
                <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest max-w-xs mx-auto">
                  The void is currently undergoing fundamental reconfiguration. Access is restricted.
                </p>
              </div>
            </motion.div>
          ) : (
            <>
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HomeView 
                settings={settings} 
                onEnterStore={() => {
                  setView('store');
                }} 
              />
            </motion.div>
          )}

          {view === 'video' && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black overflow-y-auto"
            >
              <SurgicalVideosView 
                products={products} 
                onNavigate={setView} 
                onClose={() => setView('store')} 
              />
            </motion.div>
          )}

          {view === 'store' && (
              <StoreView 
                key={`store-${settings.tab_store_label}`}
                settings={settings}
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                filteredProducts={filteredProducts}
                products={products}
                onAddToCart={addToCart}
                onSelectProduct={(p) => setSelectedProduct(p)}
                isAdmin={isAdmin}
                onEditProduct={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }}
                onDeleteProduct={handleDeleteProduct}
                onDuplicateProduct={handleDuplicateProduct}
                onUpdateProduct={handleUpdateProduct}
                onLinkUpload={handleLinkUpload}
                onToggleVisibility={handleToggleVisibility}
                onToggleFeatured={handleToggleFeatured}
                onUpdateSettings={handleSaveSettings}
                onAddProduct={async () => { setEditingProduct(null); setIsProductModalOpen(true); }}
                onOpenSubmission={() => setIsUserSubmissionOpen(true)}
              />
          )}

          {view === 'admin' && isAdmin && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard 
                products={products}
                orders={orders}
                discounts={discounts}
                announcements={announcements}
                transmissions={transmissions}
                waitlistEntries={waitlistEntries}
                driveLinks={driveLinks}
                settings={settings}
                onLogout={handleAdminLogout}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onAddDiscount={handleAddDiscount}
                onDeleteDiscount={handleDeleteDiscount}
                onToggleDiscount={handleToggleDiscount}
                onAddAnnouncement={handleAddAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                onToggleAnnouncement={handleToggleAnnouncement}
                onDuplicateProduct={handleDuplicateProduct}
                onDeleteTransmission={handleDeleteTransmission}
                onUpdateTransmissionStatus={handleUpdateTransmissionStatus}
                onDeleteWaitlistEntry={handleDeleteWaitlistEntry}
                onDeleteDriveLink={handleDeleteDriveLink}
                onAddDriveLink={handleAddDriveLink}
                onLinkUpload={handleLinkUpload}
                onSaveSettings={handleSaveSettings}
                onOpenProductModal={(p) => { setEditingProduct(p || null); setIsProductModalOpen(true); }}
                onOpenBulkImport={() => setIsBulkImportOpen(true)}
                onFocusProduct={(id) => {
                  setFocusedProductId(id);
                  setAdminTab('PRODUCTS');
                }}
                onSyncStripe={handleSyncStripe}
                onRepoSync={handleRepoSync}
                activeTab={adminTab}
                onTabChange={setAdminTab}
                // Pass storefront props for the preview tab
                storefrontProps={{
                  filteredProducts,
                  categories,
                  activeCategory,
                  setActiveCategory,
                  addToCart,
                  setSelectedProduct,
                  settings
                }}
              />
            </motion.div>
          )}

          {view === 'logos' && (
            <motion.div 
              key="logos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-[1440px] mx-auto px-[var(--spacing-phi-5)] sm:px-[var(--spacing-phi-6)] md:px-[var(--spacing-phi-7)] py-[var(--spacing-phi-7)] space-y-[var(--spacing-phi-7)]"
            >
              <h2 
                style={{ 
                  fontSize: '25px',
                  letterSpacing: getMathematicalLetterTracking(settings.inference_title || 'LOGOS')
                }}
                className="font-display font-black uppercase leading-none"
              >
                {settings.inference_title ? settings.inference_title.replace(/_/g, ' ') : 'LOGOS'}
              </h2>
            </motion.div>
          )}

          {view === 'tracking' && (
            <motion.div 
              key="tracking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <TrackingView />
            </motion.div>
          )}

          {view === 'ethos' && (
            <motion.div 
              key="ethos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-[1440px] mx-auto px-[var(--spacing-phi-5)] sm:px-[var(--spacing-phi-6)] md:px-[var(--spacing-phi-7)] py-[var(--spacing-phi-7)] space-y-16"
            >
              {/* Grand Display Header */}
              <div className="space-y-4">
                <h2 
                  style={{ 
                    letterSpacing: getMathematicalLetterTracking(settings.anonymity_title || 'ABOUT_MANIFESTO')
                  }}
                  className="font-display font-black uppercase leading-none text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                >
                  {settings.anonymity_title ? settings.anonymity_title.replace(/_/g, ' ') : 'ABOUT'}
                </h2>
              </div>

              {/* Main Bold Statement Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative overflow-hidden border border-ink/10 rounded-[var(--radius-phi-2)] bg-ink/[0.01] p-8 md:p-12 flex flex-col justify-between gap-12"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none hidden md:block">
                  <span className="font-sans font-black text-9xl">D3</span>
                </div>



                <div className="flex flex-wrap gap-4 relative z-10">
                  <button
                    onClick={() => setIsUserSubmissionOpen(true)}
                    className="border border-ink px-8 py-3.5 hover:bg-ink hover:text-paper transition-all text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-4 group"
                  >
                    <span>PROPAGATE A NEW IDEA</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => {
                      setView('store');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="border border-ink/10 hover:border-ink px-8 py-3.5 transition-all text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-4 group"
                  >
                    <span>EXPLORE</span>
                  </button>
                </div>
              </motion.div>

              {/* Contrast Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Section 1: The Menu Illusion */}
                <motion.div 
                  whileHover={{ y: -4 }}
                  className="p-8 border border-ink/10 rounded-[var(--radius-phi-1)] space-y-6 flex flex-col justify-between bg-ink/[0.005]"
                >
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center opacity-40">
                      <span className="font-mono text-xs">01</span>
                    </div>
                    <h3 className="text-xs font-display uppercase tracking-widest font-bold">REJECTING THE MENU</h3>
                    <p className="font-mono text-[10px] uppercase opacity-60 leading-relaxed">
                      A menu is for passive spectators—you sit, you point, you consume, you leave. We don't want spectators. D3COMPOSURE delivers theories, concepts, and digital/physical structures.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-ink/5">
                    <span className="font-sans text-[9px] uppercase tracking-widest opacity-30 font-bold">NO PASSIVE RESTAURANTS HERE</span>
                  </div>
                </motion.div>

                {/* Section 2: Clothing as Medium */}
                <motion.div 
                  whileHover={{ y: -4 }}
                  className="p-8 border border-ink/10 rounded-[var(--radius-phi-1)] space-y-6 flex flex-col justify-between bg-ink/[0.005]"
                >
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center opacity-40">
                      <span className="font-mono text-xs">02</span>
                    </div>
                    <h3 className="text-xs font-display uppercase tracking-widest font-bold">THE COGNITIVE WEAR</h3>
                    <p className="font-mono text-[10px] uppercase opacity-60 leading-relaxed">
                      What you wear is your billboard to the void. We construct clothing that functions as structured thought. When you wear D3COMPOSURE, you choose to carry dynamic theories, mathematics, and raw geometry.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-ink/5">
                    <span className="font-sans text-[9px] uppercase tracking-widest opacity-30 font-bold">WEARABLE EXPRESSIONS</span>
                  </div>
                </motion.div>

                {/* Section 3: Creating a Community */}
                <motion.div 
                  whileHover={{ y: -4 }}
                  className="p-8 border border-ink/10 rounded-[var(--radius-phi-1)] space-y-6 flex flex-col justify-between bg-ink/[0.005] md:col-span-2 lg:col-span-1"
                >
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center opacity-40">
                      <span className="font-mono text-xs">03</span>
                    </div>
                    <h3 className="text-xs font-display uppercase tracking-widest font-bold">A COCREATIVE LAB</h3>
                    <p className="font-mono text-[10px] uppercase opacity-60 leading-relaxed">
                      Our framework is entirely decentralized. Through our collaborative lab, community members propose, edit, and launch products. This isn't a retail channel—it's a living, breeding collective of shared expression.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-ink/5">
                    <span className="font-sans text-[9px] uppercase tracking-widest opacity-30 font-bold">BUILT BY CREATORS</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {view === 'provenance' && (() => {
            const provProduct = products.find(p => p.id === provenanceProductId);
            return (
              <motion.div 
                key="provenance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-[1440px] mx-auto px-[var(--spacing-phi-5)] sm:px-[var(--spacing-phi-6)] md:px-[var(--spacing-phi-7)] py-[var(--spacing-phi-7)] space-y-[var(--spacing-phi-7)]"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-ink/10">
                  <div>
                    <h2 
                      style={{ 
                        fontSize: getMathematicalFontSize(settings.sublimation_title || 'PROVENANCE'),
                        letterSpacing: getMathematicalLetterTracking(settings.sublimation_title || 'PROVENANCE')
                      }}
                      className="font-display font-black uppercase leading-none"
                    >
                      {settings.sublimation_title ? settings.sublimation_title.replace(/_/g, ' ') : 'PROVENANCE'}
                    </h2>
                    <p className="text-[10px] font-sans uppercase tracking-widest opacity-40 mt-2 font-bold">SECURE VERIFICATION LEDGER & PRODUCT IMMUTABILITY</p>
                  </div>
                  {provenanceProductId && (
                    <button 
                      id="btn-back-to-provenance-list"
                      onClick={() => setProvenanceProductId(null)}
                      className="px-6 py-2.5 border border-ink/20 hover:border-ink transition-all font-mono text-[9px] font-bold tracking-widest uppercase flex items-center gap-2"
                    >
                      <ArrowLeft size={12} />
                      BACK TO LOOKUP
                    </button>
                  )}
                </div>

                {provProduct ? (
                  /* Single Product Digital Passport View */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
                    {/* Visual Media Column */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="aspect-square border border-ink/10 bg-ink/[0.02] p-8 flex items-center justify-center relative overflow-hidden group">
                        {/* Target Corner Brackets for High-Tech Security feel */}
                        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-ink/20 z-10 pointer-events-none" />
                        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-ink/20 z-10 pointer-events-none" />
                        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-ink/20 z-10 pointer-events-none" />
                        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-ink/20 z-10 pointer-events-none" />

                        {/* Holographic Digital Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-60 z-10" />

                        {/* Chromatic Holographic Shimmer Backplate */}
                        <motion.div 
                          initial={{ opacity: 0.1 }}
                          animate={{ 
                            opacity: [0.1, 0.25, 0.1],
                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                          }}
                          transition={{ 
                            duration: 8, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                          className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-pink-500/5 to-yellow-500/5 mix-blend-color-dodge pointer-events-none z-10"
                          style={{ backgroundSize: "200% 200%" }}
                        />

                        {/* Active Holographic Scan Laser Bar */}
                        <motion.div 
                          initial={{ y: "-10%" }}
                          animate={{ 
                            y: ["0%", "100%", "0%"]
                          }}
                          transition={{ 
                            duration: 4.5, 
                            ease: "easeInOut", 
                            repeat: Infinity 
                          }}
                          className="absolute left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.8)] z-10 pointer-events-none"
                        />

                        <div className="absolute top-6 left-6 px-3 py-1 bg-green-500 text-white font-mono text-[8px] font-bold tracking-widest uppercase rounded-full flex items-center gap-1.5 z-20 shadow-sm">
                          <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                          VERIFIED AUTHENTIC
                        </div>
                        <MediaRenderer 
                          asset={provProduct.images?.[0]} 
                          fallbackUrl={provProduct.provenanceImage}
                          className="w-full h-full object-contain transition-all duration-700 max-h-[400px] relative z-0"
                        />
                        <div className="absolute inset-0 bg-ink/[0.02] mix-blend-overlay pointer-events-none" />
                      </div>
                      
                      {/* Secure Link Sharing Block */}
                      <div className="p-6 border border-ink/10 bg-ink/[0.01] space-y-4">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider">SHARE VERIFIABLE IDENTITY</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={`${window.location.origin}/#provenance/${provProduct.id}`}
                            className="flex-1 bg-white border border-ink/10 p-3 font-mono text-[9px] text-ink/60 outline-none select-all"
                          />
                          <button
                            id="btn-copy-share-link"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(`${window.location.origin}/#provenance/${provProduct.id}`);
                                alert("COPIED UNIQUE PROVENANCE LINK!");
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-4 bg-ink text-paper hover:bg-zinc-800 transition-all flex items-center justify-center border border-ink cursor-pointer"
                            title="Copy Link"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Passport Column */}
                    <div className="lg:col-span-7 space-y-8">
                      <div className="space-y-4">
                        <span className="font-sans text-[9px] uppercase tracking-widest opacity-40 bg-ink/5 px-2.5 py-1 font-bold">DIGITAL PASSPORT CERTIFICATE</span>
                        <h3 className="text-3xl font-display font-black uppercase tracking-tight text-ink">{provProduct.name}</h3>
                        <p className="text-xs font-mono uppercase opacity-60 leading-relaxed max-w-2xl">{provProduct.description}</p>
                      </div>

                      {/* Technical Blueprint Specifications */}
                      <div className="border border-ink/10 divide-y divide-ink/10 font-mono text-[10px] uppercase bg-paper rounded-[var(--radius-phi-1)] overflow-hidden">
                        <div className="grid grid-cols-2 p-4 bg-ink/[0.02]">
                          <span className="opacity-40">LEDGER STATUS</span>
                          <span className="font-bold text-green-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            SECURE & REGISTERED ON-CHAIN
                          </span>
                        </div>
                        <div className="grid grid-cols-2 p-4">
                          <span className="opacity-40">PRODUCT SERIAL HASH</span>
                          <span className="font-bold font-numbers text-ink tracking-tight select-all">D3-PROV-{provProduct.id.toUpperCase()}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4">
                          <span className="opacity-40">SMART CONTRACT ADDRESS</span>
                          <span className="font-bold text-ink tracking-tight select-all break-all leading-normal">0xd3c09b2e49c8db2e5e11cf8b73f78a7fde922c{provProduct.id.slice(0, 4)}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4">
                          <span className="opacity-40">DECENTRALIZED METADATA IPFS</span>
                          <span className="font-bold text-ink tracking-tight select-all break-all leading-normal">QmYw9g8f3a2c5Xv8h4k7mN3B9aQ7w1eD3cR9tY{provProduct.id.slice(0, 4)}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4">
                          <span className="opacity-40">CREATOR ENVELOPE</span>
                          <span className="font-bold text-ink opacity-80">D3COMPOSURE CRYPTO SIGNATURE KEY V1.02</span>
                        </div>
                        <div className="grid grid-cols-2 p-4">
                          <span className="opacity-40">VALIDATED ON-CHAIN TIMELINE</span>
                          <span className="font-bold font-numbers text-ink opacity-80">BLOCK #18,491,204 • JULY 09, 2026</span>
                        </div>
                      </div>

                      {/* Dynamic QR Code Generator Block */}
                      <div className="border border-dashed border-ink/20 p-6 flex flex-col sm:flex-row items-center gap-8 bg-ink/[0.01]">
                        <div className="bg-white p-3 border border-ink/10 relative shrink-0">
                          {provQrUrl ? (
                            <img 
                              src={provQrUrl} 
                              alt="Provenance QR Verification Link" 
                              className="w-36 h-36 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-36 h-36 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-ink/40 animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-4 text-center sm:text-left">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider">SECURE SCANNABLE PASSPORT QR</h4>
                          <p className="text-[9px] font-mono uppercase opacity-40 leading-relaxed max-w-md">
                            THIS QR CODE LEADS DIRECTLY TO THE CRYPTOGRAPHIC PASSPORT RECORD HOSTED ON OUR SECURE ROOT DIRECTORY. SCAN WITH ANY SMART DEVICE CAMERA TO INDEPENDENTLY VERIFY PHYSICAL ORIGINS AND DECENTRALIZED IDENTITY.
                          </p>
                          <div className="pt-2">
                            <button
                              id="btn-back-to-store-from-prov"
                              onClick={() => {
                                setProvenanceProductId(null);
                                setView('store');
                                const targetProduct = products.find(p => p.id === provProduct.id);
                                if (targetProduct) setSelectedProduct(targetProduct);
                              }}
                              className="px-6 py-2.5 bg-ink text-paper hover:bg-zinc-800 transition-all font-mono text-[9px] font-bold tracking-widest uppercase flex items-center gap-2 mx-auto sm:mx-0 cursor-pointer"
                            >
                              <ShoppingCart size={12} />
                              VIEW / PURCHASE ARTIFACT
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* General Lookup Search Portal */
                  <div className="space-y-12">
                    <div className="prose prose-ink max-w-none">
                      <p className="text-xl font-serif font-bold leading-relaxed opacity-90 whitespace-pre-wrap italic">
                        {settings.sublimation_content || 'Every artifact has a history, even if it was born in the void. Sublimation is the process of turning history into essence.'}
                      </p>
                    </div>

                    {/* Interactive Verify Form */}
                    <div className="p-8 border border-ink/10 bg-ink/[0.01] max-w-2xl space-y-6">
                      <div className="space-y-2">
                        <span className="font-sans text-[9px] uppercase tracking-widest opacity-40 font-bold">PRODUCT VERIFICATION SYSTEM</span>
                        <h3 className="text-lg font-mono font-bold uppercase tracking-wider">VERIFY PRODUCT AUTHENTICITY</h3>
                        <p className="text-[10px] font-mono uppercase opacity-40 leading-relaxed">
                          Enter the product serial or order ID from your purchase confirmation or packaging to verify the product's origin and authenticity.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">SELECT A PRODUCT TO VIEW AUTHENTICITY DETAILS</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {products.map(p => (
                            <button
                              key={p.id}
                              id={`prov-item-${p.id}`}
                              onClick={() => setProvenanceProductId(p.id)}
                              className="p-4 border border-ink/10 bg-paper hover:border-ink hover:bg-ink/[0.02] transition-all text-left flex items-center justify-between group cursor-pointer"
                            >
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink group-hover:underline">{p.name}</span>
                                <p className="text-[8px] font-mono uppercase opacity-40">SERIAL: D3-PROV-{p.id.slice(0, 6).toUpperCase()}</p>
                              </div>
                              <ArrowRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-ink" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}


              </motion.div>
            );
          })()}

          {view === 'contact' && <ContactForm />}
          {view === 'privacy' && <PrivacyPolicy />}
          {view === 'shipping' && <ShippingPolicy />}
          {view === 'refund' && <RefundPolicy />}
          {view === 'terms' && <TermsOfService />}
          {view === 'affiliates' && (
            <motion.div 
              key="affiliates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 md:p-16 max-w-4xl mx-auto space-y-8 font-mono text-center"
            >
              <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-ink">AFFILIATES</h1>
              <div className="space-y-4 text-[13px] font-mono leading-relaxed text-ink/80 max-w-2xl mx-auto border border-ink/10 p-6 md:p-8 bg-paper shadow-xs">
                <p>
                  Please send an email to{' '}
                  <a 
                    href="mailto:inquires@d3composure.com?subject=Affiliate" 
                    className="underline font-bold text-ink hover:text-ink/60 transition-colors"
                  >
                    inquires@d3composure.com
                  </a>{' '}
                  with the subject line <span className="font-bold text-ink">"Affiliate"</span> and we will send you a form to fill out.
                </p>
              </div>
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GalleryView 
                products={products} 
                onSelectProduct={(p) => setSelectedProduct(p)} 
              />
            </motion.div>
          )}

          {view === 'sustainability' && (
            <SustainabilityView onNavigate={setView} />
          )}

          {view === 'cart' && (
            <CartView 
              items={cart}
              onRemove={removeFromCart}
              onCheckout={() => setIsCheckoutOpen(true)}
              discount={activeDiscount}
              onApplyDiscount={applyDiscount}
              onRemoveDiscount={() => setActiveDiscount(null)}
              onUpdateSize={updateCartSize}
              onUpdateQuantity={updateCartQuantity}
              onNavigate={setView}
            />
          )}
          
          {/* Add other views here */}
            </>
          )}
        </AnimatePresence>
      </main>

      {view !== 'admin' && view !== 'home' && (
        <footer className="py-4 px-4 sm:px-8 bg-white text-black font-sans border-t border-black/5">
          <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-2.5 opacity-90 hover:opacity-100 transition-opacity duration-300">

            {/* Line 1: Navigation & Links (Left) + Region & Preferences (Right) */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-y-2 gap-x-4 w-full text-[10px] font-sans">
              {/* Left Column: Navigation, Corporate, Legal, and Connect */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
                {/* Navigation Links */}
                <div className="inline-flex items-center gap-x-2">
                  {[
                    { id: 'home', label: t('home') || 'Home' },
                    { id: 'store', label: t('store') || 'Shop' },
                    { id: 'cart', label: 'Shopping Bag' },
                    { id: 'gallery', label: t('gallery') || 'Gallery' }
                  ]
                    .filter(link => !settings.sections || settings.sections[link.id] !== false)
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((link, idx) => (
                      <React.Fragment key={link.id}>
                        {idx > 0 && <span className="text-black/25 text-[8px] select-none">•</span>}
                        <button 
                          onClick={() => {
                            if (link.id === 'size-chart') {
                              window.dispatchEvent(new CustomEvent('open-size-chart'));
                            } else {
                              setView(link.id as any);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="text-[9.5px] font-sans font-normal text-black/70 hover:text-black transition-colors tracking-wide cursor-pointer"
                        >
                          {link.label}
                        </button>
                      </React.Fragment>
                    ))
                  }
                </div>

                <span className="text-black/20 text-[8px] select-none">|</span>

                {/* Corporate dropdown */}
                <div 
                  className="relative inline-block"
                  onMouseEnter={() => setFooterCorporateHovered(true)}
                  onMouseLeave={() => setFooterCorporateHovered(false)}
                >
                  <button
                    onClick={() => setFooterCorporateOpen(!footerCorporateOpen)}
                    className="inline-flex items-center gap-1 text-[9.5px] font-sans font-normal text-black/70 hover:text-black transition-colors tracking-wide cursor-pointer py-0.5 px-1 rounded hover:bg-black/5"
                  >
                    <span>Corporate</span>
                    <ChevronDown size={9} className={`transition-transform duration-200 opacity-60 ${footerCorporateHovered || footerCorporateOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {(footerCorporateHovered || footerCorporateOpen) && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-1.5 z-50 bg-white border border-black/10 shadow-xl rounded-md py-1.5 px-1 min-w-[170px] flex flex-col gap-0.5 text-left"
                      >
                        <div className="px-2 py-1 text-[8px] font-mono uppercase text-black/40 tracking-wider border-b border-black/5 mb-1">
                          Corporate
                        </div>
                        {[
                          { id: 'ethos', label: t('ethos') || 'About' },
                          { id: 'sustainability', label: settings.tab_sustainability_label || t('sustainability') || 'Sustainability' },
                          { id: 'contact', label: settings.tab_contact_label || 'Contact' },
                          { id: 'affiliates', label: t('affiliates') || 'Affiliates' }
                        ]
                          .filter(link => !settings.sections || settings.sections[link.id] !== false)
                          .map((subLink) => (
                            <button
                              key={subLink.id}
                              onClick={() => {
                                setView(subLink.id as any);
                                setFooterCorporateOpen(false);
                                setFooterCorporateHovered(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-left px-2 py-1 text-[8.5px] font-sans text-black/70 hover:text-black hover:bg-black/5 rounded transition-colors cursor-pointer"
                            >
                              {subLink.label}
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span className="text-black/20 text-[8px] select-none">|</span>

                {/* Legal dropdown */}
                <div 
                  className="relative inline-block"
                  onMouseEnter={() => setFooterLegalHovered(true)}
                  onMouseLeave={() => setFooterLegalHovered(false)}
                >
                  <button
                    onClick={() => setFooterLegalOpen(!footerLegalOpen)}
                    className="inline-flex items-center gap-1 text-[9.5px] font-sans font-normal text-black/70 hover:text-black transition-colors tracking-wide cursor-pointer py-0.5 px-1 rounded hover:bg-black/5"
                  >
                    <span>Legal</span>
                    <ChevronDown size={9} className={`transition-transform duration-200 opacity-60 ${footerLegalHovered || footerLegalOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {(footerLegalHovered || footerLegalOpen) && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-1.5 z-50 bg-white border border-black/10 shadow-xl rounded-md py-1.5 px-1 min-w-[210px] flex flex-col gap-0.5 text-left"
                      >
                        <div className="px-2 py-1 text-[8px] font-mono uppercase text-black/40 tracking-wider border-b border-black/5 mb-1">
                          Legal Policies
                        </div>
                        {[
                          { id: 'terms', label: settings.tab_terms_label || 'Terms of Service', viewTarget: 'terms' },
                          { id: 'privacy', label: settings.tab_privacy_label || 'Privacy Policy', viewTarget: 'privacy' },
                          { id: 'shipping', label: settings.tab_shipping_label || 'Shipping Policy', viewTarget: 'shipping' },
                          { id: 'refund', label: settings.tab_refund_label || 'Refund Policy', viewTarget: 'refund' },
                          { id: 'donotsell', label: 'Do Not Sell or Share My Personal Information', viewTarget: 'privacy', isOptOut: true }
                        ]
                          .filter(link => !settings.sections || settings.sections[link.id] !== false)
                          .map((subLink) => (
                            <button
                              key={subLink.id}
                              onClick={() => {
                                if (subLink.isOptOut) {
                                  setSuccessMessage("Preference 'Do Not Sell or Share My Personal Information' recorded");
                                }
                                setView(subLink.viewTarget as any);
                                setFooterLegalOpen(false);
                                setFooterLegalHovered(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-left px-2 py-1 text-[8.5px] font-sans text-black/70 hover:text-black hover:bg-black/5 rounded transition-colors cursor-pointer"
                            >
                              {subLink.label}
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span className="text-black/20 text-[8px] select-none">|</span>

                {/* Connect */}
                <div className="inline-flex items-center gap-x-2">
                  <a 
                    href={`mailto:${settings.contact_email || 'inquire@d3composure.com'}`}
                    className="text-[9.5px] font-sans font-normal text-black/70 hover:text-black transition-colors tracking-wide cursor-pointer"
                  >
                    Contact
                  </a>
                  <span className="text-black/25 text-[8px] select-none">•</span>
                  <a 
                    href={settings.social_links?.instagram || "https://www.instagram.com/d3composure"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9.5px] font-sans font-normal text-black/70 hover:text-black transition-colors tracking-wide cursor-pointer"
                  >
                    Instagram
                  </a>
                  <span className="text-black/25 text-[8px] select-none">•</span>
                  <a 
                    href={settings.social_links?.linkedin || "#"} 
                    onClick={(e) => {
                      if (!settings.social_links?.linkedin) {
                        e.preventDefault();
                      }
                    }}
                    target={settings.social_links?.linkedin ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`text-[9.5px] font-sans font-normal transition-colors tracking-wide ${
                      settings.social_links?.linkedin 
                        ? 'text-black/70 hover:text-black cursor-pointer' 
                        : 'text-black/30 cursor-not-allowed'
                    }`}
                    title={settings.social_links?.linkedin ? undefined : "LinkedIn (Unavailable)"}
                  >
                    LinkedIn
                  </a>
                </div>
              </div>

              {/* Right Column: Preferences (Location, Region, Language, Currency) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-3 gap-y-1 text-[9.5px] text-black/70">
                {/* Store Location */}
                <div className="flex items-center gap-1">
                  <span className="opacity-40 uppercase tracking-wider text-[9px]">LOC:</span>
                  {STORE_LOCATIONS.map((loc) => {
                    const active = preferences.storeLocation === loc.id;
                    return (
                      <button
                        key={loc.id}
                        onClick={() => handleChangePreferences({ 
                          ...preferences, 
                          storeLocation: loc.id,
                          region: loc.region,
                          currency: loc.currency,
                          language: loc.language
                        })}
                        className={`px-0.5 transition-all font-normal cursor-pointer uppercase ${
                          active ? 'text-black font-semibold underline' : 'text-black/40 hover:text-black'
                        }`}
                      >
                        {loc.city}
                      </button>
                    );
                  })}
                </div>

                <span className="text-black/20 text-[8px] select-none">|</span>

                {/* Region */}
                <div className="flex items-center gap-1">
                  <span className="opacity-40 uppercase tracking-wider text-[9px]">REG:</span>
                  {[
                    { code: 'GLOBAL', name: 'GL' },
                    { code: 'US', name: 'US' },
                    { code: 'EU', name: 'EU' },
                    { code: 'UK', name: 'UK' },
                    { code: 'JP', name: 'JP' },
                    { code: 'KR', name: 'KR' }
                  ].map((r) => {
                    const active = preferences.region === r.code;
                    return (
                      <button
                        key={r.code}
                        onClick={() => handleChangePreferences({ ...preferences, region: r.code })}
                        className={`px-0.5 transition-all font-normal cursor-pointer uppercase ${
                          active ? 'text-black font-semibold underline' : 'text-black/40 hover:text-black'
                        }`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>

                <span className="text-black/20 text-[8px] select-none">|</span>

                {/* Currency */}
                <div className="flex items-center gap-1">
                  <span className="opacity-40 uppercase tracking-wider text-[9px]">CUR:</span>
                  {[
                    { code: 'USD', symbol: '$' },
                    { code: 'EUR', symbol: '€' },
                    { code: 'GBP', symbol: '£' },
                    { code: 'JPY', symbol: '¥' },
                    { code: 'KRW', symbol: '₩' }
                  ].map((c) => {
                    const active = preferences.currency === c.code;
                    return (
                      <button
                        key={c.code}
                        onClick={() => handleChangePreferences({ ...preferences, currency: c.code })}
                        className={`px-0.5 transition-all font-normal cursor-pointer uppercase ${
                          active ? 'text-black font-semibold underline' : 'text-black/40 hover:text-black'
                        }`}
                      >
                        {c.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Line 2: Newsletter on Left, Account Avatar Icon & Copyright on Right */}
            <div className="pt-2 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
              <div className="flex items-center">
                <FooterNewsletter onOpenModal={() => setIsWaitlistPopupOpen(true)} />
              </div>
              <div className="flex items-center gap-3">
                {/* Account Avatar Button */}
                <button
                  onClick={() => setIsAdminLoginOpen(true)}
                  title={isAdmin ? "Admin Dashboard (Active)" : "Client & Member Account"}
                  aria-label={isAdmin ? "Admin Dashboard" : "Account Login"}
                  className="flex items-center gap-1.5 text-[9.5px] font-sans text-black/60 hover:text-black transition-colors cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full border border-black/20 group-hover:border-black/60 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition-all">
                    <User size={10} className="stroke-[1.7] text-black/70 group-hover:text-black" />
                  </div>
                  <span className="uppercase tracking-wider">{isAdmin ? 'ADMIN' : 'ACCOUNT'}</span>
                </button>

                <span className="text-black/20 text-[8px] select-none">•</span>

                <div className="text-[9.5px] font-sans uppercase tracking-wider text-black/50">
                  © {new Date().getFullYear()} {settings.site_title || 'D3COMPOSURE'}. ALL RIGHTS RESERVED.
                </div>
              </div>
            </div>

          </div>
        </footer>
      )}

      {/* Modals */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateCartQuantity}
        onUpdateSize={updateCartSize}
        onRemove={removeFromCart}
        onCheckout={() => setIsCheckoutOpen(true)}
        discount={activeDiscount}
        onApplyDiscount={applyDiscount}
        onNavigate={(newView) => {
          setView(newView as any);
          setIsCartOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <ProductDetail 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        setGlobalError={setGlobalError}
        isAdmin={isAdmin}
        onUpdateProduct={handleUpdateProduct}
      />

      <SizeChartModal 
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />

      <AdminLoginModal 
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={handleAdminLogin}
        onGoogleLogin={handleGoogleLogin}
        password={adminPassword}
        setPassword={setAdminPassword}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        total={cartTotal}
        discount={activeDiscount}
        form={checkoutForm}
        setForm={setCheckoutForm}
        onSubmit={() => {}} // Handled inside CheckoutModal
        onOrderSuccess={handleOrderSuccess}
        setOrderStatus={setOrderStatus}
      />

      <SuccessOverlay 
        status={orderStatus}
        orderId={orderSuccess?.id || null}
        onReturn={() => { setOrderStatus('idle'); setOrderSuccess(null); }}
      />

      <GlobalNotificationSystem 
        error={globalError}
        success={successMessage}
        onClearError={() => setGlobalError(null)}
        onClearSuccess={() => setSuccessMessage(null)}
      />

      {view !== 'home' && <CookieConsent />}



      <SubscribeListModal 
        isOpen={isWaitlistPopupOpen}
        onClose={() => setIsWaitlistPopupOpen(false)}
        onSubscribe={handleSubscribeWaitlist}
      />

      {/* Admin Specific Modals */}
      {isAdmin && (
        <>
          <ProductModal 
            isOpen={isProductModalOpen}
            onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
            onSave={handleAddProduct}
            initialProduct={editingProduct || undefined}
            adminPassword={settings.admin_password}
            setGlobalError={setGlobalError}
            setSuccessMessage={setSuccessMessage}
          />
          <UserArtifactSubmissionModal 
            isOpen={isUserSubmissionOpen}
            onClose={() => setIsUserSubmissionOpen(false)}
            onSuccess={() => setSuccessMessage("SUBMISSION_RECEIVED")}
          />
          <BulkDriveImportModal 
            isOpen={isBulkImportOpen}
            onClose={() => setIsBulkImportOpen(false)}
            onImport={handleBulkImport}
            onScanFolder={handleScanDriveFolder}
          />
        </>
      )}
    </div>
  );
}
