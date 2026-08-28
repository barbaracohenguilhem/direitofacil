import type { AdaptiveQuestion, QuestionOption } from '@/features/adaptive/types';
import type { ImportIssue, ImportPreview, OABQuestionRecord } from './types';

type Row = Record<string, string>;
type Delimiter = ',' | ';' | '\t';

export type OfficialBankPreview = ImportPreview & {
  detectedFormat: 'official-oab-bank';
  correctedSubjects: number;
  exams: number;
  subjects: number;
};

const CURRENT_FORMAT_EXAMS = new Set(['XXXVIII', 'XXXIX', 'XL']);

const CURRENT_SUBJECT_BY_QUESTION: Array<[number, number, string]> = [
  [1, 8, 'Ética Profissional'],
  [9, 10, 'Filosofia do Direito'],
  [11, 16, 'Direito Constitucional'],
  [17, 18, 'Direitos Humanos'],
  [19, 20, 'Direito Eleitoral'],
  [21, 22, 'Direito Internacional'],
  [23, 24, 'Direito Financeiro'],
  [25, 29, 'Direito Tributário'],
  [30, 34, 'Direito Administrativo'],
  [35, 36, 'Direito Ambiental'],
  [37, 42, 'Direito Civil'],
  [43, 44, 'ECA'],
  [45, 46, 'Direito do Consumidor'],
  [47, 50, 'Direito Empresarial'],
  [51, 56, 'Processo Civil'],
  [57, 62, 'Direito Penal'],
  [63, 68, 'Processo Penal'],
  [69, 70, 'Direito Previdenciário'],
  [71, 75, 'Direito do Trabalho'],
  [76, 80, 'Processo do Trabalho'],
];

const SUBJECT_ALIASES: Record<string, string> = {
  'Estatuto da Criança e do Adolescente': 'ECA',
};

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

function parseRows(input: string) {
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
    if (char === delimiter && !quoted) { row.push(cell); cell = ''; continue; }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) result.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) result.push(row);
  return result;
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function yearFromSource(sourceUrl: string, examCode: string) {
  const fromUrl = sourceUrl.match(/\/(20\d{2})\//)?.[1];
  if (fromUrl) return Number(fromUrl);

  const fallback: Record<string, number> = {
    XXXII: 2021,
    XXXIII: 2021,
    XXXIV: 2022,
    XXXV: 2022,
    XXXVI: 2022,
    XXXVII: 2023,
    XXXVIII: 2023,
    XXXIX: 2023,
    XL: 2024,
  };
  return fallback[examCode];
}

export function canonicalOfficialSubject(examCode: string, questionNumber: number, rawSubject: string) {
  if (CURRENT_FORMAT_EXAMS.has(examCode)) {
    const range = CURRENT_SUBJECT_BY_QUESTION.find(([start, end]) => questionNumber >= start && questionNumber <= end);
    if (range) return range[2];
  }
  return SUBJECT_ALIASES[rawSubject.trim()] ?? rawSubject.trim();
}

export function looksLikeOfficialOabBankCsv(input: string) {
  const firstLine = input.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? '';
  return ['exame_codigo', 'numero_questao', 'pergunta', 'alternativa_a', 'resposta_correta']
    .every((header) => firstLine.includes(header));
}

function option(id: QuestionOption['id'], text: string, correct: boolean): QuestionOption {
  return {
    id,
    text: text.trim(),
    explanation: correct
      ? 'Explicação editorial da alternativa correta ainda não cadastrada.'
      : 'Explicação editorial desta alternativa ainda não cadastrada.',
  };
}

export function parseOfficialOabBankCsv(input: string): OfficialBankPreview {
  const matrix = parseRows(input.replace(/^\uFEFF/, ''));
  const issues: ImportIssue[] = [];

  if (!matrix.length) {
    return {
      detectedFormat: 'official-oab-bank',
      records: [], issues: [{ row: 1, message: 'Arquivo vazio.', severity: 'error' }],
      totalRows: 0, validRows: 0, invalidRows: 0,
      correctedSubjects: 0, exams: 0, subjects: 0,
    };
  }

  const headers = matrix[0].map((value) => value.trim());
  const required = [
    'exame', 'exame_codigo', 'numero_questao', 'categoria', 'pergunta',
    'alternativa_a', 'alternativa_b', 'alternativa_c', 'alternativa_d',
    'resposta_correta', 'fonte_url',
  ];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) {
    return {
      detectedFormat: 'official-oab-bank', records: [],
      issues: missing.map((field) => ({ row: 1, field, message: `Coluna obrigatória ausente: ${field}.`, severity: 'error' as const })),
      totalRows: Math.max(0, matrix.length - 1), validRows: 0, invalidRows: Math.max(0, matrix.length - 1),
      correctedSubjects: 0, exams: 0, subjects: 0,
    };
  }

  const records: OABQuestionRecord[] = [];
  const invalidRows = new Set<number>();
  const examSet = new Set<string>();
  const subjectSet = new Set<string>();
  const seenIds = new Set<string>();
  let correctedSubjects = 0;
  const now = new Date().toISOString();

  matrix.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]?.trim() ?? ''])) as Row;
    const examCode = row.exame_codigo;
    const questionNumber = Number(row.numero_questao);
    const correctOption = row.resposta_correta.toUpperCase() as QuestionOption['id'];

    if (!examCode || !Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 80) {
      issues.push({ row: rowNumber, field: 'numero_questao', message: 'Exame ou número da questão inválido.', severity: 'error' });
      invalidRows.add(rowNumber);
      return;
    }
    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
      issues.push({ row: rowNumber, field: 'resposta_correta', message: 'Gabarito deve ser A, B, C ou D.', severity: 'error' });
      invalidRows.add(rowNumber);
      return;
    }
    if (![row.pergunta, row.alternativa_a, row.alternativa_b, row.alternativa_c, row.alternativa_d].every(Boolean)) {
      issues.push({ row: rowNumber, message: 'Enunciado ou alternativa vazia.', severity: 'error' });
      invalidRows.add(rowNumber);
      return;
    }

    const subject = canonicalOfficialSubject(examCode, questionNumber, row.categoria);
    if (subject !== (SUBJECT_ALIASES[row.categoria] ?? row.categoria)) correctedSubjects += 1;

    const id = `official-${examCode.toLowerCase()}-${String(questionNumber).padStart(2, '0')}`;
    if (seenIds.has(id)) {
      issues.push({ row: rowNumber, field: 'id', message: `Questão duplicada: ${id}.`, severity: 'error' });
      invalidRows.add(rowNumber);
      return;
    }
    seenIds.add(id);
    examSet.add(examCode);
    subjectSet.add(subject);

    const options: QuestionOption[] = [
      option('A', row.alternativa_a, correctOption === 'A'),
      option('B', row.alternativa_b, correctOption === 'B'),
      option('C', row.alternativa_c, correctOption === 'C'),
      option('D', row.alternativa_d, correctOption === 'D'),
    ];

    const adaptive: AdaptiveQuestion = {
      id,
      subject,
      conceptId: '',
      conceptLabel: 'Pendente de classificação pelo outline',
      prompt: row.pergunta,
      options,
      correctOption,
      reasoningKeywords: [],
      misconceptionKeywords: [],
      openingLine: 'Questão oficial da OAB/FGV.',
      nudge: 'Pista pedagógica ainda não cadastrada.',
      secondNudge: 'Segunda pista pedagógica ainda não cadastrada.',
      takeaway: 'Conteúdo pendente de enriquecimento editorial.',
      fgvPattern: 'Padrão FGV ainda não classificado.',
      isTransfer: false,
    };

    records.push({
      id,
      exam: row.exame || `${examCode} Exame de Ordem Unificado`,
      year: yearFromSource(row.fonte_url, examCode),
      questionNumber,
      subject,
      topic: undefined,
      subtopic: undefined,
      conceptId: '',
      conceptLabel: 'Pendente de classificação pelo outline',
      difficulty: 'unknown',
      sourceUrl: row.fonte_url || undefined,
      status: 'review',
      adaptive,
      importedAt: now,
      updatedAt: now,
    });
  });

  issues.unshift({
    row: 1,
    message: `Banco oficial reconhecido. As questões entram em revisão editorial; enunciado, alternativas, gabarito e fonte são preservados sem alteração.`,
    severity: 'warning',
  });
  if (correctedSubjects) {
    issues.unshift({
      row: 1,
      field: 'categoria',
      message: `${correctedSubjects} classificação(ões) de matéria foram corrigidas automaticamente nos exames XXXVIII–XL para a grade atual de 20 disciplinas.`,
      severity: 'warning',
    });
  }

  return {
    detectedFormat: 'official-oab-bank',
    records,
    issues,
    totalRows: Math.max(0, matrix.length - 1),
    validRows: records.length,
    invalidRows: invalidRows.size,
    correctedSubjects,
    exams: examSet.size,
    subjects: subjectSet.size,
  };
}
