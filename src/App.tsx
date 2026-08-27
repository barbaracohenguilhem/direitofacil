import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LandingPage from './components/LandingPage';
import CartView from './components/CartView';
import PaymentView from './components/PaymentView';
import ConfirmationView from './components/ConfirmationView';
import StudentPortal from './components/StudentPortal';
import { AppScreen, PaymentDetails, Module } from './types';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  
  // Checkout & calculation state
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  // Confirmed payment information
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  // Syllabus click integration
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Load state on mount if user is already enrolled
  useEffect(() => {
    const enrolled = localStorage.getItem('edu_enrolled');
    if (enrolled === 'true') {
      const savedDetails = localStorage.getItem('edu_payment_details');
      if (savedDetails) {
        setPaymentDetails(JSON.parse(savedDetails));
      }
    }
  }, []);

  const handleNavigate = (targetScreen: AppScreen) => {
    setScreen(targetScreen);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleApplyCoupon = (discount: number, code: string) => {
    setCouponDiscount(discount);
    setAppliedCouponCode(code);
  };

  const handleToggleAddon = (addonId: string, price: number) => {
    setSelectedAddons(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      } else {
        return [...prev, addonId];
      }
    });
  };

  const handleSubmitPayment = (details: PaymentDetails) => {
    setPaymentDetails(details);
    localStorage.setItem('edu_enrolled', 'true');
    localStorage.setItem('edu_payment_details', JSON.stringify(details));
    handleNavigate('confirmation');
  };

  const handleSelectModule = (mod: Module) => {
    setSelectedModule(mod);
    const enrolled = localStorage.getItem('edu_enrolled');
    if (enrolled === 'true') {
      handleNavigate('portal');
    } else {
      handleNavigate('cart');
    }
  };

  // Instant login simulator for Student Portal
  const handleLogin = () => {
    // If not enrolled yet, we pre-authenticate them as a demo student to explore the student hub!
    const enrolled = localStorage.getItem('edu_enrolled');
    if (enrolled !== 'true') {
      const demoDetails: PaymentDetails = {
        cardNumber: '4111 2222 3333 4444',
        expirationDate: '12/28',
        cvc: '923',
        nameOnCard: 'Elena Kostić',
        paymentMethod: 'card'
      };
      setPaymentDetails(demoDetails);
      localStorage.setItem('edu_enrolled', 'true');
      localStorage.setItem('edu_payment_details', JSON.stringify(demoDetails));
    }
    handleNavigate('portal');
  };

  return (
    <div className="bg-[#fcf8f8] min-h-screen text-stone-900 selection:bg-stone-100 selection:text-stone-950 font-sans antialiased overflow-x-hidden">
      
      {/* Screen Router Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="min-h-screen flex flex-col justify-between"
        >
          {screen === 'landing' && (
            <LandingPage 
              onNavigate={handleNavigate}
              onSelectModule={handleSelectModule}
              onLogin={handleLogin}
            />
          )}

          {screen === 'cart' && (
            <CartView 
              onNavigate={handleNavigate}
              couponDiscount={couponDiscount}
              onApplyCoupon={handleApplyCoupon}
              appliedCouponCode={appliedCouponCode}
              selectedAddons={selectedAddons}
              onToggleAddon={handleToggleAddon}
            />
          )}

          {screen === 'payment' && (
            <PaymentView 
              onNavigate={handleNavigate}
              onSubmitPayment={handleSubmitPayment}
              couponDiscount={couponDiscount}
              appliedCouponCode={appliedCouponCode}
              selectedAddons={selectedAddons}
            />
          )}

          {screen === 'confirmation' && (
            <ConfirmationView 
              onNavigate={handleNavigate}
              paymentDetails={paymentDetails}
              couponDiscount={couponDiscount}
              selectedAddons={selectedAddons}
            />
          )}

          {screen === 'portal' && (
            <StudentPortal 
              onNavigate={(sc) => handleNavigate(sc as AppScreen)}
              selectedModule={selectedModule}
            />
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
