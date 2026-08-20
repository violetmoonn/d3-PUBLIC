import React from 'react';
import { motion } from 'motion/react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div 
    className={`animate-pulse bg-black/[0.06] rounded-[var(--radius-phi-1)] ${className}`} 
  />
);

export const ProductCardSkeleton: React.FC<{ isCenterpiece?: boolean }> = ({ isCenterpiece = false }) => {
  return (
    <div className="flex flex-col h-full dimension-card-no-outline rounded-[var(--radius-phi-2)] overflow-hidden bg-white/50 border border-black/5">
      {/* Media Skeleton */}
      <div className={`relative ${isCenterpiece ? 'aspect-[1/1.4] sm:aspect-[1/1.5]' : 'aspect-[1/1.618]'} overflow-hidden bg-black/[0.04] p-4 flex items-center justify-center`}>
        <div className="w-full h-full animate-pulse bg-gradient-to-tr from-black/[0.03] via-black/[0.08] to-black/[0.03] rounded-xs" />
      </div>

      {/* Info Skeleton */}
      <div className={`p-3.5 flex flex-col flex-grow items-center justify-center space-y-2.5 ${isCenterpiece ? 'min-h-[140px] py-6' : 'min-h-[120px]'}`}>
        <SkeletonBox className="h-3.5 w-3/5" />
        <SkeletonBox className="h-3 w-1/4" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-[var(--spacing-phi-6)]">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)] font-mono">
      {/* Left Page (Image Gallery) */}
      <div className="w-full p-6 sm:p-10 lg:p-12 lg:border-r border-ink/10 flex flex-col justify-between space-y-6">
        <div className="relative w-full aspect-square sm:aspect-[1.1/1] lg:aspect-auto lg:h-[calc(100vh-240px)] lg:max-h-[640px] bg-black/[0.04] animate-pulse rounded-xs" />
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="aspect-square bg-black/[0.05] animate-pulse rounded-xs" />
          ))}
        </div>
      </div>

      {/* Right Page (Info & Actions) */}
      <div className="w-full p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <SkeletonBox className="h-8 w-3/4" />
            <SkeletonBox className="h-6 w-1/3" />
            <SkeletonBox className="h-3 w-1/2" />
            <div className="border-t border-black/10 pt-4 space-y-2">
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-3 w-5/6" />
              <SkeletonBox className="h-3 w-4/5" />
            </div>
          </div>
        </div>

        <div className="space-y-6 border-t border-black/10 pt-6">
          <div className="space-y-2">
            <SkeletonBox className="h-3 w-1/4" />
            <div className="flex gap-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="min-w-[44px] h-[40px] bg-black/[0.05] animate-pulse rounded-xs" />
              ))}
            </div>
          </div>
          <div className="w-full h-12 bg-black/[0.08] animate-pulse rounded-xs" />
        </div>
      </div>
    </div>
  );
};
