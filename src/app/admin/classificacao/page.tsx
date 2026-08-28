'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, WandSparkles } from 'lucide-react';
import { getRuntimeCurriculum, type CurriculumConcept } from '@/features/adaptive/curriculum';
import { loadContentQuestions, updateQuestionClassification } from '@/features/content/repository';
import type { OABQuestionRecord } from '@/features/content/types';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const STOP = new Set('direito direitos alta media baixa caso correta correto afirmativa alternativa questão questao assinale considerando sobre entre para como uma um uns umas dos das por com sem que qual quais esta este essa esse seu sua seus suas'.split(' '));

function terms(value: string) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !STOP.has(token));
}

function lexicalCandidates(record: OABQuestionRecord, concepts: CurriculumConcept[]) {
  const questionText = normalize([
    record.adaptive.prompt,
    ...record.adaptive.options.map((option) => option.text),
  ].join(' '));

  return concepts
    .map((concept) => {
      const conceptTerms = terms(concept.label);
      const hits = conceptTerms.filter((term) => questionText.includes(term));
      const exact = questionText.includes(normalize(concept.label)) ? 3 : 0;
      return { concept, score: exact + hits.length, hits };
    })
    .sort((a, b) => b.score - a.score || a.concept.order - b.concept.order)
    .slice(0, 3);
}

export default function ClassificationQueuePage() {
  const [records, setRecords] = useState<OABQuestionRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(true);

  useEffect(() => setRecords(loadContentQuestions()), []);

  const curriculum = useMemo(() => getRuntimeCurriculum(), []);
  const subjects = useMemo(() => Array.from(new Set(records.map((record) => record.subject))).sort((a, b) => a.localeCompare(b, 'pt-BR')), [records]);
  const exams = useMemo(() => Array.from(new Set(records.map((record) => record.exam).filter(Boolean) as string[])).sort(), [records]);

  const filtered = useMemo(() => {
    const needle = normalize(search.trim());
    return records.filter((record) => {
      if (showOnlyPending && record.conceptId?.trim()) return false;
      if (subjectFilter !== 'all' && record.subject !== subjectFilter) return false;
      if (examFilter !== 'all' && record.exam !== examFilter) return false;
      if (needle && !normalize(`${record.id} ${record.adaptive.prompt}`).includes(needle)) return false;
      return true;
    });
  }, [records, showOnlyPending, subjectFilter, examFilter, search]);

  useEffect(() => {
    if (index >= filtered.length) setIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, index]);

  const current = filtered[index];
  const subjectConcepts = useMemo(
    () => current ? curriculum.filter((concept) => concept.subject === current.subject).sort((a, b) => a.order - b.order) : [],
    [current, curriculum],
  );
  const suggestions = useMemo(
    () => current ? lexicalCandidates(current, subjectConcepts) : [],
    [current, subjectConcepts],
  );

  const classified = records.filter((record) => record.conceptId?.trim()).length;
  const pending = records.length - classified;

  function classify(concept: CurriculumConcept) {
    if (!current) return;
    const nextRecords = updateQuestionClassification(current.id, {
      subject: concept.subject,
      conceptId: concept.id,
      conceptLabel: concept.label,
    });
    setRecords(nextRecords);
    if (!showOnlyPending) setIndex(Math.min(index + 1, filtered.length - 1));
  }

  return (
    <main className="min-h-dvh bg-[#11110f] px-5 py-7 text-[#f5f2ed] md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/questoes" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white/70"><ArrowLeft className="h-4 w-4" /> Banco editorial</Link>

        <header className="mt-9 flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[.14em] text-white/35">Admin · outline mapping</div>
            <h1 className="serif mt-3 text-4xl md:text-6xl">Ligar questões ao currículo.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">A matéria já vem do caderno oficial. Aqui confirmamos qual dos 115 temas do outline aquela questão realmente testa. Sugestões lexicais servem apenas como atalho — nunca publicam conteúdo sozinhas.</p>
          </div>
          <div className="flex gap-7 text-right">
            <Metric label="classificadas" value={classified} />
            <Metric label="pendentes" value={pending} />
          </div>
        </header>

        <section className="mt-6 flex flex-wrap gap-2">
          <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-4 py-2.5"><Search className="h-4 w-4 text-white/30" /><input value={search} onChange={(event) => { setSearch(event.target.value); setIndex(0); }} placeholder="Buscar questão…" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-white/25" /></label>
          <select value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setIndex(0); }} className="rounded-full border border-white/10 bg-[#1b1b18] px-4 py-2.5 text-xs text-white/65 outline-none"><option value="all">Todas as matérias</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select>
          <select value={examFilter} onChange={(event) => { setExamFilter(event.target.value); setIndex(0); }} className="rounded-full border border-white/10 bg-[#1b1b18] px-4 py-2.5 text-xs text-white/65 outline-none"><option value="all">Todos os exames</option>{exams.map((exam) => <option key={exam}>{exam}</option>)}</select>
          <button onClick={() => { setShowOnlyPending((value) => !value); setIndex(0); }} className={`rounded-full border px-4 py-2.5 text-xs ${showOnlyPending ? 'border-white bg-white text-[#11110f]' : 'border-white/10 text-white/55'}`}>{showOnlyPending ? 'Só pendentes' : 'Todas'}</button>
        </section>

        {!current ? (
          <section className="mt-16 flex min-h-[45dvh] flex-col items-center justify-center text-center"><Check className="h-7 w-7 text-emerald-200" /><h2 className="serif mt-6 text-4xl">Nada pendente neste filtro.</h2><p className="mt-3 text-sm text-white/35">Troque os filtros ou volte ao banco editorial.</p></section>
        ) : (
          <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,.85fr)]">
            <article className="rounded-[30px] border border-white/10 bg-[#f5f2ed] p-7 text-[#1c1a18] md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded9d2] pb-5 text-xs text-[#817b74]"><span>{current.exam} · questão {current.questionNumber}</span><span>{current.subject}</span></div>
              <h2 className="serif mt-8 text-2xl leading-snug md:text-3xl">{current.adaptive.prompt}</h2>
              <div className="mt-8 space-y-3">{current.adaptive.options.map((option) => <div key={option.id} className="grid grid-cols-[32px_1fr] gap-3 border-t border-[#e1dcd5] pt-3 text-sm leading-6"><span className={option.id === current.adaptive.correctOption ? 'font-semibold text-[#1c1a18]' : 'text-[#9a938b]'}>{option.id}</span><span className="text-[#5f5952]">{option.text}</span></div>)}</div>
              <div className="mt-8 flex items-center justify-between border-t border-[#ded9d2] pt-5 text-xs text-[#817b74]"><span>Gabarito oficial: <strong className="text-[#1c1a18]">{current.adaptive.correctOption}</strong></span>{current.sourceUrl && <a href={current.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">abrir fonte</a>}</div>
            </article>

            <aside className="rounded-[30px] border border-white/10 bg-white/[.035] p-6 md:p-7">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[.12em] text-white/35"><WandSparkles className="h-4 w-4" /> Tema do outline</div>

              {current.conceptId && <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">Classificação atual: {current.conceptLabel}</div>}

              <div className="mt-6">
                <div className="text-xs text-white/35">Atalhos sugeridos</div>
                <div className="mt-3 space-y-2">{suggestions.map(({ concept, score, hits }) => <button key={concept.id} onClick={() => classify(concept)} className="w-full rounded-2xl border border-white/10 p-4 text-left transition hover:bg-white/[.05]"><div className="flex items-start justify-between gap-3"><span className="text-sm text-white/75">{concept.label}</span>{score > 0 && <span className="text-[10px] text-white/30">{hits.length} termo(s)</span>}</div>{hits.length > 0 && <div className="mt-2 text-[10px] text-white/25">{hits.join(' · ')}</div>}</button>)}</div>
              </div>

              <div className="mt-7 border-t border-white/10 pt-6">
                <div className="text-xs text-white/35">Todos os temas de {current.subject}</div>
                <div className="mt-3 max-h-[360px] space-y-1 overflow-auto pr-1">{subjectConcepts.map((concept) => <button key={concept.id} onClick={() => classify(concept)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-xs transition hover:bg-white/[.05]"><span className="mt-0.5 w-5 shrink-0 text-white/25">{concept.order}</span><span className="leading-5 text-white/55">{concept.label}</span></button>)}</div>
              </div>

              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/30"><button disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="disabled:opacity-20">Anterior</button><span>{index + 1} / {filtered.length}</span><button disabled={index >= filtered.length - 1} onClick={() => setIndex((value) => Math.min(filtered.length - 1, value + 1))} className="flex items-center gap-1 disabled:opacity-20">Pular <ArrowRight className="h-3.5 w-3.5" /></button></div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><div className="serif text-3xl">{value}</div><div className="mt-1 text-[10px] text-white/30">{label}</div></div>;
}
