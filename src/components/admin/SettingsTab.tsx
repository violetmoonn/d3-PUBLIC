import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Globe, Palette, Shield, Save, Loader2, Type, Link, 
  Image as ImageIcon, Video, LayoutGrid, Zap, Globe2, Share2, Upload
} from 'lucide-react';
import { AppSettings } from '../../types';
import { convertGoogleDriveUrl } from '../../utils/helpers';
import { storage, ref, getDownloadURL } from '../../firebase';
import { uploadBytesResumable } from 'firebase/storage';

interface SettingsTabProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  settings, 
  onSave 
}) => {
  const [formData, setFormData] = React.useState<AppSettings>(settings);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeSubTab, setActiveSubTab] = React.useState<'BRANDING' | 'CONTENT' | 'NAVIGATION' | 'SECURITY'>('BRANDING');

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-ink/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink text-paper flex items-center justify-center">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display tracking-tighter uppercase">STORE CONFIGURATION</h2>
            <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Adjust the fundamental parameters of the store.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-12 py-4 bg-ink text-paper text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          SAVE CHANGES
        </button>
      </div>

      <div className="flex gap-6 pb-2">
        {(['BRANDING', 'CONTENT', 'NAVIGATION', 'SECURITY'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`text-[14px] font-mono font-bold uppercase tracking-widest transition-all ${
              activeSubTab === tab ? 'text-ink font-bold' : 'text-ink/40 hover:text-ink font-medium'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <AnimatePresence mode="wait">
            {activeSubTab === 'BRANDING' && (
              <motion.div 
                key="branding"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <Globe size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">IDENTITY SETTINGS</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">SITE TITLE</label>
                      <input 
                        value={formData.site_title}
                        onChange={(e) => setFormData({ ...formData, site_title: e.target.value })}
                        className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">SITE SUBTITLE</label>
                      <input 
                        value={formData.site_subtitle}
                        onChange={(e) => setFormData({ ...formData, site_subtitle: e.target.value })}
                        className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                      />
                    </div>
                  </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">SOCIAL LINKS</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <Share2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                          <input 
                            value={formData.social_links?.instagram || ''}
                            onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                            placeholder="INSTAGRAM"
                            className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0"
                          />
                        </div>
                        <div className="relative">
                          <Share2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                          <input 
                            value={formData.social_links?.facebook || ''}
                            onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                            placeholder="FACEBOOK"
                            className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0"
                          />
                        </div>
                        <div className="relative">
                          <Share2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                          <input 
                            value={formData.social_links?.twitter || ''}
                            onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })}
                            placeholder="TWITTER"
                            className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <Palette size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">VISUAL THEME</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">PRIMARY COLOR</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-12 h-12 bg-paper border border-ink/10 p-1 cursor-pointer"
                        />
                        <input 
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="flex-1 bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ACCENT COLOR</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="color"
                          value={formData.accent_color}
                          onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                          className="w-12 h-12 bg-paper border border-ink/10 p-1 cursor-pointer"
                        />
                        <input 
                          value={formData.accent_color}
                          onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                          className="flex-1 bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'CONTENT' && (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <LayoutGrid size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">HERO SECTION</span>
                  </div>
                  
                  <div className="space-y-6 p-8 bg-paper border border-ink/5 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">HERO TITLE</label>
                        <input 
                          value={formData.hero_title || ''}
                          onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                          className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">HERO SUBTITLE</label>
                        <input 
                          value={formData.hero_subtitle || ''}
                          onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                          className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">HERO TYPE</label>
                      <select 
                        value={formData.hero_type}
                        onChange={(e) => setFormData({ ...formData, hero_type: e.target.value as any })}
                        className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 uppercase font-bold"
                      >
                        <option value="IMAGE" className="bg-paper">STATIC IMAGE</option>
                        <option value="VIDEO" className="bg-paper">DYNAMIC VIDEO</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">HERO ASSET URL</label>
                      </div>
                      <div className="relative">
                        {formData.hero_type === 'IMAGE' ? <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" /> : <Video size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />}
                        <input 
                          value={formData.hero_url}
                          onChange={(e) => setFormData({ ...formData, hero_url: e.target.value })}
                          onBlur={(e) => {
                            if (e.target.value) {
                              const converted = convertGoogleDriveUrl(e.target.value);
                              setFormData(prev => ({ ...prev, hero_url: converted }));
                            }
                          }}
                          placeholder="URL OR DRIVE LINK"
                          className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">HERO BANNER FALLBACK</label>
                      </div>
                      <div className="relative">
                        <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                        <input 
                          value={formData.hero_banner_url || ''}
                          onChange={(e) => setFormData({ ...formData, hero_banner_url: e.target.value })}
                          onBlur={(e) => {
                            if (e.target.value) {
                              const converted = convertGoogleDriveUrl(e.target.value);
                              setFormData(prev => ({ ...prev, hero_banner_url: converted }));
                            }
                          }}
                          placeholder="FALLBACK BANNER URL"
                          className="w-full bg-paper border border-ink/10 p-4 pl-12 text-[11px] font-mono focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <LayoutGrid size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">SECTION CONTENT</span>
                  </div>
                  
                  <div className="space-y-12">
                    {[
                      { id: 'inference', label: 'LOGOS' },
                      { id: 'anonymity', label: 'ABOUT' },
                      { id: 'sublimation', label: 'PROVENANCE' },
                    ].map((section) => (
                      <div key={section.id} className="space-y-6 p-8 bg-paper border border-ink/10 shadow-sm">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">{section.label}_TITLE</label>
                          <input 
                            value={formData[`${section.id}_title`] || ''}
                            onChange={(e) => setFormData({ ...formData, [`${section.id}_title`]: e.target.value })}
                            className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">{section.label}_CONTENT</label>
                          <textarea 
                            value={formData[`${section.id}_content`] || ''}
                            onChange={(e) => setFormData({ ...formData, [`${section.id}_content`]: e.target.value })}
                            rows={4}
                            className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <Zap size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">ACTIVE SECTIONS</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(formData.sections || {}).filter(([key]) => key !== 'lab' && key !== 'track' && key !== 'shipping' && key !== 'privacy' && key !== 'refund' && key !== 'terms').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-6 border border-ink/10 bg-paper">
                        <span className="text-[10px] font-mono font-bold uppercase">{typeof key === 'string' ? key.replace(/_/g, ' ') : key}</span>
                        <button 
                          onClick={() => setFormData({ ...formData, sections: { ...formData.sections, [key]: !value } })}
                          className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-ink' : 'bg-ink/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-paper transition-all ${value ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'NAVIGATION' && (
              <motion.div 
                key="navigation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <Type size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">TAB LABELS</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { key: 'tab_store_label', label: 'SHOP_TAB' },
                      { key: 'tab_logos_label', label: 'LOGOS_TAB' },
                      { key: 'tab_ethos_label', label: 'ABOUT_TAB' },
                      { key: 'tab_provenance_label', label: 'PROVENANCE_TAB' },
                      { key: 'tab_contact_label', label: 'CONTACT_TAB' },
                      { key: 'tab_privacy_label', label: 'PRIVACY_TAB' },
                      { key: 'tab_shipping_label', label: 'SHIPPING_TAB' },
                      { key: 'tab_refund_label', label: 'REFUND_TAB' },
                      { key: 'tab_terms_label', label: 'TERMS_TAB' },
                    ].map((item) => (
                      <div key={item.key} className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">{item.label}</label>
                        <input 
                          value={formData[item.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                          className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0 focus:border-ink/30 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'SECURITY' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <Shield size={16} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">ACCESS SETTINGS</span>
                  </div>
                  
                  <div className="space-y-6 p-8 bg-paper border border-ink/10 shadow-sm">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">ADMIN PASSWORD</label>
                      <input 
                        type="password"
                        value={formData.admin_password}
                        onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                        placeholder="••••••••••••••••"
                        className="w-full bg-paper border border-ink/10 p-4 text-[11px] font-mono focus:ring-0"
                      />
                      <p className="text-[8px] font-mono uppercase opacity-30 mt-2">* This password protects the admin panel.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 border border-ink/5 bg-ink/5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase">MAINTENANCE MODE</span>
                        <p className="text-[8px] font-mono uppercase opacity-40">Restrict store access to administrators only.</p>
                      </div>
                      <button 
                        onClick={() => setFormData({ ...formData, maintenance_mode: !formData.maintenance_mode })}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.maintenance_mode ? 'bg-ink' : 'bg-ink/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-paper transition-all ${formData.maintenance_mode ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          <div className="p-8 border border-ink/5 space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <Globe2 size={16} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">LIVE PREVIEW STATUS</span>
            </div>
            
            <div className="aspect-[9/16] bg-ink/5 border border-ink/5 overflow-hidden relative group">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-ink text-paper flex items-center justify-center rounded-full animate-pulse">
                  <Zap size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-brand font-bold tracking-[1.1mm] uppercase">
                    {formData.site_title || ''}
                  </h4>
                  <p className="text-[8px] font-mono uppercase opacity-40 mt-1">{formData.site_subtitle}</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-ink opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                <span className="opacity-40">LAST SYNC</span>
                <span className="font-bold">JUST NOW</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                <span className="opacity-40">VERSION</span>
                <span className="font-bold">V2.4.2-STABLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
