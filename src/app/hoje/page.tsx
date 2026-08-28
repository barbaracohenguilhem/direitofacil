'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpenCheck, CalendarClock, Check, MessageCircleMore, UsersRound, X } from 'lucide-react';
import { loadLearnerState } from '@/features/adaptive/engine';
import type { LearnerState } from '@/features/adaptive/types';
import {
  ensureStudyPlan,
  loadStudyProfile,
  localDateKey,
  reflowMissedDay,
  rescheduleWithMinutes,
} from '@/features/planning/engine';
import type { StudyDay, StudyPlan, StudyProfile } from '@/features/planning/types';

function formatMinutes(value: number) {
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

export default function HojePage() {
  const router = useRouter();
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [completed, setCompleted] = useState(false);
  const [reflowOpen, setReflowOpen] = useState(false);
  const [availableToday, setAvailableToday] = useState<number | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);

  useEffect(() => {
    const storedProfile = loadStudyProfile();
    if (!storedProfile) {
      router.replace('/onboarding');
      return;
    }

    const currentPlan = ensureStudyPlan(storedProfile);
    setProfile(storedProfile);
    setPlan(currentPlan);
    setLearner(loadLearnerState());
    setCompleted(new URLSearchParams(window.location.search).get('completed') === '1');
  }, [router]);

  const todayKey = localDateKey();
  const today = useMemo<StudyDay | null>(() => plan?.days.find((day) => day.date === todayKey) ?? null, [plan, todayKey]);

  const nextWindow = useMemo(() => {
    if (!plan) return null;
    return plan.days.find((day) => day.date > todayKey && day.status === 'planned' && day.plannedMinutes > 0) ?? null;
  }, [plan, todayKey]);

  const daysUntilExam = useMemo(() => {
    if (!profile) return null;
    const exam = new Date(`${profile.examDate}T12:00:00`);
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / 86_400_000));
  }, [profile]);

  function openReflow() {
    setAvailableToday(today?.plannedMinutes ?? 0);
    setReflowOpen(true);
  }

  function applyReflow() {
    if (!plan || !today || availableToday === null) return;

    const before = today.plannedMinutes;
    let updated: StudyPlan;
    if (availableToday === 0) {
      updated = reflowMissedDay(plan, today.date);
    } else {
      updated = rescheduleWithMinutes(plan, today.date, availableToday);
    }

    const moved = Math.max(0, before - availableToday);
    setPlan(updated);
    setReflowOpen(false);
    setPlanNotice(
      moved > 0
        ? `Tudo certo. ${formatMinutes(moved)} foram redistribuídos sem apagar o que ainda precisa ser aprendido.`
        : 'Seu dia foi atualizado. O percurso continua cuidando do restante.',
    );
  }

  const studyDay = today?.status === 'planned' && today.plannedMinutes > 0 ? today : nextWindow;
  const hasStudyNow = today?.status === 'planned' && today.plannedMinutes > 0 && !completed;

  return (
    <main className="oab-shell px-4 py-5 md:py-8">
      <div className="oab-container">
        <header className="flex items-center justify-between py-3">
          <div className="serif text-xl">direito fácil</div>
          <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)]">Perfil</button>
        </header>

        {(completed || planNotice) && (
          <div className="mt-8 flex items-start justify-between gap-4 rounded-2xl border border-[#d9d2ca] bg-[#eee2d7] px-5 py-4 text-sm text-[#5f574f]">
            <span>{planNotice ?? 'Sessão concluída. Seu próximo caminho já foi ajustado com o que aconteceu hoje.'}</span>
            {planNotice && <button onClick={() => setPlanNotice(null)} aria-label="Fechar aviso"><X className="h-4 w-4" /></button>}
          </div>
        )}

        <section className="mt-12 grid gap-12 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <p className="text-sm text-[var(--muted)]">Boa noite, Ana.</p>
            <h1 className="serif mt-3 max-w-3xl text-5xl leading-[1.02] md:text-7xl">Hoje você só precisa aparecer.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)]">O sistema cuida da ordem. Sua rotina define o espaço; o que você demonstra durante o estudo redefine o conteúdo.</p>
            {daysUntilExam !== null && <p className="mt-5 text-sm text-[var(--muted)]">Faltam {daysUntilExam} dias para a sua prova.</p>}
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-[0_16px_60px_rgba(40,34,27,.05)]">
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>{hasStudyNow ? `Hoje · ${today?.preferredStart}` : studyDay ? `${studyDay.dayKey} · ${studyDay.preferredStart}` : 'Plano'}</span>
              <span>{studyDay ? formatMinutes(studyDay.plannedMinutes) : 'sem sessão'}</span>
            </div>

            {studyDay?.blocks.length ? (
              <div className="mt-6 space-y-4">
                {studyDay.blocks.map((block, index) => (
                  <div key={block.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div>{block.subject ?? block.label}</div>
                        <div className="mt-0.5 text-xs text-[var(--muted)]">{block.label}</div>
                      </div>
                      <span className="text-sm text-[var(--muted)]">{formatMinutes(block.minutes)}</span>
                    </div>
                    {index < studyDay.blocks.length - 1 && <div className="mt-4 h-px bg-[var(--line)]" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl bg-[var(--soft)] p-5 text-sm leading-6 text-[var(--muted)]">Hoje não existe sessão planejada. O curso não precisa ocupar todos os espaços da sua semana.</div>
            )}

            {hasStudyNow ? (
              <button onClick={() => router.push('/sessao/hoje')} className="mt-7 flex w-full items-center justify-between rounded-full bg-[var(--ink)] px-5 py-4 text-left text-sm font-medium text-white">
                Continuar preparação <ArrowRight className="h-4 w-4" />
              </button>
            ) : completed ? (
              <div className="mt-7 flex items-center gap-2 rounded-full bg-[var(--soft)] px-5 py-4 text-sm text-[var(--muted)]"><Check className="h-4 w-4" /> O estudo de hoje já foi feito.</div>
            ) : null}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <CalendarClock className="h-5 w-5" />
            <div className="mt-6 text-sm text-[var(--muted)]">Próxima janela</div>
            <div className="mt-1 text-lg">{nextWindow ? `${nextWindow.dayKey} · ${nextWindow.preferredStart}` : 'Plano se renova em breve'}</div>
            {nextWindow?.carriedMinutes ? <div className="mt-2 text-xs text-[var(--muted)]">inclui {formatMinutes(nextWindow.carriedMinutes)} redistribuídos</div> : null}
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <BookOpenCheck className="h-5 w-5" />
            <div className="mt-6 text-sm text-[var(--muted)]">Percurso</div>
            <div className="mt-1 text-lg">{learner?.attempts.length ? 'Recalculado pelas suas respostas' : 'Pronto para começar'}</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <UsersRound className="h-5 w-5" />
            <div className="mt-6 text-sm text-[var(--muted)]">A Praça</div>
            <div className="mt-1 text-lg">Presença ao vivo</div>
            <div className="mt-2 text-xs text-[var(--muted)]">A contagem real entra com o backend — sem números inventados.</div>
          </div>
        </section>

        <section className="mt-14 flex flex-col justify-between gap-6 border-t border-[var(--line)] py-8 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-medium">Aconteceu vida?</div>
            <p className="mt-1 text-sm text-[var(--muted)]">Diga quanto realmente cabe hoje. O restante volta para o plano sem punição.</p>
          </div>
          <button onClick={openReflow} disabled={!today || today.status === 'done'} className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm disabled:opacity-40">Reorganizar meu dia</button>
        </section>

        <button className="fixed bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(30,25,20,.12)] ring-1 ring-[var(--line)]" aria-label="Abrir tutor">
          <MessageCircleMore className="h-5 w-5" />
        </button>
      </div>

      {reflowOpen && today && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted)]">Sem culpa. Só precisamos recalcular.</p>
                <h2 className="serif mt-2 text-3xl">Quanto cabe hoje de verdade?</h2>
              </div>
              <button onClick={() => setReflowOpen(false)} className="rounded-full border border-[var(--line)] p-2" aria-label="Fechar"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[0, 15, 25, 30, 45, 60, 90, 120].map((value) => (
                <button key={value} onClick={() => setAvailableToday(value)} className={`rounded-2xl border px-3 py-3 text-sm transition ${availableToday === value ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--line)]'}`}>
                  {value === 0 ? 'Hoje não dá' : formatMinutes(value)}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm leading-6 text-[var(--muted)]">Hoje estavam planejados {formatMinutes(today.plannedMinutes)}. Se você reduzir, o motor espalha o que faltar pelas próximas janelas em pequenas doses, em vez de jogar tudo amanhã.</p>

            <button onClick={applyReflow} className="mt-7 flex w-full items-center justify-between rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-medium text-white">Atualizar meu caminho <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </main>
  );
}
