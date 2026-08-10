import React, { useState, useEffect } from 'react';
import { 
  Terminal,
  Cpu,
  Zap,
  Activity,
  Radio,
  Binary,
  RotateCw, 
  Eye, 
  Grid, 
  Layers, 
  Palette, 
  Type, 
  Check, 
  Send, 
  Upload, 
  Shuffle,
  Box,
  Code2,
  Compass,
  GitCommit,
  Sliders
} from 'lucide-react';

interface DesignPlaygroundViewProps {
  onOpenSubmission?: () => void;
  onAddToCart?: (customProduct: any) => void;
}

export const DesignPlaygroundView: React.FC<DesignPlaygroundViewProps> = ({
  onOpenSubmission,
}) => {
  // Garment Bases
  const GARMENTS = [
    { id: 'hoodie', name: 'Heavyweight Hoodie', category: 'SILHOUETTE_01', basePrice: 350 },
    { id: 'tee', name: 'Boxy Heavy Tee', category: 'SILHOUETTE_02', basePrice: 180 },
    { id: 'crewneck', name: 'Technical Crewneck', category: 'SILHOUETTE_03', basePrice: 280 },
    { id: 'sweatpants', name: 'Archival Sweatpants', category: 'SILHOUETTE_04', basePrice: 260 },
    { id: 'cap', name: 'Structured Cap', category: 'SILHOUETTE_05', basePrice: 120 },
    { id: 'tote', name: 'Heavy Canvas Tote', category: 'SILHOUETTE_06', basePrice: 140 },
  ];

  // Fabric Colors
  const COLOR_PALETTE = [
    { name: 'Void Matrix Black', hex: '#0a0a0c', border: '#2a2a2e' },
    { name: 'Quantum Chalk', hex: '#f2f0e8', border: '#d0ceb8' },
    { name: 'Cyber Cobalt', hex: '#112240', border: '#233554' },
    { name: 'Acid Slate', hex: '#242830', border: '#3a3f4d' },
    { name: 'Raw Crimson Singularity', hex: '#580c1f', border: '#78102a' },
    { name: 'Phosphor Green', hex: '#0f291e', border: '#10b981' },
  ];

  // Typography Options
  const FONTS = [
    { id: 'mono', name: 'Cryptic Monospace CRT', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
    { id: 'sans', name: 'Clean Sans-Serif Vector', family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { id: 'impact', name: 'Heavy Impact Qubit', family: '"Arial Black", "Impact", "Anton", sans-serif' },
    { id: 'serif', name: 'Editorial Serif Matrix', family: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  ];

  // Cryptic Stamp Presets (Binary & Qubit Notation)
  const STAMPS = [
    { id: 'qubit_state', name: '|Ψ⟩ Superposition', text: '|Ψ⟩ = 0.707|0⟩ + 0.707|1⟩' },
    { id: 'binary_stream', name: '01010 Bit Matrix', text: '01000100 00110011' },
    { id: 'bloch', name: 'Bloch Vector', text: 'BLOCH [θ: 45° • φ: 90°]' },
    { id: 'hadamard', name: 'Hadamard H Gate', text: 'H⊗I ENTANGLED REGISTER' },
    { id: 'barcode', name: 'D3 Barcode Bit', text: '||| | |||| | ||||' },
    { id: 'crosshair', name: 'Target Qubit 01', text: '✛ QUBIT_01 SINGULARITY ✛' }
  ];

  // State
  const [selectedGarment, setSelectedGarment] = useState(GARMENTS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [customHex, setCustomHex] = useState('');
  const [viewAngle, setViewAngle] = useState<'front' | 'back'>('front');
  const [showGrid, setShowGrid] = useState(true);
  const [studioLighting, setStudioLighting] = useState<'dark' | 'bright'>('dark');

  // Quantum Qubit Parameters
  const [qubitPhase, setQubitPhase] = useState(45); // 0 to 180 degrees
  const [qubitEntangled, setQubitEntangled] = useState(true);
  const [pauliSpinInverted, setPauliSpinInverted] = useState(false);

  // Design Layers
  const [designText, setDesignText] = useState('D3COMPOSURE');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(26);
  const [textRotation, setTextRotation] = useState(0);
  const [textX, setTextX] = useState(0);
  const [textY, setTextY] = useState(-20);

  const [selectedStamp, setSelectedStamp] = useState<string | null>('qubit_state');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [savedVault, setSavedVault] = useState<any[]>([]);
  const [statusToast, setStatusToast] = useState<string>('QUBIT_STATE: |Ψ⟩ INITIALIZED // TERMINAL ACTIVE');
  const [binaryTicker, setBinaryTicker] = useState('01010101011010100101');
  const [telemetry, setTelemetry] = useState({
    p0: '0.500',
    p1: '0.500',
    fidelity: '99.98%',
    decoherence: '124.8 µs',
    gate: 'H⊗Z'
  });

  // Ticking Quantum Binary & Matrix Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Generate random binary bitstream
      let b = '';
      for (let i = 0; i < 24; i++) {
        b += Math.random() > 0.5 ? '1' : '0';
      }
      setBinaryTicker(b);

      // Compute probabilistic state amplitudes from qubit phase
      const rad = (qubitPhase * Math.PI) / 180;
      const prob0 = Math.cos(rad / 2) ** 2;
      const prob1 = Math.sin(rad / 2) ** 2;

      setTelemetry({
        p0: prob0.toFixed(3),
        p1: prob1.toFixed(3),
        fidelity: (99.80 + Math.random() * 0.19).toFixed(2) + '%',
        decoherence: (120 + Math.random() * 10).toFixed(1) + ' µs',
        gate: pauliSpinInverted ? 'Pauli-X ⊗ H' : 'H ⊗ CNOT'
      });
    }, 800);
    return () => clearInterval(interval);
  }, [qubitPhase, pauliSpinInverted]);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setStatusToast('CUSTOM VECTOR ASSET LINKED TO QUBIT MATRIX');
      };
      reader.readAsDataURL(file);
    }
  };

  // Procedural Randomizer with Quantum Superposition
  const handleRandomize = () => {
    const randomGarment = GARMENTS[Math.floor(Math.random() * GARMENTS.length)];
    const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    const randomFont = FONTS[Math.floor(Math.random() * FONTS.length)];
    const crypticTexts = [
      '01010 // SINGULARITY',
      'QUBIT_01 [|0⟩ + |1⟩]',
      'D3COMPOSURE',
      '01000100 00110011',
      'BELL_STATE_Φ+',
      'DEEP FREQUENCY'
    ];
    const randomText = crypticTexts[Math.floor(Math.random() * crypticTexts.length)];
    const randomStamp = STAMPS[Math.floor(Math.random() * STAMPS.length)].id;
    const newPhase = Math.floor(Math.random() * 180);

    setSelectedGarment(randomGarment);
    setSelectedColor(randomColor);
    setSelectedFont(randomFont);
    setDesignText(randomText);
    setSelectedStamp(randomStamp);
    setQubitPhase(newPhase);
    setPauliSpinInverted(Math.random() > 0.5);
    setTextSize(Math.floor(Math.random() * 20) + 20);
    setTextRotation(Math.random() > 0.7 ? Math.floor(Math.random() * 90) - 45 : 0);
    setStatusToast(`QUANTUM COLLAPSE: NEW SUPERPOSITION STATE DETECTED [θ: ${newPhase}°]`);
  };

  // Save to Vault
  const handleSaveToVault = () => {
    const newDesign = {
      id: Date.now().toString(),
      garment: selectedGarment.name,
      color: customHex || selectedColor.hex,
      text: designText,
      font: selectedFont.name,
      phase: qubitPhase,
      timestamp: new Date().toLocaleTimeString(),
      previewColor: customHex || selectedColor.hex
    };
    setSavedVault([newDesign, ...savedVault]);
    setStatusToast('DESIGN ARTIFACT COLLAPSED & ARCHIVED TO QUANTUM VAULT');
  };

  const activeColorHex = customHex || selectedColor.hex;

  return (
    <div className="w-full min-h-screen bg-[#050508] text-white font-mono selection:bg-emerald-400 selection:text-black relative">
      
      {/* Top Cryptic Quantum Terminal Header Ticker */}
      <div className="border-b border-white/10 bg-[#07070b] px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-3 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              {statusToast}
            </span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-purple-400 text-[11px] font-mono">
            BITSTREAM: <span className="text-white font-bold tracking-widest">{binaryTicker}</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-blue-400">
            QUBIT STATE: <strong className="text-white">|Ψ⟩ = {telemetry.p0}|0⟩ + {telemetry.p1}|1⟩</strong>
          </span>
          <span className="text-white/20">|</span>
          <button 
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded text-emerald-300 font-bold transition-all text-[11px]"
          >
            <Shuffle size={12} className="text-emerald-400" />
            <span>MEASURE & COLLAPSE STATE</span>
          </button>
        </div>
      </div>

      {/* Main Studio 2-Column Grid Workspace */}
      <div className="max-w-[1650px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-42px)]">
        
        {/* Left Cryptic Terminal Control Inspector Pane (5 Columns) */}
        <div className="lg:col-span-5 p-4 sm:p-6 border-r border-white/10 flex flex-col gap-5 bg-[#08080d] overflow-y-auto max-h-[calc(100vh-42px)]">
          
          {/* Terminal Command Header Prompt */}
          <div className="p-3 bg-black/60 border border-white/10 rounded font-mono text-xs space-y-1">
            <div className="flex items-center justify-between text-white/50 text-[10px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Terminal size={12} /> root@d3-quantum-lab:~#
              </span>
              <span className="text-purple-400">GATE: {telemetry.gate}</span>
            </div>
            <p className="text-white text-[11px] font-mono leading-relaxed">
              &gt; EXECUTE_DESIGN_COMPOSER --target=GARMENT_MATRIX --qubits=8
            </p>
            <div className="flex items-center gap-3 text-[10px] text-white/60 pt-1 border-t border-white/10">
              <span className="text-blue-400">FIDELITY: {telemetry.fidelity}</span>
              <span>DECOHERENCE: {telemetry.decoherence}</span>
              <span className="text-amber-400">T₁/T₂ LOCKED</span>
            </div>
          </div>

          {/* Section 1: Garment Base Silhouette */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Box size={13} className="text-blue-400" />
                <span>01. GARMENT SILHOUETTE REGISTER</span>
              </label>
              <span className="text-[10px] text-purple-400 font-mono font-bold">EST. ${selectedGarment.basePrice} USD</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {GARMENTS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGarment(g)}
                  className={`px-3 py-2 text-left rounded border transition-all text-xs flex flex-col justify-between ${
                    selectedGarment.id === g.id
                      ? 'bg-white text-black border-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                      : 'bg-white/5 text-white border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  <span className={`text-[9px] mt-1 font-mono ${selectedGarment.id === g.id ? 'text-black/70' : 'text-emerald-400/80'}`}>
                    [{g.category}]
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Quantum Fabric Color */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Palette size={13} className="text-emerald-400" />
              <span>02. FABRIC MATRIX COLOR CANVAS</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setSelectedColor(c);
                    setCustomHex('');
                  }}
                  title={c.name}
                  className={`w-7 h-7 rounded-full border-2 transition-transform relative flex items-center justify-center ${
                    selectedColor.name === c.name && !customHex ? 'scale-110 ring-2 ring-emerald-400' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex, borderColor: c.border }}
                >
                  {selectedColor.name === c.name && !customHex && (
                    <Check size={12} className={c.hex === '#f2f0e8' ? 'text-black' : 'text-white'} />
                  )}
                </button>
              ))}

              {/* Custom Hex Input */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded px-2 py-1 ml-auto">
                <span className="text-[10px] text-emerald-400 font-mono">HEX:</span>
                <input
                  type="text"
                  placeholder="#0A0A0C"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-16 bg-transparent text-[11px] text-white uppercase focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Qubit Quantum Controls */}
          <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2 text-[11px]">
                <Cpu size={13} className="text-purple-400" />
                <span>03. QUBIT SUPERPOSITION PARAMETERS</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">θ = {qubitPhase}°</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] text-white mb-1">
                  <span>BLOCH SPHERE ROTATION (θ)</span>
                  <span className="text-purple-400">STATE: |Ψ({qubitPhase}°)⟩</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={qubitPhase}
                  onChange={(e) => setQubitPhase(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-white/20 h-1 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setPauliSpinInverted(!pauliSpinInverted)}
                  className={`px-2.5 py-1 text-[10px] rounded border transition-all flex items-center gap-1.5 ${
                    pauliSpinInverted 
                      ? 'bg-red-500/20 text-red-400 border-red-500' 
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
                  }`}
                >
                  <Zap size={11} />
                  <span>PAULI-X SPIN FLIP: {pauliSpinInverted ? 'ON [|1⟩]' : 'OFF [|0⟩]'}</span>
                </button>

                <button
                  onClick={() => setQubitEntangled(!qubitEntangled)}
                  className={`px-2.5 py-1 text-[10px] rounded border transition-all flex items-center gap-1.5 ${
                    qubitEntangled 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-400' 
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
                  }`}
                >
                  <Radio size={11} />
                  <span>ENTANGLEMENT: {qubitEntangled ? 'BELL STATE' : 'DECOHERED'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Typography & Custom Text Input */}
          <div className="space-y-2.5 border-t border-white/10 pt-3">
            <label className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Type size={13} className="text-blue-400" />
              <span>04. VECTOR TEXT & BIT ENCODING</span>
            </label>

            <div className="space-y-2">
              <input
                type="text"
                value={designText}
                onChange={(e) => setDesignText(e.target.value)}
                placeholder="ENTER CRYPTIC VECTOR TEXT..."
                className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 uppercase tracking-widest font-mono"
              />

              <div className="grid grid-cols-2 gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f)}
                    className={`px-2 py-1.5 text-[11px] text-left rounded border transition-all truncate ${
                      selectedFont.id === f.id
                        ? 'bg-white text-black font-bold border-white'
                        : 'bg-white/5 text-white border-white/10 hover:border-white/30'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Text Sliders */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
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
                  <div className="flex items-center gap-1 pt-0.5">
                    {['#ffffff', '#000000', '#10b981', '#ef4444', '#3b82f6', '#a855f7'].map((col) => (
                      <button
                        key={col}
                        onClick={() => setTextColor(col)}
                        className={`w-3.5 h-3.5 rounded-full border ${textColor === col ? 'ring-2 ring-white scale-110' : ''}`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Position Offsets */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-white mb-1">
                    <span>X COORD</span>
                    <span className="text-blue-400">{textX}px</span>
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
                    <span>Y COORD</span>
                    <span className="text-blue-400">{textY}px</span>
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

          {/* Section 5: Cryptic Binary Stamps & Uploads */}
          <div className="space-y-2.5 border-t border-white/10 pt-3">
            <label className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Layers size={13} className="text-purple-400" />
              <span>05. CRYPTIC STENCILS & BINARY ASSETS</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {STAMPS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStamp(selectedStamp === s.id ? null : s.id)}
                  className={`px-2 py-1.5 text-[10px] text-left rounded border transition-all truncate ${
                    selectedStamp === s.id
                      ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 text-white/80 border-white/10 hover:border-white/30'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Custom Asset Upload */}
            <div className="pt-1">
              <label className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-white/5 border border-dashed border-white/20 hover:border-emerald-400 rounded cursor-pointer text-xs text-white hover:bg-white/10 transition-all">
                <Upload size={13} className="text-emerald-400" />
                <span>UPLOAD CUSTOM PNG / VECTOR</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {uploadedImage && (
                <div className="flex items-center justify-between text-[10px] text-emerald-400 mt-1.5 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/60 font-mono">
                  <span>✔ OVERLAY VECTOR LINKED</span>
                  <button 
                    onClick={() => setUploadedImage(null)}
                    className="text-red-400 hover:text-white"
                  >
                    UNLINK
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2 mt-auto">
            <button
              onClick={handleSaveToVault}
              className="w-full py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2 rounded shadow-md"
            >
              <Check size={14} />
              <span>COLLAPSE & SAVE TO VAULT</span>
            </button>

            {onOpenSubmission && (
              <button
                onClick={onOpenSubmission}
                className="w-full py-2 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded"
              >
                <Send size={13} className="text-emerald-400" />
                <span>SUBMIT ARTIFACT FOR PRODUCTION</span>
              </button>
            )}
          </div>

        </div>

        {/* Right Canvas Display Studio (7 Columns) */}
        <div className={`lg:col-span-7 p-6 flex flex-col items-center justify-between relative transition-colors duration-500 ${
          studioLighting === 'dark' ? 'bg-[#030305]' : 'bg-[#e5e5e0] text-black'
        }`}>
          
          {/* Top Canvas View Toolbar */}
          <div className="w-full flex items-center justify-between z-10 text-xs font-mono">
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
                <span>PERSPECTIVE: {viewAngle.toUpperCase()}</span>
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded border transition-all ${
                  showGrid
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400'
                    : studioLighting === 'dark' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-black/5 border-black/10 text-black/50'
                }`}
                title="Toggle Matrix Grid Overlay"
              >
                <Grid size={13} />
              </button>

              <button
                onClick={() => setStudioLighting(studioLighting === 'dark' ? 'bright' : 'dark')}
                className={`p-1.5 rounded border transition-all ${
                  studioLighting === 'bright'
                    ? 'bg-amber-500/20 text-amber-600 border-amber-500'
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
                title="Toggle CRT / Daylight Lighting"
              >
                <Eye size={13} />
              </button>
            </div>

            <div className="text-right text-[10px] font-mono opacity-80 flex items-center gap-3">
              <span className="text-emerald-400">01010 BITMATRIX</span>
              <span className="text-purple-400">{selectedGarment.name}</span>
            </div>
          </div>

          {/* Interactive Garment Display Center Canvas Workspace */}
          <div className="relative w-full max-w-lg aspect-[1/1.2] flex items-center justify-center my-auto my-6 select-none">
            
            {/* Optional Binary Grid Overlay */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20 border border-emerald-500/30 overflow-hidden flex flex-col justify-between p-2 font-mono text-[9px] text-emerald-400 select-none"
                style={{
                  backgroundImage: `radial-gradient(${studioLighting === 'dark' ? '#10b981' : '#000000'} 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              >
                <div className="flex justify-between">
                  <span>|01010011|</span>
                  <span>[BLOCH_VECTOR: θ={qubitPhase}°]</span>
                  <span>|11001010|</span>
                </div>
                <div className="flex justify-between">
                  <span>q₀: |Ψ⟩</span>
                  <span>q₁: {telemetry.p0}</span>
                  <span>q₂: {telemetry.p1}</span>
                </div>
              </div>
            )}

            {/* Render Garment Base Silhouette Canvas */}
            <div 
              className="relative w-full h-full flex items-center justify-center transition-all duration-300 drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.6))' }}
            >
              {/* SVG Silhouette with Dynamic Fabric Color Fill */}
              <svg 
                viewBox="0 0 500 600" 
                className="w-full h-full max-h-[520px] transition-colors duration-300"
              >
                <defs>
                  <radialGradient id="fabricShade" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
                  </radialGradient>
                </defs>

                {/* Hoodie / Tops Path */}
                {selectedGarment.id === 'hoodie' && (
                  <g>
                    {/* Hoodie Silhouette */}
                    <path
                      d="M 150 120 C 180 80, 320 80, 350 120 L 460 180 L 410 320 L 370 290 L 370 520 C 370 540, 350 550, 330 550 L 170 550 C 150 550, 130 540, 130 520 L 130 290 L 90 320 L 40 180 Z"
                      fill={activeColorHex}
                      stroke={studioLighting === 'dark' ? '#10b981' : '#000000'}
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
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
                      stroke={studioLighting === 'dark' ? '#10b981' : '#000000'}
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                    />
                    <path
                      d="M 170 110 C 200 130, 300 130, 330 110 L 450 170 L 410 280 L 360 250 L 360 540 L 140 540 L 140 250 L 90 280 L 50 170 Z"
                      fill="url(#fabricShade)"
                    />
                    {/* Crew neck Collar */}
                    <path d="M 170 110 Q 250 150 330 110" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" />
                  </g>
                )}

                {/* Default Fallback Garment (Crewneck/Tote/Cap/Sweatpants) */}
                {['crewneck', 'sweatpants', 'cap', 'tote'].includes(selectedGarment.id) && (
                  <g>
                    <rect 
                      x="100" y="100" width="300" height="400" rx="20"
                      fill={activeColorHex} 
                      stroke={studioLighting === 'dark' ? '#10b981' : '#000000'}
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                    />
                    <rect x="100" y="100" width="300" height="400" rx="20" fill="url(#fabricShade)" />
                  </g>
                )}
              </svg>

              {/* OVERLAY ARTWORK LAYER (Custom Text, Cryptic Stamps, Uploaded Image) */}
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
                      alt="Custom Vector"
                      className="max-w-[120px] max-h-[120px] object-contain mb-2 drop-shadow-md"
                    />
                  )}

                  {/* Stamp Preset */}
                  {selectedStamp && (
                    <div className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-90 mb-1 border border-current px-2 py-0.5 rounded" style={{ color: textColor }}>
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
          <div className="w-full flex items-center justify-between pt-3 border-t border-white/10 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white/40">SAVED VAULT ARTIFACTS:</span>
              <span className="text-emerald-400 font-bold">{savedVault.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-purple-400">QUBIT STATE LOGGED</span>
              <span className="text-blue-400 font-bold">01010 MATRIX READY</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
