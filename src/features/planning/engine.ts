import { buildNextActivities, loadLearnerState } from '@/features/adaptive/engine';
import { getRuntimeQuestion } from '@/features/content/repository';
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

function nextLocalDateKey(value: string) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return localDateKey(date);
}

function dayKeyFor(date: Date): DayKey {
  return DAY_KEYS[date.getDay()];
}

function timeToMinutes(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function minutesToTime(value: number) {
  const normalized = Math.max(0, Math.min(value, 23 * 60 + 45));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function resolvePreferredStart(
  profile: StudyProfile,
  dayKey: DayKey,
  preferredStart: string,
  studyMinutes: number,
) {
  let start = timeToMinutes(preferredStart);
  const relevant = profile.commitments
    .filter((commitment) => commitment.days.includes(dayKey))
    .map((commitment) => ({ start: timeToMinutes(commitment.start), end: timeToMinutes(commitment.end) }))
    .sort((a, b) => a.start - b.start);

  for (const commitment of relevant) {
    const studyEnd = start + Math.min(studyMinutes, profile.sessionMinutes);
    const overlaps = start < commitment.end && studyEnd > commitment.start;
    if (overlaps) start = commitment.end + 15;
  }

  return minutesToTime(start);
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
    const question = getRuntimeQuestion(activity.questionId);
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

function distributeBacklog(plan: StudyPlan, backlog: number, fromDate: string): StudyPlan {
  if (backlog <= 0) return { ...plan, totalCarriedMinutes: 0 };

  let remaining = backlog;
  const days = plan.days.map((day) => ({ ...day, blocks: [...day.blocks] }));

  for (const day of days) {
    if (remaining <= 0) break;
    if (day.date < fromDate || day.status !== 'planned' || day.baseMinutes <= 0) continue;

    const extraCapacity = Math.max(15, Math.floor(day.baseMinutes * 0.5));
    const add = Math.min(extraCapacity, remaining);
    day.carriedMinutes += add;
    day.plannedMinutes += add;
    day.blocks = composeBlocks(day.plannedMinutes);
    remaining -= add;
  }

  return {
    ...plan,
    generatedAt: new Date().toISOString(),
    days,
    totalCarriedMinutes: remaining,
  };
}

function reconcilePastMissedDays(plan: StudyPlan, today: string): StudyPlan {
  let backlog = plan.totalCarriedMinutes;
  let foundMissed = false;

  const days = plan.days.map((day) => {
    if (day.date < today && day.status === 'planned' && day.plannedMinutes > 0) {
      backlog += day.plannedMinutes;
      foundMissed = true;
      return { ...day, status: 'missed' as const, plannedMinutes: 0, blocks: [] };
    }
    return { ...day, blocks: [...day.blocks] };
  });

  if (!foundMissed && backlog === plan.totalCarriedMinutes) return plan;

  const reconciled = distributeBacklog({ ...plan, days, totalCarriedMinutes: 0 }, backlog, today);
  saveStudyPlan(reconciled);

  if (foundMissed) {
    trackLearningEvent('schedule_reflowed', {
      date: today,
      automatic: true,
      recoveredBacklogMinutes: backlog,
      stillUnplacedMinutes: reconciled.totalCarriedMinutes,
    });
  }

  return reconciled;
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
    const rawStart = availability?.preferredStart ?? '19:00';

    days.push({
      date: localDateKey(date),
      dayKey,
      preferredStart: resolvePreferredStart(profile, dayKey, rawStart, baseMinutes),
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
    return reconcilePastMissedDays(existing, today);
  }

  let outstanding = existing?.totalCarriedMinutes ?? 0;
  if (existing && existing.examDate === profile.examDate) {
    outstanding += existing.days
      .filter((day) => day.status === 'planned' && day.plannedMinutes > 0)
      .reduce((sum, day) => sum + day.plannedMinutes, 0);
  }

  const fresh = generateStudyPlan(profile);
  if (outstanding <= 0) return fresh;

  const carried = distributeBacklog(fresh, outstanding, today);
  saveStudyPlan(carried);
  trackLearningEvent('schedule_reflowed', {
    date: today,
    automatic: true,
    crossedPlanWindow: true,
    recoveredBacklogMinutes: outstanding,
    stillUnplacedMinutes: carried.totalCarriedMinutes,
  });
  return carried;
}

export function reflowMissedDay(plan: StudyPlan, date: string): StudyPlan {
  const index = plan.days.findIndex((day) => day.date === date);
  if (index < 0) return plan;

  const source = plan.days[index];
  if (source.status !== 'planned' || source.plannedMinutes <= 0) return plan;

  const originalMinutes = source.plannedMinutes;
  const days = plan.days.map((day, i) => {
    if (i !== index) return { ...day, blocks: [...day.blocks] };
    return { ...day, status: 'missed' as const, plannedMinutes: 0, blocks: [] };
  });

  const redistributed = distributeBacklog(
    { ...plan, days, totalCarriedMinutes: 0 },
    originalMinutes + plan.totalCarriedMinutes,
    nextLocalDateKey(date),
  );
  saveStudyPlan(redistributed);
  trackLearningEvent('schedule_reflowed', {
    date,
    originalMinutes,
    availableMinutes: 0,
    movedMinutes: originalMinutes + plan.totalCarriedMinutes - redistributed.totalCarriedMinutes,
    stillUnplacedMinutes: redistributed.totalCarriedMinutes,
  });
  return redistributed;
}

export function markDayDone(plan: StudyPlan, date: string): StudyPlan {
  const days = plan.days.map((day) => {
    if (day.date === date) return { ...day, status: 'done' as const };
    if (day.date > date && day.status === 'planned' && day.plannedMinutes > 0) {
      return {
        ...day,
        blocks: composeBlocks(day.plannedMinutes),
      };
    }
    return day;
  });

  const updated = {
    ...plan,
    generatedAt: new Date().toISOString(),
    days,
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

  const redistributed = distributeBacklog(
    { ...plan, days, totalCarriedMinutes: 0 },
    deficit + plan.totalCarriedMinutes,
    nextLocalDateKey(date),
  );
  saveStudyPlan(redistributed);
  trackLearningEvent('schedule_reflowed', {
    date,
    originalMinutes: previous.plannedMinutes,
    availableMinutes,
    movedMinutes: deficit + plan.totalCarriedMinutes - redistributed.totalCarriedMinutes,
    stillUnplacedMinutes: redistributed.totalCarriedMinutes,
  });
  return redistributed;
}
