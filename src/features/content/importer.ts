import type { AdaptiveQuestion, QuestionOption } from '@/features/adaptive/types';
import type { ContentStatus, Difficulty, ImportIssue, ImportPreview, OABQuestionRecord } from './types';
import { QUESTION_IMPORT_COLUMNS } from './types';

type Row = Record<string, string>;

type CsvDelimiter = ',' | ';' | '\t';

function detectDelimiter(input: string): CsvDelimiter {
  const counts: Record<CsvDelimiter, number> = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && (char === '\n' || char === '\r')) break;
    if (!quoted && (char === ',' || char === ';' || char === '\t')) {
      counts[char as CsvDelimiter] += 1;
    }
  }

  return (Object.entries(counts) as [CsvDelimiter, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? ',';
}

function parseCsvRows(input: string): string[][] {
  const delimiter = detectDelimiter(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function splitKeywords(value: string) {
  return value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStatus(value: string): ContentStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'published' || normalized === 'publicado') return 'published';
  if (normalized === 'review' || normalized === 'revisao' || normalized === 'revisão') return 'review';
  return 'draft';
}

function normalizeDifficulty(value: string): Difficulty {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'facil' || normalized === 'fácil') return 'easy';
  if (normalized === 'medium' || normalized === 'medio' || normalized === 'médio') return 'medium';
  if (normalized === 'hard' || normalized === 'dificil' || normalized === 'difícil') return 'hard';
  return 'unknown';
}

function parseBoolean(value: string) {
  return ['1', 'true', 'yes', 'sim', 's'].includes(value.trim().toLowerCase());
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function required(row: Row, field: string, rowNumber: number, issues: ImportIssue[]) {
  const value = row[field]?.trim();
  if (!value) {
    issues.push({ row: rowNumber, field, message: `Campo obrigatório ausente: ${field}.`, severity: 'error' });
    return '';
  }
  return value;
}

function option(id: QuestionOption['id'], row: Row): QuestionOption {
  return {
    id,
    text: row[`option${id}`]?.trim() ?? '',
    explanation: row[`explanation${id}`]?.trim() || 'Explicação editorial ainda não cadastrada.',
  };
}

function validateCorrectOption(value: string, rowNumber: number, issues: ImportIssue[]) {
  const normalized = value.trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(normalized)) {
    issues.push({ row: rowNumber, field: 'correctOption', message: 'Gabarito deve ser A, B, C ou D.', severity: 'error' });
    return 'A' as const;
  }
  return normalized as QuestionOption['id'];
}

function validateSource(value: string, rowNumber: number, issues: ImportIssue[]) {
  if (!value.trim()) {
    issues.push({ row: rowNumber, field: 'sourceUrl', message: 'Fonte oficial não informada. Pode importar, mas não poderá publicar antes de revisar.', severity: 'warning' });
    return undefined;
  }
  try {
    new URL(value);
    return value.trim();
  } catch {
    issues.push({ row: rowNumber, field: 'sourceUrl', message: 'URL de fonte parece inválida.', severity: 'warning' });
    return value.trim();
  }
}

export function parseQuestionCsv(input: string): ImportPreview {
  const matrix = parseCsvRows(input.replace(/^\uFEFF/, ''));
  if (matrix.length === 0) {
    return {
      records: [],
      issues: [{ row: 1, message: 'Arquivo vazio.', severity: 'error' }],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    };
  }

  const headers = matrix[0].map((header) => header.trim());
  const issues: ImportIssue[] = [];
  const missingCoreHeaders = ['id', 'subject', 'conceptId', 'conceptLabel', 'prompt', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption']
    .filter((field) => !headers.includes(field));

  for (const field of missingCoreHeaders) {
    issues.push({ row: 1, field, message: `Coluna obrigatória ausente no cabeçalho: ${field}.`, severity: 'error' });
  }

  if (missingCoreHeaders.length > 0) {
    return {
      records: [],
      issues,
      totalRows: Math.max(0, matrix.length - 1),
      validRows: 0,
      invalidRows: Math.max(0, matrix.length - 1),
    };
  }

  const unknownHeaders = headers.filter((header) => header && !QUESTION_IMPORT_COLUMNS.includes(header as (typeof QUESTION_IMPORT_COLUMNS)[number]));
  for (const field of unknownHeaders) {
    issues.push({ row: 1, field, message: `Coluna desconhecida será ignorada: ${field}.`, severity: 'warning' });
  }

  const records: OABQuestionRecord[] = [];
  const invalidRows = new Set<number>();
  const seenIds = new Set<string>();
  const now = new Date().toISOString();

  matrix.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const row: Row = {};
    headers.forEach((header, cellIndex) => {
      row[header] = cells[cellIndex] ?? '';
    });

    const rowIssueStart = issues.length;
    const id = required(row, 'id', rowNumber, issues);
    const subject = required(row, 'subject', rowNumber, issues);
    const conceptId = required(row, 'conceptId', rowNumber, issues);
    const conceptLabel = required(row, 'conceptLabel', rowNumber, issues);
    const prompt = required(row, 'prompt', rowNumber, issues);
    required(row, 'optionA', rowNumber, issues);
    required(row, 'optionB', rowNumber, issues);
    required(row, 'optionC', rowNumber, issues);
    required(row, 'optionD', rowNumber, issues);
    const correctOption = validateCorrectOption(required(row, 'correctOption', rowNumber, issues), rowNumber, issues);

    if (id && seenIds.has(id)) {
      issues.push({ row: rowNumber, field: 'id', message: `ID duplicado dentro do arquivo: ${id}.`, severity: 'error' });
    }
    if (id) seenIds.add(id);

    const status = normalizeStatus(row.status ?? 'draft');
    const sourceUrl = validateSource(row.sourceUrl ?? '', rowNumber, issues);
    const explanationMissing = ['A', 'B', 'C', 'D'].some((letter) => !(row[`explanation${letter}`] ?? '').trim());
    if (explanationMissing) {
      issues.push({ row: rowNumber, field: 'explanations', message: 'Uma ou mais explicações de alternativa estão vazias.', severity: status === 'published' ? 'error' : 'warning' });
    }

    if (!(row.nudge ?? '').trim()) issues.push({ row: rowNumber, field: 'nudge', message: 'Pista 1 vazia.', severity: status === 'published' ? 'error' : 'warning' });
    if (!(row.secondNudge ?? '').trim()) issues.push({ row: rowNumber, field: 'secondNudge', message: 'Pista 2 vazia.', severity: 'warning' });
    if (!(row.takeaway ?? '').trim()) issues.push({ row: rowNumber, field: 'takeaway', message: 'Resumo essencial vazio.', severity: status === 'published' ? 'error' : 'warning' });
    if (!(row.fgvPattern ?? '').trim()) issues.push({ row: rowNumber, field: 'fgvPattern', message: 'Padrão FGV não classificado.', severity: 'warning' });
    if (!(row.reasoningKeywords ?? '').trim()) issues.push({ row: rowNumber, field: 'reasoningKeywords', message: 'Sem palavras-chave para avaliar a justificativa. A questão ficará bloqueada para publicação.', severity: 'warning' });

    const rowHasError = issues.slice(rowIssueStart).some((issue) => issue.severity === 'error');
    if (rowHasError) {
      invalidRows.add(rowNumber);
      return;
    }

    const adaptive: AdaptiveQuestion = {
      id,
      subject,
      conceptId,
      conceptLabel,
      prompt,
      options: [option('A', row), option('B', row), option('C', row), option('D', row)],
      correctOption,
      reasoningKeywords: splitKeywords(row.reasoningKeywords ?? ''),
      misconceptionKeywords: splitKeywords(row.misconceptionKeywords ?? ''),
      openingLine: row.openingLine?.trim() || undefined,
      nudge: row.nudge?.trim() || 'Volte ao enunciado e procure o elemento jurídico que realmente muda o resultado.',
      secondNudge: row.secondNudge?.trim() || 'Compare as alternativas e elimine as que transformam uma regra em afirmação absoluta.',
      takeaway: row.takeaway?.trim() || 'Conteúdo pendente de revisão editorial.',
      fgvPattern: row.fgvPattern?.trim() || 'Padrão ainda não classificado.',
      vade: row.vadeArticle?.trim() || row.vadeInstruction?.trim()
        ? {
            article: row.vadeArticle?.trim() || 'Dispositivo a revisar',
            instruction: row.vadeInstruction?.trim() || 'Definir orientação de marcação antes da publicação.',
          }
        : undefined,
      isTransfer: parseBoolean(row.isTransfer ?? ''),
    };

    records.push({
      id,
      exam: row.exam?.trim() || undefined,
      year: numberOrUndefined(row.year ?? ''),
      questionNumber: numberOrUndefined(row.questionNumber ?? ''),
      subject,
      topic: row.topic?.trim() || undefined,
      subtopic: row.subtopic?.trim() || undefined,
      conceptId,
      conceptLabel,
      difficulty: normalizeDifficulty(row.difficulty ?? ''),
      sourceUrl,
      status,
      adaptive,
      importedAt: now,
      updatedAt: now,
    });
  });

  return {
    records,
    issues,
    totalRows: Math.max(0, matrix.length - 1),
    validRows: records.length,
    invalidRows: invalidRows.size,
  };
}

export function questionCsvTemplate() {
  const header = QUESTION_IMPORT_COLUMNS.join(',');
  const example = [
    'oab-48-etica-01',
    'OAB 48',
    '2026',
    '1',
    'Ética',
    'Prerrogativas',
    'Inviolabilidade',
    'prerrogativas-inviolabilidade',
    'Inviolabilidade profissional',
    'Cole aqui o enunciado da questão',
    'Alternativa A',
    'Alternativa B',
    'Alternativa C',
    'Alternativa D',
    'B',
    'Por que A está errada',
    'Por que B está correta',
    'Por que C está errada',
    'Por que D está errada',
    'prerrogativa|inviolabilidade',
    'sempre|automaticamente',
    'Vamos começar por esta.',
    'Primeira pista',
    'Segunda pista',
    'Regra essencial',
    'Regra verdadeira aplicada à pessoa errada',
    'Art. X',
    'Grife apenas o trecho relevante',
    'false',
    'medium',
    'https://www.oab.org.br/',
    'draft',
  ].map((value) => `"${value.replaceAll('"', '""')}"`).join(',');
  return `${header}\n${example}`;
}
