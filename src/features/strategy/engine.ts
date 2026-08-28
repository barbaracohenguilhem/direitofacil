import { CURRICULUM, getCurriculumConcept } from '@/features/adaptive/curriculum';
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

    if (daysUntilExam <= 14) {
      return { daysUntilExam, urgency: 1, mode: 'final-stretch' };
    }
    if (daysUntilExam <= 35) {
      return { daysUntilExam, urgency: 0.82, mode: 'points-first' };
    }
    if (daysUntilExam <= 75) {
      return { daysUntilExam, urgency: 0.58, mode: 'balanced' };
    }
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

  // Perto da prova, fraqueza em conteúdo de alta incidência vale mais que exploração indiscriminada.
  const pointOpportunityBoost = (1 - strength) * incidence * (0.12 + context.urgency * 0.28);
  const incidenceBoost = incidence * (0.04 + context.urgency * 0.11);

  // Conteúdo novo continua possível, mas perde espaço perto da prova quando o retorno esperado é baixo.
  const lowYieldNewPenalty = neverSeen
    ? context.urgency * Math.max(0, 0.82 - incidence) * 0.32
    : 0;

  return {
    context,
    pointOpportunityBoost,
    incidenceBoost,
    lowYieldNewPenalty,
  };
}

export function rankPointOpportunities(state: LearnerState): ConceptOpportunity[] {
  return CURRICULUM.map((concept) => {
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
