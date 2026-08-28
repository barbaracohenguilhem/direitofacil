'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Download,
  FileSpreadsheet,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { parseQuestionCsv, questionCsvTemplate } from '@/features/content/importer';
import {
  canPublishQuestion,
  contentStats,
  getPublicationIssues,
  loadContentQuestions,
  removeContentQuestion,
  setQuestionStatus,
  upsertContentQuestions,
} from '@/features/content/repository';
import type { ContentStatus, ImportPreview, OABQuestionRecord } from '@/features/content/types';

const statusLabel: Record<ContentStatus, string> = {
  draft: 'Rascunho',
  review: 'Em revisão',
  published: 'Publicado',
};

export default function AdminQuestionsPage() {
  const [records, setRecords] = useState<OABQuestionRecord[]>([]);
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [importOpen, setImportOpen] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [qualityNotice, setQualityNotice] = useState<string[] | null>(null);

  useEffect(() => {
    setRecords(loadContentQuestions());
  }, []);

  const stats = useMemo(() => contentStats(records), [records]);
  const subjects = useMemo(
    () => Array.from(new Set(records.map((record) => record.subject))).sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesSubject = subjectFilter === 'all' || record.subject === subjectFilter;
      const haystack = [
        record.id,
        record.exam,
        record.subject,
        record.topic,
        record.subtopic,
        record.conceptLabel,
        record.adaptive.prompt,
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && matchesSubject && (!term || haystack.includes(term));
    });
  }, [records, search, statusFilter, subjectFilter]);

  function analyze(value = csv) {
    const result = parseQuestionCsv(value);
    setPreview(result);
    return result;
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setPreview(parseQuestionCsv(text));
    setNotice(null);
    setQualityNotice(null);
  }

  function importValidRows() {
    const result = preview ?? analyze();
    if (!result.records.length) return;
    const next = upsertContentQuestions(result.records);
    const forcedReview = result.records.filter(
      (record) => record.status === 'published' && !canPublishQuestion(record),
    ).length;
    setRecords(next);
    setQualityNotice(null);
    setNotice(
      `${result.records.length} questão(ões) importada(s). Linhas inválidas não foram salvas.${forcedReview ? ` ${forcedReview} marcada(s) como publicada(s) foram mantidas em revisão por falta de qualidade editorial.` : ''}`,
    );
  }

  function updateStatus(id: string, status: ContentStatus) {
    const record = records.find((item) => item.id === id);
    if (!record) return;

    if (status === 'published') {
      const issues = getPublicationIssues(record);
      if (issues.length) {
        setQualityNotice([`A questão ${id} ainda não pode entrar no motor:`, ...issues]);
        setNotice(null);
        return;
      }
    }

    setRecords(setQuestionStatus(id, status));
    setQualityNotice(null);
    setNotice(status === 'published' ? `${id} publicada e liberada para o runtime adaptativo.` : null);
  }

  function remove(id: string) {
    setRecords(removeContentQuestion(id));
  }

  function downloadTemplate() {
    const blob = new Blob([questionCsvTemplate()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-importacao-questoes-oab.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyTemplate() {
    await navigator.clipboard.writeText(questionCsvTemplate());
    setNotice('Modelo CSV copiado para a área de transferência.');
    setQualityNotice(null);
  }

  return (
    <main className="min-h-dvh bg-[#11110f] px-4 py-5 text-[#f5f2ed] md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[.14em] text-white/35">Admin · Content Engine</div>
            <h1 className="serif mt-3 text-4xl md:text-5xl">Banco de questões</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Importe milhares de questões em lote. Publicar não é apenas trocar um status: a questão precisa passar por um gate jurídico e pedagógico antes de poder chegar ao aluno.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyTemplate} className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/60"><Clipboard className="h-4 w-4" /> Copiar modelo</button>
            <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-full bg-[#f5f2ed] px-4 py-2.5 text-xs text-[#11110f]"><Download className="h-4 w-4" /> Baixar CSV modelo</button>
          </div>
        </header>

        {notice && <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>}
        {qualityNotice && (
          <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm text-amber-50">
            <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><div className="font-medium">{qualityNotice[0]}</div><ul className="mt-2 space-y-1 text-xs leading-5 text-amber-100/70">{qualityNotice.slice(1).map((issue) => <li key={issue}>• {issue}</li>)}</ul></div></div>
          </div>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <Metric label="Importadas" value={stats.total} />
          <Metric label="Rascunho" value={stats.draft} />
          <Metric label="Em revisão" value={stats.review} />
          <Metric label="Publicadas" value={stats.published} />
          <Metric label="Bloqueadas pelo gate" value={stats.blocked} />
          <Metric label="Matérias" value={stats.subjects} />
          <Metric label="Exames" value={stats.exams} />
        </section>

        <section className="mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-white/[.035]">
          <button onClick={() => setImportOpen((value) => !value)} className="flex w-full items-center justify-between px-5 py-4 text-left">
            <div className="flex items-center gap-3"><FileSpreadsheet className="h-5 w-5" /><div><div className="text-sm font-medium">Importar questões</div><div className="mt-1 text-xs text-white/35">CSV colado ou arquivo .csv</div></div></div>
            <ChevronDown className={`h-4 w-4 text-white/35 transition ${importOpen ? 'rotate-180' : ''}`} />
          </button>

          {importOpen && (
            <div className="border-t border-white/10 p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <textarea value={csv} onChange={(event) => { setCsv(event.target.value); setPreview(null); }} placeholder="Cole aqui o conteúdo CSV ou escolha um arquivo ao lado…" className="min-h-[240px] w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-white/70 outline-none placeholder:text-white/20" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => analyze()} disabled={!csv.trim()} className="rounded-full bg-[#f5f2ed] px-5 py-2.5 text-xs font-medium text-[#11110f] disabled:opacity-30">Analisar arquivo</button>
                    {preview?.records.length ? <button onClick={importValidRows} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-2.5 text-xs text-emerald-100">Importar {preview.records.length} válidas</button> : null}
                  </div>
                </div>

                <label className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-6 text-center transition hover:bg-white/[.05]">
                  <Upload className="h-6 w-6 text-white/45" />
                  <div className="mt-5 text-sm">Escolher arquivo CSV</div>
                  <div className="mt-2 text-xs leading-5 text-white/35">O arquivo é processado localmente neste protótipo. Nenhum upload externo acontece ainda.</div>
                  <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
                </label>
              </div>

              {preview && (
                <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
                  <div className="rounded-2xl border border-white/10 p-4">
                    <div className="text-xs text-white/35">Pré-validação</div>
                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-white/45">linhas</span><span>{preview.totalRows}</span></div>
                      <div className="flex justify-between"><span className="text-white/45">válidas</span><span className="text-emerald-200">{preview.validRows}</span></div>
                      <div className="flex justify-between"><span className="text-white/45">inválidas</span><span className={preview.invalidRows ? 'text-rose-200' : ''}>{preview.invalidRows}</span></div>
                      <div className="flex justify-between"><span className="text-white/45">avisos/erros</span><span>{preview.issues.length}</span></div>
                    </div>
                  </div>

                  <div className="max-h-[260px] overflow-auto rounded-2xl border border-white/10">
                    {preview.issues.length === 0 ? (
                      <div className="flex items-center gap-3 p-5 text-sm text-emerald-100"><CheckCircle2 className="h-5 w-5" /> Nenhum problema detectado.</div>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {preview.issues.map((issue, index) => (
                          <div key={`${issue.row}-${issue.field}-${index}`} className="flex gap-3 p-4 text-xs">
                            <AlertTriangle className={`h-4 w-4 shrink-0 ${issue.severity === 'error' ? 'text-rose-200' : 'text-amber-200'}`} />
                            <div><div className="text-white/65">Linha {issue.row}{issue.field ? ` · ${issue.field}` : ''}</div><div className="mt-1 text-white/35">{issue.message}</div></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[26px] border border-white/10 bg-white/[.035] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/15 px-4 py-2.5">
              <Search className="h-4 w-4 text-white/30" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar prova, matéria, tema, conceito ou enunciado…" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25" />
            </label>
            <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded-full border border-white/10 bg-[#1b1b18] px-4 py-2.5 text-xs text-white/70 outline-none">
              <option value="all">Todas as matérias</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ContentStatus)} className="rounded-full border border-white/10 bg-[#1b1b18] px-4 py-2.5 text-xs text-white/70 outline-none">
              <option value="all">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="review">Em revisão</option>
              <option value="published">Publicado</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead className="text-white/30"><tr><th className="pb-3 font-normal">questão</th><th className="pb-3 font-normal">origem</th><th className="pb-3 font-normal">classificação</th><th className="pb-3 font-normal">conceito</th><th className="pb-3 font-normal">qualidade</th><th className="pb-3 font-normal">status</th><th className="pb-3 font-normal">ações</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((record) => {
                  const publishIssues = getPublicationIssues(record);
                  const publishable = publishIssues.length === 0;
                  return (
                    <tr key={record.id}>
                      <td className="max-w-[340px] py-4 pr-5 align-top"><div className="text-white/70">{record.id}</div><p className="mt-2 line-clamp-2 text-white/35">{record.adaptive.prompt}</p></td>
                      <td className="py-4 pr-5 align-top"><div className="text-white/60">{record.exam ?? '—'}</div><div className="mt-1 text-white/30">{record.year ?? '—'} · Q{record.questionNumber ?? '—'}</div></td>
                      <td className="py-4 pr-5 align-top"><div className="text-white/60">{record.subject}</div><div className="mt-1 text-white/30">{record.topic ?? '—'}{record.subtopic ? ` · ${record.subtopic}` : ''}</div></td>
                      <td className="py-4 pr-5 align-top"><div className="text-white/60">{record.conceptLabel}</div><div className="mt-1 text-white/30">{record.difficulty}</div></td>
                      <td className="py-4 pr-5 align-top"><span className={`rounded-full px-2.5 py-1 text-[10px] ${publishable ? 'bg-emerald-300/10 text-emerald-200' : 'bg-amber-300/10 text-amber-100'}`}>{publishable ? 'pronta' : `${publishIssues.length} pendência(s)`}</span></td>
                      <td className="py-4 pr-5 align-top"><span className={`rounded-full px-2.5 py-1 text-[10px] ${record.status === 'published' ? 'bg-emerald-300/10 text-emerald-200' : record.status === 'review' ? 'bg-amber-300/10 text-amber-100' : 'bg-white/10 text-white/45'}`}>{statusLabel[record.status]}</span></td>
                      <td className="py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {record.status !== 'review' && <button onClick={() => updateStatus(record.id, 'review')} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/55">Revisar</button>}
                          {record.status !== 'published' && <button onClick={() => updateStatus(record.id, 'published')} className={`rounded-full border px-3 py-1.5 text-[10px] ${publishable ? 'border-emerald-300/20 text-emerald-100' : 'border-white/10 text-white/25'}`}>Publicar</button>}
                          {record.status !== 'draft' && <button onClick={() => updateStatus(record.id, 'draft')} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/45">Rascunho</button>}
                          <button onClick={() => remove(record.id)} className="rounded-full border border-rose-300/10 p-1.5 text-rose-200/60" aria-label={`Excluir ${record.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && <div className="py-14 text-center text-sm text-white/30">Nenhuma questão encontrada.</div>}
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/[.025] p-5 text-xs leading-5 text-white/35 md:flex-row md:items-center md:justify-between">
          <span>Somente questões publicadas e aprovadas pelo quality gate entram no runtime adaptativo.</span>
          <span>Persistência atual: localStorage · próxima camada: banco/API.</span>
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="text-xs text-white/35">{label}</div><div className="mt-4 text-2xl">{value}</div></div>;
}
