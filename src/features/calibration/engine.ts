import type { LearnerState } from '@/features/adaptive/types';

export type CalibrationReadiness = {
  ready: boolean;
  size: 5 | 10 | 20 | 30 | 40;
  internalReason: string;
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
