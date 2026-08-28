import { QUESTION_BANK } from '@/features/adaptive/question-bank';
import type { AdaptiveQuestion } from '@/features/adaptive/types';
import type { ContentStatus, OABQuestionRecord } from './types';

const STORAGE_KEY = 'direitofacil.content-questions.v1';
const PLACEHOLDER_EXPLANATION = 'Explicação editorial ainda não cadastrada.';

export function loadContentQuestions(): OABQuestionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OABQuestionRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveContentQuestions(records: OABQuestionRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

export function getPublicationIssues(record: OABQuestionRecord) {
  const issues: string[] = [];
  const adaptive = record.adaptive;

  if (!record.sourceUrl?.trim()) issues.push('Informe a fonte oficial da questão.');
  if (!record.exam?.trim()) issues.push('Identifique o exame de origem.');
  if (!record.year) issues.push('Informe o ano do exame.');
  if (!record.questionNumber) issues.push('Informe o número da questão na prova.');
  if (!record.subject.trim()) issues.push('Classifique a matéria.');
  if (!record.conceptId.trim() || !record.conceptLabel.trim()) issues.push('Classifique o conceito pedagógico.');

  if (!adaptive.prompt.trim()) issues.push('O enunciado está vazio.');
  if (adaptive.options.length !== 4 || adaptive.options.some((option) => !option.text.trim())) {
    issues.push('As quatro alternativas precisam estar preenchidas.');
  }

  if (
    adaptive.options.some(
      (option) => !option.explanation.trim() || option.explanation.trim() === PLACEHOLDER_EXPLANATION,
    )
  ) {
    issues.push('Explique por que cada alternativa está certa ou errada.');
  }

  if (!adaptive.reasoningKeywords.length) {
    issues.push('Cadastre ao menos uma palavra-chave para avaliar a justificativa do aluno.');
  }
  if (!adaptive.nudge.trim()) issues.push('Cadastre a primeira pista pedagógica.');
  if (!adaptive.secondNudge.trim()) issues.push('Cadastre a segunda pista pedagógica.');
  if (!adaptive.takeaway.trim() || adaptive.takeaway === 'Conteúdo pendente de revisão editorial.') {
    issues.push('Cadastre o que o aluno precisa guardar da questão.');
  }
  if (!adaptive.fgvPattern.trim() || adaptive.fgvPattern === 'Padrão ainda não classificado.') {
    issues.push('Classifique a pegadinha ou padrão da FGV.');
  }

  return issues;
}

export function canPublishQuestion(record: OABQuestionRecord) {
  return getPublicationIssues(record).length === 0;
}

export function canUseInAssessment(record: OABQuestionRecord) {
  const question = record.adaptive;
  return Boolean(
    record.conceptId?.trim() &&
    record.conceptLabel?.trim() &&
    record.subject?.trim() &&
    question.prompt.trim() &&
    question.options.length === 4 &&
    question.options.every((option) => option.text.trim()) &&
    ['A', 'B', 'C', 'D'].includes(question.correctOption),
  );
}

export function upsertContentQuestions(incoming: OABQuestionRecord[]) {
  const current = loadContentQuestions();
  const byId = new Map(current.map((record) => [record.id, record]));
  const now = new Date().toISOString();

  for (const record of incoming) {
    const previous = byId.get(record.id);
    const normalized = {
      ...record,
      importedAt: previous?.importedAt ?? record.importedAt,
      updatedAt: now,
    };

    // Mesmo um CSV marcado como published não entra no motor se falhar no gate editorial.
    byId.set(record.id, {
      ...normalized,
      status:
        normalized.status === 'published' && !canPublishQuestion(normalized)
          ? 'review'
          : normalized.status,
    });
  }

  const next = Array.from(byId.values()).sort((a, b) => {
    if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
    if ((a.exam ?? '') !== (b.exam ?? '')) return (a.exam ?? '').localeCompare(b.exam ?? '');
    return (a.questionNumber ?? 999) - (b.questionNumber ?? 999);
  });
  saveContentQuestions(next);
  return next;
}

export function updateQuestionClassification(
  id: string,
  classification: { subject: string; conceptId: string; conceptLabel: string },
) {
  const current = loadContentQuestions();
  const next = current.map((record) => {
    if (record.id !== id) return record;
    return {
      ...record,
      subject: classification.subject,
      conceptId: classification.conceptId,
      conceptLabel: classification.conceptLabel,
      topic: classification.conceptLabel,
      status: record.status === 'published' ? 'review' as const : record.status,
      adaptive: {
        ...record.adaptive,
        subject: classification.subject,
        conceptId: classification.conceptId,
        conceptLabel: classification.conceptLabel,
      },
      updatedAt: new Date().toISOString(),
    };
  });
  saveContentQuestions(next);
  return next;
}

export function setQuestionStatus(id: string, status: ContentStatus) {
  const current = loadContentQuestions();
  const next = current.map((record) => {
    if (record.id !== id) return record;
    if (status === 'published' && !canPublishQuestion(record)) return record;
    return { ...record, status, updatedAt: new Date().toISOString() };
  });
  saveContentQuestions(next);
  return next;
}

export function removeContentQuestion(id: string) {
  const next = loadContentQuestions().filter((record) => record.id !== id);
  saveContentQuestions(next);
  return next;
}

// Aula Question First: exige enriquecimento pedagógico e publicação explícita.
export function getRuntimeQuestionBank(): AdaptiveQuestion[] {
  if (typeof window === 'undefined') return QUESTION_BANK;

  const published = loadContentQuestions()
    .filter((record) => record.status === 'published' && canPublishQuestion(record))
    .map((record) => record.adaptive);

  const merged = new Map<string, AdaptiveQuestion>();
  for (const question of QUESTION_BANK) merged.set(question.id, question);
  for (const question of published) merged.set(question.id, question);
  return Array.from(merged.values());
}

// Calibração/simulado: uma questão oficial já pode ser usada depois de classificada no
// currículo, mesmo que explicações/pistas ainda estejam em revisão. O aluno não recebe
// feedback durante a prova, então não precisamos fingir que a questão já está pronta para aula.
export function getAssessmentQuestionBank(): AdaptiveQuestion[] {
  if (typeof window === 'undefined') return QUESTION_BANK;

  const classifiedOfficial = loadContentQuestions()
    .filter(canUseInAssessment)
    .map((record) => record.adaptive);

  const merged = new Map<string, AdaptiveQuestion>();
  for (const question of QUESTION_BANK) merged.set(question.id, question);
  for (const question of classifiedOfficial) merged.set(question.id, question);
  return Array.from(merged.values());
}

export function getRuntimeQuestion(id: string) {
  return getRuntimeQuestionBank().find((question) => question.id === id);
}

export function getAssessmentQuestion(id: string) {
  return getAssessmentQuestionBank().find((question) => question.id === id);
}

export function contentStats(records = loadContentQuestions()) {
  return {
    total: records.length,
    draft: records.filter((record) => record.status === 'draft').length,
    review: records.filter((record) => record.status === 'review').length,
    published: records.filter((record) => record.status === 'published').length,
    blocked: records.filter((record) => record.status !== 'published' && !canPublishQuestion(record)).length,
    unclassified: records.filter((record) => !record.conceptId?.trim()).length,
    classified: records.filter((record) => !!record.conceptId?.trim()).length,
    assessmentReady: records.filter(canUseInAssessment).length,
    subjects: new Set(records.map((record) => record.subject)).size,
    exams: new Set(records.map((record) => record.exam).filter(Boolean)).size,
  };
}
