import type { CurriculumConcept } from '@/features/adaptive/curriculum';

type Delimiter = ',' | ';' | '\t';

export type CurriculumImportIssue = {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
};

export type CurriculumImportPreview = {
  concepts: CurriculumConcept[];
  issues: CurriculumImportIssue[];
  totalRows: number;
};

export const CURRICULUM_COLUMNS = [
  'id',
  'subject',
  'label',
  'order',
  'prerequisites',
  'unlockStrength',
  'incidenceWeight',
] as const;

function detectDelimiter(input: string): Delimiter {
  const counts: Record<Delimiter, number> = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') { index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && (char === '\n' || char === '\r')) break;
    if (!quoted && (char === ',' || char === ';' || char === '\t')) counts[char as Delimiter] += 1;
  }
  return (Object.entries(counts) as [Delimiter, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ',';
}

function rows(input: string) {
  const delimiter = detectDelimiter(input);
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === delimiter && !quoted) { row.push(cell.trim()); cell = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) result.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) result.push(row);
  return result;
}

function clamp01(value: string, fallback: number) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
}

export function parseCurriculumCsv(input: string): CurriculumImportPreview {
  const matrix = rows(input.replace(/^\uFEFF/, ''));
  if (!matrix.length) return { concepts: [], issues: [{ row: 1, message: 'Arquivo vazio.', severity: 'error' }], totalRows: 0 };

  const headers = matrix[0].map((item) => item.trim());
  const issues: CurriculumImportIssue[] = [];
  const requiredHeaders = ['id', 'subject', 'label', 'order', 'unlockStrength', 'incidenceWeight'];
  for (const field of requiredHeaders) {
    if (!headers.includes(field)) issues.push({ row: 1, field, message: `Coluna obrigatória ausente: ${field}.`, severity: 'error' });
  }
  if (issues.some((issue) => issue.severity === 'error')) return { concepts: [], issues, totalRows: Math.max(0, matrix.length - 1) };

  const seen = new Set<string>();
  const concepts: CurriculumConcept[] = [];

  matrix.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const data = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? '']));
    const id = data.id?.trim();
    const subject = data.subject?.trim();
    const label = data.label?.trim();
    const order = Number(data.order);

    if (!id || !subject || !label) {
      issues.push({ row: rowNumber, message: 'id, subject e label são obrigatórios.', severity: 'error' });
      return;
    }
    if (seen.has(id)) {
      issues.push({ row: rowNumber, field: 'id', message: `ID duplicado no arquivo: ${id}.`, severity: 'error' });
      return;
    }
    seen.add(id);

    if (!Number.isFinite(order) || order < 1) {
      issues.push({ row: rowNumber, field: 'order', message: 'order deve ser um número maior ou igual a 1.', severity: 'error' });
      return;
    }

    const prerequisites = (data.prerequisites ?? '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);

    concepts.push({
      id,
      subject,
      label,
      order,
      prerequisites,
      unlockStrength: clamp01(data.unlockStrength ?? '', prerequisites.length ? 0.52 : 0),
      incidenceWeight: clamp01(data.incidenceWeight ?? '', 0.7),
    });
  });

  const ids = new Set(concepts.map((concept) => concept.id));
  for (const concept of concepts) {
    for (const prerequisite of concept.prerequisites) {
      if (!ids.has(prerequisite)) {
        issues.push({ row: 1, field: concept.id, message: `Pré-requisito ${prerequisite} não está neste arquivo. Tudo bem se já existir no currículo atual; revise antes de publicar a estrutura.`, severity: 'warning' });
      }
      if (prerequisite === concept.id) {
        issues.push({ row: 1, field: concept.id, message: 'Um conceito não pode depender de si mesmo.', severity: 'error' });
      }
    }
  }

  return { concepts, issues, totalRows: Math.max(0, matrix.length - 1) };
}

export function curriculumCsvTemplate() {
  const header = CURRICULUM_COLUMNS.join(',');
  const lines = [
    ['etica-base', 'Ética', 'Fundamentos éticos', '1', '', '0', '1'],
    ['etica-publicidade', 'Ética', 'Publicidade na advocacia', '2', 'etica-base', '0.52', '0.96'],
  ].map((row) => row.map((value) => `"${value}"`).join(','));
  return [header, ...lines].join('\n');
}
