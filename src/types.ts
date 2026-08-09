export interface ProductAsset {
  uid?: string;
  url: string;
  type: 'image' | 'video' | 'model3d';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: ProductAsset[];
  category: string;
  stock: number;
  is_visible: boolean;
  is_featured?: boolean;
  sizes?: string[];
  stripe_payment_link?: string;
  stripe_buy_button_id?: string;
  stripe_product_id?: string;
  stripeBuyButtonId?: string;
  stripe_publishable_key?: string;
  external_payment_link?: string;
  provenanceImage?: string;
  button_logic?: 'add_to_bag' | 'buy_now';
  product_id?: string;
  tags?: string[];
  specs?: Record<string, string>;
  status?: 'approved' | 'pending' | 'rejected';
  is_user_submitted?: boolean;
  author_uid?: string;
  created_at?: any;
  updated_at?: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  total_amount: number;
  discount_code?: string;
  status: string;
  items: any[];
  created_at: any;
  tracking_number?: string;
}

export interface Announcement {
  id: string;
  text: string;
  link?: string;
  active: boolean;
  background_color?: string;
  text_color?: string;
  created_at: any;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  min_purchase?: number;
  usage_count: number;
  usage_limit?: number;
  active: boolean;
  created_at: any;
}

export interface LogEntry {
  id: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SUCCESS';
  action: string;
  message: string;
  user?: string;
  timestamp: any;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: any;
}

export interface DriveLink {
  id: string;
  original_url: string;
  converted_url: string;
  file_id: string;
  created_at: any;
}

export interface AppSettings {
  site_title?: string;
  site_subtitle?: string;
  hero_type?: 'IMAGE' | 'VIDEO';
  hero_url?: string;
  hero_banner_url?: string; // Keep for backward compatibility if needed, but prefer hero_url
  hero_slides?: ProductAsset[];
  hero_title?: string;
  hero_subtitle?: string;
  accent_color?: string;
  primary_color?: string;
  admin_password?: string;
  maintenance_mode?: boolean;
  store_status?: 'LIVE' | 'MAINTENANCE';
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  sections?: {
    store?: boolean;
    logos?: boolean;
    ethos?: boolean;
    sustainability?: boolean;
    provenance?: boolean;
    lab?: boolean;
    chess?: boolean;
    contact?: boolean;
    privacy?: boolean;
    shipping?: boolean;
    refund?: boolean;
    terms?: boolean;
  };
  tab_store_label?: string;
  tab_logos_label?: string;
  tab_ethos_label?: string;
  tab_sustainability_label?: string;
  tab_provenance_label?: string;
  tab_lab_label?: string;
  tab_chess_label?: string;
  tab_contact_label?: string;
  tab_privacy_label?: string;
  tab_shipping_label?: string;
  tab_refund_label?: string;
  tab_terms_label?: string;
  protocol_version?: string;
  inference_title?: string;
  inference_content?: string;
  anonymity_title?: string;
  anonymity_content?: string;
  sublimation_title?: string;
  sublimation_content?: string;
  boutique_title?: string;
  boutique_subtitle?: string;
  contact_email?: string;
  discord_webhook_url?: string;
  [key: string]: any;
}

// ============================================================================
// D3 CATALOG CMS (AIRTABLE BASE SCHEMA & BUSINESS RULES)
// ============================================================================

export type D3ProductStatus = 'Active' | 'Draft' | 'Archived';
export type D3PublishStatus = 'Published' | 'Unpublished' | 'Pending';
export type D3ProductTag = 'New' | 'Sale' | 'Popular' | 'Eco-Friendly';
export type D3AdjustmentReason = 
  | 'Restock' 
  | 'Sales Correction' 
  | 'Inventory Count' 
  | 'Damage' 
  | 'Return' 
  | 'New Shipment' 
  | 'Lost Item';

export interface D3ImageAttachment {
  url: string;
  filename?: string;
  size?: number;
  type?: string;
}

export interface D3Product {
  id: string; // Airtable Record ID or generated ID
  'Product Name': string;
  Description?: string;
  'Short Description'?: string;
  Price: number;
  Cost?: number;
  'Margin (%)'?: number;
  SKU: string;
  Supplier?: string;
  Status: D3ProductStatus;
  Category: string[]; // Linked Category record IDs
  CategoryName?: string; // Resolved primary category name for display
  Tags?: D3ProductTag[];
  Images?: D3ImageAttachment[];
  'On-Hand Quantity': number;
  'Reorder Threshold': number;
  Visibility: boolean;
  'Publish Status': D3PublishStatus;
  Featured: boolean;
  'SEO Title'?: string;
  'SEO Description'?: string;
  'URL Slug': string;
  'Last Updated Date'?: string; // Read-only auto date
  'Inventory Adjustments'?: string[]; // Linked Inventory Adjustment record IDs
}

export interface D3Category {
  id: string; // Airtable Record ID or generated ID
  'Category Name': string;
  Description?: string;
  'Parent Category'?: string[]; // Linked parent category record IDs
  ParentCategoryName?: string;
  'Category Image'?: D3ImageAttachment[];
  'Featured Category'?: boolean;
  'SEO Title'?: string;
  'SEO Description'?: string;
  Products?: string[]; // Linked Product record IDs
}

export interface D3InventoryAdjustment {
  id: string; // Airtable Record ID or generated ID
  'Adjustment ID'?: string; // System-generated Autonumber e.g. ADJ-00001 (read-only)
  Product: string[]; // Linked Product record IDs
  ProductName?: string;
  Date: string; // ISO date string YYYY-MM-DD
  'Quantity Change': number; // Signed int (+ = added, - = removed)
  Reason: D3AdjustmentReason;
  Notes?: string;
  'Adjusted By': string; // User/collaborator
}

export interface D3CatalogAuditReport {
  timestamp: string;
  skuCollisions: { sku: string; recordIds: string[]; productNames: string[] }[];
  slugCollisions: { slug: string; recordIds: string[]; productNames: string[] }[];
  missingRequiredFields: { recordId: string; productName: string; missingFields: string[] }[];
  invalidSelectValues: { recordId: string; productName: string; field: string; value: string; allowed: string[] }[];
  lowStockAlerts: { recordId: string; productName: string; sku: string; onHand: number; reorderThreshold: number }[];
  totalProducts: number;
  totalCategories: number;
  totalAdjustments: number;
  isHealthy: boolean;
}
