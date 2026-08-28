import type { AdaptiveQuestion } from '@/features/adaptive/types';

export type ContentStatus = 'draft' | 'review' | 'published';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'unknown';

export type OABQuestionRecord = {
  id: string;
  exam?: string;
  year?: number;
  questionNumber?: number;
  subject: string;
  topic?: string;
  subtopic?: string;
  conceptId: string;
  conceptLabel: string;
  difficulty: Difficulty;
  sourceUrl?: string;
  status: ContentStatus;
  adaptive: AdaptiveQuestion;
  importedAt: string;
  updatedAt: string;
};

export type ImportIssue = {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
};

export type ImportPreview = {
  records: OABQuestionRecord[];
  issues: ImportIssue[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
};

export const QUESTION_IMPORT_COLUMNS = [
  'id',
  'exam',
  'year',
  'questionNumber',
  'subject',
  'topic',
  'subtopic',
  'conceptId',
  'conceptLabel',
  'prompt',
  'optionA',
  'optionB',
  'optionC',
  'optionD',
  'correctOption',
  'explanationA',
  'explanationB',
  'explanationC',
  'explanationD',
  'reasoningKeywords',
  'misconceptionKeywords',
  'openingLine',
  'nudge',
  'secondNudge',
  'takeaway',
  'fgvPattern',
  'vadeArticle',
  'vadeInstruction',
  'isTransfer',
  'difficulty',
  'sourceUrl',
  'status',
] as const;
