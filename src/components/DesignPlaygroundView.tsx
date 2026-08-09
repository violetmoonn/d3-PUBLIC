import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Download, 
  Share2, 
  Plus, 
  RotateCw, 
  Eye, 
  Grid, 
  Layers, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Sliders, 
  Trash2, 
  Check, 
  Send, 
  Upload, 
  Shuffle,
  RefreshCw,
  Box,
  Maximize2
} from 'lucide-react';

interface DesignPlaygroundViewProps {
  onOpenSubmission?: () => void;
  onAddToCart?: (customProduct: any) => void;
}

export const DesignPlaygroundView: React.FC<DesignPlaygroundViewProps> = ({
  onOpenSubmission,
  onAddToCart
}) => {
  // Garment Bases
  const GARMENTS = [
    { id: 'hoodie', name: 'Heavyweight Hoodie', category: 'TOPS', basePrice: 350 },
    { id: 'tee', name: 'Boxy Heavy Tee', category: 'TOPS', basePrice: 180 },
    { id: 'crewneck', name: 'Technical Crewneck', category: 'TOPS', basePrice: 280 },
    { id: 'sweatpants', name: 'Archival Sweatpants', category: 'BOTTOMS', basePrice: 260 },
    { id: 'cap', name: 'Structured Cap', category: 'HEADWEAR', basePrice: 120 },
    { id: 'tote', name: 'Heavy Canvas Tote', category: 'ACCESSORIES', basePrice: 140 },
  ];

  // Fabric Colors
  const COLOR_PALETTE = [
    { name: 'Void Black', hex: '#0a0a0c', border: '#2a2a2e' },
    { name: 'Archival Chalk', hex: '#f2f0e8', border: '#d0ceb8' },
    { name: 'Cyber Cobalt', hex: '#112240', border: '#233554' },
    { name: 'Acid Slate', hex: '#242830', border: '#3a3f4d' },
    { name: 'Raw Crimson', hex: '#580c1f', border: '#78102a' },
    { name: 'Industrial Olive', hex: '#1e281e', border: '#324032' },
  ];

  // Typography Options
  const FONTS = [
    { id: 'mono', name: 'Monospace Typewriter', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
    { id: 'sans', name: 'Clean Sans-Serif', family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { id: 'impact', name: 'Heavy Impact Display', family: '"Arial Black", "Impact", "Anton", sans-serif' },
    { id: 'serif', name: 'Editorial Serif', family: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  ];

  // Stamp Presets
  const STAMPS = [
    { id: 'barcode', name: 'D3 Barcode', text: '||| | |||| | ||||' },
    { id: 'logo', name: 'D3COMPOSURE', text: 'D3COMPOSURE' },
    { id: 'coords', name: 'GPS Coordinates', text: '37.7749° N • 122.4194° W' },
    { id: 'spec', name: 'Spec Tag', text: 'SPEC: D3-2026 // TYPE-A' },
    { id: 'archive', name: 'Archival Stamp', text: 'ARCHIVAL ARTIFACT [001]' },
    { id: 'crosshair', name: 'Matrix Target', text: '✛ REASON & RHYTHM ✛' }
  ];

  // State
  const [selectedGarment, setSelectedGarment] = useState(GARMENTS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [customHex, setCustomHex] = useState('');
  const [viewAngle, setViewAngle] = useState<'front' | 'back'>('front');
  const [showGrid, setShowGrid] = useState(true);
  const [studioLighting, setStudioLighting] = useState<'dark' | 'bright'>('dark');

  // Design Layers
  const [designText, setDesignText] = useState('D3COMPOSURE');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [textRotation, setTextRotation] = useState(0);
  const [textX, setTextX] = useState(0); // offset -100 to 100
  const [textY, setTextY] = useState(-20); // offset -100 to 100
  const [placement, setPlacement] = useState<'chest' | 'back' | 'left-chest' | 'hem'>('chest');

  const [selectedStamp, setSelectedStamp] = useState<string | null>('barcode');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [savedVault, setSavedVault] = useState<any[]>([]);
  const [statusToast, setStatusToast] = useState<string | null>('SYSTEM READY // STUDIO ACTIVE');
  const [jitterCoords, setJitterCoords] = useState('[X: 00.0, Y: 00.0]');

  // Live coordinate tracker animation
  useEffect(() => {
    const interval = setInterval(() => {
      const rx = (Math.random() * 2 - 1).toFixed(1);
      const ry = (Math.random() * 2 - 1).toFixed(1);
      setJitterCoords(`[X: ${textX + parseFloat(rx)}, Y: ${textY + parseFloat(ry)}]`);
    }, 1200);
    return () => clearInterval(interval);
  }, [textX, textY]);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setStatusToast('CUSTOM ASSET LOADED TO STUDIO');
      };
      reader.readAsDataURL(file);
    }
  };

  // Procedural Randomizer
  const handleRandomize = () => {
    const randomGarment = GARMENTS[Math.floor(Math.random() * GARMENTS.length)];
    const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    const randomFont = FONTS[Math.floor(Math.random() * FONTS.length)];
    const sampleTexts = ['VOID // ARCHIVE', 'PARADIGM 2026', 'D3COMPOSURE', 'SINGULARITY', 'REASON & RHYTHM', 'DEEP FREQUENCY'];
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const randomStamp = STAMPS[Math.floor(Math.random() * STAMPS.length)].id;

    setSelectedGarment(randomGarment);
    setSelectedColor(randomColor);
    setSelectedFont(randomFont);
    setDesignText(randomText);
    setSelectedStamp(randomStamp);
    setTextSize(Math.floor(Math.random() * 20) + 18);
    setTextRotation(Math.random() > 0.7 ? Math.floor(Math.random() * 90) - 45 : 0);
    setStatusToast('PROCEDURAL MATRIX GENERATED NEW CONCEPT');
  };

  // Save to Vault
  const handleSaveToVault = () => {
    const newDesign = {
      id: Date.now().toString(),
      garment: selectedGarment.name,
      color: customHex || selectedColor.hex,
      text: designText,
      font: selectedFont.name,
      timestamp: new Date().toLocaleTimeString(),
      previewColor: customHex || selectedColor.hex
    };
    setSavedVault([newDesign, ...savedVault]);
    setStatusToast('DESIGN ARCHIVED TO LOCAL VAULT');
  };

  const activeColorHex = customHex || selectedColor.hex;

  return (
    <div className="w-full min-h-screen bg-[#070709] text-white font-mono selection:bg-white selection:text-black">
      {/* Studio Top Control Status Bar */}
      <div className="border-b border-white/10 bg-[#0a0a0f] px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider">
              {statusToast}
            </span>
          </div>
          <span className="text-white/30">|</span>
          <span className="text-purple-400">
            SCALE: 1:1 • COORDS: {jitterCoords}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-white">
          <span className="text-blue-400">
            MODE: <strong className="text-white">STUDIO DESIGNER</strong>
          </span>
          <span className="text-white/30">|</span>
          <button 
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-white font-bold transition-all"
          >
            <Shuffle size={12} className="text-blue-400" />
            <span>RANDOMIZE MATRIX</span>
          </button>
        </div>
      </div>

      {/* Main Studio 2-Column Grid Workspace */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-45px)]">
        
        {/* Left Control Inspector Pane (5 Columns) */}
        <div className="lg:col-span-5 p-4 sm:p-6 border-r border-white/10 flex flex-col gap-6 bg-[#0a0a0d] overflow-y-auto max-h-[calc(100vh-45px)]">
          
          {/* Section 1: Garment Base */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Box size={14} className="text-blue-400" />
                <span>1. GARMENT BASE SILHOUETTE</span>
              </label>
              <span className="text-[10px] text-purple-400 font-bold">EST. ${selectedGarment.basePrice} USD</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {GARMENTS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGarment(g)}
                  className={`px-3 py-2.5 text-left rounded border transition-all text-xs flex flex-col justify-between ${
                    selectedGarment.id === g.id
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-white/5 text-white border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  <span className={`text-[9px] mt-1 ${selectedGarment.id === g.id ? 'text-black/70' : 'text-white/40'}`}>
                    {g.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Fabric Color */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} className="text-emerald-400" />
              <span>2. FABRIC COLOR CANVAS</span>
            </label>

            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setSelectedColor(c);
                    setCustomHex('');
                  }}
                  title={c.name}
                  className={`w-8 h-8 rounded-full border-2 transition-transform relative flex items-center justify-center ${
                    selectedColor.name === c.name && !customHex ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex, borderColor: c.border }}
                >
                  {selectedColor.name === c.name && !customHex && (
                    <Check size={14} className={c.hex === '#f2f0e8' ? 'text-black' : 'text-white'} />
                  )}
                </button>
              ))}

              {/* Custom Hex Picker Input */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-2 py-1 ml-auto">
                <span className="text-[10px] text-white/50">HEX:</span>
                <input
                  type="text"
                  placeholder="#0A0A0C"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-20 bg-transparent text-xs text-white uppercase focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Custom Typography & Text */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Type size={14} className="text-blue-400" />
              <span>3. GRAPHIC TYPOGRAPHY & TEXT</span>
            </label>

            <div className="space-y-2">
              <input
                type="text"
                value={designText}
                onChange={(e) => setDesignText(e.target.value)}
                placeholder="ENTER CUSTOM TEXT..."
                className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white uppercase tracking-wider font-mono"
              />

              <div className="grid grid-cols-2 gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f)}
                    className={`px-2.5 py-1.5 text-xs text-left rounded border transition-all truncate ${
                      selectedFont.id === f.id
                        ? 'bg-white text-black font-bold border-white'
                        : 'bg-white/5 text-white border-white/10 hover:border-white/30'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Text Parameters: Size & Rotation & Color */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <div className="flex justify-between text-[10px] text-white mb-1">
                    <span>SIZE</span>
                    <span className="text-purple-400">{textSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={60}
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className="w-full accent-white bg-white/20 h-1 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-white mb-1">
                    <span>ANGLE</span>
                    <span className="text-purple-400">{textRotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={textRotation}
                    onChange={(e) => setTextRotation(Number(e.target.value))}
                    className="w-full accent-white bg-white/20 h-1 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-white mb-1">
                    <span>INK COLOR</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#a855f7'].map((col) => (
                      <button
                        key={col}
                        onClick={() => setTextColor(col)}
                        className={`w-4 h-4 rounded-full border ${textColor === col ? 'ring-2 ring-white scale-110' : ''}`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Position Offsets */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex justify-between text-[10px] text-white mb-1">
                    <span>X POSITION</span>
                    <span className="text-purple-400">{textX}px</span>
                  </div>
                  <input
                    type="range"
                    min={-120}
                    max={120}
                    value={textX}
                    onChange={(e) => setTextX(Number(e.target.value))}
                    className="w-full accent-white bg-white/20 h-1 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-white mb-1">
                    <span>Y POSITION</span>
                    <span className="text-purple-400">{textY}px</span>
                  </div>
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    value={textY}
                    onChange={(e) => setTextY(Number(e.target.value))}
                    className="w-full accent-white bg-white/20 h-1 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Signature Stamps & Uploads */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} className="text-purple-400" />
              <span>4. STENCIL STAMPS & LOGO ASSETS</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {STAMPS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStamp(selectedStamp === s.id ? null : s.id)}
                  className={`px-2 py-1.5 text-[10px] text-center rounded border transition-all truncate ${
                    selectedStamp === s.id
                      ? 'bg-purple-500 text-white font-bold border-purple-400'
                      : 'bg-white/5 text-white/80 border-white/10 hover:border-white/30'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Custom Artwork Upload Button */}
            <div className="pt-2">
              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 border border-dashed border-white/20 hover:border-white rounded cursor-pointer text-xs text-white hover:bg-white/10 transition-all">
                <Upload size={14} className="text-blue-400" />
                <span>UPLOAD CUSTOM PNG / VECTOR</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {uploadedImage && (
                <div className="flex items-center justify-between text-[10px] text-emerald-400 mt-2 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800">
                  <span>✔ ASSET OVERLAY ATTACHED</span>
                  <button 
                    onClick={() => setUploadedImage(null)}
                    className="text-red-400 hover:text-white"
                  >
                    REMOVE
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2 mt-auto">
            <button
              onClick={handleSaveToVault}
              className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2 rounded"
            >
              <Check size={14} />
              <span>SAVE DESIGN TO VAULT</span>
            </button>

            {onOpenSubmission && (
              <button
                onClick={onOpenSubmission}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded"
              >
                <Send size={14} className="text-emerald-400" />
                <span>SUBMIT ARTIFACT FOR PRODUCTION</span>
              </button>
            )}
          </div>

        </div>

        {/* Right Canvas Display Studio (7 Columns) */}
        <div className={`lg:col-span-7 p-6 flex flex-col items-center justify-between relative transition-colors duration-500 ${
          studioLighting === 'dark' ? 'bg-[#040406]' : 'bg-[#e5e5e0] text-black'
        }`}>
          
          {/* Top Canvas View Toolbar */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewAngle(viewAngle === 'front' ? 'back' : 'front')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded border transition-all flex items-center gap-1.5 ${
                  studioLighting === 'dark'
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    : 'bg-black/10 text-black border-black/20 hover:bg-black/20'
                }`}
              >
                <RotateCw size={12} />
                <span>VIEW: {viewAngle.toUpperCase()}</span>
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded border transition-all ${
                  showGrid
                    ? 'bg-blue-500/20 text-blue-400 border-blue-400'
                    : studioLighting === 'dark' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-black/5 border-black/10 text-black/50'
                }`}
                title="Toggle Grid Overlay"
              >
                <Grid size={14} />
              </button>

              <button
                onClick={() => setStudioLighting(studioLighting === 'dark' ? 'bright' : 'dark')}
                className={`p-1.5 rounded border transition-all ${
                  studioLighting === 'bright'
                    ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500'
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
                title="Toggle Studio Lighting"
              >
                <Eye size={14} />
              </button>
            </div>

            <div className="text-right text-[10px] font-mono opacity-60">
              <span>{selectedGarment.name} • {selectedColor.name}</span>
            </div>
          </div>

          {/* Interactive Garment Display Center Workspace */}
          <div className="relative w-full max-w-lg aspect-[1/1.2] flex items-center justify-center my-auto my-6 select-none">
            
            {/* Optional Grid Overlay */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20 border border-white/20"
                style={{
                  backgroundImage: `radial-gradient(${studioLighting === 'dark' ? '#ffffff' : '#000000'} 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              />
            )}

            {/* Render Garment Base Silhouette Vector Canvas */}
            <div 
              className="relative w-full h-full flex items-center justify-center transition-all duration-300 drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.5))' }}
            >
              {/* SVG Silhouette with Dynamic Fabric Color Fill */}
              <svg 
                viewBox="0 0 500 600" 
                className="w-full h-full max-h-[520px] transition-colors duration-300"
              >
                <defs>
                  <radialGradient id="fabricShade" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
                  </radialGradient>
                </defs>

                {/* Hoodie / Tops Path */}
                {selectedGarment.id === 'hoodie' && (
                  <g>
                    {/* Hoodie Silhouette */}
                    <path
                      d="M 150 120 C 180 80, 320 80, 350 120 L 460 180 L 410 320 L 370 290 L 370 520 C 370 540, 350 550, 330 550 L 170 550 C 150 550, 130 540, 130 520 L 130 290 L 90 320 L 40 180 Z"
                      fill={activeColorHex}
                      stroke={studioLighting === 'dark' ? '#ffffff' : '#000000'}
                      strokeWidth="2"
                      strokeOpacity="0.2"
                    />
                    {/* Shadow Layer */}
                    <path
                      d="M 150 120 C 180 80, 320 80, 350 120 L 460 180 L 410 320 L 370 290 L 370 520 C 370 540, 350 550, 330 550 L 170 550 C 150 550, 130 540, 130 520 L 130 290 L 90 320 L 40 180 Z"
                      fill="url(#fabricShade)"
                    />
                    {/* Hood details */}
                    {viewAngle === 'front' ? (
                      <path d="M 210 100 Q 250 160 290 100 C 270 70, 230 70, 210 100 Z" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="2" />
                    ) : (
                      <path d="M 180 100 Q 250 180 320 100" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="2" />
                    )}
                    {/* Kangaroo Pocket */}
                    {viewAngle === 'front' && (
                      <path d="M 170 420 L 330 420 L 350 510 L 150 510 Z" fill="none" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2" />
                    )}
                  </g>
                )}

                {/* Tee Path */}
                {selectedGarment.id === 'tee' && (
                  <g>
                    <path
                      d="M 170 110 C 200 130, 300 130, 330 110 L 450 170 L 410 280 L 360 250 L 360 540 L 140 540 L 140 250 L 90 280 L 50 170 Z"
                      fill={activeColorHex}
                      stroke={studioLighting === 'dark' ? '#ffffff' : '#000000'}
                      strokeWidth="2"
                      strokeOpacity="0.2"
                    />
                    <path
                      d="M 170 110 C 200 130, 300 130, 330 110 L 450 170 L 410 280 L 360 250 L 360 540 L 140 540 L 140 250 L 90 280 L 50 170 Z"
                      fill="url(#fabricShade)"
                    />
                    {/* Crew neck Collar */}
                    <path d="M 170 110 Q 250 150 330 110" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" />
                  </g>
                )}

                {/* Default Fallback Garment (Crewneck/Tote/Cap) */}
                {['crewneck', 'sweatpants', 'cap', 'tote'].includes(selectedGarment.id) && (
                  <g>
                    <rect 
                      x="100" y="100" width="300" height="400" rx="20"
                      fill={activeColorHex} 
                      stroke={studioLighting === 'dark' ? '#ffffff' : '#000000'}
                      strokeWidth="2"
                      strokeOpacity="0.2"
                    />
                    <rect x="100" y="100" width="300" height="400" rx="20" fill="url(#fabricShade)" />
                  </g>
                )}
              </svg>

              {/* OVERLAY ARTWORK LAYER (Custom Text, Stamps, Uploaded Image) */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${textX}px, ${textY}px)`
                }}
              >
                <div 
                  className="flex flex-col items-center justify-center text-center max-w-[280px] p-2 transition-all"
                  style={{
                    transform: `rotate(${textRotation}deg)`,
                  }}
                >
                  {/* Uploaded Image Asset Overlay */}
                  {uploadedImage && (
                    <img 
                      src={uploadedImage} 
                      alt="Custom Artwork"
                      className="max-w-[120px] max-h-[120px] object-contain mb-2 drop-shadow-md"
                    />
                  )}

                  {/* Stamp Preset */}
                  {selectedStamp && (
                    <div className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-80 mb-1 border border-current px-2 py-0.5 rounded" style={{ color: textColor }}>
                      {STAMPS.find(s => s.id === selectedStamp)?.text}
                    </div>
                  )}

                  {/* Main Typography Text */}
                  {designText && (
                    <div 
                      style={{
                        fontFamily: selectedFont.family,
                        fontSize: `${textSize}px`,
                        color: textColor,
                        lineHeight: 1.1
                      }}
                      className="font-bold uppercase tracking-wider drop-shadow-lg break-words max-w-full"
                    >
                      {designText}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Design Vault List / Footer Status */}
          <div className="w-full flex items-center justify-between pt-4 border-t border-white/10 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white/40">SAVED DESIGNS IN VAULT:</span>
              <span className="text-emerald-400 font-bold">{savedVault.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40">STATUS:</span>
              <span className="text-blue-400 font-bold">READY FOR EXPORT</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
