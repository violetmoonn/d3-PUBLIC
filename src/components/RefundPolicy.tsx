import React from 'react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto space-y-8 font-mono">
      <h1 className="text-2xl font-mono font-bold uppercase tracking-widest">REFUND POLICY</h1>
      <div className="space-y-4 text-[12px] font-mono opacity-70 leading-relaxed uppercase">
        <p>
          ALL SALES ARE FINAL. IF THERE IS A PROBLEM WITH YOUR ORDER "CONTACT" US AT <a href="mailto:inquire@d3composure.com" className="underline hover:text-zinc-500 lowercase transition-all">inquire@d3composure.com</a>.
        </p>
      </div>
    </div>
  );
};
