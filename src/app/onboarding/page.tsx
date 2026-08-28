'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, Clock3, GraduationCap, Plus, Sparkles, X } from 'lucide-react';
import { generateStudyPlan, saveStudyProfile } from '@/features/planning/engine';
import type { DailyAvailability, DayKey, FixedCommitment, StudyProfile } from '@/features/planning/types';

const steps = ['Prova', 'Rotina', 'Compromissos', 'Ritmo', 'Calendário', 'Pronto'];
const days: DayKey[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const initialAvailability: DailyAvailability[] = [
  { day: 'Seg', minutes: 45, preferredStart: '19:00' },
  { day: 'Ter', minutes: 60, preferredStart: '19:30' },
  { day: 'Qua', minutes: 0, preferredStart: '19:00' },
  { day: 'Qui', minutes: 45, preferredStart: '19:00' },
  { day: 'Sex', minutes: 30, preferredStart: '18:30' },
  { day: 'Sáb', minutes: 120, preferredStart: '10:00' },
  { day: 'Dom', minutes: 0, preferredStart: '10:00' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('2026-11-29');
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [connected, setConnected] = useState(false);
  const [availability, setAvailability] = useState<DailyAvailability[]>(initialAvailability);
  const [commitments, setCommitments] = useState<FixedCommitment[]>([
    { id: 'faculdade', label: 'Faculdade', days: ['Seg', 'Qua'], start: '08:00', end: '12:00' },
  ]);

  const weeklyMinutes = useMemo(
    () => availability.reduce((total, item) => total + item.minutes, 0),
    [availability],
  );

  function updateAvailability(day: DayKey, patch: Partial<DailyAvailability>) {
    setAvailability((current) => current.map((item) => (item.day === day ? { ...item, ...patch } : item)));
  }

  function addCommitment(kind: 'Trabalho' | 'Faculdade' | 'Outro') {
    setCommitments((current) => [
      ...current,
      {
        id: `${kind.toLowerCase()}-${Date.now()}`,
        label: kind,
        days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
        start: kind === 'Faculdade' ? '08:00' : '09:00',
        end: kind === 'Faculdade' ? '12:00' : '18:00',
      },
    ]);
  }

  function toggleCommitmentDay(id: string, day: DayKey) {
    setCommitments((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const has = item.days.includes(day);
        return { ...item, days: has ? item.days.filter((entry) => entry !== day) : [...item.days, day] };
      }),
    );
  }

  function updateCommitment(id: string, patch: Partial<FixedCommitment>) {
    setCommitments((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeCommitment(id: string) {
    setCommitments((current) => current.filter((item) => item.id !== id));
  }

  function next() {
    if (step === steps.length - 1) {
      const profile: StudyProfile = {
        examDate,
        sessionMinutes,
        calendarConnected: connected,
        availability,
        commitments,
        createdAt: new Date().toISOString(),
      };

      saveStudyProfile(profile);
      generateStudyPlan(profile);
      localStorage.setItem('oab-onboarding-complete', 'true');
      router.push('/hoje');
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <main className="oab-shell px-4 py-6 md:py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-5xl flex-col rounded-[28px] border border-[var(--line)] bg-white shadow-[0_18px_70px_rgba(42,36,29,.06)]">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5 md:px-9">
          <div className="serif text-xl">direito fácil</div>
          <div className="text-xs text-[var(--muted)]">Seu plano começa pela sua vida.</div>
        </header>

        <div className="flex flex-1 flex-col px-6 py-8 md:px-14 md:py-12">
          <div className="mb-10 flex gap-2">
            {steps.map((label, index) => (
              <div key={label} className="flex-1">
                <div className={`h-1 rounded-full ${index <= step ? 'bg-[var(--ink)]' : 'bg-[var(--soft)]'}`} />
                <div className="mt-2 hidden text-[11px] text-[var(--muted)] sm:block">{label}</div>
              </div>
            ))}
          </div>

          <section className="fade-in my-auto" key={step}>
            {step === 0 && (
              <div className="max-w-2xl">
                <p className="mb-4 text-sm text-[var(--muted)]">Primeiro, o destino.</p>
                <h1 className="serif text-4xl leading-tight md:text-6xl">Quando é a sua prova?</h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">A data não serve para colocar pressão. Ela diz ao sistema quanto tempo existe para escolher o que realmente merece entrar no caminho.</p>
                <div className="mt-10 max-w-md rounded-2xl border border-[var(--line)] p-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Data da 1ª fase</label>
                  <input value={examDate} onChange={(event) => setExamDate(event.target.value)} type="date" className="w-full bg-transparent text-xl outline-none" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="mb-4 text-sm text-[var(--muted)]">Agora, a semana real.</p>
                <h1 className="serif max-w-3xl text-4xl leading-tight md:text-6xl">Quando sua vida deixa espaço?</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">Diga quanto tempo existe e quando ele costuma existir. O horário é uma preferência, não uma promessa.</p>
                <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {availability.map((item) => (
                    <div key={item.day} className="rounded-2xl border border-[var(--line)] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.day}</span>
                        <Clock3 className="h-4 w-4 text-[var(--muted)]" />
                      </div>
                      <select value={item.minutes} onChange={(event) => updateAvailability(item.day, { minutes: Number(event.target.value) })} className="mt-5 w-full bg-transparent text-sm outline-none">
                        <option value={0}>Sem tempo</option>
                        <option value={25}>25 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>1 hora</option>
                        <option value={90}>1h30</option>
                        <option value={120}>2 horas</option>
                        <option value={180}>3 horas</option>
                      </select>
                      {item.minutes > 0 && (
                        <div className="mt-4 border-t border-[var(--line)] pt-3">
                          <label className="text-[11px] text-[var(--muted)]">Normalmente a partir de</label>
                          <input type="time" value={item.preferredStart} onChange={(event) => updateAvailability(item.day, { preferredStart: event.target.value })} className="mt-1 w-full bg-transparent text-sm outline-none" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm text-[var(--muted)]">Disponibilidade semanal atual: {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}min.</p>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="mb-4 text-sm text-[var(--muted)]">O espaço livre não existe sozinho.</p>
                <h1 className="serif max-w-3xl text-4xl leading-tight md:text-6xl">O que já ocupa sua semana?</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">Isso não vira um calendário rígido. Serve para o sistema não sugerir estudo no meio da faculdade, do estágio ou de outro compromisso que já sabemos que existe.</p>

                <div className="mt-8 flex flex-wrap gap-2">
                  <button onClick={() => addCommitment('Trabalho')} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm"><BriefcaseBusiness className="h-4 w-4" /> Trabalho</button>
                  <button onClick={() => addCommitment('Faculdade')} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm"><GraduationCap className="h-4 w-4" /> Faculdade</button>
                  <button onClick={() => addCommitment('Outro')} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm"><Plus className="h-4 w-4" /> Outro</button>
                </div>

                <div className="mt-7 space-y-4">
                  {commitments.length === 0 && <div className="rounded-2xl bg-[var(--soft)] p-5 text-sm text-[var(--muted)]">Nada fixo por enquanto. Tudo bem.</div>}
                  {commitments.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--line)] p-5">
                      <div className="flex items-center gap-3">
                        <input value={item.label} onChange={(event) => updateCommitment(item.id, { label: event.target.value })} className="min-w-0 flex-1 bg-transparent text-lg font-medium outline-none" />
                        <input type="time" value={item.start} onChange={(event) => updateCommitment(item.id, { start: event.target.value })} className="bg-transparent text-sm outline-none" />
                        <span className="text-sm text-[var(--muted)]">–</span>
                        <input type="time" value={item.end} onChange={(event) => updateCommitment(item.id, { end: event.target.value })} className="bg-transparent text-sm outline-none" />
                        <button onClick={() => removeCommitment(item.id)} aria-label={`Remover ${item.label}`}><X className="h-4 w-4 text-[var(--muted)]" /></button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {days.map((day) => (
                          <button key={day} onClick={() => toggleCommitmentDay(item.id, day)} className={`rounded-full px-3 py-1.5 text-xs transition ${item.days.includes(day) ? 'bg-[var(--ink)] text-white' : 'bg-[var(--soft)] text-[var(--muted)]'}`}>{day}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-2xl">
                <p className="mb-4 text-sm text-[var(--muted)]">Seu ritmo importa.</p>
                <h1 className="serif text-4xl leading-tight md:text-6xl">Quanto tempo até sua atenção começar a ir embora?</h1>
                <p className="mt-5 text-base leading-7 text-[var(--muted)]">Uma janela de duas horas não precisa virar uma aula de duas horas. O motor pode quebrá-la em blocos e misturar matérias.</p>
                <div className="mt-10 flex flex-wrap gap-3">
                  {[25, 35, 45, 60, 90].map((value) => (
                    <button key={value} onClick={() => setSessionMinutes(value)} className={`rounded-full border px-5 py-3 text-sm transition ${sessionMinutes === value ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--line)] hover:bg-[var(--soft)]'}`}>
                      {value} min
                    </button>
                  ))}
                </div>
                <div className="mt-10 rounded-2xl bg-[var(--soft)] p-5 text-sm text-[var(--muted)]">Esse número define seu bloco confortável. Não é uma meta de produtividade.</div>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-2xl">
                <p className="mb-4 text-sm text-[var(--muted)]">Menos trabalho manual.</p>
                <h1 className="serif text-4xl leading-tight md:text-6xl">Quer deixar seu calendário conversar com o plano?</h1>
                <p className="mt-5 text-base leading-7 text-[var(--muted)]">Quando a integração real entrar, compromissos do Google Calendar poderão sinalizar semanas apertadas e janelas que mudaram.</p>
                <button onClick={() => setConnected((value) => !value)} className={`mt-10 flex w-full max-w-md items-center justify-between rounded-2xl border p-5 text-left transition ${connected ? 'border-[var(--ink)] bg-[var(--soft)]' : 'border-[var(--line)] hover:bg-[var(--soft)]'}`}>
                  <span className="flex items-center gap-3"><CalendarDays className="h-5 w-5" /> Google Calendar</span>
                  <span className="text-sm text-[var(--muted)]">{connected ? 'Conectado' : 'Conectar'}</span>
                </button>
                <p className="mt-4 text-xs text-[var(--muted)]">Integração simulada nesta versão; o estado já é persistido no perfil.</p>
              </div>
            )}

            {step === 5 && (
              <div className="max-w-3xl">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--warm)]"><Sparkles className="h-5 w-5" /></div>
                <h1 className="serif text-4xl leading-tight md:text-6xl">Já temos o suficiente para montar seu primeiro caminho.</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">Ele começa com sua rotina. Depois passa a mudar também com aquilo que suas respostas revelam.</p>
                <div className="mt-9 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-xs text-[var(--muted)]">Semana</div><div className="mt-2 text-xl">{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}min</div></div>
                  <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-xs text-[var(--muted)]">Sessão</div><div className="mt-2 text-xl">{sessionMinutes} min</div></div>
                  <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-xs text-[var(--muted)]">Compromissos</div><div className="mt-2 text-xl">{commitments.length}</div></div>
                  <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-xs text-[var(--muted)]">Calendário</div><div className="mt-2 text-xl">{connected ? 'Conectado' : 'Manual'}</div></div>
                </div>
              </div>
            )}
          </section>

          <footer className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-6">
            <button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="flex items-center gap-2 text-sm text-[var(--muted)] disabled:opacity-0"><ChevronLeft className="h-4 w-4" /> Voltar</button>
            <button onClick={next} className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">{step === steps.length - 1 ? 'Montar meu caminho' : 'Continuar'} <ChevronRight className="h-4 w-4" /></button>
          </footer>
        </div>
      </div>
    </main>
  );
}
