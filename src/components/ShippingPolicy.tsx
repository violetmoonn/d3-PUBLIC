import React from 'react';

export const ShippingPolicy: React.FC = () => {
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto space-y-8 font-mono">
      <h1 className="text-2xl font-mono font-bold uppercase tracking-widest">SHIPPING POLICY</h1>
      <div className="space-y-4 text-[12px] font-mono opacity-70 leading-relaxed uppercase">
        <p>
          EVERYTHING IS MADE TO ORDER. PLEASE ALLOW 14 BUISNESS DAYS FOR THE ITEM TO ARRIVE AT YOUR SHIPPING ADDRESS.
        </p>
        <p>
          WE SHIP INTERNATIONALLY. FOR SHIPPING INQUIRIES, PLEASE CONTACT <a href="mailto:inquire@d3composure.com" className="underline hover:text-zinc-500 lowercase transition-all">inquire@d3composure.com</a>.
        </p>
      </div>
    </div>
  );
};
