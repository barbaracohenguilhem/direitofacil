'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Sparkles } from 'lucide-react';

const steps = ['Prova', 'Rotina', 'Ritmo', 'Calendário', 'Pronto'];
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('2026-11-29');
  const [minutes, setMinutes] = useState(45);
  const [connected, setConnected] = useState(false);
  const [availability, setAvailability] = useState<Record<string, number>>({ Seg: 45, Ter: 60, Qua: 0, Qui: 45, Sex: 30, Sáb: 120, Dom: 0 });

  const weeklyMinutes = useMemo(() => Object.values(availability).reduce((a, b) => a + b, 0), [availability]);

  function next() {
    if (step === steps.length - 1) {
      localStorage.setItem('oab-onboarding-complete', 'true');
      localStorage.setItem('oab-availability', JSON.stringify(availability));
      localStorage.setItem('oab-exam-date', examDate);
      router.push('/hoje');
      return;
    }
    setStep((s) => s + 1);
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
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">Não vamos encaixar você em um cronograma pronto. A data da prova define quanto tempo existe; sua rotina define como esse tempo pode ser usado.</p>
                <div className="mt-10 max-w-md rounded-2xl border border-[var(--line)] p-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Data da 1ª fase</label>
                  <input value={examDate} onChange={(e) => setExamDate(e.target.value)} type="date" className="w-full bg-transparent text-xl outline-none" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="mb-4 text-sm text-[var(--muted)]">Agora, a semana real.</p>
                <h1 className="serif max-w-3xl text-4xl leading-tight md:text-6xl">Quando sua vida deixa espaço?</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">Coloque só o tempo que você realmente consegue sustentar. O sistema se adapta melhor a 45 minutos honestos do que a duas horas imaginárias.</p>
                <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {days.map((day) => (
                    <div key={day} className="rounded-2xl border border-[var(--line)] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{day}</span>
                        <Clock3 className="h-4 w-4 text-[var(--muted)]" />
                      </div>
                      <select value={availability[day]} onChange={(e) => setAvailability({ ...availability, [day]: Number(e.target.value) })} className="mt-5 w-full bg-transparent text-sm outline-none">
                        <option value={0}>Sem tempo</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>1 hora</option>
                        <option value={90}>1h30</option>
                        <option value={120}>2 horas</option>
                      </select>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm text-[var(--muted)]">Disponibilidade semanal atual: {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}min.</p>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-2xl">
                <p className="mb-4 text-sm text-[var(--muted)]">Seu ritmo importa.</p>
                <h1 className="serif text-4xl leading-tight md:text-6xl">Quanto tempo até sua atenção começar a ir embora?</h1>
                <p className="mt-5 text-base leading-7 text-[var(--muted)]">Não vamos transformar toda janela livre numa maratona. Isso ajuda o motor a montar sessões que você realmente termina.</p>
                <div className="mt-10 flex flex-wrap gap-3">
                  {[25, 35, 45, 60, 90].map((value) => (
                    <button key={value} onClick={() => setMinutes(value)} className={`rounded-full border px-5 py-3 text-sm transition ${minutes === value ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--line)] hover:bg-[var(--soft)]'}`}>
                      {value} min
                    </button>
                  ))}
                </div>
                <div className="mt-10 rounded-2xl bg-[var(--soft)] p-5 text-sm text-[var(--muted)]">Sessões longas ainda podem existir quando fizer sentido. Isto só define o seu intervalo confortável.</div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-2xl">
                <p className="mb-4 text-sm text-[var(--muted)]">Menos trabalho manual.</p>
                <h1 className="serif text-4xl leading-tight md:text-6xl">Quer deixar seu calendário conversar com o plano?</h1>
                <p className="mt-5 text-base leading-7 text-[var(--muted)]">No produto final, compromissos existentes poderão ajudar o sistema a encontrar janelas reais e reorganizar semanas que mudam.</p>
                <button onClick={() => setConnected((v) => !v)} className={`mt-10 flex w-full max-w-md items-center justify-between rounded-2xl border p-5 text-left transition ${connected ? 'border-[var(--ink)] bg-[var(--soft)]' : 'border-[var(--line)] hover:bg-[var(--soft)]'}`}>
                  <span className="flex items-center gap-3"><CalendarDays className="h-5 w-5" /> Google Calendar</span>
                  <span className="text-sm text-[var(--muted)]">{connected ? 'Conectado' : 'Conectar'}</span>
                </button>
                <p className="mt-4 text-xs text-[var(--muted)]">Integração simulada nesta versão.</p>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-2xl">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--warm)]"><Sparkles className="h-5 w-5" /></div>
                <h1 className="serif text-4xl leading-tight md:text-6xl">Já temos o suficiente para começar.</h1>
                <p className="mt-5 text-base leading-7 text-[var(--muted)]">Seu primeiro plano não é definitivo. Ele vai mudar conforme você responder, lembrar, hesitar, revisar e aprender.</p>
                <div className="mt-9 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-xs text-[var(--muted)]">Semana</div><div className="mt-2 text-xl">{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}min</div></div>
                  <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-xs text-[var(--muted)]">Sessão ideal</div><div className="mt-2 text-xl">{minutes} min</div></div>
                  <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-xs text-[var(--muted)]">Calendário</div><div className="mt-2 text-xl">{connected ? 'Conectado' : 'Manual'}</div></div>
                </div>
              </div>
            )}
          </section>

          <footer className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-6">
            <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="flex items-center gap-2 text-sm text-[var(--muted)] disabled:opacity-0"><ChevronLeft className="h-4 w-4" /> Voltar</button>
            <button onClick={next} className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">{step === steps.length - 1 ? 'Montar meu caminho' : 'Continuar'} <ChevronRight className="h-4 w-4" /></button>
          </footer>
        </div>
      </div>
    </main>
  );
}
