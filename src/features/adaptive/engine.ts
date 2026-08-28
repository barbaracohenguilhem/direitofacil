import { getRuntimeQuestionBank } from '@/features/content/repository';
import { strategyScoreModifiers } from '@/features/strategy/engine';
import { trackLearningEvent } from '@/features/telemetry/engine';
import { conceptIsUnlocked, getCurriculumConcept } from './curriculum';
import type { Attempt, LearnerState, PlannedActivity, ReasoningSignal } from './types';

const STORAGE_KEY = 'direitofacil.learner-state.v1';

export function emptyLearnerState(): LearnerState {
  return { concepts: {}, attempts: [], completedSessions: 0 };
}

export function loadLearnerState(): LearnerState {
  if (typeof window === 'undefined') return emptyLearnerState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LearnerState) : emptyLearnerState();
  } catch {
    return emptyLearnerState();
  }
}

export function saveLearnerState(state: LearnerState) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function inferReasoningSignal(
  reasoning: string,
  correct: boolean,
  keywords: string[],
  misconceptions: string[] = [],
): ReasoningSignal {
  const normalized = reasoning.toLowerCase();
  const goodHits = keywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
  const badHit = misconceptions.some((keyword) => normalized.includes(keyword.toLowerCase()));

  if (correct && goodHits >= 1 && !badHit) return 'solid';
  if (correct && (goodHits === 0 || badHit)) return 'lucky';
  if (!correct && goodHits >= 1) return 'partial';
  if (badHit) return 'confused';
  return 'unknown';
}

export function applyAttempt(state: LearnerState, attempt: Attempt): LearnerState {
  const previous = state.concepts[attempt.conceptId] ?? {
    conceptId: attempt.conceptId,
    strength: 0.25,
    exposures: 0,
  };

  const signalDelta: Record<ReasoningSignal, number> = {
    solid: 0.22,
    partial: 0.08,
    lucky: 0.02,
    confused: -0.08,
    unknown: -0.04,
  };

  const hintPenalty = attempt.hintsUsed * 0.035;
  const correctnessDelta = attempt.correct ? 0.08 : -0.05;
  const nextStrength = Math.max(
    0.05,
    Math.min(0.98, previous.strength + signalDelta[attempt.reasoningSignal] + correctnessDelta - hintPenalty),
  );

  const now = new Date();
  const reviewDays = nextStrength >= 0.8 ? 7 : nextStrength >= 0.6 ? 4 : nextStrength >= 0.4 ? 2 : 1;
  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + reviewDays);

  trackLearningEvent('question_answered', {
    questionId: attempt.questionId,
    subject: attempt.subject,
    conceptId: attempt.conceptId,
    correct: attempt.correct,
    reasoningSignal: attempt.reasoningSignal,
    responseMs: attempt.responseMs,
    hintsUsed: attempt.hintsUsed,
    previousStrength: Number(previous.strength.toFixed(3)),
    nextStrength: Number(nextStrength.toFixed(3)),
  });

  if (attempt.hintsUsed > 0) {
    trackLearningEvent('hint_used', {
      questionId: attempt.questionId,
      conceptId: attempt.conceptId,
      count: attempt.hintsUsed,
    });
  }

  return {
    ...state,
    concepts: {
      ...state.concepts,
      [attempt.conceptId]: {
        conceptId: attempt.conceptId,
        strength: nextStrength,
        exposures: previous.exposures + 1,
        lastSeenAt: now.toISOString(),
        nextReviewAt: nextReview.toISOString(),
      },
    },
    attempts: [...state.attempts, attempt].slice(-120),
    lastSessionAt: now.toISOString(),
  };
}

function isReviewDue(nextReviewAt?: string) {
  return !!nextReviewAt && new Date(nextReviewAt).getTime() <= Date.now();
}

export function buildNextActivities(state: LearnerState, limit = 5): PlannedActivity[] {
  const recentSubjects = state.attempts.slice(-2).map((attempt) => attempt.subject);
  const attemptedIds = new Set(state.attempts.slice(-8).map((attempt) => attempt.questionId));
  const strengths = Object.fromEntries(
    Object.entries(state.concepts).map(([conceptId, concept]) => [conceptId, concept.strength]),
  );

  const runtimeBank = getRuntimeQuestionBank().filter((question) => {
    const mapped = getCurriculumConcept(question.conceptId);
    if (!mapped) return true;
    if (state.concepts[question.conceptId]) return true;
    return conceptIsUnlocked(question.conceptId, strengths);
  });

  const ranked = runtimeBank.map((question) => {
    const concept = state.concepts[question.conceptId];
    const strength = concept?.strength ?? 0.28;
    const neverSeen = !concept;
    const due = isReviewDue(concept?.nextReviewAt);
    const recentlyAttempted = attemptedIds.has(question.id);
    const sameSubjectPenalty = recentSubjects.includes(question.subject) ? 0.12 : 0;
    const transferBoost = question.isTransfer && concept && concept.exposures > 0 ? 0.2 : 0;
    const weaknessBoost = (1 - strength) * 0.55;
    const dueBoost = due ? 0.35 : 0;
    const newBoost = neverSeen ? 0.18 : 0;
    const repeatPenalty = recentlyAttempted ? 0.5 : 0;
    const strategy = strategyScoreModifiers({
      conceptId: question.conceptId,
      strength,
      neverSeen,
    });

    return {
      question,
      score:
        weaknessBoost +
        dueBoost +
        newBoost +
        transferBoost +
        strategy.incidenceBoost +
        strategy.pointOpportunityBoost -
        strategy.lowYieldNewPenalty -
        sameSubjectPenalty -
        repeatPenalty,
      reason: question.isTransfer && concept?.exposures
        ? ('transfer' as const)
        : due
          ? ('retention' as const)
          : strength < 0.5 && concept
            ? ('reinforce' as const)
            : ('new' as const),
    };
  }).sort((a, b) => b.score - a.score);

  const chosen: PlannedActivity[] = [];
  let lastSubject = recentSubjects.at(-1);

  for (const item of ranked) {
    if (chosen.length >= limit) break;

    if (chosen.length > 0 && item.question.subject === lastSubject) {
      const alternative = ranked.find(
        (candidate) =>
          !chosen.some((picked) => picked.questionId === candidate.question.id) &&
          candidate.question.subject !== lastSubject,
      );
      if (alternative) {
        chosen.push({ questionId: alternative.question.id, reason: alternative.reason });
        lastSubject = alternative.question.subject;
        continue;
      }
    }

    if (!chosen.some((picked) => picked.questionId === item.question.id)) {
      chosen.push({ questionId: item.question.id, reason: item.reason });
      lastSubject = item.question.subject;
    }
  }

  return chosen;
}

export function finishSession(state: LearnerState): LearnerState {
  const updated = { ...state, completedSessions: state.completedSessions + 1 };
  saveLearnerState(updated);
  trackLearningEvent('session_completed', {
    completedSessions: updated.completedSessions,
    attemptsRecorded: state.attempts.length,
  });
  return updated;
}
