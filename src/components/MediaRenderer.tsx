import React, { useState, useEffect } from 'react';
import { ProductAsset } from '../types';
import { EyeOff, Loader2, Image as ImageIcon } from 'lucide-react';
import { convertMediaUrl, getMediaCandidates } from '../utils/helpers';

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

const DEFAULT_FALLBACK = '/assets/images/IMG_4800_1_3.png';

export const MediaRenderer: React.FC<MediaRendererProps> = ({ 
  asset, 
  fallbackUrl,
  className = '', 
  autoPlay = true, 
  controls = false,
  onValidation
}) => {
  const [error, setError] = useState(false);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const rawUrl = typeof asset === 'string' ? asset : asset?.url;
  const formattedUrl = rawUrl ? convertMediaUrl(rawUrl) : '';

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

  const [candidates, setCandidates] = useState<string[]>(() => getMediaCandidates(formattedUrl, fallbackUrl));

  // Reset states when URL changes
  useEffect(() => {
    setError(false);
    setAttemptIndex(0);
    setLoading(true);
    setCandidates(getMediaCandidates(formattedUrl, fallbackUrl));

    if (type === 'model3d') {
      import('@google/model-viewer').catch(() => {
        console.warn('[Notice] 3D model viewer module unavailable.');
      });
    }
  }, [formattedUrl, fallbackUrl, type]);

  const currentSrc = candidates[attemptIndex] || fallbackUrl || DEFAULT_FALLBACK;

  const handleError = () => {
    if (attemptIndex + 1 < candidates.length) {
      setAttemptIndex(prev => prev + 1);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
      onValidation?.(false);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onValidation?.(true);
  };

  return (
    <div className={`relative ${className} flex items-center justify-center overflow-hidden`}>
      {loading && (
        <div className="absolute inset-0 z-10 bg-black/[0.04] animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
        </div>
      )}
      
      {type === 'video' ? (
        <video 
          src={currentSrc} 
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
          src={currentSrc}
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
          key={`${currentSrc}-${attemptIndex}`}
          src={currentSrc} 
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


