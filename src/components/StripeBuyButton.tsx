import React, { useEffect, useRef } from 'react';
import { ExternalLink, CreditCard, ShoppingBag, ShieldCheck } from 'lucide-react';

interface StripeBuyButtonProps {
  buyButtonId?: string;
  publishableKey?: string;
  paymentLink?: string;
  productName?: string;
  price?: number;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
}

export const StripeBuyButton: React.FC<StripeBuyButtonProps> = ({
  buyButtonId,
  publishableKey,
  paymentLink,
  productName = 'Product',
  price,
  className = '',
  buttonText = 'BUY WITH STRIPE',
  showIcon = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buyButtonId && publishableKey) {
      // Dynamically load the Stripe buy-button script if not already present
      const scriptId = 'stripe-buy-button-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://js.stripe.com/v3/buy-button.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [buyButtonId, publishableKey]);

  // If Stripe buy-button-id and publishable-key are both provided, render official Stripe web component
  if (buyButtonId && publishableKey) {
    return (
      <div ref={containerRef} className={`stripe-buy-button-wrapper ${className}`}>
        {React.createElement('stripe-buy-button', {
          'buy-button-id': buyButtonId,
          'publishable-key': publishableKey
        })}
      </div>
    );
  }

  // If a Stripe payment link is provided, render direct payment button
  if (paymentLink) {
    return (
      <a
        href={paymentLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink text-paper text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all hover:bg-black ${className}`}
      >
        {showIcon && <CreditCard size={14} />}
        <span>{buttonText}</span>
        <ExternalLink size={12} className="opacity-60" />
      </a>
    );
  }

  return null;
};
