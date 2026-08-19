import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ChevronLeft, ChevronRight, LayoutGrid, LogOut, Package, Settings, MessageSquare, UserCheck, Database, Megaphone, PlusCircle, Layers } from 'lucide-react';
import { Announcement, AppSettings, DiscountCode, DriveLink, LogEntry, Order, Product } from '../../types';
import { HeroTab } from './HeroTab';
import { ProductsTab } from './ProductsTab';
import { SettingsTab } from './SettingsTab';
import { AnnouncementsTab } from './AnnouncementsTab';
import { TransmissionsTab } from './TransmissionsTab';
import { WaitlistTab, WaitlistEntry } from './WaitlistTab';
import { D3CatalogCmsTab } from './D3CatalogCmsTab';
import { ArtifactCreatorTab } from './ArtifactCreatorTab';
import { AirtableStorefront } from '../AirtableStorefront';
import { DriveLinksTab } from './DriveLinksTab';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  discounts: DiscountCode[];
  announcements: Announcement[];
  transmissions: any[];
  waitlistEntries: WaitlistEntry[];
  driveLinks: DriveLink[];
  settings: AppSettings;
  onLogout: () => void;
  onUpdateProduct: (product: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onUpdateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onAddDiscount: (discount: Partial<DiscountCode>) => Promise<void>;
  onDeleteDiscount: (id: string) => Promise<void>;
  onToggleDiscount: (discount: DiscountCode) => Promise<void>;
  onAddAnnouncement: (announcement: Partial<Announcement>) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onToggleAnnouncement: (announcement: Announcement) => Promise<void>;
  onDuplicateProduct: (product: Product) => Promise<boolean>;
  onDeleteTransmission: (id: string) => Promise<void>;
  onUpdateTransmissionStatus: (id: string, status: string) => Promise<void>;
  onDeleteWaitlistEntry: (id: string) => Promise<void>;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onOpenProductModal: (product?: Partial<Product>) => void;
  onOpenBulkImport: () => void;
  onOpenDrivePublisher?: () => void;
  onFocusProduct: (id: string) => void;
  onDeleteDriveLink: (id: string) => Promise<void>;
  onAddDriveLink: (url: string, productId?: string) => Promise<void>;
  onSyncStripe: () => Promise<void>;
  onRepoSync: () => Promise<void>;
  onLinkUpload?: (productId: string, url: string) => Promise<void>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  storefrontProps?: {
    filteredProducts: Product[];
    categories: string[];
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
    addToCart: (product: Product, size: string) => void;
    setSelectedProduct: (product: Product | null) => void;
    settings: AppSettings;
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  discounts,
  announcements,
  transmissions,
  waitlistEntries,
  driveLinks,
  settings,
  onLogout,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onDeleteOrder,
  onAddDiscount,
  onDeleteDiscount,
  onToggleDiscount,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onToggleAnnouncement,
  onDuplicateProduct,
  onDeleteTransmission,
  onUpdateTransmissionStatus,
  onDeleteWaitlistEntry,
  onSaveSettings,
  onOpenProductModal,
  onOpenBulkImport,
  onOpenDrivePublisher,
  onFocusProduct,
  onDeleteDriveLink,
  onAddDriveLink,
  onSyncStripe,
  onRepoSync,
  onLinkUpload,
  activeTab = 'PRODUCTS',
  onTabChange,
  storefrontProps
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [voidLogs, setVoidLogs] = React.useState<{ id: string; msg: string; time: string; type: 'info' | 'warn' | 'error' | 'success' }[]>([]);

  // Add initial logs
  React.useEffect(() => {
    const initialLogs = [
      { id: '1', msg: 'SESSION STARTED', time: new Date().toLocaleTimeString(), type: 'info' as const },
      { id: '3', msg: 'AUTH VERIFIED', time: new Date().toLocaleTimeString(), type: 'success' as const },
    ];
    setVoidLogs(initialLogs);
  }, []);

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setVoidLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), msg, time: new Date().toLocaleTimeString(), type }, ...prev].slice(0, 50));
  };

  const tabs = [
    { id: 'NEW_ARTIFACT', icon: PlusCircle, label: '+ NEW ARTIFACT' },
    { id: 'DRIVE_PHOTOS', icon: Database, label: 'DRIVE PHOTOS & LINKS' },
    { id: 'CATALOG_CMS', icon: Database, label: 'D3 CATALOG CMS' },
    { id: 'AIRTABLE_SYNC', icon: Layers, label: 'AIRTABLE SYNC' },
    { id: 'PRODUCTS', icon: Package, label: 'PRODUCTS' },
    { id: 'TRANSMISSIONS', icon: MessageSquare, label: 'TRANSMISSIONS' },
    { id: 'WAITLIST', icon: UserCheck, label: 'WAITING LIST' },
    { id: 'ANNOUNCEMENTS', icon: Megaphone, label: 'ANNOUNCEMENTS' },
    { id: 'HERO', icon: LayoutGrid, label: 'HERO SLIDES' },
    { id: 'SETTINGS', icon: Settings, label: 'SETTINGS' },
  ];

  const lowStockCount = products.filter(p => (p.stock || 0) < 5).length;

  return (
    <div className="flex h-screen bg-paper overflow-hidden tab-content font-typewriter">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="bg-paper border-r border-ink/5 flex flex-col z-50 relative shadow-xl"
      >
        <div className="p-8 border-b border-ink/5 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-ink rounded-full" />
              <span className="text-sm font-display tracking-tighter uppercase">ADMIN PANEL</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-ink/5 transition-all ml-auto"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`w-full flex items-center gap-3 py-2 px-1 transition-all group relative ${
                activeTab === tab.id ? 'text-ink font-bold' : 'text-ink/40 hover:text-ink font-medium'
              }`}
            >
              <div className="relative">
                <tab.icon size={18} className={activeTab === tab.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} />
                {tab.id === 'PRODUCTS' && lowStockCount > 0 && isSidebarCollapsed && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-paper animate-pulse" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[14px] font-mono uppercase tracking-wider">{tab.label}</span>
              )}
              {!isSidebarCollapsed && tab.id === 'PRODUCTS' && lowStockCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-700 border border-amber-500/40 text-[9px] font-mono font-bold uppercase tracking-wider rounded-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  {lowStockCount} LOW
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-ink/5 space-y-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <LogOut size={20} className="opacity-60 group-hover:opacity-100" />
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">LOGOUT</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-paper relative custom-scrollbar flex flex-col">
        <div className="flex-1 p-8 sm:p-12 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {activeTab === 'PRODUCTS' && (
                <ProductsTab 
                  products={products}
                  onFocusProduct={onFocusProduct}
                  onRepoSync={onRepoSync}
                  onEdit={(p) => { addLog(`EDITING PRODUCT: ${p.name}`); onOpenProductModal(p); }}
                  onDelete={async (id) => { 
                    const success = await onDeleteProduct(id);
                    if (success) addLog(`PRODUCT DELETED: ${id}`, 'warn');
                    return success;
                  }}
                  onToggleVisibility={async (p) => {
                    const success = await onUpdateProduct({ ...p, is_visible: !p.is_visible });
                    if (success) addLog(`VISIBILITY TOGGLED: ${p.name}`, 'info');
                    return success;
                  }}
                  onToggleFeatured={async (p) => {
                    const success = await onUpdateProduct({ ...p, is_featured: !p.is_featured });
                    if (success) addLog(`FEATURE STATUS TOGGLED: ${p.name}`, 'info');
                    return success;
                  }}
                  onUpdateProduct={async (updates) => {
                    const success = await onUpdateProduct(updates);
                    if (success) addLog(`PRODUCT UPDATED: ${updates.id}`, 'success');
                    return success;
                  }}
                  onDuplicate={async (p) => {
                    const success = await onDuplicateProduct(p);
                    if (success) addLog(`PRODUCT DUPLICATED: ${p.name}`, 'success');
                    return success;
                  }}
                  onAddNew={(data) => { addLog(`ADDING NEW PRODUCT: ${data?.name || 'UNTITLED'}`); onOpenProductModal(data); }}
                  onBulkImport={() => { addLog('OPENING BULK IMPORT'); onOpenBulkImport(); }}
                  onSyncStripe={async () => {
                    addLog('INITIATING STRIPE SYNC');
                    await onSyncStripe();
                    addLog('STRIPE SYNC COMPLETE', 'success');
                  }}
                  onLinkUpload={onLinkUpload}
                />
              )}

              {activeTab === 'TRANSMISSIONS' && (
                <TransmissionsTab 
                  transmissions={transmissions}
                  onDelete={onDeleteTransmission}
                  onUpdateStatus={(id, status) => onUpdateTransmissionStatus(id, status as any)}
                />
              )}

              {activeTab === 'WAITLIST' && (
                <WaitlistTab 
                  entries={waitlistEntries}
                  onDelete={onDeleteWaitlistEntry}
                />
              )}

              {activeTab === 'ANNOUNCEMENTS' && (
                <AnnouncementsTab 
                  announcements={announcements}
                  onAdd={async (a) => {
                    await onAddAnnouncement(a);
                    addLog(`ANNOUNCEMENT ADDED: ${a.text}`, 'success');
                  }}
                  onDelete={(id) => {
                    onDeleteAnnouncement(id);
                    addLog(`ANNOUNCEMENT DELETED: ${id}`, 'warn');
                  }}
                  onToggleActive={(a) => {
                    onToggleAnnouncement(a);
                    addLog(`ANNOUNCEMENT TOGGLED: ${a.active ? 'DISABLED' : 'ENABLED'}`, 'info');
                  }}
                />
              )}

              {activeTab === 'NEW_ARTIFACT' && (
                <ArtifactCreatorTab 
                  onSave={async (p) => {
                    const success = await onUpdateProduct(p);
                    if (success) {
                      addLog(`NEW ARTIFACT INDUCTED: ${p.name}`, 'success');
                    }
                    return success;
                  }}
                  setGlobalError={(msg) => msg && addLog(msg, 'error')}
                  setSuccessMessage={(msg) => msg && addLog(msg, 'success')}
                  onNavigateToProducts={() => onTabChange ? onTabChange('PRODUCTS') : null}
                />
              )}

              {activeTab === 'DRIVE_PHOTOS' && (
                <DriveLinksTab 
                  driveLinks={driveLinks}
                  products={products}
                  onDelete={onDeleteDriveLink}
                  onAdd={onAddDriveLink}
                  onBulkImport={onOpenBulkImport}
                  onOpenDrivePublisher={onOpenDrivePublisher}
                />
              )}

              {activeTab === 'CATALOG_CMS' && (
                <D3CatalogCmsTab />
              )}

              {activeTab === 'AIRTABLE_SYNC' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <AirtableStorefront 
                    defaultHeight={740}
                    title="Live Airtable Inventory & Media Sync"
                    subtitle="Direct live access to your Airtable base (appU8lAjcTDz63elZ) for managing products and media assets"
                  />
                </div>
              )}

              {activeTab === 'HERO' && (
                <HeroTab 
                  settings={settings}
                  onSave={onSaveSettings}
                />
              )}

              {activeTab === 'SETTINGS' && (
                <SettingsTab 
                  settings={settings}
                  onSave={onSaveSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-paper text-ink/40 flex items-center justify-between px-6 text-[8px] font-mono uppercase tracking-[0.2em] border-t border-ink/10">
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
              <span>STORE ONLINE</span>
            </div>
            <div className="h-3 w-px bg-ink/10 shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              <Activity size={10} className="animate-pulse" />
              <span>ACTIVE SESSIONS: {Math.floor(Math.random() * 5) + 3}</span>
            </div>
            {lowStockCount > 0 && (
              <>
                <div className="h-3 w-px bg-ink/10 shrink-0" />
                <button
                  onClick={() => onTabChange?.('PRODUCTS')}
                  className="flex items-center gap-1.5 text-amber-600 font-bold hover:underline cursor-pointer shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>LOW STOCK ALERT ({lowStockCount} ITEMS &lt; 5)</span>
                </button>
              </>
            )}
            <div className="h-3 w-px bg-ink/10 shrink-0" />
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="opacity-50 shrink-0">LATEST ACTIVITY:</span>
              <span className="text-ink truncate">{voidLogs[0]?.msg || 'IDLE'}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <span>DOMAIN: D3COMPOSURE.NAME</span>
            <div className="h-3 w-px bg-ink/10" />
            <span>LAST SYNC: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </main>
    </div>
  );
};
