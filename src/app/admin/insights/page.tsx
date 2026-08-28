'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Brain, CalendarClock, CheckCircle2, Clock3, EyeOff, Sparkles } from 'lucide-react';
import { loadLearnerState } from '@/features/adaptive/engine';
import { QUESTION_BANK } from '@/features/adaptive/question-bank';
import { getCalibrationReadiness } from '@/features/calibration/engine';
import { loadStudyPlan, loadStudyProfile, localDateKey } from '@/features/planning/engine';
import type { LearnerState } from '@/features/adaptive/types';
import type { StudyPlan, StudyProfile } from '@/features/planning/types';
import { loadLearningEvents, summarizeEngagement, type LearningEvent } from '@/features/telemetry/engine';

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatMs(value: number) {
  if (value < 1000) return `${value} ms`;
  return `${Math.round(value / 1000)} s`;
}

export default function InternalInsightsPage() {
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [events, setEvents] = useState<LearningEvent[]>([]);

  useEffect(() => {
    setLearner(loadLearnerState());
    setProfile(loadStudyProfile());
    setPlan(loadStudyPlan());
    setEvents(loadLearningEvents());
  }, []);

  const calibration = learner ? getCalibrationReadiness(learner) : null;
  const engagement = useMemo(() => summarizeEngagement(events), [events]);

  const conceptRows = useMemo(() => {
    if (!learner) return [];
    return Object.values(learner.concepts)
      .map((concept) => {
        const reference = QUESTION_BANK.find((question) => question.conceptId === concept.conceptId);
        return {
          ...concept,
          subject: reference?.subject ?? '—',
          label: reference?.conceptLabel ?? concept.conceptId,
          due: concept.nextReviewAt ? new Date(concept.nextReviewAt) <= new Date() : false,
        };
      })
      .sort((a, b) => a.strength - b.strength);
  }, [learner]);

  const attempts = learner?.attempts ?? [];
  const averageResponse = attempts.length
    ? attempts.reduce((sum, attempt) => sum + attempt.responseMs, 0) / attempts.length
    : 0;
  const hints = attempts.reduce((sum, attempt) => sum + attempt.hintsUsed, 0);
  const reasoningCounts = attempts.reduce<Record<string, number>>((acc, attempt) => {
    acc[attempt.reasoningSignal] = (acc[attempt.reasoningSignal] ?? 0) + 1;
    return acc;
  }, {});

  const today = plan?.days.find((day) => day.date === localDateKey());

  return (
    <main className="min-h-dvh bg-[#11110f] px-4 py-5 text-[#f5f2ed] md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[.14em] text-white/40"><EyeOff className="h-4 w-4" /> interno · não exibir ao aluno</div>
            <h1 className="serif mt-3 text-4xl md:text-5xl">Learning Intelligence</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Uma janela para testar se o curso está realmente adaptando o percurso pelo motivo certo. Esta tela é operacional, não faz parte da experiência do estudante.</p>
          </div>
          <div className={`w-fit rounded-full border px-4 py-2 text-xs ${calibration?.ready ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/10 text-white/45'}`}>
            Calibração: {calibration?.ready ? 'pronta' : 'ainda não'}
          </div>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Sessões concluídas" value={String(learner?.completedSessions ?? 0)} icon={<CheckCircle2 className="h-4 w-4" />} />
          <Metric label="Tentativas" value={String(attempts.length)} icon={<Brain className="h-4 w-4" />} />
          <Metric label="Tempo médio / resposta" value={attempts.length ? formatMs(averageResponse) : '—'} icon={<Clock3 className="h-4 w-4" />} />
          <Metric label="Pistas utilizadas" value={String(hints)} icon={<Sparkles className="h-4 w-4" />} />
          <Metric label="Dias com eventos" value={String(engagement.activeDates)} icon={<CalendarClock className="h-4 w-4" />} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[.035]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div><div className="text-sm font-medium">Estado por conceito</div><div className="mt-1 text-xs text-white/35">Ordenado do ponto mais fraco para o mais sólido</div></div>
              <div className="text-xs text-white/35">{conceptRows.length} conceitos observados</div>
            </div>
            {conceptRows.length ? (
              <div className="divide-y divide-white/10">
                {conceptRows.map((concept) => (
                  <div key={concept.conceptId} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_110px_100px_130px] md:items-center">
                    <div>
                      <div className="flex items-center gap-2"><span className="text-sm">{concept.label}</span>{concept.due && <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[10px] text-amber-200">revisão vencida</span>}</div>
                      <div className="mt-1 text-xs text-white/35">{concept.subject}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/35">força interna</div>
                      <div className="mt-1 text-sm">{pct(concept.strength)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/35">exposições</div>
                      <div className="mt-1 text-sm">{concept.exposures}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/35">próxima revisão</div>
                      <div className="mt-1 text-xs text-white/70">{concept.nextReviewAt ? new Date(concept.nextReviewAt).toLocaleDateString('pt-BR') : '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty text="Nenhuma evidência pedagógica registrada ainda." />}
          </div>

          <div className="space-y-6">
            <Panel title="Raciocínio observado">
              {Object.keys(reasoningCounts).length ? (
                <div className="space-y-3">
                  {['solid', 'partial', 'lucky', 'confused', 'unknown'].map((signal) => (
                    <div key={signal} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"><span className="text-xs text-white/45">{signal}</span><span className="text-sm">{reasoningCounts[signal] ?? 0}</span></div>
                  ))}
                </div>
              ) : <div className="text-xs text-white/35">Ainda sem justificativas analisadas.</div>}
            </Panel>

            <Panel title="Agenda de hoje">
              {today ? (
                <div>
                  <div className="flex items-center justify-between"><span className="text-xs text-white/40">base</span><span className="text-sm">{today.baseMinutes} min</span></div>
                  <div className="mt-3 flex items-center justify-between"><span className="text-xs text-white/40">planejado agora</span><span className="text-sm">{today.plannedMinutes} min</span></div>
                  <div className="mt-3 flex items-center justify-between"><span className="text-xs text-white/40">carregado</span><span className="text-sm">{today.carriedMinutes} min</span></div>
                  <div className="mt-3 flex items-center justify-between"><span className="text-xs text-white/40">status</span><span className="text-sm">{today.status}</span></div>
                </div>
              ) : <div className="text-xs text-white/35">Plano ainda não gerado.</div>}
            </Panel>

            <Panel title="Prontidão de calibração">
              <div className="flex gap-3">
                {calibration?.ready ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />}
                <div><div className="text-sm">{calibration?.ready ? 'Liberar no percurso' : 'Manter invisível'}</div><p className="mt-2 text-xs leading-5 text-white/35">{calibration?.internalReason ?? 'Sem estado do aluno.'}</p></div>
              </div>
            </Panel>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Eventos de engajamento">
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {Object.entries(engagement.counts).map(([key, value]) => <div key={key} className="flex items-center justify-between border-b border-white/10 pb-2 text-xs"><span className="text-white/35">{key}</span><span>{value}</span></div>)}
            </div>
            <p className="mt-5 text-xs leading-5 text-white/30">Ainda não transformamos isso em dinheiro, desconto ou score. Primeiro coletamos sinais confiáveis; a política de bolsa será desenhada em cima deles depois.</p>
          </Panel>

          <Panel title="Perfil de rotina">
            {profile ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-white/35">prova</span><span>{new Date(`${profile.examDate}T12:00:00`).toLocaleDateString('pt-BR')}</span></div>
                <div className="flex justify-between"><span className="text-white/35">sessão confortável</span><span>{profile.sessionMinutes} min</span></div>
                <div className="flex justify-between"><span className="text-white/35">calendar</span><span>{profile.calendarConnected ? 'conectado (mock)' : 'manual'}</span></div>
                <div className="flex justify-between"><span className="text-white/35">compromissos fixos</span><span>{profile.commitments.length}</span></div>
                <div className="pt-3 text-white/35">Disponibilidade semanal</div>
                <div className="flex flex-wrap gap-2">{profile.availability.map((item) => <span key={item.day} className="rounded-full border border-white/10 px-3 py-1.5">{item.day} · {item.minutes}m · {item.preferredStart}</span>)}</div>
              </div>
            ) : <div className="text-xs text-white/35">Onboarding ainda não concluído.</div>}
          </Panel>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[.025] p-5">
          <div className="text-sm font-medium">Últimas tentativas</div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="text-white/30"><tr><th className="pb-3 font-normal">questão</th><th className="pb-3 font-normal">matéria</th><th className="pb-3 font-normal">certa?</th><th className="pb-3 font-normal">raciocínio</th><th className="pb-3 font-normal">pistas</th><th className="pb-3 font-normal">tempo</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {attempts.slice(-12).reverse().map((attempt) => <tr key={`${attempt.questionId}-${attempt.createdAt}`}><td className="py-3 text-white/70">{attempt.questionId}</td><td className="py-3 text-white/50">{attempt.subject}</td><td className="py-3">{attempt.correct ? 'sim' : 'não'}</td><td className="py-3">{attempt.reasoningSignal}</td><td className="py-3">{attempt.hintsUsed}</td><td className="py-3">{formatMs(attempt.responseMs)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center gap-2 text-xs text-white/35">{icon}{label}</div><div className="mt-5 text-2xl">{value}</div></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/[.035] p-5"><div className="mb-5 text-sm font-medium">{title}</div>{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-10 text-sm text-white/35">{text}</div>;
}
