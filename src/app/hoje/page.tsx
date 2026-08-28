'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, MessageCircleMore, Sparkles, X } from 'lucide-react';
import { loadLearnerState } from '@/features/adaptive/engine';
import type { LearnerState } from '@/features/adaptive/types';
import { loadMockSession } from '@/features/auth/mock-auth';
import { getCalibrationReadiness } from '@/features/calibration/engine';
import {
  ensureStudyPlan,
  loadStudyProfile,
  localDateKey,
  markDayDone,
  reflowMissedDay,
  rescheduleWithMinutes,
} from '@/features/planning/engine';
import type { StudyDay, StudyPlan, StudyProfile } from '@/features/planning/types';
import { trackLearningEvent } from '@/features/telemetry/engine';
import { SocraticTutor } from '@/features/tutor/socratic-tutor';

function formatMinutes(value: number) {
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HojePage() {
  const router = useRouter();
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [studentName, setStudentName] = useState('');
  const [completed, setCompleted] = useState(false);
  const [reflowOpen, setReflowOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [availableToday, setAvailableToday] = useState<number | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);

  useEffect(() => {
    const storedProfile = loadStudyProfile();
    if (!storedProfile) {
      router.replace('/onboarding');
      return;
    }

    const session = loadMockSession();
    setStudentName(session?.name?.split(' ')[0] ?? '');

    const completedNow = new URLSearchParams(window.location.search).get('completed') === '1';
    let currentPlan = ensureStudyPlan(storedProfile);
    if (completedNow) {
      currentPlan = markDayDone(currentPlan, localDateKey());
      window.history.replaceState({}, '', '/hoje');
    }

    setProfile(storedProfile);
    setPlan(currentPlan);
    setLearner(loadLearnerState());
    setCompleted(completedNow);
  }, [router]);

  const todayKey = localDateKey();
  const today = useMemo<StudyDay | null>(() => plan?.days.find((day) => day.date === todayKey) ?? null, [plan, todayKey]);
  const calibration = useMemo(() => (learner ? getCalibrationReadiness(learner) : null), [learner]);

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

  function openTutor() {
    trackLearningEvent('tutor_opened', { origin: 'hoje' });
    setTutorOpen(true);
  }

  function applyReflow() {
    if (!plan || !today || availableToday === null) return;

    const before = today.plannedMinutes;
    const updated = availableToday === 0
      ? reflowMissedDay(plan, today.date)
      : rescheduleWithMinutes(plan, today.date, availableToday);

    const moved = Math.max(0, before - availableToday);
    setPlan(updated);
    setReflowOpen(false);
    setPlanNotice(
      moved > 0
        ? `${formatMinutes(moved)} foram redistribuídos. Nada foi perdido.`
        : 'Seu dia mudou. O caminho mudou junto.',
    );
  }

  const hasStudyNow = today?.status === 'planned' && today.plannedMinutes > 0 && !completed;
  const studyDay = hasStudyNow ? today : nextWindow;

  return (
    <main className="min-h-dvh bg-[#faf9f7] text-[#191816]">
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-5 md:px-8 md:pt-7">
        <header className="flex items-center justify-between border-b border-[#e8e4de] pb-5">
          <button onClick={() => router.push('/hoje')} className="serif text-xl">direito fácil</button>
          <nav className="flex items-center gap-5 text-sm text-[#77736d]">
            <button onClick={() => router.push('/materiais')} className="hidden transition hover:text-[#191816] sm:block">Materiais</button>
            <button onClick={() => router.push('/praca')} className="hidden transition hover:text-[#191816] sm:block">A Praça</button>
            <button onClick={() => router.push('/perfil')} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd8d1] bg-white text-xs text-[#625d56]">{studentName ? studentName[0]?.toUpperCase() : 'A'}</button>
          </nav>
        </header>

        {(completed || planNotice) && (
          <div className="mt-6 flex items-center justify-between gap-5 border-b border-[#ded9d2] pb-5 text-sm text-[#6d655d]">
            <span>{planNotice ?? 'Terminamos por hoje. O que aconteceu na sessão já mudou o próximo percurso.'}</span>
            {planNotice && <button onClick={() => setPlanNotice(null)} aria-label="Fechar"><X className="h-4 w-4" /></button>}
          </div>
        )}

        <section className="pb-14 pt-14 md:pb-20 md:pt-20">
          <p className="text-sm text-[#77736d]">{greeting()}{studentName ? `, ${studentName}` : ''}{daysUntilExam !== null ? ` · ${daysUntilExam} dias até a prova` : ''}</p>
          <h1 className="serif mt-5 max-w-5xl text-[clamp(4rem,10vw,8.6rem)] leading-[.88] tracking-[-.055em]">
            {hasStudyNow ? <>Hoje,<br /><span className="text-[#8d867e]">{formatMinutes(today.plannedMinutes)}.</span></> : completed ? <>Por hoje,<br /><span className="text-[#8d867e]">feito.</span></> : <>Hoje,<br /><span className="text-[#8d867e]">sem pressa.</span></>}
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-[#77736d]">Você não precisa decidir matéria, aula ou revisão. Só começar. A ordem abaixo já leva em conta sua rotina e o que suas respostas vêm revelando.</p>
        </section>

        <section className="border-y border-[#ded9d2]">
          <div className="flex items-center justify-between py-5 text-xs uppercase tracking-[.12em] text-[#99928a]">
            <span>{hasStudyNow ? `Sua sessão · ${today.preferredStart}` : studyDay ? `Próxima sessão · ${studyDay.dayKey} ${studyDay.preferredStart}` : 'Seu caminho'}</span>
            <span>{studyDay ? formatMinutes(studyDay.plannedMinutes) : 'nenhuma sessão pendente'}</span>
          </div>

          {studyDay?.blocks.length ? (
            <div>
              {studyDay.blocks.map((block, index) => (
                <div key={block.id} className="grid grid-cols-[38px_1fr_auto] items-center gap-4 border-t border-[#ebe7e1] py-5 md:grid-cols-[55px_1fr_auto] md:py-6">
                  <span className="text-xs tabular-nums text-[#aaa39a]">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="text-lg md:text-xl">{block.subject ?? block.label}</div>
                    <div className="mt-1 text-xs text-[#908981]">{block.label}</div>
                  </div>
                  <span className="text-sm tabular-nums text-[#77736d]">{formatMinutes(block.minutes)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-t border-[#ebe7e1] py-10 text-sm text-[#77736d]">Nenhuma sessão planejada agora. Descanso também faz parte do cronograma.</div>
          )}

          <div className="flex flex-col gap-4 border-t border-[#ded9d2] py-6 sm:flex-row sm:items-center sm:justify-between">
            {hasStudyNow ? (
              <button onClick={() => router.push('/sessao/hoje')} className="group flex w-full items-center justify-between rounded-full bg-[#191816] px-6 py-4 text-sm font-medium text-white sm:w-auto sm:min-w-[260px]">Começar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
            ) : completed ? (
              <div className="flex items-center gap-2 text-sm text-[#77736d]"><Check className="h-4 w-4" /> A sessão de hoje já foi concluída.</div>
            ) : <span />}

            {today && today.status !== 'done' && (
              <button onClick={openReflow} className="text-left text-sm text-[#77736d] underline decoration-[#cfc8bf] underline-offset-4 transition hover:text-[#191816]">Aconteceu vida? Reorganizar hoje</button>
            )}
          </div>
        </section>

        {calibration?.ready && (
          <section className="mt-16 overflow-hidden rounded-[32px] bg-[#171614] px-6 py-8 text-[#f8f6f2] md:px-10 md:py-10">
            <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Sparkles className="h-5 w-5 text-white/55" />
                <p className="mt-8 text-sm text-white/40">Uma etapa apareceu no seu caminho.</p>
                <h2 className="serif mt-3 max-w-3xl text-4xl leading-[1.05] md:text-6xl">Agora vale a pena medir sem ajuda.</h2>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-white/50">A calibração só aparece quando já existe informação suficiente para o resultado realmente mudar o que vem depois.</p>
              </div>
              <button onClick={() => router.push('/calibracao')} className="flex items-center gap-3 rounded-full bg-[#f8f6f2] px-5 py-3 text-sm text-[#171614]">Calibrar <ArrowRight className="h-4 w-4" /></button>
            </div>
          </section>
        )}

        <section className="mt-16 grid gap-8 border-t border-[#ded9d2] pt-7 text-sm md:grid-cols-3">
          <div><div className="text-xs uppercase tracking-[.1em] text-[#aaa39a]">Próxima janela</div><div className="mt-3 text-[#4d4944]">{nextWindow ? `${nextWindow.dayKey}, ${nextWindow.preferredStart} · ${formatMinutes(nextWindow.plannedMinutes)}` : 'O plano se renova em breve.'}</div>{nextWindow?.carriedMinutes ? <div className="mt-1 text-xs text-[#99928a]">inclui {formatMinutes(nextWindow.carriedMinutes)} redistribuídos</div> : null}</div>
          <div><div className="text-xs uppercase tracking-[.1em] text-[#aaa39a]">Percurso</div><div className="mt-3 text-[#4d4944]">{learner?.attempts.length ? 'Mudou com suas respostas mais recentes.' : 'Pronto para começar a aprender com você.'}</div></div>
          <button onClick={() => router.push('/praca')} className="text-left"><div className="text-xs uppercase tracking-[.1em] text-[#aaa39a]">A Praça</div><div className="mt-3 text-[#4d4944]">Estudar junto, sem ranking e sem competição. <span className="text-[#8d867e]">Abrir →</span></div></button>
        </section>
      </div>

      <button onClick={openTutor} className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[#ded9d2] bg-white shadow-[0_12px_40px_rgba(30,25,20,.1)]" aria-label="Abrir tutor"><MessageCircleMore className="h-5 w-5" /></button>

      {reflowOpen && today && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 backdrop-blur-[3px] sm:items-center">
          <div className="w-full max-w-lg rounded-[30px] bg-[#faf9f7] p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm text-[#77736d]">Sem culpa. Só recalculamos.</p><h2 className="serif mt-2 text-4xl leading-tight">Quanto cabe hoje de verdade?</h2></div>
              <button onClick={() => setReflowOpen(false)} className="rounded-full border border-[#ded9d2] p-2" aria-label="Fechar"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[0, 15, 25, 30, 45, 60, 90, 120].map((value) => (
                <button key={value} onClick={() => setAvailableToday(value)} className={`rounded-full border px-4 py-2.5 text-sm transition ${availableToday === value ? 'border-[#191816] bg-[#191816] text-white' : 'border-[#ded9d2] bg-white text-[#625d56]'}`}>{value === 0 ? 'Hoje não dá' : formatMinutes(value)}</button>
              ))}
            </div>

            <p className="mt-7 text-sm leading-6 text-[#77736d]">Hoje estavam planejados {formatMinutes(today.plannedMinutes)}. O que não couber será espalhado pelas próximas janelas em doses possíveis, não despejado amanhã.</p>
            <button onClick={applyReflow} className="mt-7 flex w-full items-center justify-between rounded-full bg-[#191816] px-5 py-4 text-sm font-medium text-white">Atualizar meu caminho <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <SocraticTutor open={tutorOpen} onClose={() => setTutorOpen(false)} />
    </main>
  );
}
