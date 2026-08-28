import { buildNextActivities, loadLearnerState } from '@/features/adaptive/engine';
import { getQuestion } from '@/features/adaptive/question-bank';
import { trackLearningEvent } from '@/features/telemetry/engine';
import type { DayKey, StudyBlock, StudyDay, StudyPlan, StudyProfile } from './types';

const PROFILE_KEY = 'direitofacil.study-profile.v1';
const PLAN_KEY = 'direitofacil.study-plan.v1';

const DAY_KEYS: DayKey[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayKeyFor(date: Date): DayKey {
  return DAY_KEYS[date.getDay()];
}

export function saveStudyProfile(profile: StudyProfile) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    trackLearningEvent('onboarding_completed', {
      examDate: profile.examDate,
      sessionMinutes: profile.sessionMinutes,
      calendarConnected: profile.calendarConnected,
      commitmentCount: profile.commitments.length,
      weeklyMinutes: profile.availability.reduce((sum, item) => sum + item.minutes, 0),
    });
  }
}

export function loadStudyProfile(): StudyProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as StudyProfile) : null;
  } catch {
    return null;
  }
}

export function saveStudyPlan(plan: StudyPlan) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }
}

export function loadStudyPlan(): StudyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as StudyPlan) : null;
  } catch {
    return null;
  }
}

function blockDurations(total: number, count: number) {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const rest = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rest ? 1 : 0));
}

function activityCountFor(minutes: number) {
  if (minutes <= 0) return 0;
  return Math.max(2, Math.min(6, Math.ceil(minutes / 10)));
}

function composeBlocks(minutes: number): StudyBlock[] {
  if (minutes <= 0) return [];

  const learner = loadLearnerState();
  const activities = buildNextActivities(learner, activityCountFor(minutes));
  const durations = blockDurations(minutes, activities.length);

  return activities.map((activity, index) => {
    const question = getQuestion(activity.questionId);
    const isReview = activity.reason === 'retention' || activity.reason === 'reinforce' || activity.reason === 'transfer';
    return {
      id: `${activity.questionId}-${index}`,
      questionId: activity.questionId,
      adaptiveReason: activity.reason,
      label: isReview ? 'Revisão aplicada' : 'Aprender pela questão',
      subject: question?.subject,
      minutes: durations[index] ?? 0,
      kind: isReview ? 'review' : 'learning',
    } satisfies StudyBlock;
  });
}

export function generateStudyPlan(profile: StudyProfile, start = new Date()): StudyPlan {
  const days: StudyDay[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(start);
    date.setHours(12, 0, 0, 0);
    date.setDate(start.getDate() + offset);
    const dayKey = dayKeyFor(date);
    const availability = profile.availability.find((item) => item.day === dayKey);
    const baseMinutes = availability?.minutes ?? 0;

    days.push({
      date: localDateKey(date),
      dayKey,
      preferredStart: availability?.preferredStart ?? '19:00',
      baseMinutes,
      plannedMinutes: baseMinutes,
      carriedMinutes: 0,
      status: baseMinutes > 0 ? 'planned' : 'unavailable',
      blocks: composeBlocks(baseMinutes),
    });
  }

  const plan: StudyPlan = {
    generatedAt: new Date().toISOString(),
    examDate: profile.examDate,
    days,
    totalCarriedMinutes: 0,
  };

  saveStudyPlan(plan);
  return plan;
}

export function ensureStudyPlan(profile: StudyProfile): StudyPlan {
  const existing = loadStudyPlan();
  const today = localDateKey();
  if (existing && existing.examDate === profile.examDate && existing.days.some((day) => day.date === today)) {
    return existing;
  }
  return generateStudyPlan(profile);
}

export function reflowMissedDay(plan: StudyPlan, date: string): StudyPlan {
  const index = plan.days.findIndex((day) => day.date === date);
  if (index < 0) return plan;

  const source = plan.days[index];
  if (source.status !== 'planned' || source.plannedMinutes <= 0) return plan;

  const originalMinutes = source.plannedMinutes;
  let remaining = source.plannedMinutes;
  const days = plan.days.map((day, i) => {
    if (i !== index) return { ...day, blocks: [...day.blocks] };
    return { ...day, status: 'missed' as const, plannedMinutes: 0, blocks: [] };
  });

  for (let i = index + 1; i < days.length && remaining > 0; i += 1) {
    const day = days[i];
    if (day.status === 'unavailable' || day.baseMinutes <= 0) continue;

    const extraCapacity = Math.max(15, Math.floor(day.baseMinutes * 0.5));
    const add = Math.min(extraCapacity, remaining);
    day.carriedMinutes += add;
    day.plannedMinutes += add;
    day.blocks = composeBlocks(day.plannedMinutes);
    remaining -= add;
  }

  const updated: StudyPlan = {
    ...plan,
    generatedAt: new Date().toISOString(),
    days,
    totalCarriedMinutes: remaining,
  };

  saveStudyPlan(updated);
  trackLearningEvent('schedule_reflowed', {
    date,
    originalMinutes,
    availableMinutes: 0,
    movedMinutes: originalMinutes - remaining,
    stillUnplacedMinutes: remaining,
  });
  return updated;
}

export function markDayDone(plan: StudyPlan, date: string): StudyPlan {
  const updated = {
    ...plan,
    days: plan.days.map((day) => (day.date === date ? { ...day, status: 'done' as const } : day)),
  };
  saveStudyPlan(updated);
  return updated;
}

export function rescheduleWithMinutes(plan: StudyPlan, date: string, availableMinutes: number): StudyPlan {
  const index = plan.days.findIndex((day) => day.date === date);
  if (index < 0) return plan;

  const previous = plan.days[index];
  const deficit = Math.max(0, previous.plannedMinutes - availableMinutes);
  const days = plan.days.map((day, i) => {
    if (i !== index) return { ...day, blocks: [...day.blocks] };
    return {
      ...day,
      baseMinutes: availableMinutes,
      plannedMinutes: availableMinutes,
      carriedMinutes: 0,
      status: availableMinutes > 0 ? ('planned' as const) : ('unavailable' as const),
      blocks: composeBlocks(availableMinutes),
    };
  });

  let remaining = deficit;
  for (let i = index + 1; i < days.length && remaining > 0; i += 1) {
    const day = days[i];
    if (day.status === 'unavailable' || day.baseMinutes <= 0) continue;
    const extraCapacity = Math.max(15, Math.floor(day.baseMinutes * 0.5));
    const add = Math.min(extraCapacity, remaining);
    day.carriedMinutes += add;
    day.plannedMinutes += add;
    day.blocks = composeBlocks(day.plannedMinutes);
    remaining -= add;
  }

  const updated: StudyPlan = {
    ...plan,
    generatedAt: new Date().toISOString(),
    days,
    totalCarriedMinutes: remaining,
  };
  saveStudyPlan(updated);
  trackLearningEvent('schedule_reflowed', {
    date,
    originalMinutes: previous.plannedMinutes,
    availableMinutes,
    movedMinutes: deficit - remaining,
    stillUnplacedMinutes: remaining,
  });
  return updated;
}
