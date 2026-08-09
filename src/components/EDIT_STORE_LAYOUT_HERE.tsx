/**
 * ============================================================================
 * !!! EDIT_STORE_LAYOUT_HERE.tsx !!!
 * ============================================================================
 * This file dictates the OVERALL layout of your store.
 * Amateur coders: Edit this file to change the Hero section, category filters,
 * and how the product grid is arranged.
 * ============================================================================
 */

import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { AppSettings, Product } from '../types';
import { ProductCard } from './EDIT_PRODUCT_UI_HERE';

interface StoreViewProps {
  settings: AppSettings;
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  filteredProducts: Product[];
  products: Product[];
  onAddToCart: (product: Product, size: string) => void;
  onSelectProduct: (product: Product) => void;
  isAdmin?: boolean;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => Promise<boolean>;
  onDuplicateProduct?: (product: Product) => Promise<boolean>;
  onUpdateProduct?: (updates: Partial<Product>) => Promise<boolean>;
  onLinkUpload?: (productId: string, url: string) => Promise<void>;
  onToggleVisibility?: (product: Product) => Promise<boolean>;
  onToggleFeatured?: (product: Product) => Promise<boolean>;
  onUpdateSettings?: (updates: Partial<AppSettings>) => Promise<void>;
  onAddProduct?: () => Promise<void>;
  onOpenSubmission?: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  settings,
  categories,
  activeCategory,
  setActiveCategory,
  filteredProducts,
  products,
  onAddToCart,
  onSelectProduct,
  isAdmin = false,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onUpdateProduct,
  onLinkUpload,
  onToggleVisibility,
  onToggleFeatured,
  onUpdateSettings,
  onAddProduct,
  onOpenSubmission
}) => {
  const isSingleProduct = filteredProducts.length === 1;

  return (
    <motion.div 
      key={`store-${settings.tab_store_label}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="max-w-[1440px] mx-auto px-[var(--spacing-phi-5)] sm:px-[var(--spacing-phi-6)] md:px-[var(--spacing-phi-7)] pt-4">
        {isSingleProduct ? (
          <div className="flex flex-col items-center justify-center w-full py-2 sm:py-6 md:py-10">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
              <ProductCard 
                key={filteredProducts[0].id || `${filteredProducts[0].name}-0`} 
                product={filteredProducts[0]} 
                index={0}
                onAddToCart={onAddToCart}
                onSelect={(p) => onSelectProduct(p)}
                isAdmin={isAdmin} 
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                onDuplicate={onDuplicateProduct}
                onUpdateProduct={onUpdateProduct}
                onLinkUpload={(url) => onLinkUpload?.(filteredProducts[0].id, url)}
                onToggleVisibility={() => onToggleVisibility?.(filteredProducts[0])}
                onToggleFeatured={() => onToggleFeatured?.(filteredProducts[0])}
                isCenterpiece={true}
              />
            </div>

            {isAdmin && (
              <div className="mt-8">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onAddProduct}
                  className="px-6 py-3 border border-dashed border-ink/30 flex items-center gap-2 hover:border-ink hover:bg-ink/5 transition-all text-ink/60 hover:text-ink text-xs font-mono uppercase tracking-widest"
                >
                  <Plus size={16} />
                  <span>ADD NEW ARTIFACT</span>
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          /* Product Grid (3x3 Layout) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-[var(--spacing-phi-6)]">
            {filteredProducts.map((product, idx) => (
              <ProductCard 
                key={product.id || `${product.name}-${idx}`} 
                product={product} 
                index={idx}
                onAddToCart={onAddToCart}
                onSelect={(p) => onSelectProduct(p)}
                isAdmin={isAdmin} 
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                onDuplicate={onDuplicateProduct}
                onUpdateProduct={onUpdateProduct}
                onLinkUpload={(url) => onLinkUpload?.(product.id, url)}
                onToggleVisibility={() => onToggleVisibility?.(product)}
                onToggleFeatured={() => onToggleFeatured?.(product)}
              />
            ))}

            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onAddProduct}
                className="relative aspect-[1/1.618] border border-dashed border-ink/20 flex flex-col items-center justify-center gap-4 hover:border-ink hover:bg-ink/5 transition-all text-ink/40 hover:text-ink group"
              >
                <div className="w-12 h-12 rounded-full border border-ink/10 flex items-center justify-center group-hover:border-ink transition-colors">
                  <Plus size={24} />
                </div>
                <div className="text-center px-4">
                  <p className="text-[10px] font-mono tracking-[0.2em] uppercase">NEW ARTIFACT</p>
                  <p className="text-[8px] font-mono opacity-60 uppercase mt-2">CLICK TO CREATE</p>
                </div>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
