import { getCurriculumConcept, getRuntimeCurriculum } from '@/features/adaptive/curriculum';
import type { LearnerState } from '@/features/adaptive/types';
import type { StudyProfile } from '@/features/planning/types';

const PROFILE_KEY = 'direitofacil.study-profile.v1';

export type StrategyContext = {
  daysUntilExam: number | null;
  urgency: number;
  mode: 'foundation' | 'balanced' | 'points-first' | 'final-stretch';
};

export type ConceptOpportunity = {
  conceptId: string;
  label: string;
  subject: string;
  strength: number;
  incidenceWeight: number;
  opportunity: number;
};

export type InternalScoreProjection = {
  projectedScore: number | null;
  gapTo40: number | null;
  confidence: number;
  observedConcepts: number;
  totalConcepts: number;
  note: string;
};

function daysBetweenTodayAnd(examDate: string) {
  const exam = new Date(`${examDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / 86_400_000));
}

export function getStrategyContext(): StrategyContext {
  if (typeof window === 'undefined') {
    return { daysUntilExam: null, urgency: 0.35, mode: 'balanced' };
  }

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { daysUntilExam: null, urgency: 0.35, mode: 'balanced' };
    const profile = JSON.parse(raw) as StudyProfile;
    const daysUntilExam = daysBetweenTodayAnd(profile.examDate);

    if (daysUntilExam <= 14) return { daysUntilExam, urgency: 1, mode: 'final-stretch' };
    if (daysUntilExam <= 35) return { daysUntilExam, urgency: 0.82, mode: 'points-first' };
    if (daysUntilExam <= 75) return { daysUntilExam, urgency: 0.58, mode: 'balanced' };
    return { daysUntilExam, urgency: 0.28, mode: 'foundation' };
  } catch {
    return { daysUntilExam: null, urgency: 0.35, mode: 'balanced' };
  }
}

export function strategyScoreModifiers({
  conceptId,
  strength,
  neverSeen,
}: {
  conceptId: string;
  strength: number;
  neverSeen: boolean;
}) {
  const context = getStrategyContext();
  const curriculum = getCurriculumConcept(conceptId);
  const incidence = curriculum?.incidenceWeight ?? 0.72;

  const pointOpportunityBoost = (1 - strength) * incidence * (0.12 + context.urgency * 0.28);
  const incidenceBoost = incidence * (0.04 + context.urgency * 0.11);
  const lowYieldNewPenalty = neverSeen
    ? context.urgency * Math.max(0, 0.82 - incidence) * 0.32
    : 0;

  return { context, pointOpportunityBoost, incidenceBoost, lowYieldNewPenalty };
}

export function rankPointOpportunities(state: LearnerState): ConceptOpportunity[] {
  return getRuntimeCurriculum().map((concept) => {
    const strength = state.concepts[concept.id]?.strength ?? 0.18;
    return {
      conceptId: concept.id,
      label: concept.label,
      subject: concept.subject,
      strength,
      incidenceWeight: concept.incidenceWeight,
      opportunity: (1 - strength) * concept.incidenceWeight,
    };
  }).sort((a, b) => b.opportunity - a.opportunity);
}

export function estimateInternalScoreProjection(state: LearnerState): InternalScoreProjection {
  const curriculum = getRuntimeCurriculum();
  const observed = curriculum.filter((concept) => !!state.concepts[concept.id]);
  const observedConcepts = observed.length;
  const totalConcepts = curriculum.length;
  const evidenceConfidence = Math.min(1, state.attempts.length / 32);
  const coverageConfidence = totalConcepts ? observedConcepts / totalConcepts : 0;
  const confidence = Math.min(1, evidenceConfidence * 0.55 + coverageConfidence * 0.45);

  if (state.attempts.length < 5 || observedConcepts < 2) {
    return {
      projectedScore: null,
      gapTo40: null,
      confidence,
      observedConcepts,
      totalConcepts,
      note: 'Evidência insuficiente. Não usar esta projeção com o aluno.',
    };
  }

  const totalWeight = curriculum.reduce((sum, concept) => sum + concept.incidenceWeight, 0);
  const weightedProbability = curriculum.reduce((sum, concept) => {
    const conceptState = state.concepts[concept.id];
    const strength = conceptState?.strength ?? 0.16;
    const probability = Math.min(0.93, 0.25 + strength * 0.68);
    return sum + probability * concept.incidenceWeight;
  }, 0) / Math.max(totalWeight, 1);

  const rawScore = weightedProbability * 80;
  const conservativeAnchor = 31;
  const blendedScore = conservativeAnchor * (1 - confidence) + rawScore * confidence;
  const projectedScore = Math.max(0, Math.min(80, Number(blendedScore.toFixed(1))));

  return {
    projectedScore,
    gapTo40: Number(Math.max(0, 40 - projectedScore).toFixed(1)),
    confidence,
    observedConcepts,
    totalConcepts,
    note: 'Proxy interno. Precisa ser recalibrado com banco histórico completo e resultados reais antes de ser exibido ao aluno.',
  };
}
