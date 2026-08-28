import type { LearnerState } from '@/features/adaptive/types';
import type { LearningEvent } from '@/features/telemetry/engine';

export type BadgeId =
  | 'primeiro-passo'
  | 'constancia'
  | 'raciocinio-claro'
  | 'voltou-e-firmou'
  | 'calibracao';

export type Badge = {
  id: BadgeId;
  title: string;
  description: string;
  earned: boolean;
};

export type DedicationEvidence = {
  activeDays: number;
  completedSessions: number;
  completedCalibrations: number;
  solidReasoningAnswers: number;
  retentionAnswers: number;
  scheduleAdaptations: number;
  validatedCommunityHelp: number | null;
};

function uniqueDays(events: LearningEvent[]) {
  return new Set(events.map((event) => event.createdAt.slice(0, 10))).size;
}

export function getDedicationEvidence(
  learner: LearnerState,
  events: LearningEvent[],
): DedicationEvidence {
  return {
    activeDays: uniqueDays(events),
    completedSessions: learner.completedSessions,
    completedCalibrations: events.filter((event) => event.type === 'calibration_completed').length,
    solidReasoningAnswers: learner.attempts.filter((attempt) => attempt.reasoningSignal === 'solid').length,
    retentionAnswers: learner.attempts.filter((attempt) => {
      const concept = learner.concepts[attempt.conceptId];
      return (concept?.exposures ?? 0) >= 2;
    }).length,
    scheduleAdaptations: events.filter((event) => event.type === 'schedule_reflowed').length,
    // Só pode contar depois que a resposta da comunidade tiver validação real no backend.
    validatedCommunityHelp: null,
  };
}

export function deriveBadges(
  learner: LearnerState,
  events: LearningEvent[],
): Badge[] {
  const evidence = getDedicationEvidence(learner, events);
  const stabilizedAfterDifficulty = Object.values(learner.concepts).some(
    (concept) => concept.exposures >= 2 && concept.strength >= 0.65,
  );

  return [
    {
      id: 'primeiro-passo',
      title: 'Primeiro passo',
      description: 'Concluiu a primeira sessão do próprio percurso.',
      earned: learner.completedSessions >= 1,
    },
    {
      id: 'constancia',
      title: 'Constância',
      description: 'Apareceu para estudar em pelo menos três dias diferentes.',
      earned: evidence.activeDays >= 3,
    },
    {
      id: 'raciocinio-claro',
      title: 'Raciocínio claro',
      description: 'Explicou corretamente o caminho da resposta em diferentes questões.',
      earned: evidence.solidReasoningAnswers >= 3,
    },
    {
      id: 'voltou-e-firmou',
      title: 'Voltou e firmou',
      description: 'Transformou um conteúdo repetido em conhecimento mais sólido.',
      earned: stabilizedAfterDifficulty,
    },
    {
      id: 'calibracao',
      title: 'Calibração',
      description: 'Fez uma calibração quando o sistema considerou que ela seria útil.',
      earned: evidence.completedCalibrations >= 1,
    },
  ];
}
