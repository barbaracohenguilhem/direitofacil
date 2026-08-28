'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpenCheck, CalendarClock, MessageCircleMore, UsersRound } from 'lucide-react';
import { buildNextActivities, loadLearnerState } from '@/features/adaptive/engine';
import { getQuestion } from '@/features/adaptive/question-bank';
import type { LearnerState } from '@/features/adaptive/types';

export default function HojePage() {
  const router = useRouter();
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setLearner(loadLearnerState());
    setCompleted(new URLSearchParams(window.location.search).get('completed') === '1');
  }, []);

  const nextItems = useMemo(() => {
    if (!learner) return [];
    return buildNextActivities(learner, 4)
      .map((activity) => ({ activity, question: getQuestion(activity.questionId) }))
      .filter((item) => item.question);
  }, [learner]);

  const visibleItems = nextItems.length
    ? nextItems
    : [
        { label: 'Ética', minutes: '12 min' },
        { label: 'Processo Civil', minutes: '15 min' },
        { label: 'Constitucional', minutes: '10 min' },
      ];

  return (
    <main className="oab-shell px-4 py-5 md:py-8">
      <div className="oab-container">
        <header className="flex items-center justify-between py-3">
          <div className="serif text-xl">direito fácil</div>
          <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)]">Perfil</button>
        </header>

        {completed && (
          <div className="mt-8 rounded-2xl border border-[#d9d2ca] bg-[#eee2d7] px-5 py-4 text-sm text-[#5f574f]">
            Sessão concluída. Seu próximo caminho já foi ajustado com o que aconteceu hoje.
          </div>
        )}

        <section className="mt-12 grid gap-12 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <p className="text-sm text-[var(--muted)]">Boa noite, Ana.</p>
            <h1 className="serif mt-3 max-w-3xl text-5xl leading-[1.02] md:text-7xl">Hoje você só precisa aparecer.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)]">O caminho já foi reorganizado para o tempo que você tem hoje. Não precisa escolher matéria, módulo ou revisão.</p>
          </div>
          <div className="rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-[0_16px_60px_rgba(40,34,27,.05)]">
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>Hoje</span>
              <span>{completed ? 'próxima janela' : '47 min'}</span>
            </div>
            <div className="mt-6 space-y-4">
              {visibleItems.map((item, index) => {
                const label = 'question' in item ? item.question?.subject ?? 'Revisão' : item.label;
                const minutes = 'minutes' in item ? item.minutes : index === 0 ? '12 min' : index === 1 ? '15 min' : '10 min';
                return (
                  <div key={`${label}-${index}`}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{label}</span>
                      <span className="text-sm text-[var(--muted)]">{minutes}</span>
                    </div>
                    {index < visibleItems.length - 1 && <div className="mt-4 h-px bg-[var(--line)]" />}
                  </div>
                );
              })}
            </div>
            <button onClick={() => router.push('/sessao/hoje')} className="mt-7 flex w-full items-center justify-between rounded-full bg-[var(--ink)] px-5 py-4 text-left text-sm font-medium text-white">
              {completed ? 'Começar próxima sessão' : 'Continuar preparação'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <CalendarClock className="h-5 w-5" />
            <div className="mt-6 text-sm text-[var(--muted)]">Próxima janela</div>
            <div className="mt-1 text-lg">Amanhã · 19:00</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <BookOpenCheck className="h-5 w-5" />
            <div className="mt-6 text-sm text-[var(--muted)]">Percurso</div>
            <div className="mt-1 text-lg">{learner?.attempts.length ? 'Recalculado agora' : 'Pronto para começar'}</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <UsersRound className="h-5 w-5" />
            <div className="mt-6 text-sm text-[var(--muted)]">Agora</div>
            <div className="mt-1 text-lg">86 estudando</div>
          </div>
        </section>

        <section className="mt-14 flex flex-col justify-between gap-6 border-t border-[var(--line)] py-8 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-medium">Aconteceu vida?</div>
            <p className="mt-1 text-sm text-[var(--muted)]">Se hoje não couber, o plano redistribui o que importa sem te punir.</p>
          </div>
          <button className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm">Reorganizar meu dia</button>
        </section>

        <button className="fixed bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(30,25,20,.12)] ring-1 ring-[var(--line)]" aria-label="Abrir tutor">
          <MessageCircleMore className="h-5 w-5" />
        </button>
      </div>
    </main>
  );
}
