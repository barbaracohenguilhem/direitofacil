'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, RotateCcw, Trash2, Upload } from 'lucide-react';
import {
  CURRICULUM,
  getRuntimeCurriculum,
  loadCurriculumOverrides,
  removeCurriculumOverride,
  resetCurriculumOverrides,
  upsertCurriculumConcepts,
  type CurriculumConcept,
} from '@/features/adaptive/curriculum';
import { curriculumCsvTemplate, parseCurriculumCsv, type CurriculumImportPreview } from '@/features/curriculum/importer';

export default function CurriculumEditorPage() {
  const [concepts, setConcepts] = useState<CurriculumConcept[]>([]);
  const [overrides, setOverrides] = useState<Set<string>>(new Set());
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<CurriculumImportPreview | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function refresh() {
    setConcepts(getRuntimeCurriculum());
    setOverrides(new Set(loadCurriculumOverrides().map((concept) => concept.id)));
  }

  useEffect(() => {
    refresh();
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(concepts.map((concept) => concept.subject))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [concepts],
  );

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setPreview(parseCurriculumCsv(text));
    setNotice(null);
  }

  function analyze() {
    const result = parseCurriculumCsv(csv);
    setPreview(result);
    return result;
  }

  function importConcepts() {
    const result = preview ?? analyze();
    if (!result.concepts.length || result.issues.some((issue) => issue.severity === 'error')) return;
    upsertCurriculumConcepts(result.concepts);
    refresh();
    setNotice(`${result.concepts.length} conceito(s) incorporado(s) ao currículo runtime.`);
  }

  function removeOverride(id: string) {
    removeCurriculumOverride(id);
    refresh();
    setNotice(`Override de ${id} removido. Se existir no currículo seed, voltou ao valor original.`);
  }

  function resetAll() {
    resetCurriculumOverrides();
    refresh();
    setNotice('Overrides removidos. Currículo voltou ao seed do protótipo.');
  }

  function downloadTemplate() {
    const blob = new Blob([curriculumCsvTemplate()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-curriculo-oab.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-dvh bg-[#11110f] px-4 py-6 text-[#f5f2ed] md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[.14em] text-white/35">Admin · Curriculum Engine</div>
            <h1 className="serif mt-3 text-4xl md:text-5xl">Editar o currículo invisível</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">A ordem que o aluno nunca vê fica aqui. Importe conceitos, pré-requisitos, limiar de avanço e peso de incidência sem alterar código.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-full bg-[#f5f2ed] px-4 py-2.5 text-xs text-[#11110f]"><Download className="h-4 w-4" /> Modelo CSV</button>
            <button onClick={resetAll} className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/55"><RotateCcw className="h-4 w-4" /> Restaurar seed</button>
          </div>
        </header>

        {notice && <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>}

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_290px]">
          <div className="rounded-[26px] border border-white/10 bg-white/[.035] p-5">
            <div className="flex items-center gap-2 text-sm"><FileSpreadsheet className="h-5 w-5" /> Importar grafo</div>
            <p className="mt-2 text-xs leading-5 text-white/35">Aceita vírgula, ponto e vírgula ou tabulação. Pré-requisitos múltiplos usam <code className="text-white/55">|</code>.</p>
            <textarea value={csv} onChange={(event) => { setCsv(event.target.value); setPreview(null); }} placeholder="id;subject;label;order;prerequisites;unlockStrength;incidenceWeight" className="mt-5 min-h-[220px] w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-white/70 outline-none placeholder:text-white/20" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={analyze} disabled={!csv.trim()} className="rounded-full bg-[#f5f2ed] px-5 py-2.5 text-xs text-[#11110f] disabled:opacity-30">Analisar</button>
              {preview?.concepts.length && !preview.issues.some((issue) => issue.severity === 'error') ? <button onClick={importConcepts} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-5 py-2.5 text-xs text-emerald-100">Aplicar {preview.concepts.length} conceito(s)</button> : null}
            </div>

            {preview && (
              <div className="mt-5 rounded-2xl border border-white/10">
                <div className="border-b border-white/10 p-4 text-xs text-white/40">{preview.totalRows} linha(s) · {preview.concepts.length} conceito(s) válidos · {preview.issues.length} aviso(s)/erro(s)</div>
                {preview.issues.length ? <div className="max-h-[220px] divide-y divide-white/10 overflow-auto">{preview.issues.map((issue, index) => <div key={`${issue.row}-${index}`} className="flex gap-3 p-4 text-xs"><AlertTriangle className={`h-4 w-4 shrink-0 ${issue.severity === 'error' ? 'text-rose-200' : 'text-amber-200'}`} /><div><div className="text-white/60">Linha {issue.row}{issue.field ? ` · ${issue.field}` : ''}</div><div className="mt-1 text-white/35">{issue.message}</div></div></div>)}</div> : <div className="p-4 text-xs text-emerald-100">Estrutura válida para importação.</div>}
              </div>
            )}
          </div>

          <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[26px] border border-dashed border-white/15 bg-white/[.02] p-6 text-center">
            <Upload className="h-6 w-6 text-white/40" />
            <div className="mt-5 text-sm">Escolher CSV</div>
            <p className="mt-2 text-xs leading-5 text-white/35">Ideal para exportação do Excel ou Google Sheets.</p>
            <input type="file" accept=".csv,text/csv,.tsv,text/tab-separated-values" onChange={handleFile} className="hidden" />
          </label>
        </section>

        <section className="mt-6 space-y-6">
          {subjects.map((subject) => (
            <div key={subject} className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[.035]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="text-sm font-medium">{subject}</div><div className="text-xs text-white/30">{concepts.filter((concept) => concept.subject === subject).length} conceitos</div></div>
              <div className="divide-y divide-white/10">
                {concepts.filter((concept) => concept.subject === subject).sort((a, b) => a.order - b.order).map((concept) => {
                  const overridden = overrides.has(concept.id);
                  const seed = CURRICULUM.some((item) => item.id === concept.id);
                  return (
                    <div key={concept.id} className="grid gap-4 px-5 py-4 md:grid-cols-[80px_1fr_180px_120px_120px_70px] md:items-center">
                      <div><div className="text-[10px] uppercase tracking-[.1em] text-white/25">ordem</div><div className="mt-1 text-sm">{concept.order}</div></div>
                      <div><div className="text-sm">{concept.label}</div><div className="mt-1 text-xs text-white/30">{concept.id} · {overridden ? 'override editorial' : seed ? 'seed' : 'runtime'}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[.1em] text-white/25">pré-requisito(s)</div><div className="mt-1 text-xs text-white/55">{concept.prerequisites.join(' → ') || 'nenhum'}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[.1em] text-white/25">avanço</div><div className="mt-1 text-sm">{Math.round(concept.unlockStrength * 100)}%</div></div>
                      <div><div className="text-[10px] uppercase tracking-[.1em] text-white/25">incidência</div><div className="mt-1 text-sm">{Math.round(concept.incidenceWeight * 100)}%</div></div>
                      <div className="text-right">{overridden && <button onClick={() => removeOverride(concept.id)} title="Remover override" className="rounded-full border border-rose-300/10 p-2 text-rose-200/55"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
