import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sliders, 
  Crosshair, 
  Grid as GridIcon, 
  Activity, 
  Zap, 
  Layers, 
  Tv, 
  X, 
  Film, 
  Download, 
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { Product } from '../types';

interface SurgicalVideoItem {
  id: string;
  title: string;
  code: string;
  url: string;
  category: string;
  duration: string;
  resolution: string;
  fps: number;
  focalLength: string;
  description: string;
  telemetry: {
    peakDecibels: string;
    warpSpeed: string;
    trebleEnergy: string;
    quantumJitter: string;
  };
}

interface SurgicalVideosViewProps {
  products?: Product[];
  onNavigate?: (view: string) => void;
  onClose?: () => void;
}

const DEFAULT_SURGICAL_REELS: SurgicalVideoItem[] = [
  {
    id: 'reel-01',
    title: 'SURGICAL REEL 01 // HIGH-SPEED STITCH & WEAVE TEARDOWN',
    code: 'SRG-001',
    url: 'https://lh3.googleusercontent.com/d/1Vva7aQJxxVP6mJE8AM8VbpMWRAp2T6f0',
    category: 'MACRO INSPECTION',
    duration: '00:02:14:08',
    resolution: '3840x2160 UHD',
    fps: 120,
    focalLength: '50mm T1.2 Anamorphic',
    description: 'High-speed 120fps ultra-macro capture inspecting seam tension, fabric elasticity, and structural grain integrity under heavy stress testing.',
    telemetry: {
      peakDecibels: '-6.2 dB',
      warpSpeed: '0.998 c',
      trebleEnergy: '+4.2 kHz',
      quantumJitter: '< 0.002 ms'
    }
  },
  {
    id: 'reel-02',
    title: 'SURGICAL REEL 02 // TENSILE STRESS & ERGONOMIC RANGE TEST',
    code: 'SRG-002',
    url: 'https://lh3.googleusercontent.com/d/1Vva7aQJxxVP6mJE8AM8VbpMWRAp2T6f0',
    category: 'LAB DYNAMICS',
    duration: '00:01:45:12',
    resolution: '4096x2160 DCI 4K',
    fps: 240,
    focalLength: '85mm T1.4 Macro',
    description: 'Ultra-slow motion kinetic analysis measuring range of movement, joint seam distortion, and recovery rate on technical cotton fleece.',
    telemetry: {
      peakDecibels: '-12.8 dB',
      warpSpeed: '0.842 c',
      trebleEnergy: '+3.1 kHz',
      quantumJitter: '< 0.001 ms'
    }
  },
  {
    id: 'reel-03',
    title: 'SURGICAL REEL 03 // CHROMATIC SPECTRA & DYE RESISTANCE',
    code: 'SRG-003',
    url: 'https://lh3.googleusercontent.com/d/1Vva7aQJxxVP6mJE8AM8VbpMWRAp2T6f0',
    category: 'SPECTRAL ANALYSIS',
    duration: '00:03:10:00',
    resolution: '3840x2160 UHD',
    fps: 60,
    focalLength: '35mm T1.5 Cine',
    description: 'Spectral wavelength absorption testing under extreme UV spectrum exposure. Evaluates pigment stability and reflectance indexes.',
    telemetry: {
      peakDecibels: '-18.4 dB',
      warpSpeed: '0.912 c',
      trebleEnergy: '+5.6 kHz',
      quantumJitter: '< 0.004 ms'
    }
  }
];

export const SurgicalVideosView: React.FC<SurgicalVideosViewProps> = ({
  products = [],
  onNavigate,
  onClose
}) => {
  // Combine default surgical reels with any product video assets
  const productVideos: SurgicalVideoItem[] = (products || []).flatMap((p, idx) => 
    (p.images || [])
      .filter(img => img.type === 'video' && img.url)
      .map((img, vIdx) => ({
        id: `prod-vid-${p.id}-${vIdx}`,
        title: `SURGICAL CAPTURE // ${p.name.toUpperCase()} (ASSET ${vIdx + 1})`,
        code: `PRD-${p.id.substring(0, 4)}`,
        url: img.url,
        category: p.category ? p.category.toUpperCase() : 'ARTIFACT',
        duration: '00:01:30:00',
        resolution: '3840x2160 UHD',
        fps: 60,
        focalLength: '50mm Cine',
        description: `Product motion analysis for ${p.name}. Inspecting garment fall, silhouette structure, and finish detail under motion studio lighting.`,
        telemetry: {
          peakDecibels: '-8.5 dB',
          warpSpeed: '0.950 c',
          trebleEnergy: '+3.8 kHz',
          quantumJitter: '< 0.003 ms'
        }
      }))
  );

  const allReels = [...DEFAULT_SURGICAL_REELS, ...productVideos];
  const [activeReel, setActiveReel] = useState<SurgicalVideoItem>(allReels[0]);

  // Video State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showReticleOverlay, setShowReticleOverlay] = useState<boolean>(true);
  const [showTelemetryOverlay, setShowTelemetryOverlay] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // Sync Video Controls
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, activeReel]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const stepFrame = (direction: 'forward' | 'backward') => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    const fps = activeReel.fps || 30;
    const frameTime = 1 / fps;
    const newTime = direction === 'forward' 
      ? Math.min(duration, currentTime + frameTime) 
      : Math.max(0, currentTime - frameTime);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Format time code MM:SS:FF
  const formatTimecode = (seconds: number, fps: number = 30) => {
    if (isNaN(seconds) || seconds < 0) return '00:00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const categories = ['ALL', ...Array.from(new Set(allReels.map(r => r.category)))];
  const filteredReels = activeCategoryFilter === 'ALL'
    ? allReels
    : allReels.filter(r => r.category === activeCategoryFilter);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-2 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto select-none">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/15 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-white">
              SURGICAL VIDEO REEL ANALYSIS
            </h1>
          </div>
          <p className="text-[9px] sm:text-[10px] text-white/60 uppercase tracking-widest mt-0.5 sm:mt-1">
            ULTRA-HIGH FREQUENCY KINETIC INSPECTION // PRECISION OPTICS & MOTION TELEMETRY
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-white/20 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <X size={13} className="sm:w-3.5 sm:h-3.5" />
              <span>CLOSE VIEW</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('store')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-black hover:bg-neutral-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <span>RETURN TO STORE</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Player on Left, Playlist & Technical Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Left Column: Player Viewport (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          
          <div 
            ref={containerRef}
            className="relative aspect-video w-full bg-neutral-950 border border-white/20 overflow-hidden group shadow-2xl rounded-sm"
          >
            {/* The Actual Video Element */}
            <video
              ref={videoRef}
              src={activeReel.url}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* Grid Overlay */}
            {showGridOverlay && (
              <div className="absolute inset-0 pointer-events-none border border-white/10 opacity-30 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:40px_40px]" />
            )}

            {/* Reticle Overlay */}
            {showReticleOverlay && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                <div className="w-16 h-16 sm:w-24 sm:h-24 border border-dashed border-cyan-400/60 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-ping" />
                </div>
                <div className="absolute w-full h-[1px] bg-white/10" />
                <div className="absolute h-full w-[1px] bg-white/10" />
              </div>
            )}

            {/* Top Bar Telemetry Watermark Overlay */}
            {showTelemetryOverlay && (
              <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between text-[8px] sm:text-[9px] uppercase tracking-widest font-mono text-white/80 bg-black/75 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 border border-white/15 pointer-events-none">
                <div className="flex items-center gap-2 sm:gap-4 truncate">
                  <span className="font-bold text-white truncate">[ REC ] {activeReel.code}</span>
                  <span className="hidden sm:inline text-cyan-400">FPS: {activeReel.fps}</span>
                  <span className="hidden md:inline text-emerald-400">RES: {activeReel.resolution}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-red-500 font-bold">PEAK: {activeReel.telemetry.peakDecibels}</span>
                  <span className="hidden xs:inline text-purple-400">JITTER: {activeReel.telemetry.quantumJitter}</span>
                </div>
              </div>
            )}

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-1.5 sm:gap-3 transition-opacity duration-300">
              
              {/* Progress Slider Bar */}
              <div className="space-y-0.5 sm:space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.01}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 sm:h-1.5 bg-white/20 appearance-none cursor-pointer accent-white hover:bg-white/40 transition-colors"
                />
                <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-mono text-white/70">
                  <span className="text-cyan-400 font-bold">{formatTimecode(currentTime, activeReel.fps)}</span>
                  <span className="hidden xs:inline text-[7.5px] sm:text-[9px] tracking-widest opacity-60">TIMECODE</span>
                  <span className="text-white/50">{formatTimecode(duration, activeReel.fps)}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap">
                
                {/* Playback Controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer rounded-xs"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={12} className="sm:w-3.5 sm:h-3.5" /> : <Play size={12} className="sm:w-3.5 sm:h-3.5" />}
                  </button>

                  <button
                    onClick={() => stepFrame('backward')}
                    className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-xs"
                    title="Previous Frame"
                  >
                    <ChevronLeft size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    onClick={() => stepFrame('forward')}
                    className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-xs"
                    title="Next Frame"
                  >
                    <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        setCurrentTime(0);
                      }
                    }}
                    className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-xs"
                    title="Restart"
                  >
                    <RotateCcw size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>

                  {/* Audio Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-1.5 sm:p-2 transition-colors cursor-pointer rounded-xs ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={12} className="sm:w-3.5 sm:h-3.5" /> : <Volume2 size={12} className="sm:w-3.5 sm:h-3.5" />}
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-white/10 p-0.5 sm:p-1 rounded-xs border border-white/10">
                  <span className="hidden md:inline text-[8px] opacity-50 px-1">SPEED:</span>
                  {[0.5, 1.0, 1.5, 2.0].map(rate => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-1 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-xs transition-colors cursor-pointer ${
                        playbackRate === rate ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Overlay Toggles & Fullscreen */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setShowGridOverlay(!showGridOverlay)}
                    className={`p-1.5 sm:p-2 transition-colors cursor-pointer rounded-xs border ${
                      showGridOverlay ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/10 border-white/10 text-white/50'
                    }`}
                    title="Toggle Grid"
                  >
                    <GridIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    onClick={() => setShowReticleOverlay(!showReticleOverlay)}
                    className={`p-1.5 sm:p-2 transition-colors cursor-pointer rounded-xs border ${
                      showReticleOverlay ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/10 border-white/10 text-white/50'
                    }`}
                    title="Toggle Reticle"
                  >
                    <Crosshair size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-xs"
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize size={12} className="sm:w-3.5 sm:h-3.5" /> : <Maximize size={12} className="sm:w-3.5 sm:h-3.5" />}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Active Reel Technical Description & Spec Box */}
          <div className="bg-neutral-900 border border-white/15 p-3 sm:p-5 space-y-3 sm:space-y-4 rounded-sm">
            <div className="flex justify-between items-start border-b border-white/10 pb-2.5 sm:pb-3 gap-2">
              <div>
                <span className="text-[8.5px] sm:text-[9px] font-bold text-cyan-400 uppercase tracking-widest block">
                  [{activeReel.category}] {activeReel.code}
                </span>
                <h2 className="text-xs sm:text-sm font-black uppercase text-white mt-0.5 sm:mt-1">
                  {activeReel.title}
                </h2>
              </div>
              <span className="text-[8.5px] sm:text-[10px] bg-white/10 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 border border-white/15 uppercase tracking-wider shrink-0">
                LENS: {activeReel.focalLength}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed uppercase">
              {activeReel.description}
            </p>

            {/* 4-Color Signature Palette Telemetry Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1 sm:pt-2 text-[9px] sm:text-[10px] uppercase font-mono">
              <div className="bg-black/40 p-2 sm:p-2.5 border border-white/10">
                <span className="text-white/40 block text-[7.5px] sm:text-[8px]">PEAK DECIBELS</span>
                <span className="text-red-500 font-bold">{activeReel.telemetry.peakDecibels}</span>
              </div>

              <div className="bg-black/40 p-2 sm:p-2.5 border border-white/10">
                <span className="text-white/40 block text-[7.5px] sm:text-[8px]">WARP SPEED</span>
                <span className="text-cyan-400 font-bold">{activeReel.telemetry.warpSpeed}</span>
              </div>

              <div className="bg-black/40 p-2 sm:p-2.5 border border-white/10">
                <span className="text-white/40 block text-[7.5px] sm:text-[8px]">TREBLE ENERGY</span>
                <span className="text-emerald-400 font-bold">{activeReel.telemetry.trebleEnergy}</span>
              </div>

              <div className="bg-black/40 p-2 sm:p-2.5 border border-white/10">
                <span className="text-white/40 block text-[7.5px] sm:text-[8px]">QUANTUM JITTER</span>
                <span className="text-purple-400 font-bold">{activeReel.telemetry.quantumJitter}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Playlist & Selection Drawer (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3 sm:space-y-4">
          
          <div className="bg-neutral-900 border border-white/15 p-3 sm:p-4 space-y-3 sm:space-y-4 rounded-sm">
            
            <div className="flex justify-between items-center pb-2">
              <div className="flex items-center gap-2">
                <Film size={15} className="text-white/60" />
                <h3 className="text-[18px] font-bold uppercase tracking-wider text-white">
                  SURGICAL REEL LIBRARY ({allReels.length})
                </h3>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`text-[14px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all ${
                    activeCategoryFilter === cat 
                      ? 'text-white font-extrabold' 
                      : 'text-white/40 hover:text-white font-medium'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Reel Clips List */}
            <div className="space-y-2.5 sm:space-y-3 max-h-[280px] sm:max-h-[400px] lg:max-h-[520px] overflow-y-auto pr-1">
              {filteredReels.map((reel) => {
                const isActive = reel.id === activeReel.id;

                return (
                  <div
                    key={reel.id}
                    onClick={() => {
                      setActiveReel(reel);
                      setIsPlaying(true);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                      }
                    }}
                    className={`p-2.5 sm:p-3 border transition-all cursor-pointer space-y-1.5 sm:space-y-2 group relative ${
                      isActive 
                        ? 'bg-white/10 border-white text-white shadow-lg' 
                        : 'bg-black/30 border-white/10 text-white/70 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${
                        isActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 opacity-60'
                      }`}>
                        {reel.code}
                      </span>
                      <span className="text-[8.5px] sm:text-[9px] opacity-40 font-mono">
                        {reel.duration}
                      </span>
                    </div>

                    <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wide line-clamp-2 text-white">
                      {reel.title}
                    </h4>

                    <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] opacity-50 uppercase pt-1 border-t border-white/5">
                      <span>FPS: {reel.fps}</span>
                      <span>RES: {reel.resolution}</span>
                    </div>

                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Quick Technical Specs & Export Status */}
          <div className="bg-neutral-950 border border-white/10 p-3 sm:p-4 space-y-2 sm:space-y-3 text-[9px] sm:text-[10px] text-white/60 uppercase">
            <div className="flex items-center justify-between text-white font-bold border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                SURGICAL OPTICS SYSTEM
              </span>
              <span className="text-[7.5px] sm:text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="leading-normal text-[8.5px] sm:text-[9px]">
              All motion captures utilize calibrated 4K/120fps anamorphic glass to perform optical stress tests and inspect textile weave dynamics under studio conditions.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
