import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  FolderTree, 
  History, 
  ShieldCheck, 
  Database, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit2, 
  Trash2, 
  Copy, 
  Layers, 
  TrendingUp, 
  Tag, 
  FileText, 
  X, 
  Check, 
  Sliders
} from 'lucide-react';
import { 
  D3Product, 
  D3Category, 
  D3InventoryAdjustment, 
  D3ProductStatus, 
  D3PublishStatus, 
  D3ProductTag, 
  D3AdjustmentReason, 
  D3CatalogAuditReport 
} from '../../types';
import { d3CatalogCms } from '../../services/d3CatalogCmsService';
import { 
  VALID_PRODUCT_STATUSES, 
  VALID_PUBLISH_STATUSES, 
  VALID_TAGS, 
  VALID_ADJUSTMENT_REASONS, 
  generateUrlSlug, 
  calculateMargin 
} from '../../utils/d3CatalogHelpers';

export const D3CatalogCmsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'PRODUCTS' | 'CATEGORIES' | 'ADJUSTMENTS' | 'AUDIT' | 'API_SPECS'>('PRODUCTS');
  const [products, setProducts] = useState<D3Product[]>([]);
  const [categories, setCategories] = useState<D3Category[]>([]);
  const [adjustments, setAdjustments] = useState<D3InventoryAdjustment[]>([]);
  const [auditReport, setAuditReport] = useState<D3CatalogAuditReport | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [publishFilter, setPublishFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<D3Product> | null>(null);
  const [productModalErrors, setProductModalErrors] = useState<string[]>([]);

  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjTargetProduct, setAdjTargetProduct] = useState<D3Product | null>(null);
  const [adjQuantity, setAdjQuantity] = useState<number>(10);
  const [adjReason, setAdjReason] = useState<D3AdjustmentReason>('Restock');
  const [adjNotes, setAdjNotes] = useState<string>('');
  const [adjBy, setAdjBy] = useState<string>('Judy Lee (Inventory Lead)');

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(d3CatalogCms.getAllProducts());
    setCategories(d3CatalogCms.getAllCategories());
    setAdjustments(d3CatalogCms.getAllInventoryAdjustments());
    setAuditReport(d3CatalogCms.runCatalogAudit());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p['Product Name'].toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.SKU.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p['URL Slug'].toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || p.Status === statusFilter;
    const matchesPublish = publishFilter === 'ALL' || p['Publish Status'] === publishFilter;
    const matchesCategory = categoryFilter === 'ALL' || p.Category.includes(categoryFilter);

    return matchesSearch && matchesStatus && matchesPublish && matchesCategory;
  });

  const lowStockCount = products.filter(p => p['On-Hand Quantity'] <= p['Reorder Threshold']).length;
  const storefrontPublishedCount = products.filter(p => p.Status === 'Active' && p.Visibility && p['Publish Status'] === 'Published').length;

  // Save Product Handler
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setProductModalErrors([]);

    if (!editingProduct) return;

    if (editingProduct.id) {
      // Update
      const res = d3CatalogCms.updateProduct(editingProduct.id, editingProduct);
      if (!res.success) {
        setProductModalErrors(res.errors || [res.message || 'Update failed']);
        return;
      }
      showToast(res.message || 'Product updated successfully');
    } else {
      // Create
      const res = d3CatalogCms.createProduct(editingProduct);
      if (!res.success) {
        setProductModalErrors(res.errors || [res.message || 'Creation failed']);
        return;
      }
      showToast(res.message || 'Product created successfully');
    }

    setShowProductModal(false);
    setEditingProduct(null);
    refreshData();
  };

  // Save Inventory Adjustment Handler
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjTargetProduct) return;

    const res = d3CatalogCms.createInventoryAdjustment({
      Product: [adjTargetProduct.id],
      Date: new Date().toISOString().split('T')[0],
      'Quantity Change': adjQuantity,
      Reason: adjReason,
      Notes: adjNotes,
      'Adjusted By': adjBy
    });

    if (res.success) {
      showToast(res.message || 'Inventory adjustment logged');
      setShowAdjModal(false);
      setAdjTargetProduct(null);
      refreshData();
    } else {
      showToast(`Error: ${res.errors?.join(', ') || 'Adjustment failed'}`);
    }
  };

  // Save Category Handler
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const res = d3CatalogCms.createCategory({
      'Category Name': newCatName,
      Description: newCatDesc
    });

    if (res.success) {
      showToast(`Category '${newCatName}' created`);
      setShowCatModal(false);
      setNewCatName('');
      setNewCatDesc('');
      refreshData();
    } else {
      showToast(`Error: ${res.errors?.join(', ')}`);
    }
  };

  return (
    <div className="space-y-8 font-mono text-ink">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-ink text-paper px-6 py-4 rounded-xl shadow-2xl border border-paper/20 flex items-center gap-3 max-w-lg"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-mono">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-ink text-paper text-[10px] uppercase font-bold tracking-widest rounded-full">AIRTABLE CMS BASE</span>
            <span className="text-xs text-ink/50 font-mono">BASE NAME: D3 CATALOG CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight uppercase">D3 CATALOG CMS</h1>
          <p className="text-xs text-ink/60 mt-1 max-w-2xl">
            Single source of truth for product catalog, category taxonomy, inventory ledger, and publishing pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              d3CatalogCms.resetToDefaultSeed();
              refreshData();
              showToast("Reset D3 Catalog CMS to seed state.");
            }}
            className="px-4 py-2 border border-ink/20 hover:border-ink/50 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>RESET DEMO DATA</span>
          </button>
          
          <button
            onClick={() => {
              setEditingProduct({
                'Product Name': '',
                SKU: '',
                Price: 350,
                Cost: 110,
                Status: 'Active',
                Category: [categories[0]?.id || 'cat_artifacts'],
                Visibility: true,
                'Publish Status': 'Published',
                'On-Hand Quantity': 25,
                'Reorder Threshold': 10,
                Featured: false,
                Tags: ['New']
              });
              setShowProductModal(true);
            }}
            className="px-5 py-2 bg-ink text-paper hover:bg-ink/90 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>NEW PRODUCT</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 bg-ink/5 rounded-xl border border-ink/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-ink/50">
            <span>TOTAL PRODUCTS</span>
            <Package size={14} />
          </div>
          <div className="text-2xl font-bold font-display">{products.length}</div>
          <div className="text-[10px] text-ink/60">Across all statuses</div>
        </div>

        <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>STOREFRONT LIVE</span>
            <CheckCircle2 size={14} />
          </div>
          <div className="text-2xl font-bold font-display text-emerald-900">{storefrontPublishedCount}</div>
          <div className="text-[10px] text-emerald-700 font-mono">Active + Published + Visible</div>
        </div>

        <div className={`p-5 rounded-xl border space-y-1 ${lowStockCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-ink/5 border-ink/10'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>RESTOCK ALERTS</span>
            <AlertTriangle size={14} className={lowStockCount > 0 ? 'text-amber-600 animate-pulse' : ''} />
          </div>
          <div className="text-2xl font-bold font-display text-amber-950">{lowStockCount}</div>
          <div className="text-[10px] text-amber-800">On-Hand ≤ Reorder Threshold</div>
        </div>

        <div className="p-5 bg-ink/5 rounded-xl border border-ink/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-ink/50">
            <span>TAXONOMY</span>
            <FolderTree size={14} />
          </div>
          <div className="text-2xl font-bold font-display">{categories.length}</div>
          <div className="text-[10px] text-ink/60">Categories linked</div>
        </div>

        <div className="p-5 bg-ink/5 rounded-xl border border-ink/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-ink/50">
            <span>STOCK LEDGER</span>
            <History size={14} />
          </div>
          <div className="text-2xl font-bold font-display">{adjustments.length}</div>
          <div className="text-[10px] text-ink/60">Inventory logs</div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-ink/10 overflow-x-auto custom-scrollbar pb-px">
        <button
          onClick={() => setActiveSubTab('PRODUCTS')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
            activeSubTab === 'PRODUCTS' ? 'border-ink text-ink bg-ink/5' : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Package size={16} />
          <span>PRODUCTS ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CATEGORIES')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
            activeSubTab === 'CATEGORIES' ? 'border-ink text-ink bg-ink/5' : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <FolderTree size={16} />
          <span>CATEGORIES ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ADJUSTMENTS')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
            activeSubTab === 'ADJUSTMENTS' ? 'border-ink text-ink bg-ink/5' : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <History size={16} />
          <span>INVENTORY ADJUSTMENTS ({adjustments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('AUDIT')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
            activeSubTab === 'AUDIT' ? 'border-ink text-ink bg-ink/5' : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <ShieldCheck size={16} />
          <span>CATALOG AUDIT {auditReport && !auditReport.isHealthy && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('API_SPECS')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
            activeSubTab === 'API_SPECS' ? 'border-ink text-ink bg-ink/5' : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Database size={16} />
          <span>AIRTABLE API & JSON OUTPUT</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: PRODUCTS TABLE & MANAGER
         ========================================================================= */}
      {activeSubTab === 'PRODUCTS' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-paper p-4 border border-ink/10 rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, SKU, or slug..."
                className="w-full pl-9 pr-4 py-2 bg-ink/5 border border-ink/10 rounded-lg text-xs focus:outline-none focus:border-ink"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-ink/5 border border-ink/10 rounded-lg text-xs font-mono font-medium focus:outline-none"
              >
                <option value="ALL">Status: All</option>
                <option value="Active">Status: Active</option>
                <option value="Draft">Status: Draft</option>
                <option value="Archived">Status: Archived</option>
              </select>

              <select
                value={publishFilter}
                onChange={(e) => setPublishFilter(e.target.value)}
                className="py-2 px-3 bg-ink/5 border border-ink/10 rounded-lg text-xs font-mono font-medium focus:outline-none"
              >
                <option value="ALL">Publish: All</option>
                <option value="Published">Published</option>
                <option value="Unpublished">Unpublished</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 bg-ink/5 border border-ink/10 rounded-lg text-xs font-mono font-medium focus:outline-none"
              >
                <option value="ALL">Category: All</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c['Category Name']}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-ink/10 rounded-xl overflow-hidden bg-paper shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ink/5 border-b border-ink/10 text-[10px] font-mono uppercase tracking-widest text-ink/70">
                    <th className="p-4">PRODUCT / SKU</th>
                    <th className="p-4">CATEGORY</th>
                    <th className="p-4">PRICE / COST</th>
                    <th className="p-4">MARGIN %</th>
                    <th className="p-4">ON-HAND STOCK</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">PUBLISH</th>
                    <th className="p-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-xs">
                  {filteredProducts.map((p) => {
                    const isLowStock = p['On-Hand Quantity'] <= p['Reorder Threshold'];
                    const categoryObj = categories.find(c => c.id === p.Category[0] || c['Category Name'] === p.Category[0]);

                    return (
                      <tr key={p.id} className="hover:bg-ink/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.Images && p.Images.length > 0 ? (
                              <img src={p.Images[0].url} alt={p['Product Name']} className="w-10 h-10 object-cover rounded border border-ink/10" />
                            ) : (
                              <div className="w-10 h-10 bg-ink/10 rounded flex items-center justify-center text-ink/30">
                                <Package size={16} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold font-display text-sm">{p['Product Name']}</div>
                              <div className="text-[10px] text-ink/50 font-mono flex items-center gap-2">
                                <span>SKU: <strong className="text-ink">{p.SKU}</strong></span>
                                <span>•</span>
                                <span>/{p['URL Slug']}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-xs">
                          <span className="px-2.5 py-1 bg-ink/5 rounded-full border border-ink/10 text-[11px] font-semibold">
                            {categoryObj ? categoryObj['Category Name'] : p.CategoryName || 'General'}
                          </span>
                        </td>

                        <td className="p-4 font-mono">
                          <div className="font-bold">${p.Price.toFixed(2)}</div>
                          {p.Cost !== undefined && (
                            <div className="text-[10px] text-ink/50">Cost: ${p.Cost.toFixed(2)}</div>
                          )}
                        </td>

                        <td className="p-4 font-mono font-bold text-emerald-700">
                          {((p['Margin (%)'] || 0) * 100).toFixed(1)}%
                        </td>

                        <td className="p-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isLowStock ? 'text-amber-600 font-extrabold' : ''}`}>
                              {p['On-Hand Quantity']} units
                            </span>
                            {isLowStock && (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 text-[9px] font-bold rounded uppercase border border-amber-500/20 flex items-center gap-1">
                                <AlertTriangle size={10} /> RESTOCK
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-ink/40">Threshold: {p['Reorder Threshold']}</div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                            p.Status === 'Active' ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' :
                            p.Status === 'Draft' ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20' :
                            'bg-red-500/10 text-red-800 border border-red-500/20'
                          }`}>
                            {p.Status}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                            p['Publish Status'] === 'Published' ? 'bg-ink text-paper' :
                            p['Publish Status'] === 'Pending' ? 'bg-amber-500/20 text-amber-900' :
                            'bg-ink/10 text-ink/60'
                          }`}>
                            {p['Publish Status']}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setAdjTargetProduct(p);
                                setAdjQuantity(10);
                                setAdjReason('Restock');
                                setShowAdjModal(true);
                              }}
                              title="Adjust Inventory Log"
                              className="p-1.5 hover:bg-ink/10 rounded transition-colors text-ink/70 hover:text-ink"
                            >
                              <Sliders size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct({ ...p });
                                setShowProductModal(true);
                              }}
                              title="Edit Product"
                              className="p-1.5 hover:bg-ink/10 rounded transition-colors text-ink/70 hover:text-ink"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete product '${p['Product Name']}'?`)) {
                                  d3CatalogCms.deleteProduct(p.id);
                                  refreshData();
                                  showToast(`Deleted product '${p['Product Name']}'`);
                                }
                              }}
                              title="Delete Product"
                              className="p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CATEGORIES TAXONOMY
         ========================================================================= */}
      {activeSubTab === 'CATEGORIES' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-paper p-4 border border-ink/10 rounded-xl">
            <div>
              <h3 className="font-display font-bold text-sm">CATEGORY TAXONOMY (AIRTABLE LINKED TABLE)</h3>
              <p className="text-xs text-ink/60">Organize products into hierarchical categories with parent links.</p>
            </div>
            <button
              onClick={() => setShowCatModal(true)}
              className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg shadow transition-all flex items-center gap-2"
            >
              <Plus size={14} />
              <span>NEW CATEGORY</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const linkedProducts = products.filter(p => p.Category.includes(cat.id));
              const parentCat = categories.find(c => cat['Parent Category']?.includes(c.id));

              return (
                <div key={cat.id} className="p-6 bg-paper border border-ink/10 rounded-xl space-y-4 hover:border-ink/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-ink/40 font-mono uppercase">ID: {cat.id}</div>
                      <h4 className="text-lg font-bold font-display">{cat['Category Name']}</h4>
                    </div>
                    {cat['Featured Category'] && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-900 border border-amber-500/30 text-[9px] font-bold uppercase rounded">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink/70">{cat.Description || 'No description provided.'}</p>

                  {parentCat && (
                    <div className="text-xs text-ink/60 bg-ink/5 p-2 rounded flex items-center gap-2">
                      <FolderTree size={12} />
                      <span>Parent Category: <strong>{parentCat['Category Name']}</strong></span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-ink/10 flex justify-between items-center text-xs text-ink/60 font-mono">
                    <span>{linkedProducts.length} Linked Products</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Active Taxonomy</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: INVENTORY ADJUSTMENTS LEDGER
         ========================================================================= */}
      {activeSubTab === 'ADJUSTMENTS' && (
        <div className="space-y-6">
          <div className="bg-paper p-4 border border-ink/10 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-display font-bold text-sm">INVENTORY ADJUSTMENT LEDGER (APPEND-ONLY LOG)</h3>
              <p className="text-xs text-ink/60">Operating Rule 4: Never overwrite stock silently. Every stock delta is logged here with signed change and reason.</p>
            </div>
            <button
              onClick={() => {
                if (products.length > 0) {
                  setAdjTargetProduct(products[0]);
                  setShowAdjModal(true);
                }
              }}
              className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg shadow transition-all flex items-center gap-2"
            >
              <Plus size={14} />
              <span>LOG STOCK ADJUSTMENT</span>
            </button>
          </div>

          <div className="border border-ink/10 rounded-xl overflow-hidden bg-paper shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ink/5 border-b border-ink/10 text-[10px] font-mono uppercase tracking-widest text-ink/70">
                    <th className="p-4">ADJUSTMENT ID</th>
                    <th className="p-4">DATE</th>
                    <th className="p-4">AFFECTED PRODUCT</th>
                    <th className="p-4">QUANTITY CHANGE</th>
                    <th className="p-4">REASON</th>
                    <th className="p-4">NOTES</th>
                    <th className="p-4">ADJUSTED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-xs font-mono">
                  {adjustments.map((adj) => {
                    const isPositive = adj['Quantity Change'] > 0;
                    return (
                      <tr key={adj.id} className="hover:bg-ink/[0.02]">
                        <td className="p-4 font-bold text-ink">
                          {adj['Adjustment ID'] || adj.id}
                        </td>
                        <td className="p-4 text-ink/60">{adj.Date}</td>
                        <td className="p-4 font-bold font-display">
                          {adj.ProductName || adj.Product.join(', ')}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-xs ${
                            isPositive ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' : 'bg-red-500/10 text-red-800 border border-red-500/20'
                          }`}>
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {isPositive ? `+${adj['Quantity Change']}` : adj['Quantity Change']} units
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-ink/5 border border-ink/10 rounded-md font-semibold text-[11px]">
                            {adj.Reason}
                          </span>
                        </td>
                        <td className="p-4 text-ink/70 max-w-xs truncate">{adj.Notes || '-'}</td>
                        <td className="p-4 text-ink/60">{adj['Adjusted By']}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CATALOG INTEGRITY AUDIT
         ========================================================================= */}
      {activeSubTab === 'AUDIT' && auditReport && (
        <div className="space-y-6">
          <div className="p-6 bg-paper border border-ink/10 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-base">CATALOG BUSINESS RULES INTEGRITY AUDIT</h3>
                <p className="text-xs text-ink/60">Automated verification of SKU uniqueness, URL Slug uniqueness, required field constraints, and select options.</p>
              </div>
              <button
                onClick={() => {
                  setAuditReport(d3CatalogCms.runCatalogAudit());
                  showToast("Catalog audit complete.");
                }}
                className="px-4 py-2 border border-ink/20 hover:border-ink/50 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} />
                <span>RE-RUN AUDIT</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-ink/10">
              <div className="p-4 bg-ink/5 rounded-lg border border-ink/10">
                <div className="text-[10px] text-ink/50 font-bold uppercase">SKU COLLISIONS</div>
                <div className={`text-xl font-bold font-display ${auditReport.skuCollisions.length > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {auditReport.skuCollisions.length}
                </div>
              </div>

              <div className="p-4 bg-ink/5 rounded-lg border border-ink/10">
                <div className="text-[10px] text-ink/50 font-bold uppercase">SLUG COLLISIONS</div>
                <div className={`text-xl font-bold font-display ${auditReport.slugCollisions.length > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {auditReport.slugCollisions.length}
                </div>
              </div>

              <div className="p-4 bg-ink/5 rounded-lg border border-ink/10">
                <div className="text-[10px] text-ink/50 font-bold uppercase">MISSING REQUIRED FIELDS</div>
                <div className={`text-xl font-bold font-display ${auditReport.missingRequiredFields.length > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {auditReport.missingRequiredFields.length}
                </div>
              </div>

              <div className="p-4 bg-ink/5 rounded-lg border border-ink/10">
                <div className="text-[10px] text-ink/50 font-bold uppercase">RESTOCK ALERTS</div>
                <div className="text-xl font-bold font-display text-amber-600">
                  {auditReport.lowStockAlerts.length}
                </div>
              </div>
            </div>

            {auditReport.isHealthy ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 text-emerald-900 text-xs font-bold">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>CATALOG HEALTHY: All products pass SKU uniqueness, slug uniqueness, and required field validation!</span>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-900 text-xs font-bold">
                <AlertTriangle size={18} className="text-red-600" />
                <span>ATTENTION NEEDED: Issues detected in catalog definitions. Please resolve collisions or missing fields below.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: AIRTABLE API & JSON OUTPUT EXPECTATIONS
         ========================================================================= */}
      {activeSubTab === 'API_SPECS' && (
        <div className="space-y-6">
          <div className="p-6 bg-paper border border-ink/10 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-base">AIRTABLE API ENDPOINTS & STRUCTURED JSON OUTPUT</h3>
            <p className="text-xs text-ink/60">
              The catalog engine responds with structured JSON mirroring the Airtable base schema for all programmatic requests.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-ink/5 rounded-lg border border-ink/10 space-y-2 font-mono text-xs">
                <div className="font-bold text-ink uppercase">REST API Endpoints Available:</div>
                <ul className="list-disc pl-5 space-y-1 text-ink/80 text-[11px]">
                  <li><code className="bg-ink/10 px-1 py-0.5 rounded text-ink font-bold">GET /api/cms/products?storefront=true</code> - Read active, visible, published products for storefront.</li>
                  <li><code className="bg-ink/10 px-1 py-0.5 rounded text-ink font-bold">POST /api/cms/products</code> - Create product with SKU & Slug uniqueness checks.</li>
                  <li><code className="bg-ink/10 px-1 py-0.5 rounded text-ink font-bold">POST /api/cms/inventory-adjustments</code> - Log stock change (signed delta, reason) & reconcile on-hand total.</li>
                  <li><code className="bg-ink/10 px-1 py-0.5 rounded text-ink font-bold">GET /api/cms/audit</code> - Run complete catalog business rules integrity report.</li>
                </ul>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold font-mono uppercase text-ink/70">Programmatic JSON Response Preview:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(products.slice(0, 2), null, 2));
                      showToast("JSON copied to clipboard!");
                    }}
                    className="text-xs font-bold flex items-center gap-1 text-ink hover:underline"
                  >
                    <Copy size={12} /> Copy JSON
                  </button>
                </div>

                <pre className="p-4 bg-ink text-paper rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 custom-scrollbar">
                  {JSON.stringify({
                    base: "D3 Catalog CMS",
                    table: "Products",
                    operatingRule: "Reads: Status = Active, Visibility = true, Publish Status = Published",
                    records: products.filter(p => p.Status === 'Active' && p.Visibility && p['Publish Status'] === 'Published').map(p => ({
                      id: p.id,
                      fields: {
                        "Product Name": p['Product Name'],
                        "Description": p.Description,
                        "Short Description": p['Short Description'],
                        "Price": p.Price,
                        "Cost": p.Cost,
                        "Margin (%)": p['Margin (%)'],
                        "SKU": p.SKU,
                        "Supplier": p.Supplier,
                        "Status": p.Status,
                        "Category": p.Category,
                        "Tags": p.Tags,
                        "Images": p.Images,
                        "On-Hand Quantity": p['On-Hand Quantity'],
                        "Reorder Threshold": p['Reorder Threshold'],
                        "Visibility": p.Visibility,
                        "Publish Status": p['Publish Status'],
                        "Featured": p.Featured,
                        "SEO Title": p['SEO Title'],
                        "SEO Description": p['SEO Description'],
                        "URL Slug": p['URL Slug'],
                        "Last Updated Date": p['Last Updated Date'],
                        "Inventory Adjustments": p['Inventory Adjustments']
                      }
                    }))
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PRODUCT CREATION / EDITING
         ========================================================================= */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-paper border border-ink/20 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar space-y-6"
          >
            <div className="flex justify-between items-center border-b border-ink/10 pb-4">
              <h3 className="font-display font-bold text-lg uppercase">
                {editingProduct.id ? `EDIT PRODUCT: ${editingProduct['Product Name']}` : 'CREATE NEW CATALOG PRODUCT'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-ink/5 rounded-full">
                <X size={18} />
              </button>
            </div>

            {productModalErrors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 text-xs text-red-900 font-bold">
                {productModalErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">PRODUCT NAME *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct['Product Name'] || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = generateUrlSlug(name);
                      setEditingProduct({
                        ...editingProduct,
                        'Product Name': name,
                        'URL Slug': slug,
                        'SEO Title': `${name} | D3COMPOSURE`
                      });
                    }}
                    placeholder="e.g. D3 07 Heavyweight Knit"
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">SKU (STOCK KEEPING UNIT) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.SKU || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, SKU: e.target.value.toUpperCase() })}
                    placeholder="e.g. D3-KNIT-07"
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">PRICE (USD) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editingProduct.Price || 0}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      const c = editingProduct.Cost || 0;
                      setEditingProduct({
                        ...editingProduct,
                        Price: p,
                        'Margin (%)': calculateMargin(p, c)
                      });
                    }}
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">COST (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.Cost || 0}
                    onChange={(e) => {
                      const c = parseFloat(e.target.value) || 0;
                      const p = editingProduct.Price || 0;
                      setEditingProduct({
                        ...editingProduct,
                        Cost: c,
                        'Margin (%)': calculateMargin(p, c)
                      });
                    }}
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">MARGIN (%)</label>
                  <input
                    type="text"
                    disabled
                    value={`${((editingProduct['Margin (%)'] || 0) * 100).toFixed(1)}%`}
                    className="w-full p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-bold text-emerald-800 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">CATEGORY *</label>
                  <select
                    value={editingProduct.Category?.[0] || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Category: [e.target.value] })}
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c['Category Name']}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">STATUS</label>
                  <select
                    value={editingProduct.Status || 'Active'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Status: e.target.value as D3ProductStatus })}
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none"
                  >
                    {VALID_PRODUCT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">PUBLISH STATUS</label>
                  <select
                    value={editingProduct['Publish Status'] || 'Published'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, 'Publish Status': e.target.value as D3PublishStatus })}
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none"
                  >
                    {VALID_PUBLISH_STATUSES.map(ps => <option key={ps} value={ps}>{ps}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">ON-HAND QUANTITY</label>
                  <input
                    type="number"
                    value={editingProduct['On-Hand Quantity'] || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, 'On-Hand Quantity': parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">REORDER THRESHOLD</label>
                  <input
                    type="number"
                    value={editingProduct['Reorder Threshold'] || 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, 'Reorder Threshold': parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">URL SLUG (AUTO GENERATED)</label>
                <input
                  type="text"
                  required
                  value={editingProduct['URL Slug'] || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, 'URL Slug': generateUrlSlug(e.target.value) })}
                  className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.Visibility ?? true}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Visibility: e.target.checked })}
                    className="rounded text-ink focus:ring-ink"
                  />
                  <span className="text-xs font-bold">STOREFRONT VISIBILITY</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.Featured ?? false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Featured: e.target.checked })}
                    className="rounded text-ink focus:ring-ink"
                  />
                  <span className="text-xs font-bold">FEATURED PRODUCT</span>
                </label>
              </div>

              <div className="pt-4 border-t border-ink/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 border border-ink/20 hover:border-ink/50 text-xs font-bold uppercase rounded-lg"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-ink text-paper hover:bg-ink/90 text-xs font-bold uppercase rounded-lg shadow-lg"
                >
                  {editingProduct.id ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: INVENTORY ADJUSTMENT LOGGING
         ========================================================================= */}
      {showAdjModal && adjTargetProduct && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-paper border border-ink/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-ink/10 pb-4">
              <div>
                <h3 className="font-display font-bold text-base uppercase">LOG INVENTORY ADJUSTMENT</h3>
                <p className="text-xs text-ink/60">Product: <strong>{adjTargetProduct['Product Name']}</strong> ({adjTargetProduct.SKU})</p>
              </div>
              <button onClick={() => setShowAdjModal(false)} className="p-2 hover:bg-ink/5 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-ink/5 rounded-lg border border-ink/10 flex justify-between items-center">
                <span>CURRENT ON-HAND STOCK:</span>
                <span className="font-bold text-sm">{adjTargetProduct['On-Hand Quantity']} units</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">QUANTITY CHANGE (SIGNED INT, e.g. +20 or -5) *</label>
                <input
                  type="number"
                  required
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">REASON (SINGLE SELECT) *</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value as D3AdjustmentReason)}
                  className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                >
                  {VALID_ADJUSTMENT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">NOTES</label>
                <textarea
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="Context regarding stock adjustment..."
                  className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink h-20"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">ADJUSTED BY</label>
                <input
                  type="text"
                  value={adjBy}
                  onChange={(e) => setAdjBy(e.target.value)}
                  className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink"
                />
              </div>

              <div className="pt-4 border-t border-ink/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="px-4 py-2 border border-ink/20 hover:border-ink/50 text-xs font-bold uppercase rounded-lg"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-paper hover:bg-ink/90 text-xs font-bold uppercase rounded-lg shadow-lg"
                >
                  LOG ADJUSTMENT
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CATEGORY CREATION
         ========================================================================= */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-paper border border-ink/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-ink/10 pb-4">
              <h3 className="font-display font-bold text-base uppercase">NEW CATEGORY</h3>
              <button onClick={() => setShowCatModal(false)} className="p-2 hover:bg-ink/5 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">CATEGORY NAME *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. OUTERWEAR"
                  className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">DESCRIPTION</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Category scope and merchandising notes..."
                  className="w-full p-2.5 bg-ink/5 border border-ink/10 rounded-lg focus:outline-none focus:border-ink h-24"
                />
              </div>

              <div className="pt-4 border-t border-ink/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border border-ink/20 text-xs font-bold uppercase rounded-lg"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg shadow-lg"
                >
                  CREATE CATEGORY
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
