import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Sparkles, 
  BookOpen, 
  Clock, 
  HelpCircle, 
  Check, 
  ChevronRight, 
  MessageSquare, 
  Users, 
  Lock, 
  Compass, 
  Award,
  Video,
  X
} from 'lucide-react';
import { SYLLABUS_MODULES, TESTIMONIALS } from '../data';
import { AppScreen, Module } from '../types';

interface LandingPageProps {
  onNavigate: (screen: AppScreen) => void;
  onSelectModule: (module: Module) => void;
  onLogin: () => void;
}

export default function LandingPage({ onNavigate, onSelectModule, onLogin }: LandingPageProps) {
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [selectedModuleForDetails, setSelectedModuleForDetails] = useState<Module | null>(null);
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);

  const handleOpenVideoPreview = () => {
    setIsVideoPreviewOpen(true);
  };

  const handleOpenSyllabus = () => {
    setIsSyllabusOpen(true);
  };

  const handleCloseSyllabus = () => {
    setIsSyllabusOpen(false);
    setSelectedModuleForDetails(null);
  };

  return (
    <div className="bg-white min-h-screen font-sans text-stone-900 relative selection:bg-stone-100 selection:text-stone-900 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="font-serif text-2xl font-medium tracking-tight text-stone-950 cursor-pointer" onClick={() => onNavigate('landing')}>
            EduPortal
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <button 
              onClick={handleOpenSyllabus}
              className="text-stone-600 text-sm font-medium hover:text-stone-900 transition-colors"
            >
              Curriculum
            </button>
            <button 
              onClick={() => {
                const element = document.getElementById('testimonials-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-stone-600 text-sm font-medium hover:text-stone-900 transition-colors"
            >
              Testimonials
            </button>
            <button 
              onClick={() => onNavigate('cart')}
              className="text-stone-600 text-sm font-medium hover:text-stone-900 transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={onLogin}
              className="bg-stone-950 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-stone-800 transition-colors"
            >
              Student Portal
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <button 
              onClick={onLogin}
              className="bg-stone-950 text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Portal
            </button>
            <button 
              onClick={handleOpenSyllabus}
              className="text-stone-600 p-1 hover:text-stone-950"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-[120px] pb-24 px-4 md:px-10 max-w-[1200px] mx-auto w-full relative">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mt-8 mb-20 relative z-10 max-w-4xl mx-auto">
          <span className="text-stone-400 text-xs uppercase tracking-widest mb-6 font-semibold block">
            MASTERCLASS SERIES
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-stone-950 leading-tight mb-8 font-medium">
            Advanced<br />Architecture.
          </h1>
          <p className="text-stone-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            A rigorous exploration into the structural poetry of modern environments. Redefine space, form, and material through a curriculum designed for the uncompromising visionary.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button 
              onClick={() => onNavigate('cart')}
              className="w-full sm:w-auto bg-stone-950 text-white px-10 py-4 rounded-full text-sm font-semibold tracking-wide hover:bg-stone-800 transition-all shadow-sm hover:shadow active:scale-98"
            >
              Enroll Now — $1,356.25
            </button>
            <button 
              onClick={handleOpenSyllabus}
              className="w-full sm:w-auto bg-transparent border border-stone-300 text-stone-800 px-10 py-4 rounded-full text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              View Full Syllabus
            </button>
          </div>
        </section>

        {/* Floating Artifacts Canvas - Exact Layout matching the design with high interactivity */}
        <div className="relative w-full min-h-[500px] md:h-[450px] mt-16 pb-12">
          
          {/* Card 1: Course Preview - Module 01: The Grid (Left-aligned) */}
          <motion.div 
            initial={{ opacity: 0, y: 40, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            whileHover={{ rotate: 0, scale: 1.02, zIndex: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="md:absolute left-0 md:left-[5%] top-0 w-full md:w-[340px] bg-white rounded-[24px] p-5 border border-stone-200/80 shadow-xl shadow-stone-100/50 cursor-pointer pointer-events-auto transition-shadow"
            onClick={handleOpenVideoPreview}
          >
            <div className="w-full h-[190px] rounded-[16px] bg-stone-100 overflow-hidden mb-4 relative group">
              <img 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                alt="Minimalist architectural scale model"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIUEX02gGoJDNVLsCgEwIeNKycZSbOW26560XbOfDuoQr1Akn7C8lqsvWF76-6XKzyLaBQ4BP05ZfwuTHLpXGnY6b9a9KKlRSxKce8OT1Qp8ip97fxzglw5DfFg-OEhxz51oRrbhHSi3TGUnjUjv7jP4hKNpf-vyG3-jmIdOROjT9GjZ9ohgLKifSpUyGX1humKhXIsXujKx05oNVCAoj7uWQo9tL64RGZbGblPzI7RTf124K5qaBg"
              />
              <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center backdrop-blur-sm shadow-md group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-stone-900 fill-stone-900 ml-1" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                2h 15m Preview
              </div>
            </div>
            <h3 className="font-serif text-xl font-medium text-stone-950 mb-1.5 flex items-center justify-between">
              Module 01: The Grid
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Deconstructing structural logic and foundational typologies.
            </p>
          </motion.div>

          {/* Card 2: Accent Highlight - Guest Critique (Right-aligned) */}
          <motion.div 
            initial={{ opacity: 0, y: 30, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 3 }}
            whileHover={{ rotate: 0, scale: 1.02, zIndex: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.15 }}
            className="mt-6 md:mt-0 md:absolute right-0 md:right-[5%] top-[10px] w-full md:w-[290px] bg-[#f7dece] rounded-[24px] p-6 border border-[#dac2b3]/60 cursor-pointer pointer-events-auto"
            onClick={() => {
              const element = document.getElementById('testimonials-section');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-10 h-10 rounded-full bg-[#f4dbcb] flex items-center justify-center mb-4 border border-[#dac2b3]">
              <Sparkles className="w-5 h-5 text-amber-900" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#5d2a1a] mb-2">Guest Critique</h3>
            <p className="text-stone-800 text-sm leading-relaxed opacity-90 mb-4">
              Live portfolio reviews with leading international practitioners every fortnight.
            </p>
            <div className="flex items-center gap-1 text-xs text-[#5d2a1a] font-bold uppercase tracking-wider">
              <span>View Cohort Schedule</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>

          {/* Card 3: Testimonial - Elena K. (Center-bottom) */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, zIndex: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.3 }}
            className="mt-6 md:mt-0 md:absolute left-1/2 md:-translate-x-1/2 top-[220px] w-full md:w-[400px] bg-white rounded-[24px] p-6 border border-stone-200/80 shadow-lg shadow-stone-100/50 cursor-pointer pointer-events-auto"
            onClick={() => {
              setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-11 h-11 rounded-full bg-stone-100 border border-stone-200/60 flex items-center justify-center font-bold text-stone-800 text-sm">
                {TESTIMONIALS[activeTestimonialIdx].avatarInitials}
              </div>
              <div className="flex-1">
                <div className="font-bold text-stone-900 text-sm leading-snug">
                  {TESTIMONIALS[activeTestimonialIdx].author}
                </div>
                <div className="text-stone-400 text-xs">
                  {TESTIMONIALS[activeTestimonialIdx].role}
                </div>
              </div>
              <span className="text-stone-300 text-xs uppercase tracking-wider font-semibold">
                Click to Rotate
              </span>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed italic">
              {TESTIMONIALS[activeTestimonialIdx].quote}
            </p>
          </motion.div>

        </div>

        {/* Feature Grid / Core Benefits Section */}
        <section id="features-section" className="mt-32 pt-12 border-t border-stone-100">
          <div className="text-center mb-16">
            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">
              ACADEMIC EXPERIENCE
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-stone-950 mt-3 font-medium">
              Curated for Critical Depth
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-stone-50 rounded-[20px] border border-stone-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100 mb-6 text-stone-900">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-950 mb-3">Tectonic Rigor</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Go beyond aesthetic theory. Learn the physical assembly logic, joint details, and materials that transform ideas into structural realities.
              </p>
            </div>
            <div className="p-6 bg-stone-50 rounded-[20px] border border-stone-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100 mb-6 text-stone-900">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-950 mb-3">Live Critiques</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Present your projects directly to world-leading practitioners. Receive direct, uncompromising guidance to refine your creative perspective.
              </p>
            </div>
            <div className="p-6 bg-stone-50 rounded-[20px] border border-stone-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100 mb-6 text-stone-900">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-950 mb-3">Closed Cohort</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Learn alongside select practitioners and design alumni. Gain lifetime access to an elite global network of spatial innovators.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonial Section & Carousel */}
        <section id="testimonials-section" className="mt-32 bg-stone-50 rounded-[32px] p-8 md:p-16 border border-stone-100/50">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-6 block">
              STUDENT REVIEWS
            </span>
            <p className="font-serif text-2xl md:text-3xl text-stone-900 leading-relaxed italic mb-8">
              "This masterclass was a complete inflection point. The depth of instruction on parametric systems and structural engineering joints is simply unmatched."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-950 text-white flex items-center justify-center font-bold text-sm">
                MK
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-950 text-sm">Milena Kostić</h4>
                <p className="text-stone-400 text-xs">Architectural Director, Belgrade</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-32 max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-stone-950 text-center mb-16 font-medium">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-6">
              <h3 className="font-semibold text-stone-900 mb-2">What is the cohort format?</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                The series consists of four pre-recorded foundational modules combined with bi-weekly live review sessions. You can review the masterclass assets on your own schedule and present drafts in live sessions.
              </p>
            </div>
            <div className="border-b border-stone-100 pb-6">
              <h3 className="font-semibold text-stone-900 mb-2">Do I receive continuous feedback?</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Yes. Through our Guest Critique portal, students submit progress drafts and receive written and audio feedback from course guides, as well as peer suggestions from the cohort.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Simple Footer */}
      <footer className="border-t border-stone-100 py-12 bg-white mt-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-stone-400 text-xs gap-4">
          <div>© 2026 EduPortal Editorial. All rights reserved.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-stone-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Syllabus Modal Overview */}
      {isSyllabusOpen && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[28px] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative border border-stone-100"
          >
            <button 
              onClick={handleCloseSyllabus}
              className="absolute top-6 right-6 p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest block mb-1">
              CURRICULUM SYLLABUS
            </span>
            <h2 className="font-serif text-3xl text-stone-950 mb-6 font-medium">
              Course Architecture
            </h2>

            <div className="space-y-4 mb-8">
              {SYLLABUS_MODULES.map((mod, idx) => (
                <div 
                  key={mod.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    selectedModuleForDetails?.id === mod.id 
                      ? 'border-stone-900 bg-stone-50/50' 
                      : 'border-stone-100 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div 
                    onClick={() => setSelectedModuleForDetails(selectedModuleForDetails?.id === mod.id ? null : mod)}
                    className="flex justify-between items-start gap-4 cursor-pointer"
                  >
                    <div>
                      <span className="text-xs text-stone-400 font-semibold block mb-1 uppercase tracking-wider">
                        {mod.duration}
                      </span>
                      <h3 className="font-serif text-lg font-medium text-stone-950">
                        {mod.title}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                      {selectedModuleForDetails?.id === mod.id ? 'Hide Details' : 'View Details'}
                    </span>
                  </div>

                  {selectedModuleForDetails?.id === mod.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-stone-200/60 overflow-hidden"
                    >
                      <p className="text-stone-600 text-sm mb-4 leading-relaxed">
                        {mod.description}
                      </p>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                        Key Concepts Covered:
                      </h4>
                      <ul className="space-y-2">
                        {mod.notes.map((note, noteIdx) => (
                          <li key={noteIdx} className="text-xs text-stone-500 flex items-start gap-2">
                            <span className="text-stone-900 font-bold mt-0.5">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 items-center">
              <button 
                onClick={() => {
                  handleCloseSyllabus();
                  onNavigate('cart');
                }}
                className="flex-1 bg-stone-950 text-white py-4 rounded-full text-sm font-semibold hover:bg-stone-800 transition-colors text-center"
              >
                Secure Your Spot — $1,356.25
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Video Preview Modal */}
      {isVideoPreviewOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[28px] max-w-3xl w-full overflow-hidden shadow-2xl relative border border-stone-100"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <div>
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest block mb-0.5">
                  MODULE 01 PREVIEW
                </span>
                <h3 className="font-serif text-xl font-medium text-stone-950">
                  The Grid: Fundamental Structure
                </h3>
              </div>
              <button 
                onClick={() => setIsVideoPreviewOpen(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Video Player */}
            <div className="w-full aspect-video bg-black relative">
              <img 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80" 
                alt="Masterclass lecture layout"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIUEX02gGoJDNVLsCgEwIeNKycZSbOW26560XbOfDuoQr1Akn7C8lqsvWF76-6XKzyLaBQ4BP05ZfwuTHLpXGnY6b9a9KKlRSxKce8OT1Qp8ip97fxzglw5DfFg-OEhxz51oRrbhHSi3TGUnjUjv7jP4hKNpf-vyG3-jmIdOROjT9GjZ9ohgLKifSpUyGX1humKhXIsXujKx05oNVCAoj7uWQo9tL64RGZbGblPzI7RTf124K5qaBg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
              
              {/* Overlay play state */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="flex items-center gap-4 text-white mb-2">
                  <Play className="w-10 h-10 bg-white text-stone-950 fill-stone-950 rounded-full p-2.5 cursor-pointer hover:scale-105 transition-transform" />
                  <div>
                    <div className="text-sm font-bold">Lecture 1.1: Historical Precedents</div>
                    <div className="text-stone-300 text-xs">Durat: 08:42 / 18:24</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden cursor-pointer mb-2">
                  <div className="bg-white h-full w-[45%]" />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                In this video session:
              </h4>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">
                We analyze structural order in modern modular systems, analyzing Le Corbusier's Domino framework and Mies van der Rohe's column grids. You will learn how to create grids that act as catalysts for poetic layout decisions.
              </p>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <span className="text-xs text-stone-400 font-medium">
                  Enrollment unlocks full lifetime HD streaming & subtitles.
                </span>
                <button 
                  onClick={() => {
                    setIsVideoPreviewOpen(false);
                    onNavigate('cart');
                  }}
                  className="bg-stone-950 text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors"
                >
                  Secure Enrollment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
