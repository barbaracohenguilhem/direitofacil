'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronLeft, GraduationCap, Plus, Sparkles, X } from 'lucide-react';
import { generateStudyPlan, saveStudyProfile } from '@/features/planning/engine';
import type { DailyAvailability, DayKey, FixedCommitment, StudyProfile } from '@/features/planning/types';

const steps = ['Prova', 'Sua semana', 'O que já ocupa', 'Seu ritmo', 'Calendário', 'Seu caminho'];
const days: DayKey[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const initialAvailability: DailyAvailability[] = days.map((day) => ({
  day,
  minutes: 0,
  preferredStart: day === 'Sáb' || day === 'Dom' ? '10:00' : '19:00',
}));

function formatMinutes(value: number) {
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [connected, setConnected] = useState(false);
  const [availability, setAvailability] = useState<DailyAvailability[]>(initialAvailability);
  const [commitments, setCommitments] = useState<FixedCommitment[]>([]);

  const weeklyMinutes = useMemo(
    () => availability.reduce((total, item) => total + item.minutes, 0),
    [availability],
  );

  const canContinue = step === 0 ? Boolean(examDate) : step === 1 ? weeklyMinutes > 0 : true;

  function updateAvailability(day: DayKey, patch: Partial<DailyAvailability>) {
    setAvailability((current) => current.map((item) => (item.day === day ? { ...item, ...patch } : item)));
  }

  function addCommitment(kind: 'Trabalho' | 'Faculdade' | 'Outro') {
    setCommitments((current) => [
      ...current,
      {
        id: `${kind.toLowerCase()}-${Date.now()}`,
        label: kind,
        days: kind === 'Outro' ? ['Seg'] : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
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
    if (!canContinue) return;
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
    <main className="min-h-dvh bg-[#faf9f7] text-[#191816]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col px-5 py-5 md:px-8 md:py-7">
        <header className="flex items-center justify-between border-b border-[#e8e4de] pb-5">
          <div className="serif text-xl">direito fácil</div>
          <div className="text-xs text-[#99928a]">Seu plano começa pela sua vida.</div>
        </header>

        <div className="mt-6 flex items-center gap-4">
          <span className="w-12 text-xs tabular-nums text-[#aaa39a]">0{step + 1}/0{steps.length}</span>
          <div className="flex flex-1 gap-1.5">{steps.map((label, index) => <div key={label} className={`h-px flex-1 transition-all duration-500 ${index <= step ? 'bg-[#191816]' : 'bg-[#ddd8d1]'}`} />)}</div>
          <span className="hidden text-xs text-[#99928a] sm:block">{steps[step]}</span>
        </div>

        <section className="fade-in flex flex-1 flex-col justify-center py-12 md:py-16" key={step}>
          {step === 0 && (
            <div className="max-w-4xl">
              <p className="text-sm text-[#8d867e]">Primeiro, precisamos saber quanto tempo existe.</p>
              <h1 className="serif mt-5 max-w-3xl text-5xl leading-[.98] tracking-[-.035em] md:text-7xl">Quando é a sua prova?</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#77736d]">A data não serve para colocar pressão. Ela muda as escolhas do motor: com quatro meses, construímos base; com três semanas, cada minuto precisa perseguir pontos prováveis.</p>
              <label className="mt-12 block max-w-lg border-b border-[#cfc8bf] pb-4">
                <span className="text-xs uppercase tracking-[.11em] text-[#99928a]">Data da 1ª fase</span>
                <input value={examDate} onChange={(event) => setExamDate(event.target.value)} type="date" className="mt-3 w-full bg-transparent text-2xl outline-none md:text-3xl" />
              </label>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-[#8d867e]">Agora a semana como ela realmente é.</p>
              <h1 className="serif mt-5 max-w-4xl text-5xl leading-[.98] tracking-[-.035em] md:text-7xl">Quando existe espaço de verdade?</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#77736d]">Não coloque o tempo que você gostaria de ter. Coloque o que normalmente existe. Quarenta minutos reais valem mais para o sistema do que duas horas imaginárias.</p>

              <div className="mt-10 border-y border-[#ded9d2]">
                {availability.map((item) => (
                  <div key={item.day} className="grid grid-cols-[54px_1fr] items-center gap-4 border-b border-[#ebe7e1] py-4 last:border-b-0 sm:grid-cols-[80px_180px_1fr]">
                    <span className="text-sm font-medium">{item.day}</span>
                    <select value={item.minutes} onChange={(event) => updateAvailability(item.day, { minutes: Number(event.target.value) })} className="bg-transparent text-sm text-[#625d56] outline-none">
                      <option value={0}>Sem tempo</option><option value={25}>25 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>1 hora</option><option value={90}>1h30</option><option value={120}>2 horas</option><option value={180}>3 horas</option>
                    </select>
                    {item.minutes > 0 ? <label className="col-start-2 flex items-center gap-3 text-xs text-[#99928a] sm:col-start-3"><span>A partir de</span><input type="time" value={item.preferredStart} onChange={(event) => updateAvailability(item.day, { preferredStart: event.target.value })} className="bg-transparent text-sm text-[#625d56] outline-none" /></label> : <span className="hidden text-xs text-[#bbb4ab] sm:block">dia livre do curso</span>}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-[#77736d]">{weeklyMinutes > 0 ? `${formatMinutes(weeklyMinutes)} disponíveis por semana.` : 'Escolha pelo menos uma janela. O plano nasce daqui.'}</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-[#8d867e]">Tempo livre não significa agenda vazia.</p>
              <h1 className="serif mt-5 max-w-4xl text-5xl leading-[.98] tracking-[-.035em] md:text-7xl">O que já ocupa sua vida?</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#77736d]">Faculdade, estágio, trabalho, terapia, academia — qualquer coisa fixa que o curso não deveria atravessar. Se não houver nada recorrente, você pode simplesmente continuar.</p>

              <div className="mt-9 flex flex-wrap gap-2">
                <button onClick={() => addCommitment('Trabalho')} className="flex items-center gap-2 rounded-full border border-[#d8d2ca] bg-white px-4 py-2.5 text-sm"><BriefcaseBusiness className="h-4 w-4" /> Trabalho</button>
                <button onClick={() => addCommitment('Faculdade')} className="flex items-center gap-2 rounded-full border border-[#d8d2ca] bg-white px-4 py-2.5 text-sm"><GraduationCap className="h-4 w-4" /> Faculdade</button>
                <button onClick={() => addCommitment('Outro')} className="flex items-center gap-2 rounded-full border border-[#d8d2ca] bg-white px-4 py-2.5 text-sm"><Plus className="h-4 w-4" /> Outro</button>
              </div>

              <div className="mt-8 border-t border-[#ded9d2]">
                {commitments.length === 0 && <div className="py-8 text-sm text-[#99928a]">Nenhum compromisso fixo adicionado. Tudo bem.</div>}
                {commitments.map((item) => (
                  <div key={item.id} className="border-b border-[#ebe7e1] py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <input value={item.label} onChange={(event) => updateCommitment(item.id, { label: event.target.value })} className="min-w-[160px] flex-1 bg-transparent text-lg outline-none" />
                      <input type="time" value={item.start} onChange={(event) => updateCommitment(item.id, { start: event.target.value })} className="bg-transparent text-sm text-[#625d56] outline-none" /><span className="text-sm text-[#aaa39a]">—</span><input type="time" value={item.end} onChange={(event) => updateCommitment(item.id, { end: event.target.value })} className="bg-transparent text-sm text-[#625d56] outline-none" />
                      <button onClick={() => removeCommitment(item.id)} aria-label={`Remover ${item.label}`}><X className="h-4 w-4 text-[#99928a]" /></button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">{days.map((day) => <button key={day} onClick={() => toggleCommitmentDay(item.id, day)} className={`rounded-full px-3 py-1.5 text-xs transition ${item.days.includes(day) ? 'bg-[#191816] text-white' : 'bg-[#eeeae4] text-[#77736d]'}`}>{day}</button>)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-4xl">
              <p className="text-sm text-[#8d867e]">Agora uma pergunta menos matemática.</p>
              <h1 className="serif mt-5 max-w-4xl text-5xl leading-[.98] tracking-[-.035em] md:text-7xl">Quando sua cabeça começa a ir embora?</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#77736d]">Uma janela de duas horas não precisa virar uma aula de duas horas. Esse número diz ao motor quando vale trocar a atividade, mudar a matéria ou fazer uma pausa.</p>
              <div className="mt-12 flex flex-wrap gap-3">{[25, 35, 45, 60, 90].map((value) => <button key={value} onClick={() => setSessionMinutes(value)} className={`min-w-[92px] rounded-full border px-5 py-3 text-sm transition ${sessionMinutes === value ? 'border-[#191816] bg-[#191816] text-white' : 'border-[#d8d2ca] bg-white text-[#625d56]'}`}>{value} min</button>)}</div>
              <p className="mt-7 text-sm text-[#99928a]">Não é meta de produtividade. É limite de conforto.</p>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-4xl">
              <p className="text-sm text-[#8d867e]">Se quiser, podemos fazer menos perguntas no futuro.</p>
              <h1 className="serif mt-5 max-w-4xl text-5xl leading-[.98] tracking-[-.035em] md:text-7xl">Seu calendário pode falar com o plano.</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#77736d]">Quando a integração real estiver ligada, o sistema poderá perceber semanas apertadas e evitar horários que já estão ocupados. É opcional.</p>
              <button onClick={() => setConnected((value) => !value)} className={`mt-12 flex w-full max-w-xl items-center justify-between border-y py-5 text-left transition ${connected ? 'border-[#191816]' : 'border-[#ded9d2]'}`}><span className="flex items-center gap-3 text-lg"><CalendarDays className="h-5 w-5" /> Google Calendar</span><span className="text-sm text-[#77736d]">{connected ? 'Conectado' : 'Conectar'}</span></button>
              <p className="mt-4 text-xs text-[#aaa39a]">Integração simulada neste protótipo. Nenhum calendário real é acessado ainda.</p>
            </div>
          )}

          {step === 5 && (
            <div className="max-w-4xl">
              <Sparkles className="h-6 w-6 text-[#8d867e]" />
              <p className="mt-8 text-sm text-[#8d867e]">Isso basta para começar.</p>
              <h1 className="serif mt-5 max-w-4xl text-5xl leading-[.98] tracking-[-.035em] md:text-7xl">Seu primeiro caminho já pode existir.</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#77736d]">Ele vai nascer da sua rotina. Depois, cada resposta, hesitação, pista e revisão passa a mudar o que vem depois — sem você precisar administrar nada.</p>

              <div className="mt-12 max-w-2xl border-y border-[#ded9d2] text-sm">
                <SummaryRow label="Tempo real por semana" value={formatMinutes(weeklyMinutes)} />
                <SummaryRow label="Bloco confortável" value={`${sessionMinutes} min`} />
                <SummaryRow label="Compromissos fixos" value={commitments.length ? `${commitments.length}` : 'nenhum'} />
                <SummaryRow label="Google Calendar" value={connected ? 'conectado' : 'não conectado'} />
              </div>
            </div>
          )}
        </section>

        <footer className="flex items-center justify-between border-t border-[#e8e4de] py-5">
          <button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="flex items-center gap-2 text-sm text-[#77736d] transition disabled:pointer-events-none disabled:opacity-0"><ChevronLeft className="h-4 w-4" /> Voltar</button>
          <button onClick={next} disabled={!canContinue} className="group flex items-center gap-3 rounded-full bg-[#191816] px-6 py-3.5 text-sm font-medium text-white transition disabled:opacity-25">{step === steps.length - 1 ? 'Criar meu caminho' : 'Continuar'} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
        </footer>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-6 border-b border-[#ebe7e1] py-4 last:border-b-0"><span className="text-[#77736d]">{label}</span><span>{value}</span></div>;
}
