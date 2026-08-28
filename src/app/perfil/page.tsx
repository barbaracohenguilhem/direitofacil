'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, CalendarDays, CheckCircle2, Clock3, Sparkles } from 'lucide-react';
import { loadLearnerState } from '@/features/adaptive/engine';
import type { LearnerState } from '@/features/adaptive/types';
import { loadStudyProfile } from '@/features/planning/engine';
import type { StudyProfile } from '@/features/planning/types';
import { deriveBadges, getDedicationEvidence } from '@/features/rewards/engine';
import { loadLearningEvents, type LearningEvent } from '@/features/telemetry/engine';

export default function ProfilePage() {
  const router = useRouter();
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [events, setEvents] = useState<LearningEvent[]>([]);

  useEffect(() => {
    setLearner(loadLearnerState());
    setProfile(loadStudyProfile());
    setEvents(loadLearningEvents());
  }, []);

  const badges = useMemo(() => (learner ? deriveBadges(learner, events) : []), [learner, events]);
  const evidence = useMemo(() => (learner ? getDedicationEvidence(learner, events) : null), [learner, events]);
  const earned = badges.filter((badge) => badge.earned);

  return (
    <main className="min-h-dvh bg-[#f8f6f2] text-[#1c1a18]">
      <header className="border-b border-[#ded9d2] px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={() => router.push('/hoje')} className="flex items-center gap-2 text-sm text-[#77716a]"><ArrowLeft className="h-4 w-4" /> Hoje</button>
          <div className="serif text-lg">Seu perfil</div>
          <div className="w-[54px]" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-sm text-[#77716a]">Seu percurso, sem comparação.</p>
            <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight md:text-6xl">O progresso aqui é seu. Não existe pódio.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#77716a]">As medalhas registram coisas que você construiu ao longo do caminho. Elas não posicionam você acima ou abaixo de ninguém.</p>
          </div>
          <div className="rounded-[24px] bg-[#171614] p-5 text-[#f8f6f2]">
            <div className="text-sm text-white/45">Medalhas conquistadas</div>
            <div className="serif mt-3 text-5xl">{earned.length}</div>
            <div className="mt-4 text-xs leading-5 text-white/40">de {badges.length} reconhecimentos disponíveis nesta versão</div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <article key={badge.id} className={`rounded-[24px] border p-5 ${badge.earned ? 'border-[#cfc5bb] bg-white' : 'border-[#e3dfda] bg-transparent opacity-55'}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${badge.earned ? 'bg-[#eee2d7]' : 'bg-[#ece9e4]'}`}>
                {badge.earned ? <Award className="h-5 w-5" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <h2 className="mt-6 text-lg font-medium">{badge.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#77716a]">{badge.description}</p>
              <div className="mt-5 text-xs text-[#8f8880]">{badge.earned ? 'Conquistada' : 'Ainda não apareceu no seu percurso'}</div>
            </article>
          ))}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[28px] border border-[#ded9d2] bg-white p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm text-[#77716a]"><Sparkles className="h-4 w-4" /> Bolsa por dedicação</div>
            <h2 className="serif mt-4 max-w-2xl text-3xl leading-tight md:text-4xl">Sua dedicação já pode ser observada sem virar uma corrida por pontos.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#77716a]">Nesta fase, registramos evidências que podem futuramente sustentar um desconto de renovação. Ainda não existe conversão em reais ou porcentagem — de propósito.</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Evidence label="Dias em que apareceu" value={evidence ? String(evidence.activeDays) : '—'} />
              <Evidence label="Sessões concluídas" value={evidence ? String(evidence.completedSessions) : '—'} />
              <Evidence label="Justificativas sólidas" value={evidence ? String(evidence.solidReasoningAnswers) : '—'} />
              <Evidence label="Calibrações" value={evidence ? String(evidence.completedCalibrations) : '—'} />
            </div>

            <div className="mt-7 rounded-2xl bg-[#f1ede8] p-5 text-sm leading-6 text-[#625c56]">A regra final não deverá premiar simplesmente quem acerta mais. O objetivo é reconhecer presença, consistência, revisão e participação útil — sem prejudicar quem começa sabendo menos.</div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-[#ded9d2] p-5">
              <CalendarDays className="h-5 w-5" />
              <div className="mt-5 text-sm text-[#77716a]">Sua prova</div>
              <div className="mt-1 text-lg">{profile ? new Date(`${profile.examDate}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</div>
            </div>
            <div className="rounded-[24px] border border-[#ded9d2] p-5">
              <Clock3 className="h-5 w-5" />
              <div className="mt-5 text-sm text-[#77716a]">Sessão confortável</div>
              <div className="mt-1 text-lg">{profile ? `${profile.sessionMinutes} min` : '—'}</div>
            </div>
            <div className="rounded-[24px] border border-[#ded9d2] p-5">
              <CheckCircle2 className="h-5 w-5" />
              <div className="mt-5 text-sm text-[#77716a]">Google Calendar</div>
              <div className="mt-1 text-lg">{profile?.calendarConnected ? 'Conectado (mock)' : 'Não conectado'}</div>
              <p className="mt-2 text-xs leading-5 text-[#9a948d]">Integração real entra quando conectarmos autenticação e Calendar API.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Evidence({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#e3ded8] p-4"><div className="text-xs text-[#8a847e]">{label}</div><div className="mt-2 text-2xl">{value}</div></div>;
}
