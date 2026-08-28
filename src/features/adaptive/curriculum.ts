import type { Subject } from './types';
import { OAB_OUTLINE_CURRICULUM } from './curriculum-outline';

export type CurriculumConcept = {
  id: string;
  label: string;
  subject: Subject;
  order: number;
  prerequisites: string[];
  unlockStrength: number;
  incidenceWeight: number;
};

const STORAGE_KEY = 'direitofacil.curriculum.v1';

// O outline oficial escolhido para o produto agora é a fonte-base do currículo runtime.
// O aluno nunca vê esta árvore; ela existe para planejamento, pré-requisitos e adaptação.
// Um título do PDF foi quebrado por mudança de linha na extração; normalizamos aqui sem
// alterar o identificador estável já usado pela branch.
export const CURRICULUM: CurriculumConcept[] = OAB_OUTLINE_CURRICULUM.map((concept) =>
  concept.id === 'm16-t06-crimes-contra-a-administracao-fe-publica-e-outros-de-al'
    ? { ...concept, label: 'Crimes contra a Administração, fé pública e outros de alta incidência' }
    : concept,
);

function normalizeConcept(concept: CurriculumConcept): CurriculumConcept {
  return {
    ...concept,
    id: concept.id.trim(),
    label: concept.label.trim(),
    subject: concept.subject.trim(),
    order: Math.max(1, Number(concept.order) || 1),
    prerequisites: Array.from(new Set(concept.prerequisites.map((value) => value.trim()).filter(Boolean))),
    unlockStrength: Math.max(0, Math.min(1, Number(concept.unlockStrength) || 0)),
    incidenceWeight: Math.max(0, Math.min(1, Number(concept.incidenceWeight) || 0)),
  };
}

export function loadCurriculumOverrides(): CurriculumConcept[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CurriculumConcept[]).map(normalizeConcept) : [];
  } catch {
    return [];
  }
}

export function saveCurriculumOverrides(concepts: CurriculumConcept[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(concepts.map(normalizeConcept).filter((concept) => concept.id && concept.label && concept.subject)),
  );
}

export function getRuntimeCurriculum(): CurriculumConcept[] {
  if (typeof window === 'undefined') return CURRICULUM;
  const merged = new Map(CURRICULUM.map((concept) => [concept.id, concept]));
  for (const concept of loadCurriculumOverrides()) merged.set(concept.id, concept);
  return Array.from(merged.values()).sort((a, b) => {
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject, 'pt-BR');
    return a.order - b.order;
  });
}

export function upsertCurriculumConcepts(incoming: CurriculumConcept[]) {
  const overrides = new Map(loadCurriculumOverrides().map((concept) => [concept.id, concept]));
  for (const concept of incoming) overrides.set(concept.id, normalizeConcept(concept));
  const next = Array.from(overrides.values());
  saveCurriculumOverrides(next);
  return getRuntimeCurriculum();
}

export function removeCurriculumOverride(id: string) {
  const next = loadCurriculumOverrides().filter((concept) => concept.id !== id);
  saveCurriculumOverrides(next);
  return getRuntimeCurriculum();
}

export function resetCurriculumOverrides() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  return getRuntimeCurriculum();
}

export function getCurriculumConcept(id: string) {
  return getRuntimeCurriculum().find((concept) => concept.id === id);
}

export function conceptIsUnlocked(
  conceptId: string,
  strengths: Record<string, number>,
) {
  const concept = getCurriculumConcept(conceptId);
  if (!concept || concept.prerequisites.length === 0) return true;

  return concept.prerequisites.every(
    (prerequisiteId) => (strengths[prerequisiteId] ?? 0) >= concept.unlockStrength,
  );
}
