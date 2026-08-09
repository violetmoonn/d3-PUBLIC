import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({ isOpen, onClose }) => {
  const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
  const data = [
    { label: '1- Length', values: [65.5, 67.5, 69.5, 71.5, 73.5, 75.5] },
    { label: '2- Chest Width', values: [57, 59, 61, 63, 65, 67] },
    { label: '3- Sleeve Length', values: [56, 57, 58, 59, 60, 61] },
    { label: '4- Shoulder', values: [17.75, 18.5, 19.25, 20, 20.75, 21.5] },
    { label: '5- Bottom rib height', values: [6.2, 6.2, 6.2, 6.2, 6.2, 6.2] },
    { label: '6- Armhole in curve', values: [28, 29, 30, 31, 32, 33] },
    { label: '7- Sleeve rib height', values: [5, 5, 5, 5, 5, 5] },
    { label: '8- Hood width', values: [26, 26.5, 27, 27.5, 28, 28.5] },
    { label: '9- Hood height', values: [37.5, 38, 38.5, 39, 39.5, 40] },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center p-0 sm:p-4 md:p-8 bg-black/95 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-paper w-full h-full sm:h-auto sm:max-w-6xl max-h-full sm:max-h-[90vh] overflow-y-auto relative border-0 sm:border-4 border-ink shadow-none sm:shadow-xl sm:rounded-2xl tab-content font-typewriter"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-1.5 sm:p-2 bg-paper hover:bg-ink hover:text-paper transition-all z-10 border sm:border border-ink rounded-full"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>

            <div className="p-4 sm:p-8 md:p-16 pt-16 sm:pt-8 md:pt-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-12 border-b-[4px] border-ink pb-4 gap-4">
                <h2 className="text-xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mt-4 sm:mt-0">
                  SIZE CHART
                </h2>
                <div className="bg-ink text-paper px-4 py-2 mb-2 w-fit rounded-full">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest">UNISEX FIT</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16">
                {/* Table Section */}
                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <table className="w-full border-collapse min-w-[450px] lg:min-w-0">
                    <thead>
                      <tr className="border-b-4 border-ink">
                        <th className="w-1/3 py-4 text-left font-black uppercase tracking-widest text-[10px] sm:text-xs pr-4">Measurement</th>
                        {sizes.map(size => (
                          <th key={size} className="py-4 text-center font-black uppercase tracking-widest text-[10px] sm:text-xs px-2">{size}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} className="border-b-2 border-ink/10 hover:bg-ink/5 transition-colors">
                          <td className="w-1/3 py-3 sm:py-4 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider pr-4">{row.label}</td>
                          {row.values.map((val, vIdx) => (
                            <td key={vIdx} className="py-3 sm:py-4 text-center font-mono text-[10px] sm:text-[11px] font-bold px-2">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-8 space-y-2">
                    <p className="text-[9px] font-mono uppercase opacity-40 tracking-[0.2em]">
                      * ALL MEASUREMENTS ARE IN CENTIMETERS (CM).
                    </p>
                    <p className="text-[9px] font-mono uppercase opacity-40 tracking-[0.2em]">
                      * TOLERANCE +/- 1.5CM.
                    </p>
                  </div>
                </div>

                {/* Diagram Section */}
                <div className="flex flex-col items-center justify-center bg-ink/5 p-4 sm:p-8 border-2 sm:border-4 border-ink relative overflow-hidden group min-h-[280px] sm:min-h-[400px]">
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  </div>
                  
                  <svg viewBox="0 0 400 500" className="w-full max-w-[280px] sm:max-w-[350px] drop-shadow-2xl">
                    {/* Hoodie Outline */}
                    <path 
                      d="M120,150 Q200,50 280,150 L320,180 L380,380 L350,400 L320,250 L320,450 L80,450 L80,250 L50,400 L20,380 L80,180 Z" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                    {/* Hood Detail */}
                    <path d="M150,150 Q200,80 250,150" fill="none" stroke="white" strokeWidth="3" />
                    {/* Pocket */}
                    <path d="M140,350 L260,350 L280,420 L120,420 Z" fill="none" stroke="white" strokeWidth="3" />
                    
                    {/* Measurement Indicators */}
                    {/* 1- Length */}
                    <line x1="200" y1="150" x2="200" y2="450" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="205" y="300" className="font-black text-xl" fill="white">1</text>
                    
                    {/* 2- Chest */}
                    <line x1="80" y1="280" x2="320" y2="280" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="200" y="275" className="font-black text-xl" textAnchor="middle" fill="white">2</text>
                    
                    {/* 3- Sleeve */}
                    <line x1="20" y1="380" x2="120" y2="150" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="60" y="260" className="font-black text-xl" fill="white">3</text>
 
                    {/* 8- Hood Width */}
                    <line x1="150" y1="120" x2="250" y2="120" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="200" y="115" className="font-black text-xl" textAnchor="middle" fill="white">8</text>
                  </svg>
 
                  <div className="mt-8 grid grid-cols-3 gap-4 w-full">
                    <div className="border border-ink p-2 text-center rounded-full">
                      <span className="text-[10px] font-black uppercase block">VOID SPEC 01</span>
                    </div>
                    <div className="border border-ink p-2 text-center rounded-full">
                      <span className="text-[10px] font-black uppercase block">HEAVYWEIGHT</span>
                    </div>
                    <div className="border border-ink p-2 text-center rounded-full">
                      <span className="text-[10px] font-black uppercase block">UNISEX</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
