import { 
  D3Product, 
  D3Category, 
  D3InventoryAdjustment, 
  D3CatalogAuditReport 
} from '../types';

export interface CMSResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  affectedRecord?: string;
  fieldsChanged?: string[];
  errors?: string[];
  audit?: D3CatalogAuditReport;
}

// Initial Mock Seed Data matching the prompt's schema & rules
export const INITIAL_CMS_CATEGORIES: D3Category[] = [
  {
    id: 'cat_artifacts',
    'Category Name': 'ARTIFACTS',
    Description: 'High-fidelity technical clothing artifacts engineered in Portugal.',
    'Featured Category': true,
    'SEO Title': 'D3COMPOSURE | Technical Artifacts',
    'SEO Description': 'Explore minimalist technical streetwear artifacts crafted with 400+ GSM Portuguese organic cotton.',
    Products: ['prod_01', 'prod_02', 'prod_03', 'prod_04', 'prod_05']
  },
  {
    id: 'cat_garments',
    'Category Name': 'GARMENTS',
    Description: 'Essential graphic apparel and core wardrobe items.',
    'Parent Category': ['cat_artifacts'],
    ParentCategoryName: 'ARTIFACTS',
    'Featured Category': false,
    'SEO Title': 'D3COMPOSURE | Core Garments',
    'SEO Description': 'Core minimalist graphic garments and signature dropped-shoulder tees.',
    Products: ['prod_02', 'prod_04']
  },
  {
    id: 'cat_knits',
    'Category Name': 'CATALOG KNITS',
    Description: 'Technical performance knits and thermal crewnecks.',
    'Featured Category': true,
    'SEO Title': 'D3COMPOSURE | Technical Knits',
    'SEO Description': 'High performance thermal crewnecks and knitwear.',
    Products: ['prod_06']
  }
];

export const INITIAL_CMS_PRODUCTS: D3Product[] = [
  {
    id: 'prod_01',
    'Product Name': 'D3 01 Heavyweight Hoodie',
    Description: 'A high-fidelity heavyweight hoodie artifact crafted for the D3COMPOSURE void. Features an experimental silhouette with technical precision.',
    'Short Description': 'Experimental technical silhouette hoodie in Portuguese organic cotton.',
    Price: 350,
    Cost: 120,
    'Margin (%)': 0.6571,
    SKU: 'D3-HOOD-01',
    Supplier: 'Atelier Porto Ltd',
    Status: 'Active',
    Category: ['cat_artifacts'],
    CategoryName: 'ARTIFACTS',
    Tags: ['New', 'Popular'],
    Images: [
      { url: '/assets/images/IMG_4800_1_3.png', type: 'image' },
      { url: '/assets/images/IMG_3215_3_3.png', type: 'image' },
      { url: '/assets/images/black_hoodie_tracksuit.jpg', type: 'image' },
      { url: '/assets/images/d3_02_garment.jpg', type: 'image' }
    ],
    'On-Hand Quantity': 45,
    'Reorder Threshold': 10,
    Visibility: true,
    'Publish Status': 'Published',
    Featured: true,
    'SEO Title': 'D3 01 Heavyweight Hoodie | D3COMPOSURE',
    'SEO Description': 'Heavyweight Portuguese organic cotton hoodie with dropped shoulders and technical void silhouette.',
    'URL Slug': 'd3-01-heavyweight-hoodie',
    'Last Updated Date': '2026-08-01',
    'Inventory Adjustments': ['adj_1001']
  },
  {
    id: 'prod_02',
    'Product Name': 'D3 02 Graphic Garment',
    Description: 'Essential graphic garment tailored with dropped shoulders and signature technical composition.',
    'Short Description': 'Signature dropped-shoulder graphic tee artifact.',
    Price: 350,
    Cost: 110,
    'Margin (%)': 0.6857,
    SKU: 'D3-TEE-02',
    Supplier: 'Atelier Porto Ltd',
    Status: 'Active',
    Category: ['cat_garments'],
    CategoryName: 'GARMENTS',
    Tags: ['Popular'],
    Images: [
      { url: '/assets/images/d3_02_model_front.jpg', type: 'image' },
      { url: '/assets/images/d3_02_garment.jpg', type: 'image' }
    ],
    'On-Hand Quantity': 28,
    'Reorder Threshold': 15,
    Visibility: true,
    'Publish Status': 'Published',
    Featured: true,
    'SEO Title': 'D3 02 Graphic Garment | D3COMPOSURE',
    'SEO Description': 'Architectural drop-shoulder graphic garment crafted for long-term durability.',
    'URL Slug': 'd3-02-graphic-garment',
    'Last Updated Date': '2026-08-02',
    'Inventory Adjustments': ['adj_1002']
  },
  {
    id: 'prod_03',
    'Product Name': 'D3 03 Archival Unisex Piece',
    Description: 'Archival unisex piece engineered for modern structure and comfort. Made to order.',
    'Short Description': 'Structured archival unisex garment.',
    Price: 350,
    Cost: 130,
    'Margin (%)': 0.6286,
    SKU: 'D3-UNI-03',
    Supplier: 'Atelier Porto Ltd',
    Status: 'Active',
    Category: ['cat_artifacts'],
    CategoryName: 'ARTIFACTS',
    Tags: ['Eco-Friendly'],
    Images: [],
    'On-Hand Quantity': 8,
    'Reorder Threshold': 10, // Triggers Low Stock Alert!
    Visibility: true,
    'Publish Status': 'Published',
    Featured: false,
    'SEO Title': 'D3 03 Archival Unisex Piece | D3COMPOSURE',
    'SEO Description': 'Made-to-order archival unisex artifact engineered with luxury finish.',
    'URL Slug': 'd3-03-archival-unisex-piece',
    'Last Updated Date': '2026-08-03',
    'Inventory Adjustments': ['adj_1003']
  },
  {
    id: 'prod_04',
    'Product Name': 'D3 04 Signature Cotton Tee',
    Description: 'Signature cotton tee featuring minimal typographic detail and refined silhouette.',
    'Short Description': 'Refined minimal typographic cotton tee.',
    Price: 350,
    Cost: 95,
    'Margin (%)': 0.7286,
    SKU: 'D3-TEE-04',
    Supplier: 'Lisbon Textiles',
    Status: 'Active',
    Category: ['cat_garments'],
    CategoryName: 'GARMENTS',
    Tags: ['Sale'],
    Images: [],
    'On-Hand Quantity': 62,
    'Reorder Threshold': 20,
    Visibility: true,
    'Publish Status': 'Published',
    Featured: false,
    'SEO Title': 'D3 04 Signature Cotton Tee | D3COMPOSURE',
    'SEO Description': 'Minimal typographic graphic tee crafted from heavy combed cotton.',
    'URL Slug': 'd3-04-signature-cotton-tee',
    'Last Updated Date': '2026-08-04',
    'Inventory Adjustments': ['adj_1004']
  },
  {
    id: 'prod_05',
    'Product Name': 'D3 05 Experimental Void Sweatshirt',
    Description: 'A high-fidelity artifact crafted for the D3COMPOSURE void. Features an experimental silhouette with technical precision.',
    'Short Description': 'Experimental blue sweatshirt artifact.',
    Price: 350,
    Cost: 125,
    'Margin (%)': 0.6429,
    SKU: 'D3-SWEAT-05',
    Supplier: 'Atelier Porto Ltd',
    Status: 'Active',
    Category: ['cat_artifacts'],
    CategoryName: 'ARTIFACTS',
    Tags: ['New'],
    Images: [{ url: '/src/assets/images/d3_01_blue_sweatshirt_1783500383980.jpg' }],
    'On-Hand Quantity': 18,
    'Reorder Threshold': 12,
    Visibility: true,
    'Publish Status': 'Published',
    Featured: true,
    'SEO Title': 'D3 05 Experimental Void Sweatshirt | D3COMPOSURE',
    'SEO Description': 'High-fidelity blue sweatshirt featuring heavy Portuguese fleece.',
    'URL Slug': 'd3-05-experimental-void-sweatshirt',
    'Last Updated Date': '2026-08-04',
    'Inventory Adjustments': ['adj_1005']
  },
  {
    id: 'prod_06',
    'Product Name': 'D3 06 Technical Knit Crewneck',
    Description: 'The ultimate technical knit designed for high performance, thermal efficiency, and lifelong durability.',
    'Short Description': 'High performance thermal crewneck knit.',
    Price: 350,
    Cost: 140,
    'Margin (%)': 0.6000,
    SKU: 'D3-KNIT-06',
    Supplier: 'Coimbra Mills',
    Status: 'Active',
    Category: ['cat_knits'],
    CategoryName: 'CATALOG KNITS',
    Tags: ['Popular'],
    Images: [{ url: '/src/assets/images/d3_12_blue_crewneck_1783844647220.jpg' }],
    'On-Hand Quantity': 5,
    'Reorder Threshold': 10, // Triggers Low Stock Alert!
    Visibility: true,
    'Publish Status': 'Published',
    Featured: true,
    'SEO Title': 'D3 06 Technical Knit Crewneck | D3COMPOSURE',
    'SEO Description': 'Thermal knit crewneck engineered for lifelong architectural structure.',
    'URL Slug': 'd3-06-technical-knit-crewneck',
    'Last Updated Date': '2026-08-05',
    'Inventory Adjustments': ['adj_1006']
  }
];

export const INITIAL_CMS_ADJUSTMENTS: D3InventoryAdjustment[] = [
  {
    id: 'adj_1001',
    'Adjustment ID': 'ADJ-00001',
    Product: ['prod_01'],
    ProductName: 'D3 01 Heavyweight Hoodie',
    Date: '2026-08-01',
    'Quantity Change': 50,
    Reason: 'New Shipment',
    Notes: 'Initial production run arrival from Porto Atelier.',
    'Adjusted By': 'Judy Lee (Inventory Lead)'
  },
  {
    id: 'adj_1002',
    'Adjustment ID': 'ADJ-00002',
    Product: ['prod_02'],
    ProductName: 'D3 02 Graphic Garment',
    Date: '2026-08-02',
    'Quantity Change': 30,
    Reason: 'Restock',
    Notes: 'Restocked for autumn catalog rollout.',
    'Adjusted By': 'Judy Lee (Inventory Lead)'
  },
  {
    id: 'adj_1003',
    'Adjustment ID': 'ADJ-00003',
    Product: ['prod_03'],
    ProductName: 'D3 03 Archival Unisex Piece',
    Date: '2026-08-03',
    'Quantity Change': -2,
    Reason: 'Damage',
    Notes: 'Damaged in transit during quality control inspection.',
    'Adjusted By': 'Alex Rivera (QC Specialist)'
  },
  {
    id: 'adj_1004',
    'Adjustment ID': 'ADJ-00004',
    Product: ['prod_04'],
    ProductName: 'D3 04 Signature Cotton Tee',
    Date: '2026-08-04',
    'Quantity Change': 65,
    Reason: 'New Shipment',
    Notes: 'Bulk batch received from Lisbon Textiles.',
    'Adjusted By': 'Judy Lee (Inventory Lead)'
  },
  {
    id: 'adj_1005',
    'Adjustment ID': 'ADJ-00005',
    Product: ['prod_05'],
    ProductName: 'D3 05 Experimental Void Sweatshirt',
    Date: '2026-08-04',
    'Quantity Change': 20,
    Reason: 'Restock',
    Notes: 'Replenished sample rack inventory.',
    'Adjusted By': 'Judy Lee (Inventory Lead)'
  },
  {
    id: 'adj_1006',
    'Adjustment ID': 'ADJ-00006',
    Product: ['prod_06'],
    ProductName: 'D3 06 Technical Knit Crewneck',
    Date: '2026-08-05',
    'Quantity Change': -5,
    Reason: 'Sales Correction',
    Notes: 'Reconciled physical count against digital sales.',
    'Adjusted By': 'Alex Rivera (QC Specialist)'
  }
];

class D3CatalogCMSService {
  private products: D3Product[] = [...INITIAL_CMS_PRODUCTS];
  private categories: D3Category[] = [...INITIAL_CMS_CATEGORIES];
  private adjustments: D3InventoryAdjustment[] = [...INITIAL_CMS_ADJUSTMENTS];
  private nextAutonumber: number = 7;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedProds = localStorage.getItem('d3_cms_products');
        const savedCats = localStorage.getItem('d3_cms_categories');
        const savedAdjs = localStorage.getItem('d3_cms_adjustments');
        const savedAuto = localStorage.getItem('d3_cms_autonumber');

        if (savedProds) this.products = JSON.parse(savedProds);
        if (savedCats) this.categories = JSON.parse(savedCats);
        if (savedAdjs) this.adjustments = JSON.parse(savedAdjs);
        if (savedAuto) this.nextAutonumber = parseInt(savedAuto, 10);
      }
    } catch (e) {
      console.warn("Could not load D3 Catalog CMS from localStorage:", e);
    }
  }

  private saveToLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('d3_cms_products', JSON.stringify(this.products));
        localStorage.setItem('d3_cms_categories', JSON.stringify(this.categories));
        localStorage.setItem('d3_cms_adjustments', JSON.stringify(this.adjustments));
        localStorage.setItem('d3_cms_autonumber', this.nextAutonumber.toString());
      }
    } catch (e) {
      console.warn("Could not save D3 Catalog CMS to localStorage:", e);
    }
  }

  // API Methods

  /**
   * Operating Rule 1 (Reads):
   * Storefront view queries Products where Status = Active, Visibility = true, and Publish Status = Published.
   */
  public getStorefrontProducts(): D3Product[] {
    return this.products.filter(p => 
      p.Status === 'Active' && 
      p.Visibility === true && 
      p['Publish Status'] === 'Published'
    );
  }

  public getAllProducts(): D3Product[] {
    return [...this.products];
  }

  public getProductByIdOrSlug(identifier: string): D3Product | undefined {
    return this.products.find(p => p.id === identifier || p['URL Slug'] === identifier || p.SKU === identifier);
  }

  public getAllCategories(): D3Category[] {
    return [...this.categories];
  }

  public getAllInventoryAdjustments(): D3InventoryAdjustment[] {
    return [...this.adjustments];
  }

  /**
   * Operating Rule 2 & 3 (Writes & Uniqueness & Slugs):
   * Create a new product adhering to schema, slug generation, SKU uniqueness, and category link.
   */
  public createProduct(productInput: Partial<D3Product>): CMSResponse<D3Product> {
    const { validateProductRecord, ensureUniqueSlug, calculateMargin } = require('../utils/d3CatalogHelpers');

    // Auto-generate slug if missing
    let slug = productInput['URL Slug'] || ensureUniqueSlug(productInput['Product Name'] || '', this.products);
    
    // Default values according to specification
    const newProduct: D3Product = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      'Product Name': productInput['Product Name']?.trim() || '',
      Description: productInput.Description || '',
      'Short Description': productInput['Short Description'] || '',
      Price: Number(productInput.Price) || 0,
      Cost: productInput.Cost !== undefined ? Number(productInput.Cost) : 0,
      'Margin (%)': calculateMargin(Number(productInput.Price) || 0, productInput.Cost),
      SKU: productInput.SKU?.trim() || '',
      Supplier: productInput.Supplier || 'Internal Studio',
      Status: productInput.Status || 'Active',
      Category: Array.isArray(productInput.Category) ? productInput.Category : productInput.Category ? [productInput.Category] : [],
      CategoryName: '',
      Tags: Array.isArray(productInput.Tags) ? productInput.Tags : [],
      Images: productInput.Images || [],
      'On-Hand Quantity': productInput['On-Hand Quantity'] !== undefined ? Number(productInput['On-Hand Quantity']) : 0,
      'Reorder Threshold': productInput['Reorder Threshold'] !== undefined ? Number(productInput['Reorder Threshold']) : 10,
      Visibility: productInput.Visibility !== undefined ? Boolean(productInput.Visibility) : true,
      'Publish Status': productInput['Publish Status'] || 'Published',
      Featured: Boolean(productInput.Featured),
      'SEO Title': productInput['SEO Title'] || `${productInput['Product Name']} | D3COMPOSURE`,
      'SEO Description': productInput['SEO Description'] || productInput['Short Description'] || '',
      'URL Slug': slug,
      'Last Updated Date': new Date().toISOString().split('T')[0],
      'Inventory Adjustments': []
    };

    // Resolve primary category name
    if (newProduct.Category.length > 0) {
      const cat = this.categories.find(c => c.id === newProduct.Category[0] || c['Category Name'] === newProduct.Category[0]);
      if (cat) newProduct.CategoryName = cat['Category Name'];
    }

    // Validation
    const validation = validateProductRecord(newProduct, this.products, this.categories);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        message: `Product creation rejected: ${validation.errors.join(' ')}`
      };
    }

    // Push record
    this.products.unshift(newProduct);

    // Also update Category linked Products array
    if (newProduct.Category.length > 0) {
      const cat = this.categories.find(c => c.id === newProduct.Category[0]);
      if (cat) {
        if (!cat.Products) cat.Products = [];
        if (!cat.Products.includes(newProduct.id)) cat.Products.push(newProduct.id);
      }
    }

    // Log initial inventory adjustment if initial stock > 0
    if (newProduct['On-Hand Quantity'] > 0) {
      this.createInventoryAdjustment({
        Product: [newProduct.id],
        Date: new Date().toISOString().split('T')[0],
        'Quantity Change': newProduct['On-Hand Quantity'],
        Reason: 'New Shipment',
        Notes: `Initial catalog intake stock for ${newProduct['Product Name']}.`,
        'Adjusted By': 'System Admin'
      }, true); // pass true so we don't double count stock
    }

    this.saveToLocalStorage();

    return {
      success: true,
      data: newProduct,
      affectedRecord: newProduct.id,
      fieldsChanged: Object.keys(newProduct),
      message: `Successfully created Product '${newProduct['Product Name']}' (${newProduct.SKU}) linked to Category '${newProduct.CategoryName || 'General'}'.`
    };
  }

  /**
   * Update Product
   */
  public updateProduct(id: string, updates: Partial<D3Product>): CMSResponse<D3Product> {
    const { validateProductRecord, calculateMargin } = require('../utils/d3CatalogHelpers');
    const existingIndex = this.products.findIndex(p => p.id === id);

    if (existingIndex === -1) {
      return { success: false, errors: [`Product with ID '${id}' not found.`] };
    }

    const current = this.products[existingIndex];

    // Read-only rule check: Never overwrite Last Updated Date manually
    const updatedCandidate: D3Product = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
      'Last Updated Date': new Date().toISOString().split('T')[0] // Auto-updated
    };

    // Recalculate margin if price or cost changed
    if (updates.Price !== undefined || updates.Cost !== undefined) {
      updatedCandidate['Margin (%)'] = calculateMargin(updatedCandidate.Price, updatedCandidate.Cost);
    }

    // Resolve Category Name
    if (updatedCandidate.Category && updatedCandidate.Category.length > 0) {
      const cat = this.categories.find(c => c.id === updatedCandidate.Category[0] || c['Category Name'] === updatedCandidate.Category[0]);
      if (cat) updatedCandidate.CategoryName = cat['Category Name'];
    }

    // Validation
    const validation = validateProductRecord(updatedCandidate, this.products, this.categories);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        message: `Product update rejected: ${validation.errors.join(' ')}`
      };
    }

    this.products[existingIndex] = updatedCandidate;
    this.saveToLocalStorage();

    const changedKeys = Object.keys(updates).filter(k => k !== 'Last Updated Date');

    return {
      success: true,
      data: updatedCandidate,
      affectedRecord: id,
      fieldsChanged: changedKeys,
      message: `Updated Product '${updatedCandidate['Product Name']}'. Modified fields: ${changedKeys.join(', ')}.`
    };
  }

  /**
   * Operating Rule 4 (Inventory Integrity):
   * Never silently overwrite On-Hand Quantity. Always log an Inventory Adjustments record
   * with signed Quantity Change & Reason, then reconcile the on-hand total.
   */
  public createInventoryAdjustment(
    adjInput: Partial<D3InventoryAdjustment>,
    skipStockReconciliation: boolean = false
  ): CMSResponse<D3InventoryAdjustment> {
    const { validateInventoryAdjustmentRecord } = require('../utils/d3CatalogHelpers');

    const productIds = Array.isArray(adjInput.Product) ? adjInput.Product : adjInput.Product ? [adjInput.Product] : [];
    const targetProduct = this.products.find(p => productIds.includes(p.id) || productIds.includes(p['Product Name']));

    if (!targetProduct) {
      return {
        success: false,
        errors: [`Target product '${productIds.join(', ')}' not found.`]
      };
    }

    const autonumberStr = `ADJ-${String(this.nextAutonumber).padStart(5, '0')}`;
    this.nextAutonumber++;

    const newAdj: D3InventoryAdjustment = {
      id: `rec_adj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      'Adjustment ID': autonumberStr,
      Product: [targetProduct.id],
      ProductName: targetProduct['Product Name'],
      Date: adjInput.Date || new Date().toISOString().split('T')[0],
      'Quantity Change': Number(adjInput['Quantity Change']) || 0,
      Reason: adjInput.Reason || 'Inventory Count',
      Notes: adjInput.Notes || '',
      'Adjusted By': adjInput['Adjusted By'] || 'Store Manager'
    };

    const validation = validateInventoryAdjustmentRecord(newAdj, this.products);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        message: `Inventory Adjustment rejected: ${validation.errors.join(' ')}`
      };
    }

    // Reconcile Product On-Hand Quantity
    if (!skipStockReconciliation) {
      const oldStock = targetProduct['On-Hand Quantity'];
      const newStock = Math.max(0, oldStock + newAdj['Quantity Change']);
      targetProduct['On-Hand Quantity'] = newStock;
      targetProduct['Last Updated Date'] = new Date().toISOString().split('T')[0];

      if (!targetProduct['Inventory Adjustments']) targetProduct['Inventory Adjustments'] = [];
      targetProduct['Inventory Adjustments'].push(newAdj.id);
    }

    this.adjustments.unshift(newAdj);
    this.saveToLocalStorage();

    // Check restock alert condition: On-Hand Quantity <= Reorder Threshold
    const isRestockNeeded = targetProduct['On-Hand Quantity'] <= targetProduct['Reorder Threshold'];
    const stockAlertMsg = isRestockNeeded 
      ? ` ⚠️ RESTOCK ALERT: On-Hand stock (${targetProduct['On-Hand Quantity']}) is at or below reorder threshold (${targetProduct['Reorder Threshold']}).`
      : '';

    return {
      success: true,
      data: newAdj,
      affectedRecord: newAdj.id,
      fieldsChanged: ['Adjustment ID', 'Product', 'Quantity Change', 'Reason', 'Date', 'Notes', 'Adjusted By'],
      message: `Logged Inventory Adjustment ${autonumberStr} for '${targetProduct['Product Name']}' (${newAdj['Quantity Change'] >= 0 ? '+' : ''}${newAdj['Quantity Change']} units, Reason: ${newAdj.Reason}). Reconciled On-Hand Stock: ${targetProduct['On-Hand Quantity']}.${stockAlertMsg}`
    };
  }

  /**
   * Category Management
   */
  public createCategory(catInput: Partial<D3Category>): CMSResponse<D3Category> {
    if (!catInput['Category Name']?.trim()) {
      return { success: false, errors: ['Category Name is required.'] };
    }

    const name = catInput['Category Name'].trim();
    if (this.categories.some(c => c['Category Name'].toLowerCase() === name.toLowerCase())) {
      return { success: false, errors: [`Category '${name}' already exists.`] };
    }

    const newCat: D3Category = {
      id: `rec_cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      'Category Name': name,
      Description: catInput.Description || '',
      'Parent Category': catInput['Parent Category'] || [],
      'Category Image': catInput['Category Image'] || [],
      'Featured Category': Boolean(catInput['Featured Category']),
      'SEO Title': catInput['SEO Title'] || `${name} | D3COMPOSURE`,
      'SEO Description': catInput['SEO Description'] || catInput.Description || '',
      Products: []
    };

    this.categories.push(newCat);
    this.saveToLocalStorage();

    return {
      success: true,
      data: newCat,
      affectedRecord: newCat.id,
      fieldsChanged: Object.keys(newCat),
      message: `Created Category '${name}'.`
    };
  }

  /**
   * Delete Product
   */
  public deleteProduct(id: string): CMSResponse<void> {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return { success: false, errors: [`Product '${id}' not found.`] };

    this.products = this.products.filter(p => p.id !== id);
    this.saveToLocalStorage();

    return {
      success: true,
      affectedRecord: id,
      message: `Deleted product '${prod['Product Name']}' (${prod.SKU}).`
    };
  }

  /**
   * Run full audit report
   */
  public runCatalogAudit(): D3CatalogAuditReport {
    const { auditD3Catalog } = require('../utils/d3CatalogHelpers');
    return auditD3Catalog(this.products, this.categories, this.adjustments);
  }

  /**
   * Reset store to initial Airtable demo state
   */
  public resetToDefaultSeed() {
    this.products = [...INITIAL_CMS_PRODUCTS];
    this.categories = [...INITIAL_CMS_CATEGORIES];
    this.adjustments = [...INITIAL_CMS_ADJUSTMENTS];
    this.nextAutonumber = 7;
    this.saveToLocalStorage();
  }
}

export const d3CatalogCms = new D3CatalogCMSService();
