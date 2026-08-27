import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Info, 
  Lock, 
  Check, 
  ShieldCheck, 
  Zap, 
  ChevronLeft 
} from 'lucide-react';
import { MASTERCLASS_PRICE } from '../data';
import { AppScreen, PaymentDetails } from '../types';

interface PaymentViewProps {
  onNavigate: (screen: AppScreen) => void;
  onSubmitPayment: (details: PaymentDetails) => void;
  couponDiscount: number;
  appliedCouponCode: string;
  selectedAddons: string[];
}

export default function PaymentView({ 
  onNavigate, 
  onSubmitPayment,
  couponDiscount,
  appliedCouponCode,
  selectedAddons
}: PaymentViewProps) {
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  // Validation feedback
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto fill credentials helper
  const handleAutofill = () => {
    setCardNumber('4111 2222 3333 4444');
    setExpirationDate('12/28');
    setCvc('923');
    setNameOnCard('Elena Kostić');
    setErrors({});
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // strip non-digits
    if (value.length > 16) value = value.substring(0, 16);
    
    // add spaces every 4 characters
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = value.length; i < len; i += 4) {
      parts.push(value.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    
    if (value.length > 2) {
      setExpirationDate(`${value.substring(0, 2)}/${value.substring(2, 4)}`);
    } else {
      setExpirationDate(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvc(value);
    }
  };

  const validateForm = (): boolean => {
    const tempErrors: { [key: string]: string } = {};

    if (paymentMethod === 'card') {
      const numericCardNumber = cardNumber.replace(/\s/g, '');
      if (numericCardNumber.length !== 16) {
        tempErrors.cardNumber = 'Card number must be 16 digits.';
      }
      if (!expirationDate.includes('/') || expirationDate.length !== 5) {
        tempErrors.expirationDate = 'Expiration date must be MM/YY.';
      } else {
        const [monthStr, yearStr] = expirationDate.split('/');
        const month = parseInt(monthStr, 10);
        if (month < 1 || month > 12) {
          tempErrors.expirationDate = 'Invalid month (01-12).';
        }
      }
      if (cvc.length < 3) {
        tempErrors.cvc = 'CVC must be 3 or 4 digits.';
      }
      if (!nameOnCard.trim()) {
        tempErrors.nameOnCard = 'Please enter name as shown on card.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'paypal') {
      // Paypal behaves smoothly
      setIsSubmitting(true);
      setTimeout(() => {
        onSubmitPayment({
          cardNumber: '',
          expirationDate: '',
          cvc: '',
          nameOnCard: 'PayPal User',
          paymentMethod: 'paypal'
        });
      }, 1500);
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    // Simulate high-end card verification with elegant loader
    setTimeout(() => {
      onSubmitPayment({
        cardNumber,
        expirationDate,
        cvc,
        nameOnCard,
        paymentMethod: 'card'
      });
    }, 1800);
  };

  // Dynamic values calculation
  const hasCompanionAddon = selectedAddons.includes('companion');
  const hasToolkitAddon = selectedAddons.includes('toolkit');
  const subTotal = (MASTERCLASS_PRICE * (1 - couponDiscount)) + 
    (hasCompanionAddon ? 95 : 0) + 
    (hasToolkitAddon ? 120 : 0);
  const calculatedTax = subTotal * 0.085;
  const finalTotal = subTotal + calculatedTax;

  return (
    <div className="bg-[#fcf8f8] min-h-screen pt-24 pb-16 font-sans text-[#1c1b1c]">
      <main className="max-w-[1200px] mx-auto px-4 md:px-10 flex flex-col gap-10">
        
        {/* Progress Tracker (Check, Active 2, Inactive 3) */}
        <nav aria-label="Progress" className="max-w-2xl mx-auto w-full">
          <ol className="flex items-center" role="list">
            <li className="relative pr-8 sm:pr-20 flex-grow">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="h-0.5 w-full bg-stone-900"></div>
              </div>
              <button 
                onClick={() => onNavigate('cart')}
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-stone-900 hover:bg-stone-50 transition-colors"
              >
                <Check className="w-4 h-4 text-stone-900" />
              </button>
            </li>
            <li className="relative pr-8 sm:pr-20 flex-grow">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="h-0.5 w-full bg-stone-200"></div>
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-stone-950 text-white font-semibold text-xs">
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
            <span className="text-stone-500 -ml-2 cursor-pointer hover:text-stone-800" onClick={() => onNavigate('cart')}>Cart</span>
            <span className="text-stone-950 font-bold -ml-12 sm:-ml-24">Payment</span>
            <span className="text-stone-400 -mr-4">Confirmation</span>
          </div>
        </nav>

        {/* Back Link */}
        <div className="max-w-5xl mx-auto w-full -mb-4">
          <button 
            onClick={() => onNavigate('cart')}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-950 transition-colors uppercase tracking-wider font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to selection</span>
          </button>
        </div>

        {/* Column Grid exactly matching the design */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-5xl mx-auto items-start w-full">
          
          {/* Left Column: Payment details */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white rounded-[24px] p-6 md:p-8 border border-stone-200/80 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h1 className="font-serif text-3xl text-stone-950 font-medium">Payment Method</h1>
                <button 
                  type="button"
                  onClick={handleAutofill}
                  className="bg-stone-50 border border-stone-200 hover:bg-stone-100 text-[11px] font-bold text-stone-600 px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Zap className="w-3 h-3 text-amber-600 fill-amber-500" /> Autofill Demo Info
                </button>
              </div>

              <div className="flex flex-col gap-6">
                
                {/* Credit Card Option selection */}
                <label className={`relative flex cursor-pointer rounded-2xl border p-5 focus:outline-none transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-stone-950 bg-stone-50/50 ring-1 ring-stone-950' 
                    : 'border-stone-200 hover:bg-stone-50/50'
                }`}>
                  <input 
                    type="radio" 
                    name="payment-method" 
                    value="card" 
                    className="sr-only"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-lg font-bold text-stone-900 leading-tight">Credit Card</span>
                      <span className="mt-2 flex items-center gap-2 text-xs text-stone-500 font-medium">
                        <CreditCard className="w-4 h-4 text-stone-400" />
                        Pay securely with Visa, Mastercard, or Amex
                      </span>
                    </span>
                  </span>
                  <div className="flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'card' ? 'border-stone-950' : 'border-stone-300'
                    }`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-stone-950" />}
                    </div>
                  </div>
                </label>

                {/* Card Form Input (shown only if credit card is selected) */}
                {paymentMethod === 'card' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-4 pl-1 pr-1 pb-2 overflow-hidden"
                  >
                    {/* Card Number */}
                    <div>
                      <label htmlFor="card-number" className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                        Card Number
                      </label>
                      <input 
                        type="text" 
                        id="card-number" 
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className={`block w-full rounded-xl border px-4 py-3 text-stone-900 bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 text-sm font-semibold tracking-wider ${
                          errors.cardNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-stone-200 focus:ring-stone-950 focus:border-stone-950'
                        }`}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-500 text-xs mt-1 font-medium">{errors.cardNumber}</p>
                      )}
                    </div>

                    {/* Expiration + CVC */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiration" className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                          Expiration Date
                        </label>
                        <input 
                          type="text" 
                          id="expiration" 
                          placeholder="MM/YY"
                          value={expirationDate}
                          onChange={handleExpirationChange}
                          className={`block w-full rounded-xl border px-4 py-3 text-stone-900 bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 text-sm font-semibold ${
                            errors.expirationDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-stone-200 focus:ring-stone-950 focus:border-stone-950'
                          }`}
                        />
                        {errors.expirationDate && (
                          <p className="text-red-500 text-xs mt-1 font-medium">{errors.expirationDate}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="cvc" className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                          CVC
                        </label>
                        <input 
                          type="password" 
                          id="cvc" 
                          placeholder="123"
                          value={cvc}
                          onChange={handleCvcChange}
                          className={`block w-full rounded-xl border px-4 py-3 text-stone-900 bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 text-sm font-semibold tracking-widest ${
                            errors.cvc ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-stone-200 focus:ring-stone-950 focus:border-stone-950'
                          }`}
                        />
                        {errors.cvc && (
                          <p className="text-red-500 text-xs mt-1 font-medium">{errors.cvc}</p>
                        )}
                      </div>
                    </div>

                    {/* Name on Card */}
                    <div>
                      <label htmlFor="card-name" className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                        Name on Card
                      </label>
                      <input 
                        type="text" 
                        id="card-name" 
                        placeholder="Jane Doe"
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        className={`block w-full rounded-xl border px-4 py-3 text-stone-900 bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 text-sm font-semibold ${
                          errors.nameOnCard ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-stone-200 focus:ring-stone-950 focus:border-stone-950'
                        }`}
                      />
                      {errors.nameOnCard && (
                        <p className="text-red-500 text-xs mt-1 font-medium">{errors.nameOnCard}</p>
                      )}
                    </div>

                  </motion.div>
                )}

                {/* PayPal Option */}
                <label className={`relative flex cursor-pointer rounded-2xl border p-5 focus:outline-none transition-colors ${
                  paymentMethod === 'paypal' 
                    ? 'border-stone-950 bg-stone-50/50 ring-1 ring-stone-950' 
                    : 'border-stone-200 hover:bg-stone-50/50'
                }`}>
                  <input 
                    type="radio" 
                    name="payment-method" 
                    value="paypal" 
                    className="sr-only"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col justify-center">
                      <span className="block text-lg font-bold text-stone-900 leading-tight">PayPal</span>
                    </span>
                  </span>
                  <div className="flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'paypal' ? 'border-stone-950' : 'border-stone-300'
                    }`}>
                      {paymentMethod === 'paypal' && <div className="w-2.5 h-2.5 rounded-full bg-stone-950" />}
                    </div>
                  </div>
                </label>

              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Complete Button */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Accent Card Notice */}
            <div className="bg-[#f7dece] rounded-[24px] p-5 flex items-start gap-4 border border-[#dac2b3]">
              <Info className="w-5 h-5 text-[#5d2a1a] shrink-0 mt-0.5" />
              <p className="text-sm text-[#5d2a1a] leading-relaxed font-medium">
                You've unlocked free premium shipping on this editorial collection.
              </p>
            </div>

            {/* Order Summary exactly as shown in Image 1 */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 border border-stone-200/80 shadow-md flex flex-col gap-5">
              <h2 className="font-serif text-3xl text-stone-950 pb-3 border-b border-stone-100 font-medium">
                Order Summary
              </h2>

              <ul className="flex flex-col gap-3 py-1 text-sm">
                <li className="flex justify-between items-center text-stone-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </li>

                {couponDiscount > 0 && (
                  <li className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Discount ({appliedCouponCode})</span>
                    <span>-${(MASTERCLASS_PRICE * couponDiscount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </li>
                )}

                <li className="flex justify-between items-center text-stone-500">
                  <span>Shipping</span>
                  <span className="text-[#5d2a1a] font-bold uppercase tracking-wider text-xs">Free</span>
                </li>

                <li className="flex justify-between items-center text-stone-500">
                  <span>Tax</span>
                  <span className="font-semibold text-stone-900">${calculatedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </li>
              </ul>

              <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                <span className="font-serif text-2xl font-medium text-stone-950">Total</span>
                <span className="font-serif text-2xl font-bold text-stone-950">
                  ${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Complete Payment Button */}
              <button 
                onClick={handleCompletePayment}
                disabled={isSubmitting}
                className="w-full mt-4 bg-stone-950 text-white rounded-full py-4 px-6 font-semibold uppercase tracking-wider text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:bg-stone-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Secure Transaction...</span>
                  </div>
                ) : (
                  <span>Complete Payment</span>
                )}
              </button>

              <div className="text-center text-xs text-stone-500 flex justify-center items-center gap-1.5 mt-2">
                <Lock className="w-4 h-4 text-stone-400" /> 
                <span>Payments are secure and encrypted.</span>
              </div>
            </div>

            {/* Extra assurance metrics */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-stone-900 leading-none">Safe Shopping Guarantee</div>
                <div className="text-[11px] text-stone-400 mt-0.5">30-day full tuition refund policy if unsatisfied.</div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
