'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, EyeOff, LockKeyhole, Sparkles, Unlock } from 'lucide-react';
import { buildNextActivities, loadLearnerState } from '@/features/adaptive/engine';
import { conceptIsUnlocked, getRuntimeCurriculum, type CurriculumConcept } from '@/features/adaptive/curriculum';
import { getRuntimeQuestionBank } from '@/features/content/repository';
import type { LearnerState } from '@/features/adaptive/types';

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function InternalCurriculumPage() {
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumConcept[]>([]);

  useEffect(() => {
    setLearner(loadLearnerState());
    setCurriculum(getRuntimeCurriculum());
  }, []);

  const strengths = useMemo(() => {
    if (!learner) return {} as Record<string, number>;
    return Object.fromEntries(
      Object.entries(learner.concepts).map(([conceptId, concept]) => [conceptId, concept.strength]),
    );
  }, [learner]);

  const nextActivities = useMemo(
    () => (learner ? buildNextActivities(learner, 6) : []),
    [learner],
  );

  const runtimeBank = useMemo(() => getRuntimeQuestionBank(), [learner]);
  const subjects = useMemo(
    () => Array.from(new Set(curriculum.map((concept) => concept.subject))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [curriculum],
  );

  return (
    <main className="min-h-dvh bg-[#11110f] px-4 py-6 text-[#f5f2ed] md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/10 pb-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[.14em] text-white/40"><EyeOff className="h-4 w-4" /> interno · grafo invisível</div>
          <h1 className="serif mt-3 text-4xl md:text-6xl">Currículo adaptativo</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/45">O aluno nunca vê esta árvore. Esta tela lê exatamente o currículo runtime — incluindo alterações importadas pelo editor — que decide quando cada conceito pode entrar.</p>
        </header>

        {!learner ? (
          <div className="py-14 text-sm text-white/35">Carregando estado interno…</div>
        ) : (
          <>
            <section className="mt-7 grid gap-5 xl:grid-cols-4">
              {subjects.map((subject) => {
                const concepts = curriculum.filter((concept) => concept.subject === subject).sort((a, b) => a.order - b.order);
                return (
                  <div key={subject} className="rounded-[24px] border border-white/10 bg-white/[.035] p-5">
                    <div className="text-sm font-medium">{subject}</div>
                    <div className="mt-6 space-y-3">
                      {concepts.map((concept, index) => {
                        const observed = learner.concepts[concept.id];
                        const unlocked = conceptIsUnlocked(concept.id, strengths) || !!observed;
                        return (
                          <div key={concept.id}>
                            <div className={`rounded-2xl border p-4 ${unlocked ? 'border-white/15 bg-white/[.04]' : 'border-white/5 bg-black/10 opacity-55'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[10px] uppercase tracking-[.12em] text-white/30">passo {concept.order}</div>
                                  <div className="mt-1 text-sm">{concept.label}</div>
                                </div>
                                {unlocked ? <Unlock className="h-4 w-4 text-emerald-300/70" /> : <LockKeyhole className="h-4 w-4 text-white/25" />}
                              </div>
                              <div className="mt-4 flex items-center justify-between text-xs"><span className="text-white/30">força</span><span>{observed ? pct(observed.strength) : 'não visto'}</span></div>
                              <div className="mt-2 flex items-center justify-between text-xs"><span className="text-white/30">incidência</span><span>{pct(concept.incidenceWeight)}</span></div>
                              {concept.prerequisites.length > 0 && <div className="mt-2 text-[11px] leading-5 text-white/30">entra quando {concept.prerequisites.join(', ')} ≥ {pct(concept.unlockStrength)}</div>}
                            </div>
                            {index < concepts.length - 1 && <div className="mx-auto h-5 w-px bg-white/10" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[.035] p-5">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /><span className="text-sm font-medium">Se uma sessão começasse agora</span></div>
                <p className="mt-2 text-xs leading-5 text-white/35">Esta é a decisão real do motor depois de aplicar bloqueio, fraqueza, revisão, incidência, urgência de prova e mistura de matérias.</p>
                <div className="mt-6 space-y-3">
                  {nextActivities.map((activity, index) => {
                    const question = runtimeBank.find((item) => item.id === activity.questionId);
                    return (
                      <div key={activity.questionId} className="flex items-center gap-4 rounded-2xl border border-white/10 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs text-white/45">{index + 1}</div>
                        <div className="min-w-0 flex-1"><div className="text-sm">{question?.conceptLabel ?? activity.questionId}</div><div className="mt-1 text-xs text-white/35">{question?.subject ?? '—'} · {activity.reason}</div></div>
                        {index < nextActivities.length - 1 && <ArrowRight className="h-4 w-4 text-white/20" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[.035] p-5">
                <div className="text-sm font-medium">Regra de produto</div>
                <div className="mt-6 space-y-4 text-sm leading-6 text-white/50">
                  <p><strong className="text-white/75">Acerto sólido:</strong> pode abrir o próximo passo daquela matéria.</p>
                  <p><strong className="text-white/75">Acerto por sorte:</strong> aumenta pouco a força e não finge domínio.</p>
                  <p><strong className="text-white/75">Erro ou confusão:</strong> mantém o conceito circulando sem tela de reprovação.</p>
                  <p><strong className="text-white/75">Interleaving:</strong> outras matérias entram enquanto uma trilha aguarda evidência.</p>
                  <p><strong className="text-white/75">Reta final:</strong> oportunidade de ponto e incidência passam a pesar mais.</p>
                  <p><strong className="text-white/75">Aluno:</strong> não recebe nenhuma dessas informações.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
