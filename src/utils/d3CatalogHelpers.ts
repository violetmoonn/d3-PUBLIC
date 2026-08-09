import { 
  D3Product, 
  D3Category, 
  D3InventoryAdjustment, 
  D3ProductStatus, 
  D3PublishStatus, 
  D3ProductTag, 
  D3AdjustmentReason,
  D3CatalogAuditReport
} from '../types';

export const VALID_PRODUCT_STATUSES: D3ProductStatus[] = ['Active', 'Draft', 'Archived'];
export const VALID_PUBLISH_STATUSES: D3PublishStatus[] = ['Published', 'Unpublished', 'Pending'];
export const VALID_TAGS: D3ProductTag[] = ['New', 'Sale', 'Popular', 'Eco-Friendly'];
export const VALID_ADJUSTMENT_REASONS: D3AdjustmentReason[] = [
  'Restock', 
  'Sales Correction', 
  'Inventory Count', 
  'Damage', 
  'Return', 
  'New Shipment', 
  'Lost Item'
];

/**
 * Generates a URL-safe lowercase-hyphenated slug from a product name.
 * e.g., "D3 Heavyweight Hoodie!" -> "d3-heavyweight-hoodie"
 */
export function generateUrlSlug(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric chars except space & hyphen
    .replace(/[\s_]+/g, '-')   // Replace spaces/underscores with hyphen
    .replace(/^-+|-+$/g, '');  // Trim leading/trailing hyphens
}

/**
 * Ensures slug uniqueness among existing products.
 * If collision occurs, appends a numeric suffix (e.g., -1, -2).
 */
export function ensureUniqueSlug(desiredSlug: string, existingProducts: D3Product[], currentRecordId?: string): string {
  let slug = generateUrlSlug(desiredSlug);
  if (!slug) slug = 'product-' + Math.random().toString(36).substr(2, 6);

  let counter = 1;
  let candidate = slug;

  while (existingProducts.some(p => p.id !== currentRecordId && p['URL Slug'] === candidate)) {
    candidate = `${slug}-${counter}`;
    counter++;
  }

  return candidate;
}

/**
 * Calculates Profit Margin (%) from Price and Cost.
 * Margin % = (Price - Cost) / Price
 * Returns a decimal between 0 and 1 (or 0 if Price <= 0).
 */
export function calculateMargin(price: number, cost?: number): number {
  if (!price || price <= 0 || cost === undefined || cost === null) return 0;
  const margin = (price - cost) / price;
  return Math.max(0, Math.round(margin * 10000) / 10000); // 4 decimal places
}

/**
 * Validates a Product record against D3 Catalog CMS operating rules.
 */
export function validateProductRecord(
  product: Partial<D3Product>, 
  existingProducts: D3Product[], 
  existingCategories: D3Category[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Required fields: Product Name, SKU, Price, linked Category
  if (!product['Product Name']?.trim()) {
    errors.push("Product Name is required.");
  }

  if (!product.SKU?.trim()) {
    errors.push("SKU is required.");
  }

  if (product.Price === undefined || product.Price === null || isNaN(product.Price) || product.Price < 0) {
    errors.push("Price must be a valid non-negative number.");
  }

  if (!product.Category || product.Category.length === 0) {
    errors.push("Product must link to at least one valid Category.");
  } else {
    // Check linked category IDs exist
    const categoryExists = product.Category.some(catId => 
      existingCategories.some(c => c.id === catId || c['Category Name'] === catId)
    );
    if (!categoryExists) {
      errors.push(`Linked Category '${product.Category.join(', ')}' does not exist in Categories taxonomy.`);
    }
  }

  // 2. Uniqueness checks: SKU and URL Slug
  if (product.SKU?.trim()) {
    const skuMatch = existingProducts.find(p => p.id !== product.id && p.SKU?.trim().toLowerCase() === product.SKU?.trim().toLowerCase());
    if (skuMatch) {
      errors.push(`SKU '${product.SKU}' collides with existing product '${skuMatch['Product Name']}' (${skuMatch.id}). SKU must be unique.`);
    }
  }

  if (product['URL Slug']?.trim()) {
    const slugMatch = existingProducts.find(p => p.id !== product.id && p['URL Slug']?.trim().toLowerCase() === product['URL Slug']?.trim().toLowerCase());
    if (slugMatch) {
      errors.push(`URL Slug '${product['URL Slug']}' collides with existing product '${slugMatch['Product Name']}' (${slugMatch.id}). URL Slug must be unique.`);
    }
  }

  // 3. Select field option validation
  if (product.Status && !VALID_PRODUCT_STATUSES.includes(product.Status)) {
    errors.push(`Invalid Status '${product.Status}'. Allowed options: ${VALID_PRODUCT_STATUSES.join(', ')}.`);
  }

  if (product['Publish Status'] && !VALID_PUBLISH_STATUSES.includes(product['Publish Status'])) {
    errors.push(`Invalid Publish Status '${product['Publish Status']}'. Allowed options: ${VALID_PUBLISH_STATUSES.join(', ')}.`);
  }

  if (product.Tags && product.Tags.length > 0) {
    const invalidTags = product.Tags.filter(t => !VALID_TAGS.includes(t));
    if (invalidTags.length > 0) {
      errors.push(`Invalid Tag(s): '${invalidTags.join(', ')}'. Allowed options: ${VALID_TAGS.join(', ')}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates an Inventory Adjustment record against D3 Catalog CMS operating rules.
 */
export function validateInventoryAdjustmentRecord(
  adjustment: Partial<D3InventoryAdjustment>,
  existingProducts: D3Product[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!adjustment.Product || adjustment.Product.length === 0) {
    errors.push("Product link is required for Inventory Adjustment.");
  } else {
    const productExists = adjustment.Product.some(prodId => 
      existingProducts.some(p => p.id === prodId || p['Product Name'] === prodId)
    );
    if (!productExists) {
      errors.push(`Linked Product '${adjustment.Product.join(', ')}' does not exist.`);
    }
  }

  if (adjustment['Quantity Change'] === undefined || adjustment['Quantity Change'] === null || isNaN(adjustment['Quantity Change']) || adjustment['Quantity Change'] === 0) {
    errors.push("Quantity Change must be a non-zero signed integer (e.g. +10 or -5).");
  }

  if (!adjustment.Reason) {
    errors.push("Reason is required.");
  } else if (!VALID_ADJUSTMENT_REASONS.includes(adjustment.Reason)) {
    errors.push(`Invalid Reason '${adjustment.Reason}'. Allowed options: ${VALID_ADJUSTMENT_REASONS.join(', ')}.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Filter products for Storefront presentation:
 * Rule 1: Status = Active, Visibility = true, Publish Status = Published
 */
export function filterStorefrontProducts(products: D3Product[]): D3Product[] {
  return products.filter(p => 
    p.Status === 'Active' && 
    p.Visibility === true && 
    p['Publish Status'] === 'Published'
  );
}

/**
 * Runs a comprehensive catalog health & business rule integrity audit.
 */
export function auditD3Catalog(
  products: D3Product[],
  categories: D3Category[],
  adjustments: D3InventoryAdjustment[]
): D3CatalogAuditReport {
  const report: D3CatalogAuditReport = {
    timestamp: new Date().toISOString(),
    skuCollisions: [],
    slugCollisions: [],
    missingRequiredFields: [],
    invalidSelectValues: [],
    lowStockAlerts: [],
    totalProducts: products.length,
    totalCategories: categories.length,
    totalAdjustments: adjustments.length,
    isHealthy: true
  };

  // SKU Collisions
  const skuMap = new Map<string, { recordIds: string[]; productNames: string[] }>();
  products.forEach(p => {
    if (p.SKU) {
      const skuKey = p.SKU.trim().toLowerCase();
      if (!skuMap.has(skuKey)) {
        skuMap.set(skuKey, { recordIds: [], productNames: [] });
      }
      const entry = skuMap.get(skuKey)!;
      entry.recordIds.push(p.id);
      entry.productNames.push(p['Product Name']);
    }
  });

  skuMap.forEach((val, skuKey) => {
    if (val.recordIds.length > 1) {
      report.skuCollisions.push({
        sku: skuKey,
        recordIds: val.recordIds,
        productNames: val.productNames
      });
    }
  });

  // Slug Collisions
  const slugMap = new Map<string, { recordIds: string[]; productNames: string[] }>();
  products.forEach(p => {
    if (p['URL Slug']) {
      const slugKey = p['URL Slug'].trim().toLowerCase();
      if (!slugMap.has(slugKey)) {
        slugMap.set(slugKey, { recordIds: [], productNames: [] });
      }
      const entry = slugMap.get(slugKey)!;
      entry.recordIds.push(p.id);
      entry.productNames.push(p['Product Name']);
    }
  });

  slugMap.forEach((val, slugKey) => {
    if (val.recordIds.length > 1) {
      report.slugCollisions.push({
        slug: slugKey,
        recordIds: val.recordIds,
        productNames: val.productNames
      });
    }
  });

  // Check required fields, select values, and low stock alerts
  products.forEach(p => {
    const missing: string[] = [];
    if (!p['Product Name']?.trim()) missing.push('Product Name');
    if (!p.SKU?.trim()) missing.push('SKU');
    if (p.Price === undefined || p.Price === null) missing.push('Price');
    if (!p.Category || p.Category.length === 0) missing.push('Category');

    if (missing.length > 0) {
      report.missingRequiredFields.push({
        recordId: p.id,
        productName: p['Product Name'] || 'Unnamed',
        missingFields: missing
      });
    }

    // Invalid select values
    if (p.Status && !VALID_PRODUCT_STATUSES.includes(p.Status)) {
      report.invalidSelectValues.push({
        recordId: p.id,
        productName: p['Product Name'],
        field: 'Status',
        value: p.Status,
        allowed: VALID_PRODUCT_STATUSES
      });
    }

    if (p['Publish Status'] && !VALID_PUBLISH_STATUSES.includes(p['Publish Status'])) {
      report.invalidSelectValues.push({
        recordId: p.id,
        productName: p['Product Name'],
        field: 'Publish Status',
        value: p['Publish Status'],
        allowed: VALID_PUBLISH_STATUSES
      });
    }

    if (p.Tags) {
      p.Tags.forEach(t => {
        if (!VALID_TAGS.includes(t)) {
          report.invalidSelectValues.push({
            recordId: p.id,
            productName: p['Product Name'],
            field: 'Tags',
            value: t,
            allowed: VALID_TAGS
          });
        }
      });
    }

    // Low stock trigger: On-Hand Quantity <= Reorder Threshold
    if (p['On-Hand Quantity'] !== undefined && p['Reorder Threshold'] !== undefined) {
      if (p['On-Hand Quantity'] <= p['Reorder Threshold']) {
        report.lowStockAlerts.push({
          recordId: p.id,
          productName: p['Product Name'],
          sku: p.SKU,
          onHand: p['On-Hand Quantity'],
          reorderThreshold: p['Reorder Threshold']
        });
      }
    }
  });

  report.isHealthy = (
    report.skuCollisions.length === 0 &&
    report.slugCollisions.length === 0 &&
    report.missingRequiredFields.length === 0 &&
    report.invalidSelectValues.length === 0
  );

  return report;
}
