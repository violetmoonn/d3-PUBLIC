import React from 'react';
import { X } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementBarProps {
  announcements?: Announcement[];
  message?: string;
  onDismiss?: () => void;
  isHidden?: boolean;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  announcements = [],
  message,
  onDismiss,
  isHidden = false
}) => {
  if (isHidden) return null;

  const activeAnnouncement = announcements.find(a => a.active) || (announcements.length > 0 ? announcements[0] : null);
  const text = message || activeAnnouncement?.text || "Sign up for 10% OFF. All items are back in stock for the season.";
  let bg = activeAnnouncement?.background_color || '#f0f0f0';
  if (bg.toLowerCase() === '#ffccd5') {
    bg = '#f0f0f0';
  }
  const color = activeAnnouncement?.text_color || '#000000';

  return (
    <aside 
      aria-label="Site announcement"
      className="fixed top-0 left-0 right-0 z-[70] transition-all duration-300 text-center py-2 px-4 flex items-center justify-center border-b border-black/10 select-none shadow-xs h-[36px] sm:h-[38px] grayscale"
      style={{ backgroundColor: bg, color: color }}
    >
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-center relative">
        <p className="text-[11px] sm:text-[12px] font-sans font-medium tracking-wide truncate sm:overflow-visible">
          {text}
        </p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:opacity-60 transition-opacity cursor-pointer text-inherit"
            aria-label="Dismiss banner"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </aside>
  );
};



