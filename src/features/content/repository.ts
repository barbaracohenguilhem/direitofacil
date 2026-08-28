import { QUESTION_BANK } from '@/features/adaptive/question-bank';
import type { AdaptiveQuestion } from '@/features/adaptive/types';
import type { ContentStatus, OABQuestionRecord } from './types';

const STORAGE_KEY = 'direitofacil.content-questions.v1';

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

export function upsertContentQuestions(incoming: OABQuestionRecord[]) {
  const current = loadContentQuestions();
  const byId = new Map(current.map((record) => [record.id, record]));
  const now = new Date().toISOString();

  for (const record of incoming) {
    const previous = byId.get(record.id);
    byId.set(record.id, {
      ...record,
      importedAt: previous?.importedAt ?? record.importedAt,
      updatedAt: now,
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

export function setQuestionStatus(id: string, status: ContentStatus) {
  const current = loadContentQuestions();
  const next = current.map((record) =>
    record.id === id
      ? { ...record, status, updatedAt: new Date().toISOString() }
      : record,
  );
  saveContentQuestions(next);
  return next;
}

export function removeContentQuestion(id: string) {
  const next = loadContentQuestions().filter((record) => record.id !== id);
  saveContentQuestions(next);
  return next;
}

export function getRuntimeQuestionBank(): AdaptiveQuestion[] {
  if (typeof window === 'undefined') return QUESTION_BANK;

  const published = loadContentQuestions()
    .filter((record) => record.status === 'published')
    .map((record) => record.adaptive);

  const merged = new Map<string, AdaptiveQuestion>();
  for (const question of QUESTION_BANK) merged.set(question.id, question);
  // Conteúdo editorial publicado pode substituir um seed de mesmo id sem alterar o motor.
  for (const question of published) merged.set(question.id, question);
  return Array.from(merged.values());
}

export function getRuntimeQuestion(id: string) {
  return getRuntimeQuestionBank().find((question) => question.id === id);
}

export function contentStats(records = loadContentQuestions()) {
  return {
    total: records.length,
    draft: records.filter((record) => record.status === 'draft').length,
    review: records.filter((record) => record.status === 'review').length,
    published: records.filter((record) => record.status === 'published').length,
    subjects: new Set(records.map((record) => record.subject)).size,
    exams: new Set(records.map((record) => record.exam).filter(Boolean)).size,
  };
}
