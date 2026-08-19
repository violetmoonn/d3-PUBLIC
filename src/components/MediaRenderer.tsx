import React, { useState, useEffect } from 'react';
import { ProductAsset } from '../types';
import { EyeOff, Loader2, Image as ImageIcon } from 'lucide-react';
import { convertGoogleDriveUrl } from '../utils/helpers';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface MediaRendererProps {
  asset?: ProductAsset | string;
  fallbackUrl?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  onValidation?: (isValid: boolean) => void;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({ 
  asset, 
  fallbackUrl = '/uploads/hero_banner.jpg',
  className = '', 
  autoPlay = true, 
  controls = false,
  onValidation
}) => {
  const [error, setError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const rawUrl = typeof asset === 'string' ? asset : asset?.url;
  
  // Format local path or drive URL
  let formattedUrl = rawUrl ? convertGoogleDriveUrl(rawUrl) : '';
  if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && !formattedUrl.startsWith('/')) {
    formattedUrl = '/' + formattedUrl;
  }
  // Convert local filenames containing spaces or colons to sanitized paths if needed
  if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    if (formattedUrl.includes(':') || formattedUrl.includes(' ')) {
      const sanitized = formattedUrl.replace(/ /g, '_').replace(/:/g, '_');
      formattedUrl = sanitized;
    }
  }

  const typeFromAsset = typeof asset === 'string' ? undefined : asset?.type;
  
  // Normalize type string
  let type = 'image';
  if (typeFromAsset) {
    if (typeFromAsset.startsWith('video') || typeFromAsset === 'video') type = 'video';
    else if (typeFromAsset.includes('model') || typeFromAsset === 'model3d') type = 'model3d';
  } else {
    const isVideoUrl = formattedUrl?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || formattedUrl?.includes('/video/');
    if (isVideoUrl) type = 'video';
  }

  const [currentSrc, setCurrentSrc] = useState(formattedUrl || fallbackUrl);

  // Reset states when URL changes
  useEffect(() => {
    setError(false);
    setUsedFallback(false);
    setLoading(true);
    setCurrentSrc(formattedUrl || fallbackUrl);

    if (type === 'model3d') {
      import('@google/model-viewer').catch(() => {
        console.warn('[Notice] 3D model viewer module unavailable.');
      });
    }
  }, [formattedUrl, type]);

  const handleError = () => {
    if (currentSrc.startsWith('/assets/images/')) {
      const uploadAlt = currentSrc.replace('/assets/images/', '/uploads/');
      setCurrentSrc(uploadAlt);
      setLoading(true);
    } else if (currentSrc.startsWith('/uploads/')) {
      const assetAlt = currentSrc.replace('/uploads/', '/assets/images/');
      setCurrentSrc(assetAlt);
      setLoading(true);
    } else if (!usedFallback && currentSrc !== fallbackUrl) {
      setUsedFallback(true);
      setCurrentSrc(fallbackUrl);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
      onValidation?.(false);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    onValidation?.(true);
  };

  const activeUrl = error ? fallbackUrl : currentSrc;

  if (!activeUrl || error) {
    return (
      <div className={`relative ${className} flex flex-col items-center justify-center overflow-hidden bg-ink/5 border border-ink/10`}>
        <img 
          src={fallbackUrl} 
          alt="Product Fallback" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-80 filter grayscale"
          onLoad={handleLoad}
          onError={() => setError(true)}
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-center text-white">
          <ImageIcon size={18} className="opacity-70 mb-1" />
          <span className="text-[8px] font-mono tracking-widest uppercase opacity-80">ARTIFACT PREVIEW</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} flex items-center justify-center overflow-hidden`}>
      {loading && (
        <div className="absolute inset-0 z-10 bg-black/[0.04] animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
        </div>
      )}
      
      {type === 'video' ? (
        <video 
          src={activeUrl} 
          className={`w-full h-full ${className.includes('object-contain') ? 'object-contain' : 'object-cover'}`} 
          autoPlay={autoPlay} 
          muted 
          loop 
          controls={controls}
          playsInline
          onLoadedData={handleLoad}
          onError={handleError}
        />
      ) : type === 'model3d' ? (
        // @ts-ignore
        <model-viewer
          src={activeUrl}
          alt="3D model"
          auto-rotate
          camera-controls
          style={{ width: '100%', height: '100%' }}
          className="w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <img 
          key={activeUrl}
          src={activeUrl} 
          alt="Product" 
          referrerPolicy="no-referrer"
          className={`w-full h-full ${className.includes('object-contain') ? 'object-contain' : 'object-cover'}`} 
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};


