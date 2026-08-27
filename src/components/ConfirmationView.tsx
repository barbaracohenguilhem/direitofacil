import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  ShieldCheck, 
  Printer, 
  Award 
} from 'lucide-react';
import { MASTERCLASS_PRICE } from '../data';
import { AppScreen, PaymentDetails } from '../types';

interface ConfirmationViewProps {
  onNavigate: (screen: AppScreen) => void;
  paymentDetails: PaymentDetails | null;
  couponDiscount: number;
  selectedAddons: string[];
}

export default function ConfirmationView({ 
  onNavigate, 
  paymentDetails,
  couponDiscount,
  selectedAddons
}: ConfirmationViewProps) {
  
  const orderNumber = 'EP-' + Math.floor(100000 + Math.random() * 900000);
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate prices
  const hasCompanionAddon = selectedAddons.includes('companion');
  const hasToolkitAddon = selectedAddons.includes('toolkit');
  const subTotal = (MASTERCLASS_PRICE * (1 - couponDiscount)) + 
    (hasCompanionAddon ? 95 : 0) + 
    (hasToolkitAddon ? 120 : 0);
  const calculatedTax = subTotal * 0.085;
  const finalTotal = subTotal + calculatedTax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#fcf8f8] min-h-screen pt-24 pb-16 font-sans text-[#1c1b1c] flex items-center justify-center">
      <main className="max-w-2xl w-full mx-auto px-4">
        
        {/* Animated Confirmation Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 md:p-10 border border-stone-200/80 shadow-2xl relative overflow-hidden"
        >
          {/* Top golden accent line */}
          <div className="absolute top-0 inset-x-0 h-2 bg-[#f7dece]" />

          <div className="flex flex-col items-center text-center">
            
            {/* Success icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 text-emerald-600">
              <CheckCircle className="w-10 h-10 fill-emerald-50" />
            </div>

            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              REGISTRATION CONFIRMED
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-950 font-medium leading-tight mb-4">
              Welcome to the Cohort
            </h1>
            <p className="text-stone-500 text-sm leading-relaxed max-w-md mb-8">
              Your payment of <span className="font-bold text-stone-900">${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> is complete. You have been assigned to the upcoming Fall cohort of Advanced Architecture.
            </p>

            {/* Receipt Summary Details */}
            <div className="w-full bg-stone-50 rounded-2xl p-6 border border-stone-100 text-left mb-8 text-sm">
              <div className="flex justify-between pb-3 border-b border-stone-200/60 mb-4">
                <h3 className="font-bold text-stone-900 uppercase text-xs tracking-wider">Receipt Summary</h3>
                <button 
                  onClick={handlePrint}
                  className="text-stone-400 hover:text-stone-900 flex items-center gap-1 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-stone-400">Order Number</span>
                  <span className="font-semibold text-stone-800">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Date</span>
                  <span className="font-semibold text-stone-800">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Payment Method</span>
                  <span className="font-semibold text-stone-800 uppercase">
                    {paymentDetails?.paymentMethod === 'paypal' ? 'PayPal' : `Credit Card (*${paymentDetails?.cardNumber.slice(-4) || '4444'})`}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-stone-200/60 mt-2 text-stone-900 font-bold">
                  <span>Total Charged</span>
                  <span>${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Next Step Box */}
            <div className="w-full bg-[#f4dbcb]/20 rounded-2xl p-5 border border-[#dac2b3]/30 text-left flex items-start gap-3.5 mb-8">
              <Award className="w-6 h-6 text-[#5d2a1a] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#5d2a1a] text-xs uppercase tracking-wider leading-none">Immediate Access Granted</h4>
                <p className="text-[13px] text-[#5d2a1a] mt-1 leading-relaxed opacity-90">
                  Your student account for <span className="font-bold">{paymentDetails?.nameOnCard || 'Elena Kostić'}</span> has been fully provisioned. You can enter the Student Portal right now to start watching Module 01, downloading tools, and preparing for the first critique session.
                </p>
              </div>
            </div>

            {/* CTA Button to Student Portal */}
            <button 
              onClick={() => onNavigate('portal')}
              className="w-full bg-stone-950 text-white py-4 rounded-full text-sm font-semibold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-md shadow-stone-950/10 hover:shadow-stone-950/25 active:scale-98 cursor-pointer"
            >
              <span>Enter Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => onNavigate('landing')}
              className="text-stone-400 hover:text-stone-700 text-xs mt-4 transition-colors font-semibold"
            >
              Return to Homepage
            </button>

          </div>

        </motion.div>
      </main>
    </div>
  );
}
