import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Percent, 
  Lock, 
  Check, 
  ChevronRight, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';
import { MASTERCLASS_PRICE } from '../data';
import { AppScreen } from '../types';

interface CartViewProps {
  onNavigate: (screen: AppScreen) => void;
  couponDiscount: number;
  onApplyCoupon: (discount: number, code: string) => void;
  appliedCouponCode: string;
  selectedAddons: string[];
  onToggleAddon: (addonId: string, price: number) => void;
}

export default function CartView({ 
  onNavigate, 
  couponDiscount, 
  onApplyCoupon, 
  appliedCouponCode,
  selectedAddons,
  onToggleAddon
}: CartViewProps) {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    const formattedCode = promoInput.trim().toUpperCase();
    if (formattedCode === 'ARCH20') {
      onApplyCoupon(0.20, 'ARCH20'); // 20% discount
      setPromoSuccess('Promo ARCH20 applied! 20% discount on masterclass.');
    } else if (formattedCode === 'VISIONARY') {
      onApplyCoupon(0.15, 'VISIONARY'); // 15% discount
      setPromoSuccess('Promo VISIONARY applied! 15% discount.');
    } else if (formattedCode === 'FREEGRID') {
      onApplyCoupon(0.10, 'FREEGRID');
      setPromoSuccess('Promo FREEGRID applied! 10% discount.');
    } else {
      setPromoError('Invalid coupon code. Try "ARCH20" or "VISIONARY".');
    }
  };

  const hasCompanionAddon = selectedAddons.includes('companion');
  const hasToolkitAddon = selectedAddons.includes('toolkit');

  return (
    <div className="bg-[#fcf8f8] min-h-screen pt-24 pb-16 font-sans text-[#1c1b1c]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10">
        
        {/* Progress Tracker */}
        <nav aria-label="Progress" className="max-w-2xl mx-auto w-full mb-12">
          <ol className="flex items-center justify-between relative" role="list">
            <li className="relative flex-1">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="h-0.5 w-full bg-stone-900" />
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white font-semibold text-xs">
                1
              </div>
            </li>
            <li className="relative flex-1">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="h-0.5 w-full bg-stone-200" />
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#f1eded] text-stone-400 font-semibold text-xs border border-stone-300">
                2
              </div>
            </li>
            <li className="relative">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#f1eded] text-stone-400 font-semibold text-xs border border-stone-300">
                3
              </div>
            </li>
          </ol>
          <div className="flex justify-between mt-3 text-center text-xs font-semibold uppercase tracking-wider text-stone-500">
            <span className="text-stone-900 font-bold -ml-2">Cart</span>
            <span className="text-stone-400 -ml-1">Payment</span>
            <span className="text-stone-400 -mr-4">Confirmation</span>
          </div>
        </nav>

        {/* Free Shipping Highlight Banner */}
        <div className="bg-[#f7dece] rounded-2xl p-4 flex items-start gap-3 mb-8 border border-[#dac2b3] max-w-4xl mx-auto">
          <Info className="w-5 h-5 text-[#5d2a1a] shrink-0 mt-0.5" />
          <p className="text-sm text-[#5d2a1a] font-medium leading-relaxed">
            You've unlocked free premium shipping and instant digital access for this cohort editorial collection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-5xl mx-auto items-start">
          
          {/* Main Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm">
              <h1 className="font-serif text-3xl text-stone-950 mb-6 font-medium">Your Selection</h1>

              {/* Course Item */}
              <div className="flex flex-col md:flex-row gap-5 pb-6 border-b border-stone-100">
                <div className="w-full md:w-[130px] aspect-[4/3] rounded-xl bg-stone-100 overflow-hidden relative shrink-0">
                  <img 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                    alt="Brutalist architectural model scale representation"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIUEX02gGoJDNVLsCgEwIeNKycZSbOW26560XbOfDuoQr1Akn7C8lqsvWF76-6XKzyLaBQ4BP05ZfwuTHLpXGnY6b9a9KKlRSxKce8OT1Qp8ip97fxzglw5DfFg-OEhxz51oRrbhHSi3TGUnjUjv7jP4hKNpf-vyG3-jmIdOROjT9GjZ9ohgLKifSpUyGX1humKhXIsXujKx05oNVCAoj7uWQo9tL64RGZbGblPzI7RTf124K5qaBg"
                  />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Cohort Series
                    </span>
                    <h2 className="font-serif text-xl font-medium text-stone-950 leading-tight">
                      Masterclass: Advanced Architecture
                    </h2>
                    <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                      Lifetime digital lesson access, live critique reviews, and certificates.
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-stone-400 font-medium">Qty: 1</span>
                    <div className="text-right">
                      {couponDiscount > 0 && (
                        <span className="text-xs text-stone-400 line-through mr-2 font-semibold">
                          ${MASTERCLASS_PRICE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="text-lg font-bold text-stone-950">
                        ${(MASTERCLASS_PRICE * (1 - couponDiscount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Add-on Items */}
              <div className="pt-6">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
                  RETIRED COHORT ADD-ONS (OPTIONAL)
                </h3>
                
                <div className="space-y-3">
                  
                  {/* Add-on 1 */}
                  <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    hasCompanionAddon ? 'border-stone-950 bg-stone-50' : 'border-stone-200 hover:bg-stone-50/50'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-stone-950 focus:ring-stone-950 h-4 w-4"
                      checked={hasCompanionAddon}
                      onChange={() => onToggleAddon('companion', 95.00)}
                    />
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-stone-900">Archival Companion Book</span>
                        <span className="font-bold text-sm text-stone-950">+$95.00</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Limited hardcover printing of the Advanced Architecture syllabus notes, case diagrams, and joint drawings shipped worldwide.
                      </p>
                    </div>
                  </label>

                  {/* Add-on 2 */}
                  <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    hasToolkitAddon ? 'border-stone-950 bg-stone-50' : 'border-stone-200 hover:bg-stone-50/50'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-stone-950 focus:ring-stone-950 h-4 w-4"
                      checked={hasToolkitAddon}
                      onChange={() => onToggleAddon('toolkit', 120.00)}
                    />
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-stone-900">Digital Studio Toolkit</span>
                        <span className="font-bold text-sm text-stone-950">+$120.00</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Instant download of 40+ parametric Grasshopper templates, structural Revit details, and 3D brutalist asset components.
                      </p>
                    </div>
                  </label>

                </div>
              </div>

            </div>
          </div>

          {/* Checkout Totals & Promo input */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Promo code form */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                Do you have a Promo Code?
              </h3>
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input 
                  type="text" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="e.g. ARCH20"
                  className="flex-grow rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 text-sm"
                />
                <button 
                  type="submit"
                  className="bg-stone-900 text-white rounded-xl px-5 py-2.5 font-semibold text-sm hover:bg-stone-800 transition-colors"
                >
                  Apply
                </button>
              </form>
              {promoError && (
                <p className="text-red-600 text-xs mt-2 font-medium">{promoError}</p>
              )}
              {promoSuccess && (
                <p className="text-emerald-700 text-xs mt-2 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" /> {promoSuccess}
                </p>
              )}
              <p className="text-[11px] text-stone-400 mt-3 italic leading-normal">
                💡 Tip: Try applying code <span className="font-bold text-stone-600">ARCH20</span> to save 20% on enrollment!
              </p>
            </div>

            {/* Order summary sidebar */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col gap-5">
              <h3 className="font-serif text-xl font-medium text-stone-950 pb-3 border-b border-stone-100">
                Cart Totals
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm text-stone-500">
                  <span>Masterclass Course</span>
                  <span>${MASTERCLASS_PRICE.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                    <span>Discount Applied ({appliedCouponCode})</span>
                    <span>-${(MASTERCLASS_PRICE * couponDiscount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {hasCompanionAddon && (
                  <div className="flex justify-between items-center text-sm text-stone-600">
                    <span>Archival Book Addon</span>
                    <span>$95.00</span>
                  </div>
                )}

                {hasToolkitAddon && (
                  <div className="flex justify-between items-center text-sm text-stone-600">
                    <span>Digital Studio Toolkit</span>
                    <span>$120.00</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-stone-500">
                  <span>Shipping</span>
                  <span className="text-emerald-700 font-bold uppercase tracking-wider text-xs">Free</span>
                </div>

                {/* Subtotal calculation */}
                {(() => {
                  const subTotal = (MASTERCLASS_PRICE * (1 - couponDiscount)) + 
                    (hasCompanionAddon ? 95 : 0) + 
                    (hasToolkitAddon ? 120 : 0);
                  const calculatedTax = subTotal * 0.085;
                  const finalTotal = subTotal + calculatedTax;

                  return (
                    <>
                      <div className="flex justify-between items-center text-sm text-stone-500 pt-1 border-t border-stone-100">
                        <span>Est. Subtotal</span>
                        <span>${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-stone-500">
                        <span>Sales Tax (8.5%)</span>
                        <span>${calculatedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                        <span className="font-serif text-xl font-medium text-stone-950">Order Total</span>
                        <span className="font-serif text-xl font-bold text-stone-950">
                          ${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <button 
                onClick={() => onNavigate('payment')}
                className="w-full mt-4 bg-stone-950 text-white rounded-full py-4 px-6 font-semibold uppercase tracking-wider text-xs hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Payment</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Payments are secure and encrypted.</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
