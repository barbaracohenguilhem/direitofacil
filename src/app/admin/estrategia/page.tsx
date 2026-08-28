'use client';

import { useEffect, useMemo, useState } from 'react';
import { EyeOff, Gauge, Target, TimerReset } from 'lucide-react';
import { loadLearnerState } from '@/features/adaptive/engine';
import type { LearnerState } from '@/features/adaptive/types';
import { getStrategyContext, rankPointOpportunities } from '@/features/strategy/engine';

const modeCopy = {
  foundation: 'Fundação',
  balanced: 'Equilíbrio',
  'points-first': 'Pontos primeiro',
  'final-stretch': 'Reta final',
} as const;

export default function InternalStrategyPage() {
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [context, setContext] = useState(() => getStrategyContext());

  useEffect(() => {
    setLearner(loadLearnerState());
    setContext(getStrategyContext());
  }, []);

  const opportunities = useMemo(
    () => (learner ? rankPointOpportunities(learner) : []),
    [learner],
  );

  return (
    <main className="min-h-dvh bg-[#11110f] px-4 py-6 text-[#f5f2ed] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/10 pb-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[.14em] text-white/40"><EyeOff className="h-4 w-4" /> interno · estratégia de prova</div>
          <h1 className="serif mt-3 text-4xl md:text-6xl">Onde estão os próximos pontos?</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/45">Esta tela não aparece para o aluno. Ela mostra como o motor muda de comportamento conforme a prova se aproxima e onde existe maior combinação de fraqueza + incidência histórica.</p>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric icon={<TimerReset className="h-4 w-4" />} label="Dias até a prova" value={context.daysUntilExam === null ? '—' : String(context.daysUntilExam)} />
          <Metric icon={<Gauge className="h-4 w-4" />} label="Modo do motor" value={modeCopy[context.mode]} />
          <Metric icon={<Target className="h-4 w-4" />} label="Pressão de oportunidade" value={`${Math.round(context.urgency * 100)}%`} />
        </section>

        <section className="mt-6 rounded-[26px] border border-white/10 bg-white/[.035] p-5 md:p-7">
          <div className="flex items-end justify-between gap-5">
            <div>
              <div className="text-sm font-medium">Oportunidade por conceito</div>
              <p className="mt-2 text-xs leading-5 text-white/35">Não é probabilidade de acertar uma questão específica. É um sinal interno para ordenar onde a recuperação de conhecimento tende a render mais.</p>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            {opportunities.map((item, index) => (
              <div key={item.conceptId} className="grid gap-4 rounded-2xl border border-white/10 p-4 md:grid-cols-[42px_1fr_100px_100px_140px] md:items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs text-white/40">{index + 1}</div>
                <div><div className="text-sm">{item.label}</div><div className="mt-1 text-xs text-white/35">{item.subject}</div></div>
                <div><div className="text-[10px] uppercase tracking-[.1em] text-white/25">força</div><div className="mt-1 text-sm">{Math.round(item.strength * 100)}%</div></div>
                <div><div className="text-[10px] uppercase tracking-[.1em] text-white/25">incidência</div><div className="mt-1 text-sm">{Math.round(item.incidenceWeight * 100)}%</div></div>
                <div>
                  <div className="text-[10px] uppercase tracking-[.1em] text-white/25">oportunidade</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white/65" style={{ width: `${Math.max(4, Math.round(item.opportunity * 100))}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Rule title="Mais de 75 dias" text="Pode investir mais em fundação e abrir novos conceitos de forma organizada." />
          <Rule title="36–75 dias" text="Equilibra progressão, revisão e oportunidade provável de ponto." />
          <Rule title="15–35 dias" text="Fraquezas de alta incidência passam a pesar mais que exploração de baixo retorno." />
          <Rule title="Até 14 dias" text="Reta final: revisão, transferência e pontos prováveis dominam a decisão." />
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center gap-2 text-xs text-white/35">{icon}{label}</div><div className="mt-5 text-2xl">{value}</div></div>;
}

function Rule({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-sm">{title}</div><p className="mt-2 text-xs leading-5 text-white/35">{text}</p></div>;
}
