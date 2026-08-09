import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, DollarSign, Languages, Scale, ShieldCheck, Check } from 'lucide-react';
import { t } from '../utils/helpers';

interface Preferences {
  region: string;
  currency: string;
  language: string;
  units: 'metric' | 'imperial';
}

interface PreferencesViewProps {
  preferences: Preferences;
  onChangePreferences: (prefs: Preferences) => void;
}

const REGIONS = [
  { code: 'US', name: 'UNITED STATES', timezone: 'EST/PST' },
  { code: 'EU', name: 'EUROPEAN UNION', timezone: 'CET' },
  { code: 'UK', name: 'UNITED KINGDOM', timezone: 'GMT' },
  { code: 'JP', name: 'JAPAN', timezone: 'JST' },
  { code: 'KR', name: 'SOUTH KOREA', timezone: 'KST' },
  { code: 'GL', name: 'GLOBAL / INT', timezone: 'UTC' }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US DOLLAR' },
  { code: 'EUR', symbol: '€', name: 'EURO' },
  { code: 'GBP', symbol: '£', name: 'BRITISH POUND' },
  { code: 'JPY', symbol: '¥', name: 'JAPANESE YEN' },
  { code: 'KRW', symbol: '₩', name: 'KOREAN WON' }
];

const LANGUAGES = [
  { code: 'EN', name: 'ENGLISH (US/UK)' },
  { code: 'JA', name: 'JAPANESE (日本語)' },
  { code: 'KO', name: 'KOREAN (한국어)' },
  { code: 'DE', name: 'GERMAN (DEUTSCH)' },
  { code: 'FR', name: 'FRENCH (FRANÇAIS)' }
];

export function PreferencesView({ preferences, onChangePreferences }: PreferencesViewProps) {
  const [region, setRegion] = useState(preferences.region);
  const [currency, setCurrency] = useState(preferences.currency);
  const [language, setLanguage] = useState(preferences.language);
  const [units, setUnits] = useState<'metric' | 'imperial'>(preferences.units);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updatePreference = (key: 'region' | 'currency' | 'language' | 'units', value: any) => {
    const targetRegion = key === 'region' ? value : region;
    const targetCurrency = key === 'currency' ? value : currency;
    const targetLanguage = key === 'language' ? value : language;
    const targetUnits = key === 'units' ? value : units;

    if (key === 'region') setRegion(value);
    if (key === 'currency') setCurrency(value);
    if (key === 'language') setLanguage(value);
    if (key === 'units') setUnits(value);

    onChangePreferences({
      region: targetRegion,
      currency: targetCurrency,
      language: targetLanguage,
      units: targetUnits,
    });

    setIsSaving(true);
    setIsSaved(false);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onChangePreferences({ region, currency, language, units });
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-[var(--spacing-phi-5)] sm:px-[var(--spacing-phi-6)] md:px-[var(--spacing-phi-7)] py-[var(--spacing-phi-7)] space-y-12">
      {/* Header */}
      <div className="space-y-4 font-mono">
        <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-ink">{t('preferences')}</h1>
        <p className="text-[12px] font-mono opacity-70 leading-relaxed uppercase max-w-2xl">
          CALIBRATE LOCAL LEDGER ROUTING, ACCREDITED COMPLIANCE CRITERIA, DISPLAY CURRENCY FOR THE TRANSACTING TERMINAL, AND UNIT MEASUREMENTS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Form Column */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Section: Region Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-3">
              <Globe size={16} className="text-ink/60" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                01. GEOGRAPHIC ROUTING / REGION
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {REGIONS.map((r) => {
                const active = region === r.code;
                return (
                  <button
                    key={r.code}
                    onClick={() => updatePreference('region', r.code)}
                    className={`p-5 text-left border rounded-[var(--radius-phi-1)] flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${
                      active 
                        ? 'border-ink bg-ink/5' 
                        : 'border-ink/10 hover:border-ink/40 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-4">
                      <span className="font-mono text-xs font-bold text-ink/40 group-hover:text-ink/60 transition-colors">
                        {r.code}
                      </span>
                      {active && (
                        <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
                        {r.name}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-widest opacity-40 mt-1">
                        {r.timezone} ZONE
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Currency Preference */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-3">
              <DollarSign size={16} className="text-ink/60" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                02. LEDGER CURRENCY
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {CURRENCIES.map((c) => {
                const active = currency === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => updatePreference('currency', c.code)}
                    className={`p-4 border rounded-[var(--radius-phi-1)] flex flex-col items-center justify-center text-center transition-all duration-300 ${
                      active 
                        ? 'border-ink bg-ink/5' 
                        : 'border-ink/10 hover:border-ink/40 bg-transparent'
                    }`}
                  >
                    <span className="font-mono text-2xl font-light mb-2">{c.symbol}</span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                      {c.code}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-wider opacity-40 mt-1 truncate max-w-full">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Language Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-3">
              <Languages size={16} className="text-ink/60" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                03. COMPILER LANGUAGE
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {LANGUAGES.map((l) => {
                const active = language === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => updatePreference('language', l.code)}
                    className={`p-4 border rounded-[var(--radius-phi-1)] flex items-center justify-between transition-all duration-300 ${
                      active 
                        ? 'border-ink bg-ink/5' 
                        : 'border-ink/10 hover:border-ink/40 bg-transparent'
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                      {l.name}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">
                      [{l.code}]
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Measurement Units */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-3">
              <Scale size={16} className="text-ink/60" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                04. MEASURE UNIT MATRIX
              </h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => updatePreference('units', 'imperial')}
                className={`flex-1 p-5 border rounded-[var(--radius-phi-1)] flex flex-col justify-between transition-all duration-300 text-left ${
                  units === 'imperial' 
                    ? 'border-ink bg-ink/5' 
                    : 'border-ink/10 hover:border-ink/40 bg-transparent'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-3">
                  <span className="font-mono text-[10px] font-bold tracking-widest">IMPERIAL SYSTEM</span>
                  {units === 'imperial' && <div className="w-1.5 h-1.5 bg-ink rounded-full" />}
                </div>
                <p className="font-mono text-[9px] uppercase tracking-wider opacity-40">
                  SIZING SPECIFICATIONS IN INCHES, TOTAL SCALE EXPRESSED IN LBS (US DEFAULT)
                </p>
              </button>
              
              <button
                onClick={() => updatePreference('units', 'metric')}
                className={`flex-1 p-5 border rounded-[var(--radius-phi-1)] flex flex-col justify-between transition-all duration-300 text-left ${
                  units === 'metric' 
                    ? 'border-ink bg-ink/5' 
                    : 'border-ink/10 hover:border-ink/40 bg-transparent'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-3">
                  <span className="font-mono text-[10px] font-bold tracking-widest">METRIC SYSTEM</span>
                  {units === 'metric' && <div className="w-1.5 h-1.5 bg-ink rounded-full" />}
                </div>
                <p className="font-mono text-[9px] uppercase tracking-wider opacity-40">
                  SIZING SPECIFICATIONS IN CM, TOTAL SCALE EXPRESSED IN KG (GLOBAL STANDARD)
                </p>
              </button>
            </div>
          </div>

        </div>

        {/* Right Sidebar Config Status Column */}
        <div className="space-y-8">
          <div className="border border-ink/10 rounded-[var(--radius-phi-2)] bg-ink/[0.01] p-6 space-y-6 sticky top-32">
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              LEDGER STATUS SUMMARY
            </h4>
            
            <div className="border border-ink/10 divide-y divide-ink/10 font-mono text-[10px] uppercase bg-paper rounded-[var(--radius-phi-1)] overflow-hidden">
              <div className="grid grid-cols-2 p-4">
                <span className="opacity-40">ROUTING ENDPOINT:</span>
                <span className="text-right font-bold tracking-wider">{region}</span>
              </div>
              <div className="grid grid-cols-2 p-4">
                <span className="opacity-40">LEDGER SYMBOL:</span>
                <span className="text-right font-bold tracking-wider">{currency}</span>
              </div>
              <div className="grid grid-cols-2 p-4">
                <span className="opacity-40">COMPILER LANG:</span>
                <span className="text-right font-bold tracking-wider">{language}</span>
              </div>
              <div className="grid grid-cols-2 p-4">
                <span className="opacity-40">MEASUREMENT:</span>
                <span className="text-right font-bold tracking-wider">{units}</span>
              </div>
              <div className="grid grid-cols-2 p-4">
                <span className="opacity-40">LEDGER INTEGRITY:</span>
                <span className="text-right font-bold text-green-600 tracking-widest flex items-center justify-end gap-1.5">
                  <ShieldCheck size={11} /> SECURE
                </span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-ink text-paper py-4 text-[10px] font-mono font-bold uppercase tracking-[0.25em] transition-all hover:bg-zinc-800 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="animate-pulse">{t('reconfiguring')}</span>
              ) : (
                t('save_config')
              )}
            </button>

            <AnimatePresence>
              {isSaved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 border border-green-500/30 bg-green-500/5 rounded-[var(--radius-phi-1)] flex items-center gap-3"
                >
                  <Check size={14} className="text-green-500" />
                  <p className="font-mono text-[9px] uppercase tracking-wider text-green-500">
                    REGIONAL CONFIGURATION COMPLETED SUCCESSFULLY.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
