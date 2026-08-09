import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Leaf, Award, CheckCircle2, Globe2, ArrowRight } from 'lucide-react';
import { getMathematicalFontSize, getMathematicalLetterTracking } from '../utils/helpers';

interface SustainabilityViewProps {
  onNavigate?: (view: string) => void;
}

export const SustainabilityView: React.FC<SustainabilityViewProps> = ({ onNavigate }) => {
  const certifications = [
    {
      code: "ISO 45001",
      title: "ISO 45001",
      category: "Occupational Health & Safety",
      description: "ISO 45001 is the international standard for occupational health and safety. It helps protect employees and visitors from work-related injuries and illnesses. The standard builds on earlier systems like OHSAS 18001 and follows ILO labor and safety guidelines."
    },
    {
      code: "GOTS 6.0",
      title: "Global Organic Textile Standard (GOTS) 6.0",
      category: "Organic Textile Standard",
      details: [
        { label: "Finished knitted fabric", value: "100% Organic Cotton" },
        { label: "Raw knitted fabric", value: "70% Organic Cotton + 30% Modal" },
        { label: "Raw knitted fabric", value: "90% Organic Cotton + 10% Recycled Polyester" }
      ]
    },
    {
      code: "OEKO-TEX 100",
      title: "OEKO-TEX Standard 100",
      category: "Textile Safety Certification",
      description: "One of the world’s best-known textile safety certifications. It ensures fabrics are tested for harmful substances, guaranteeing consumer safety and product confidence."
    },
    {
      code: "UN GLOBAL COMPACT",
      title: "The Global Compact",
      category: "United Nations Initiative",
      description: "A United Nations initiative promoting sustainable and socially responsible business practices. It outlines ten principles covering human rights, labor, the environment, and anti-corruption."
    },
    {
      code: "GRS",
      title: "Global Recycled Standard (GRS)",
      category: "Supply Chain & Recycled Traceability",
      description: "For companies producing or selling recycled products. It covers the entire supply chain, ensuring traceability, environmental protection, social responsibility, and accurate labeling."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-[1440px] mx-auto px-[var(--spacing-phi-5)] sm:px-[var(--spacing-phi-6)] md:px-[var(--spacing-phi-7)] py-[var(--spacing-phi-7)] space-y-16 text-ink"
    >
      {/* Header */}
      <div className="space-y-4 font-mono">
        <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-ink">SUSTAINABILITY</h1>
      </div>

      {/* Hero Statement Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative overflow-hidden border border-ink/10 rounded-[var(--radius-phi-2)] bg-ink/[0.015] p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
      >
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-ink/5 text-ink/80 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full border border-ink/10">
            <Leaf size={12} />
            DIRECTIVE
          </span>
          <p className="font-mono text-xs opacity-70 leading-relaxed uppercase tracking-wider">
            Our commitment begins at the molecular level of fiber sourcing and extends across every stage of ethical garment production.
          </p>
        </div>

        <div className="shrink-0 font-mono text-[9px] uppercase tracking-widest opacity-30 hidden lg:block text-right">
          <p>ETHICAL FABRICATION</p>
          <p>LOCAL PORTUGUESE CRAFT</p>
          <p>ZERO HAZARDOUS CHEMICALS</p>
        </div>
      </motion.div>

      {/* Material Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Award size={16} className="text-ink" />
            PRIMARY MATERIAL
          </h3>
          <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest">LOCAL SOURCING</span>
        </div>

        <div className="border border-ink/10 rounded-[var(--radius-phi-2)] bg-paper p-8 sm:p-10 space-y-4 hover:border-ink/20 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/80">100% COTTON</span>
              <h4 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-ink">
                Locally Manufactured in Portugal
              </h4>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-ink/10 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest shrink-0">
              <Globe2 size={14} className="text-ink/60" />
              MADE IN PORTUGAL
            </div>
          </div>
          <p className="font-mono text-xs opacity-75 uppercase leading-relaxed tracking-wide max-w-4xl">
            Material: 100% cotton sourced from local manufacturer based in Portugal.
          </p>
        </div>
      </div>

      {/* Affiliated Certifications Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/10 pb-4 gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={16} className="text-ink" />
            AFFILIATED CERTIFICATIONS
          </h3>
          <span className="font-mono text-[10px] opacity-50 uppercase tracking-widest font-semibold">
            5 INTERNATIONAL AUDITED STANDARDS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert, idx) => (
            <motion.div
              key={cert.code}
              whileHover={{ y: -3 }}
              className="border border-ink/10 rounded-[var(--radius-phi-2)] bg-paper p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-ink/30 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/80 bg-ink/5 px-2.5 py-1 rounded-full border border-ink/10">
                    {cert.category}
                  </span>
                  <span className="font-mono text-[10px] opacity-30 font-bold">0{idx + 1}</span>
                </div>

                <h4 className="text-lg font-display font-bold uppercase tracking-tight text-ink leading-snug">
                  {cert.title}
                </h4>

                {cert.description && (
                  <p className="font-mono text-[11px] opacity-75 leading-relaxed uppercase tracking-wide">
                    {cert.description}
                  </p>
                )}

                {cert.details && (
                  <div className="space-y-2.5 pt-2 border-t border-ink/5">
                    {cert.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex flex-col sm:flex-row sm:items-center justify-between font-mono text-[10.5px] uppercase gap-1">
                        <span className="opacity-50 flex items-center gap-1.5">
                          <CheckCircle2 size={11} className="text-ink shrink-0" />
                          {detail.label}:
                        </span>
                        <span className="font-bold text-ink tracking-wide">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-ink/5 flex items-center justify-between font-mono text-[9px] uppercase opacity-40">
                <span>VERIFIED COMPLIANCE</span>
                <span>{cert.code}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action Card */}
      <div className="p-8 md:p-10 border border-ink bg-ink text-paper rounded-[var(--radius-phi-2)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-display uppercase tracking-wider font-bold">COMMITMENT TO CONSCIOUS MANUFACTURING</h3>
          <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">
            Explore our ethically produced artifacts crafted with 100% Portuguese organic cotton.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => {
              onNavigate('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-paper text-ink hover:bg-paper/90 px-8 py-3.5 transition-all text-[10px] font-mono font-bold uppercase tracking-wider rounded-[var(--radius-phi-1)] flex items-center gap-3 self-stretch md:self-auto justify-center cursor-pointer"
          >
            <span>EXPLORE CATALOGUE</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
