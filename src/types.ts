export interface PaymentDetails {
  cardNumber: string;
  expirationDate: string;
  cvc: string;
  nameOnCard: string;
  paymentMethod: 'card' | 'paypal';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  videoUrl: string;
  notes: string[];
}

export interface Testimonial {
  author: string;
  role: string;
  avatarInitials: string;
  quote: string;
}

export interface Question {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  votes: number;
}

export interface ProjectSubmission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'reviewed';
  submittedAt: string;
  feedback?: string;
}

export type AppScreen = 'landing' | 'cart' | 'payment' | 'confirmation' | 'portal';
