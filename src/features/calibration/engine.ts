import type { AdaptiveQuestion, LearnerState } from '@/features/adaptive/types';
import { getRuntimeQuestion, getRuntimeQuestionBank } from '@/features/content/repository';
import { trackLearningEvent } from '@/features/telemetry/engine';

export type CalibrationReadiness = {
  ready: boolean;
  size: 5 | 10 | 20 | 30 | 40;
  internalReason: string;
};

export type CalibrationEvidence = {
  questionId: string;
  correct: boolean;
};

export function getCalibrationReadiness(state: LearnerState): CalibrationReadiness {
  const concepts = Object.values(state.concepts);
  const repeatedConcepts = concepts.filter((concept) => concept.exposures >= 2).length;
  const retainedConcepts = concepts.filter((concept) => concept.exposures >= 2 && concept.strength >= 0.45).length;
  const evidence = state.attempts.length;
  const sessions = state.completedSessions;

  const ready = sessions >= 2 && evidence >= 8 && repeatedConcepts >= 3 && retainedConcepts >= 2;

  let size: CalibrationReadiness['size'] = 5;
  if (sessions >= 4 && evidence >= 18) size = 10;
  if (sessions >= 8 && evidence >= 35) size = 20;
  if (sessions >= 12 && evidence >= 55) size = 30;
  if (sessions >= 16 && evidence >= 75) size = 40;

  return {
    ready,
    size,
    internalReason: ready
      ? `ready: ${sessions} sessions, ${evidence} attempts, ${repeatedConcepts} repeated concepts, ${retainedConcepts} with retention evidence`
      : `not-ready: ${sessions} sessions, ${evidence} attempts, ${repeatedConcepts} repeated concepts, ${retainedConcepts} with retention evidence`,
  };
}

export function buildCalibrationQuestions(state: LearnerState, requestedSize: number): AdaptiveQuestion[] {
  const observedConceptIds = new Set(Object.keys(state.concepts));
  const recentQuestionIds = new Set(state.attempts.slice(-4).map((attempt) => attempt.questionId));

  const ranked = getRuntimeQuestionBank()
    .filter((question) => observedConceptIds.has(question.conceptId))
    .map((question) => {
      const concept = state.concepts[question.conceptId];
      const weakness = 1 - (concept?.strength ?? 0.25);
      const transferBoost = question.isTransfer ? 0.18 : 0;
      const recentPenalty = recentQuestionIds.has(question.id) ? 0.25 : 0;
      return {
        question,
        score: weakness + transferBoost - recentPenalty,
      };
    })
    .sort((a, b) => b.score - a.score);

  const selected: AdaptiveQuestion[] = [];
  let previousSubject: string | undefined;

  for (const candidate of ranked) {
    if (selected.length >= requestedSize) break;

    if (candidate.question.subject === previousSubject) {
      const alternate = ranked.find(
        (item) =>
          item.question.subject !== previousSubject &&
          !selected.some((selectedQuestion) => selectedQuestion.id === item.question.id),
      );
      if (alternate) {
        selected.push(alternate.question);
        previousSubject = alternate.question.subject;
        continue;
      }
    }

    if (!selected.some((item) => item.id === candidate.question.id)) {
      selected.push(candidate.question);
      previousSubject = candidate.question.subject;
    }
  }

  return selected;
}

export function applyCalibrationEvidence(state: LearnerState, evidence: CalibrationEvidence[]): LearnerState {
  const concepts = { ...state.concepts };
  const now = new Date();

  for (const item of evidence) {
    const question = getRuntimeQuestion(item.questionId);
    if (!question) continue;

    const previous = concepts[question.conceptId] ?? {
      conceptId: question.conceptId,
      strength: 0.25,
      exposures: 0,
    };

    const delta = item.correct ? 0.14 : -0.13;
    const nextStrength = Math.max(0.05, Math.min(0.98, previous.strength + delta));
    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + (item.correct ? 4 : 1));

    concepts[question.conceptId] = {
      ...previous,
      strength: nextStrength,
      exposures: previous.exposures + 1,
      lastSeenAt: now.toISOString(),
      nextReviewAt: nextReview.toISOString(),
    };
  }

  trackLearningEvent('calibration_completed', {
    total: evidence.length,
    correct: evidence.filter((item) => item.correct).length,
  });

  return {
    ...state,
    concepts,
    lastSessionAt: now.toISOString(),
  };
}
