export type KnownSubject =
  | 'Ética'
  | 'Processo Civil'
  | 'Constitucional'
  | 'Direito Civil';

// O banco completo da OAB terá muitas matérias. Mantemos autocomplete para as já usadas
// no protótipo sem impedir novas disciplinas importadas pelo Content Engine.
export type Subject = KnownSubject | (string & {});

export type ReasoningSignal =
  | 'solid'
  | 'partial'
  | 'lucky'
  | 'confused'
  | 'unknown';

export type QuestionOption = {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
  explanation: string;
};

export type AdaptiveQuestion = {
  id: string;
  subject: Subject;
  conceptId: string;
  conceptLabel: string;
  prompt: string;
  options: QuestionOption[];
  correctOption: QuestionOption['id'];
  reasoningKeywords: string[];
  misconceptionKeywords?: string[];
  openingLine?: string;
  nudge: string;
  secondNudge: string;
  takeaway: string;
  fgvPattern: string;
  vade?: {
    article: string;
    instruction: string;
  };
  isTransfer?: boolean;
};

export type ConceptState = {
  conceptId: string;
  strength: number;
  exposures: number;
  lastSeenAt?: string;
  nextReviewAt?: string;
};

export type Attempt = {
  questionId: string;
  conceptId: string;
  subject: Subject;
  selectedOption: string;
  correct: boolean;
  reasoningSignal: ReasoningSignal;
  hintsUsed: number;
  responseMs: number;
  createdAt: string;
};

export type LearnerState = {
  concepts: Record<string, ConceptState>;
  attempts: Attempt[];
  completedSessions: number;
  lastSessionAt?: string;
};

export type PlannedActivity = {
  questionId: string;
  reason: 'new' | 'reinforce' | 'retention' | 'transfer';
};
