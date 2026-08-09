import React from 'react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto space-y-8 font-mono">
      <h1 className="text-2xl font-mono font-bold uppercase tracking-widest">TERMS OF SERVICE</h1>
      <div className="space-y-4 text-[12px] font-mono opacity-70 leading-relaxed uppercase">
        <p>
          BY ACCESSING OR USING THE SERVICE, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DISAGREE WITH ANY PART OF THE TERMS, THEN YOU MAY NOT ACCESS THE SERVICE.
        </p>
        <p>
          WE RESERVE THE RIGHT, AT OUR SOLE DISCRETION, TO MODIFY OR REPLACE THESE TERMS AT ANY TIME.
        </p>
        <p>
          ALL CONTENT, FEATURES, AND FUNCTIONALITY ARE AND WILL REMAIN THE EXCLUSIVE PROPERTY OF D3COMPOSURE.
        </p>
        <p>
          YOUR PRIVACY IS IMPORTANT TO US. PLEASE REVIEW OUR PRIVACY POLICY TO UNDERSTAND HOW WE COLLECT AND USE YOUR INFORMATION.
        </p>
      </div>
    </div>
  );
};
