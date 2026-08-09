import React from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';

interface HomeViewProps {
  settings: AppSettings;
  onEnterStore: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ settings, onEnterStore }) => {
  return (
    <div 
      onClick={onEnterStore}
      onTouchEnd={(e) => {
        e.preventDefault();
        onEnterStore();
      }}
      className="fixed inset-0 w-screen h-screen bg-white overflow-hidden z-[9999] cursor-pointer flex items-center justify-center select-none"
    >
      {/* Centered Logo on White Screen */}
      <div className="flex flex-col items-center justify-center text-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          <h1 
            style={{ 
              fontFamily: '"Arial Black", "Impact", "Anton", sans-serif', 
              letterSpacing: '-0.035em',
              fontWeight: 900,
              color: '#000000'
            }}
            className="text-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase leading-none select-none"
          >
            {(settings.site_title ? settings.site_title.replace(/_/g, ' ') : 'D3COMPOSURE')}
          </h1>
        </motion.div>
      </div>
    </div>
  );
};

