'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpenText, FileText, Map, Sparkles } from 'lucide-react';
import { loadLearnerState } from '@/features/adaptive/engine';
import { QUESTION_BANK } from '@/features/adaptive/question-bank';
import type { LearnerState } from '@/features/adaptive/types';

export default function MaterialsPage() {
  const router = useRouter();
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);

  useEffect(() => {
    setLearner(loadLearnerState());
  }, []);

  const unlocked = useMemo(() => {
    if (!learner) return [];
    const seenConcepts = Object.values(learner.concepts)
      .filter((concept) => concept.exposures > 0)
      .map((concept) => concept.conceptId);

    const unique = new Map<string, (typeof QUESTION_BANK)[number]>();
    for (const question of QUESTION_BANK) {
      if (seenConcepts.includes(question.conceptId) && !unique.has(question.conceptId)) {
        unique.set(question.conceptId, question);
      }
    }
    return Array.from(unique.values());
  }, [learner]);

  const selected = unlocked.find((item) => item.conceptId === activeConcept) ?? unlocked[0];

  return (
    <main className="min-h-dvh bg-[#f8f6f2] text-[#1c1a18]">
      <header className="border-b border-[#ded9d2] px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={() => router.push('/hoje')} className="flex items-center gap-2 text-sm text-[#77716a]"><ArrowLeft className="h-4 w-4" /> Hoje</button>
          <div className="serif text-lg">Materiais</div>
          <div className="w-[54px]" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <section className="max-w-3xl">
          <p className="text-sm text-[#77716a]">Só o que já passou pelo seu caminho.</p>
          <h1 className="serif mt-3 text-4xl leading-tight md:text-6xl">Sua biblioteca cresce depois que você aprende.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#77716a]">Não existe catálogo de assuntos futuros aqui. Resumos, mapas e marcações aparecem conforme os conceitos entram nas suas sessões.</p>
        </section>

        {!learner ? (
          <div className="mt-12 text-sm text-[#8a847e]">Carregando…</div>
        ) : unlocked.length === 0 ? (
          <div className="mt-12 rounded-[26px] border border-[#ded9d2] bg-white p-7">
            <BookOpenText className="h-5 w-5" />
            <h2 className="serif mt-6 text-3xl">Ainda não há nada para rever.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#77716a]">Depois da sua primeira sessão, os materiais daquele conteúdo aparecem aqui automaticamente.</p>
            <button onClick={() => router.push('/hoje')} className="mt-6 rounded-full bg-[#1c1a18] px-5 py-3 text-sm text-white">Voltar para hoje</button>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-2">
              {unlocked.map((item) => (
                <button key={item.conceptId} onClick={() => setActiveConcept(item.conceptId)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.conceptId === item.conceptId ? 'border-[#1c1a18] bg-white' : 'border-[#ded9d2] bg-transparent hover:bg-white'}`}>
                  <div className="text-xs text-[#8a847e]">{item.subject}</div>
                  <div className="mt-1 text-sm font-medium">{item.conceptLabel}</div>
                </button>
              ))}
            </aside>

            {selected && (
              <section className="rounded-[28px] border border-[#ded9d2] bg-white p-6 md:p-8">
                <div className="flex items-center gap-3 text-sm text-[#77716a]"><Sparkles className="h-4 w-4" /> {selected.subject}</div>
                <h2 className="serif mt-4 text-3xl md:text-4xl">{selected.conceptLabel}</h2>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <article className="rounded-2xl bg-[#f1ede8] p-5">
                    <FileText className="h-5 w-5" />
                    <div className="mt-5 text-sm font-medium">Resumo essencial</div>
                    <p className="mt-3 text-sm leading-6 text-[#625c56]">{selected.takeaway}</p>
                  </article>
                  <article className="rounded-2xl border border-[#ded9d2] p-5">
                    <Map className="h-5 w-5" />
                    <div className="mt-5 text-sm font-medium">Mapa mental</div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#625c56]">
                      <span className="rounded-full bg-[#f1ede8] px-3 py-2">regra central</span>
                      <span>→</span>
                      <span className="rounded-full bg-[#f1ede8] px-3 py-2">aplicação</span>
                      <span>→</span>
                      <span className="rounded-full bg-[#eee2d7] px-3 py-2">pegadinha FGV</span>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#8a847e]">O mapa real será gerado a partir do conteúdo aprovado de cada conceito.</p>
                  </article>
                </div>

                <div className="mt-4 rounded-2xl bg-[#171614] p-5 text-[#f8f6f2]">
                  <div className="text-xs uppercase tracking-[.12em] text-white/40">Padrão da FGV</div>
                  <p className="mt-3 text-sm leading-6 text-white/70">{selected.fgvPattern}</p>
                </div>

                {selected.vade && (
                  <div className="mt-4 rounded-2xl border border-[#ded9d2] p-5">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[.12em] text-[#837d75]"><BookOpenText className="h-4 w-4" /> Vade Mecum · {selected.vade.article}</div>
                    <p className="mt-3 text-sm leading-6 text-[#625c56]">{selected.vade.instruction}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
