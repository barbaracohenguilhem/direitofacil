import { Module, Testimonial, Question } from './types';

export const MASTERCLASS_PRICE = 1250.00;
export const SHIPPING_PRICE = 0.00; // Free shipping
export const TAX_RATE = 0.085; // 8.5% tax
export const TAX_PRICE = 106.25;
export const TOTAL_PRICE = 1356.25;

export const SYLLABUS_MODULES: Module[] = [
  {
    id: 'm1',
    title: 'Module 01: The Grid',
    description: 'Deconstructing structural logic, structural order, and foundational typologies in high-end editorial spatial design.',
    duration: '2h 15m',
    isCompleted: false,
    videoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIUEX02gGoJDNVLsCgEwIeNKycZSbOW26560XbOfDuoQr1Akn7C8lqsvWF76-6XKzyLaBQ4BP05ZfwuTHLpXGnY6b9a9KKlRSxKce8OT1Qp8ip97fxzglw5DfFg-OEhxz51oRrbhHSi3TGUnjUjv7jP4hKNpf-vyG3-jmIdOROjT9GjZ9ohgLKifSpUyGX1humKhXIsXujKx05oNVCAoj7uWQo9tL64RGZbGblPzI7RTf124K5qaBg',
    notes: [
      'Understand proportional modular grids for plan and section.',
      'Analyze the relationship between structural grids and spatial partitions.',
      'Examine precedent studies of brutalist and modernist grid layouts.',
      'Practical Exercise: Design a 9-square structural grid using custom constraints.'
    ]
  },
  {
    id: 'm2',
    title: 'Module 02: Parametric Systems',
    description: 'Algorithmic form generation, responsive envelopes, and computational logic applied to building geometry.',
    duration: '3h 10m',
    isCompleted: false,
    videoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIUEX02gGoJDNVLsCgEwIeNKycZSbOW26560XbOfDuoQr1Akn7C8lqsvWF76-6XKzyLaBQ4BP05ZfwuTHLpXGnY6b9a9KKlRSxKce8OT1Qp8ip97fxzglw5DfFg-OEhxz51oRrbhHSi3TGUnjUjv7jP4hKNpf-vyG3-jmIdOROjT9GjZ9ohgLKifSpUyGX1humKhXIsXujKx05oNVCAoj7uWQo9tL64RGZbGblPzI7RTf124K5qaBg',
    notes: [
      'Introduction to visual programming and parametric modeling.',
      'Explore digital material simulation and environmental optimization.',
      'Create custom attractor-point systems for facade openings.',
      'Practical Exercise: Generate a responsive louvier facade module.'
    ]
  },
  {
    id: 'm3',
    title: 'Module 03: Tectonic Assembly',
    description: 'The material articulation of structural joints, assembly logic, and detail-level constructive poetry.',
    duration: '2h 45m',
    isCompleted: false,
    videoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIUEX02gGoJDNVLsCgEwIeNKycZSbOW26560XbOfDuoQr1Akn7C8lqsvWF76-6XKzyLaBQ4BP05ZfwuTHLpXGnY6b9a9KKlRSxKce8OT1Qp8ip97fxzglw5DfFg-OEhxz51oRrbhHSi3TGUnjUjv7jP4hKNpf-vyG3-jmIdOROjT9GjZ9ohgLKifSpUyGX1humKhXIsXujKx05oNVCAoj7uWQo9tL64RGZbGblPzI7RTf124K5qaBg',
    notes: [
      'Investigate the transition between load-bearing and lightweight systems.',
      'Analyze concrete casting, steel fabrication, and CNC timber joints.',
      'Detail design: Create a clean glass-to-concrete floor junction.',
      'Practical Exercise: Document an exploded axonometric of a joint assembly.'
    ]
  },
  {
    id: 'm4',
    title: 'Module 04: Radical Materiality',
    description: 'Redefining the physical sensory envelope. Exploring biopolymers, earth textures, and interactive surfaces.',
    duration: '3h 30m',
    isCompleted: false,
    videoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIUEX02gGoJDNVLsCgEwIeNKycZSbOW26560XbOfDuoQr1Akn7C8lqsvWF76-6XKzyLaBQ4BP05ZfwuTHLpXGnY6b9a9KKlRSxKce8OT1Qp8ip97fxzglw5DfFg-OEhxz51oRrbhHSi3TGUnjUjv7jP4hKNpf-vyG3-jmIdOROjT9GjZ9ohgLKifSpUyGX1humKhXIsXujKx05oNVCAoj7uWQo9tL64RGZbGblPzI7RTf124K5qaBg',
    notes: [
      'Understand life-cycle analysis of novel bio-based materials.',
      'Examine thermal mass and microclimate performance of natural plasters.',
      'Design sensory spaces using tactile contrast and acoustic properties.',
      'Practical Exercise: Draft a specification sheet for a low-carbon material.'
    ]
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    author: 'Elena K.',
    role: 'Alumni, Fall Cohort',
    avatarInitials: 'EK',
    quote: '"A profound shift in my design methodology. The curriculum doesn\'t just teach theory; it demands a total recalibration of how you perceive spatial relationships."'
  },
  {
    author: 'Marcus V.',
    role: 'Lead Architect, Studio MV',
    avatarInitials: 'MV',
    quote: '"The guest critiques alone are worth five times the tuition. Getting real-time feedback from world-class designers completely reshaped our studio\'s latest project proposal."'
  },
  {
    author: 'Sophia L.',
    role: 'Ph.D. Candidate, ETH Zürich',
    avatarInitials: 'SL',
    quote: '"The tectonic joint exercises and parametric scripting frameworks are directly applicable to complex architectural modeling. This masterclass is incredibly rigorous."'
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    user: 'Amara O.',
    text: 'How can we best reconcile structural grids with non-standard parametric form finding without losing tectonic efficiency?',
    timestamp: '2 hours ago',
    votes: 24
  },
  {
    id: 'q2',
    user: 'Liam Chen',
    text: 'For the Module 01 exercise, are we allowed to use asymmetrical grid offsets, or should they strictly maintain standard proportion rules?',
    timestamp: '4 hours ago',
    votes: 18
  },
  {
    id: 'q3',
    user: 'Beatrice M.',
    text: 'Which biopolymer specifications are currently considered viable for structural load-bearing envelopes in humid coastal climates?',
    timestamp: '1 day ago',
    votes: 12
  }
];
