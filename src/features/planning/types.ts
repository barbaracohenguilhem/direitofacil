export type DayKey = 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';

export type DailyAvailability = {
  day: DayKey;
  minutes: number;
  preferredStart: string;
};

export type FixedCommitment = {
  id: string;
  label: string;
  days: DayKey[];
  start: string;
  end: string;
};

export type StudyProfile = {
  examDate: string;
  sessionMinutes: number;
  calendarConnected: boolean;
  availability: DailyAvailability[];
  commitments: FixedCommitment[];
  createdAt: string;
};

export type StudyBlock = {
  id: string;
  label: string;
  subject?: string;
  minutes: number;
  kind: 'learning' | 'review' | 'questions' | 'calibration';
};

export type StudyDay = {
  date: string;
  dayKey: DayKey;
  preferredStart: string;
  baseMinutes: number;
  plannedMinutes: number;
  carriedMinutes: number;
  status: 'planned' | 'done' | 'missed' | 'unavailable';
  blocks: StudyBlock[];
};

export type StudyPlan = {
  generatedAt: string;
  examDate: string;
  days: StudyDay[];
  totalCarriedMinutes: number;
};
