export type LearningEventType =
  | 'onboarding_completed'
  | 'session_started'
  | 'session_completed'
  | 'question_answered'
  | 'hint_used'
  | 'schedule_reflowed'
  | 'tutor_opened'
  | 'tutor_completed'
  | 'community_posted'
  | 'calibration_started'
  | 'calibration_completed';

export type LearningEvent = {
  id: string;
  type: LearningEventType;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

const TELEMETRY_KEY = 'direitofacil.learning-events.v1';

export function loadLearningEvents(): LearningEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    return raw ? (JSON.parse(raw) as LearningEvent[]) : [];
  } catch {
    return [];
  }
}

export function trackLearningEvent(
  type: LearningEventType,
  metadata?: LearningEvent['metadata'],
) {
  if (typeof window === 'undefined') return;
  const event: LearningEvent = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    createdAt: new Date().toISOString(),
    metadata,
  };
  const current = loadLearningEvents();
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify([...current, event].slice(-500)));
}

export function summarizeEngagement(events: LearningEvent[]) {
  const counts = events.reduce<Record<LearningEventType, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {
    onboarding_completed: 0,
    session_started: 0,
    session_completed: 0,
    question_answered: 0,
    hint_used: 0,
    schedule_reflowed: 0,
    tutor_opened: 0,
    tutor_completed: 0,
    community_posted: 0,
    calibration_started: 0,
    calibration_completed: 0,
  });

  const activeDates = new Set(events.map((event) => event.createdAt.slice(0, 10))).size;
  return { counts, activeDates, totalEvents: events.length };
}
