import type { Subject } from './types';

export type CurriculumConcept = {
  id: string;
  label: string;
  subject: Subject;
  order: number;
  prerequisites: string[];
  unlockStrength: number;
  incidenceWeight: number;
};

export const CURRICULUM: CurriculumConcept[] = [
  {
    id: 'responsabilidade-profissional',
    label: 'Responsabilidade profissional',
    subject: 'Ética',
    order: 1,
    prerequisites: [],
    unlockStrength: 0,
    incidenceWeight: 1,
  },
  {
    id: 'publicidade-advocacia',
    label: 'Publicidade na advocacia',
    subject: 'Ética',
    order: 2,
    prerequisites: ['responsabilidade-profissional'],
    unlockStrength: 0.52,
    incidenceWeight: 1,
  },
  {
    id: 'prazo-contestacao',
    label: 'Contestação e termo inicial',
    subject: 'Processo Civil',
    order: 1,
    prerequisites: [],
    unlockStrength: 0,
    incidenceWeight: 0.92,
  },
  {
    id: 'recursos-cabimento',
    label: 'Cabimento dos recursos',
    subject: 'Processo Civil',
    order: 2,
    prerequisites: ['prazo-contestacao'],
    unlockStrength: 0.52,
    incidenceWeight: 0.95,
  },
  {
    id: 'competencia-constitucional',
    label: 'Competência constitucional',
    subject: 'Constitucional',
    order: 1,
    prerequisites: [],
    unlockStrength: 0,
    incidenceWeight: 0.9,
  },
  {
    id: 'controle-constitucionalidade',
    label: 'Controle de constitucionalidade',
    subject: 'Constitucional',
    order: 2,
    prerequisites: ['competencia-constitucional'],
    unlockStrength: 0.52,
    incidenceWeight: 1,
  },
  {
    id: 'prescricao-decadencia',
    label: 'Prescrição e decadência',
    subject: 'Direito Civil',
    order: 1,
    prerequisites: [],
    unlockStrength: 0,
    incidenceWeight: 0.88,
  },
  {
    id: 'inadimplemento-obrigacoes',
    label: 'Inadimplemento das obrigações',
    subject: 'Direito Civil',
    order: 2,
    prerequisites: ['prescricao-decadencia'],
    unlockStrength: 0.52,
    incidenceWeight: 0.86,
  },
];

export function getCurriculumConcept(id: string) {
  return CURRICULUM.find((concept) => concept.id === id);
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
