import type { LearnerState } from '@/features/adaptive/types';
import type { CurriculumConcept } from '@/features/adaptive/curriculum';
import type { OABQuestionRecord } from '@/features/content/types';
import type { StudyPlan, StudyProfile } from '@/features/planning/types';
import type { LearningEvent } from '@/features/telemetry/engine';

export type UserId = string;

export interface LearnerStateRepository {
  get(userId: UserId): Promise<LearnerState>;
  save(userId: UserId, state: LearnerState): Promise<void>;
}

export interface StudyProfileRepository {
  get(userId: UserId): Promise<StudyProfile | null>;
  save(userId: UserId, profile: StudyProfile): Promise<void>;
}

export interface StudyPlanRepository {
  getCurrent(userId: UserId): Promise<StudyPlan | null>;
  save(userId: UserId, plan: StudyPlan): Promise<void>;
}

export interface QuestionRepository {
  listPublished(): Promise<OABQuestionRecord[]>;
  listAdmin(): Promise<OABQuestionRecord[]>;
  upsert(records: OABQuestionRecord[]): Promise<void>;
}

export interface CurriculumRepository {
  listActive(): Promise<CurriculumConcept[]>;
  upsert(concepts: CurriculumConcept[]): Promise<void>;
}

export interface LearningEventRepository {
  append(userId: UserId, event: LearningEvent): Promise<void>;
  list(userId: UserId, limit?: number): Promise<LearningEvent[]>;
}

export interface CalibrationRepository {
  createRun(userId: UserId, payload: {
    questionIds: string[];
    startedAt: string;
  }): Promise<string>;
  finishRun(runId: string, payload: {
    finishedAt: string;
    correct: number;
    total: number;
  }): Promise<void>;
}

export interface RewardLedgerRepository {
  append(userId: UserId, entry: {
    reason: string;
    units: number;
    sourceId?: string;
  }): Promise<void>;
}

export type OABEngineRepositories = {
  learner: LearnerStateRepository;
  profile: StudyProfileRepository;
  plan: StudyPlanRepository;
  questions: QuestionRepository;
  curriculum: CurriculumRepository;
  events: LearningEventRepository;
  calibrations: CalibrationRepository;
  rewards: RewardLedgerRepository;
};
