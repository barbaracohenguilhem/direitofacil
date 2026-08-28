'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpenText, FileText, Lightbulb, Mic, PenLine, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { QUESTION_BANK, getQuestion } from '@/features/adaptive/question-bank';
import {
  applyAttempt,
  buildNextActivities,
  finishSession,
  inferReasoningSignal,
  loadLearnerState,
  saveLearnerState,
} from '@/features/adaptive/engine';
import type { AdaptiveQuestion, LearnerState, PlannedActivity, ReasoningSignal } from '@/features/adaptive/types';
import { loadStudyPlan, localDateKey, markDayDone } from '@/features/planning/engine';
import { trackLearningEvent } from '@/features/telemetry/engine';
import { useBrowserVoice } from '@/features/voice/use-browser-voice';

type Stage = 'question' | 'why' | 'feedback' | 'explain' | 'materials';
type SessionActivity = PlannedActivity & { minutes?: number };

const signalCopy: Record<ReasoningSignal, string> = {
  solid: 'Seu raciocínio está consistente. Agora vamos levar essa lógica para outro contexto.',
  partial: 'Você já tem uma parte importante da lógica. Vou completar só o pedaço que ainda está solto.',
  lucky: 'Você chegou à alternativa certa, mas o caminho ainda não está firme. Vamos ajustar isso agora.',
  confused: 'Tem uma regra verdadeira misturada com outra ideia aqui. Vamos separar as duas.',
  unknown: 'Tudo bem ainda não ter uma regra clara. A tentativa já nos mostra por onde começar.',
};

function formatMinutes(value?: number) {
  if (!value) return null;
  return `${value} min`;
}

export default function SessionPage() {
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const sessionTracked = useRef(false);
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [plan, setPlan] = useState<SessionActivity[]>([]);
  const [scheduledMinutes, setScheduledMinutes] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('question');
  const [reasoning, setReasoning] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [signal, setSignal] = useState<ReasoningSignal>('unknown');
  const [responseMs, setResponseMs] = useState(0);
  const [attemptCommitted, setAttemptCommitted] = useState(false);
  const [teacherVoiceEnabled, setTeacherVoiceEnabled] = useState(false);
  const {
    listening,
    speechInputSupported,
    speechOutputSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useBrowserVoice();

  useEffect(() => {
    const state = loadLearnerState();
    const studyPlan = loadStudyPlan();
    const today = studyPlan?.days.find((day) => day.date === localDateKey() && day.status === 'planned');

    const scheduled: SessionActivity[] = (today?.blocks ?? [])
      .filter((block) => block.questionId)
      .map((block) => ({
        questionId: block.questionId as string,
        reason: block.adaptiveReason ?? 'new',
        minutes: block.minutes,
      }));

    const fallbackLimit = Math.max(2, Math.min(5, today?.blocks.length || 5));
    const fallback: SessionActivity[] = buildNextActivities(state, fallbackLimit);
    const nextPlan = scheduled.length ? scheduled : fallback;

    setLearner(state);
    setScheduledMinutes(today?.plannedMinutes ?? null);
    setPlan(
      nextPlan.length
        ? nextPlan
        : QUESTION_BANK.slice(0, 5).map((question) => ({ questionId: question.id, reason: 'new' as const })),
    );

    if (!sessionTracked.current) {
      sessionTracked.current = true;
      trackLearningEvent('session_started', {
        plannedMinutes: today?.plannedMinutes ?? null,
        scheduledActivities: nextPlan.length || fallbackLimit,
        source: scheduled.length ? 'study-plan' : 'adaptive-fallback',
      });
    }
  }, []);

  const activity = plan[index];
  const question = useMemo<AdaptiveQuestion | undefined>(
    () => (activity ? getQuestion(activity.questionId) : undefined),
    [activity],
  );

  useEffect(() => {
    if (!teacherVoiceEnabled || !question || !speechOutputSupported) return;

    if (stage === 'question') {
      speak(`${question.openingLine ?? 'Vamos começar por esta questão.'} ${question.prompt}`);
    }

    if (stage === 'feedback') {
      speak(`${signalCopy[signal]} ${hintsUsed === 0 ? question.nudge : question.secondNudge}`);
    }
  }, [teacherVoiceEnabled, question, stage, signal, hintsUsed, speechOutputSupported, speak]);

  function resetQuestion() {
    stopListening();
    stopSpeaking();
    setSelected(null);
    setReasoning('');
    setHintsUsed(0);
    setSignal('unknown');
    setResponseMs(0);
    setAttemptCommitted(false);
    setStage('question');
    startedAt.current = Date.now();
  }

  function choose(id: string) {
    stopSpeaking();
    setSelected(id);
    setStage('why');
  }

  function toggleListening() {
    if (listening) {
      stopListening();
      return;
    }
    startListening((text) => setReasoning(text));
  }

  function toggleTeacherVoice() {
    if (teacherVoiceEnabled) {
      setTeacherVoiceEnabled(false);
      stopSpeaking();
      return;
    }
    setTeacherVoiceEnabled(true);
  }

  function submitReasoning() {
    if (!question || !selected || !learner) return;
    stopListening();
    const correct = selected === question.correctOption;
    const reasoningSignal = inferReasoningSignal(
      reasoning,
      correct,
      question.reasoningKeywords,
      question.misconceptionKeywords,
    );
    setSignal(reasoningSignal);
    setResponseMs(Date.now() - startedAt.current);
    setStage('feedback');
  }

  function commitAttemptAndExplain() {
    if (!question || !selected || !learner) return;
    stopSpeaking();

    if (!attemptCommitted) {
      const updated = applyAttempt(learner, {
        questionId: question.id,
        conceptId: question.conceptId,
        subject: question.subject,
        selectedOption: selected,
        correct: selected === question.correctOption,
        reasoningSignal: signal,
        hintsUsed,
        responseMs,
        createdAt: new Date().toISOString(),
      });

      setLearner(updated);
      saveLearnerState(updated);
      setAttemptCommitted(true);
    }

    setStage('explain');
  }

  function nextQuestion() {
    if (index >= plan.length - 1) {
      setStage('materials');
      return;
    }
    setIndex((value) => value + 1);
    resetQuestion();
  }

  function completeSession() {
    stopListening();
    stopSpeaking();
    if (learner) finishSession(learner);

    const studyPlan = loadStudyPlan();
    if (studyPlan) markDayDone(studyPlan, localDateKey());

    router.push('/hoje?completed=1');
  }

  if (!question || !learner) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#171614] text-white"><div className="text-sm text-white/50">Preparando sua sessão…</div></main>;
  }

  const selectedOption = question.options.find((option) => option.id === selected);
  const correct = selected === question.correctOption;

  return (
    <main className="min-h-dvh bg-[#171614] text-[#f8f6f2]">
      <header className="border-b border-white/10 px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="serif text-lg">direito fácil</div>
          <div className="text-right text-xs text-white/45">
            Sessão de hoje · {index + 1} de {plan.length}
            {scheduledMinutes ? ` · ${scheduledMinutes} min` : ''}
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-61px)] max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_320px] lg:py-12">
        <section className="flex min-h-[620px] flex-col rounded-[28px] bg-[#f8f6f2] p-6 text-[#1c1a18] md:p-10">
          <div className="mb-8 flex items-center justify-between gap-6">
            <span className="text-xs uppercase tracking-[.14em] text-[#8a857e]">{question.subject} · {question.conceptLabel}</span>
            <div className="flex gap-1">{plan.map((_, itemIndex) => <span key={itemIndex} className={`h-1.5 w-8 rounded-full ${itemIndex <= index ? 'bg-[#1c1a18]' : 'bg-[#ded9d2]'}`} />)}</div>
          </div>

          {stage === 'question' && (
            <div className="fade-in">
              <p className="mb-5 text-sm text-[#77716a]">{question.openingLine ?? 'Sem teoria primeiro. Tente usar o que você já tem.'}</p>
              <h1 className="serif max-w-4xl text-3xl leading-tight md:text-4xl">{question.prompt}</h1>
              <div className="mt-9 grid gap-3">
                {question.options.map((option) => (
                  <button key={option.id} onClick={() => choose(option.id)} className="group flex items-start gap-4 rounded-2xl border border-[#ded9d2] bg-white p-5 text-left transition hover:-translate-y-[1px] hover:border-[#918b83]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d6d1ca] text-sm">{option.id}</span>
                    <span className="pt-1 text-sm leading-6 text-[#46413c]">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === 'why' && (
            <div className="fade-in flex flex-1 flex-col">
              <p className="text-sm text-[#77716a]">Você marcou {selected}.</p>
              <h1 className="serif mt-3 text-4xl md:text-5xl">Por quê?</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#77716a]">Não precisa escrever bonito. Queremos entender o caminho que te levou até essa alternativa.</p>
              <textarea value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="Eu escolhi essa porque..." className="mt-8 min-h-[170px] w-full rounded-2xl border border-[#ded9d2] bg-white p-5 text-base outline-none transition focus:border-[#8f8880]" />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={toggleListening} disabled={!speechInputSupported} className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition disabled:opacity-40 ${listening ? 'border-[#1c1a18] bg-[#1c1a18] text-white' : 'border-[#ded9d2] bg-white'}`}><Mic className="h-4 w-4" /> {listening ? 'Ouvindo…' : speechInputSupported ? 'Responder falando' : 'Voz indisponível'}</button>
                <button type="button" className="flex items-center gap-2 rounded-full border border-[#ded9d2] bg-white px-4 py-2.5 text-sm"><PenLine className="h-4 w-4" /> Escrever</button>
              </div>
              {listening && <p className="mt-3 text-xs text-[#8a847e]">Fale normalmente. A transcrição aparece no campo acima.</p>}
              <div className="mt-auto flex justify-end pt-8">
                <button onClick={submitReasoning} disabled={!reasoning.trim()} className="flex items-center gap-2 rounded-full bg-[#1c1a18] px-6 py-3 text-sm text-white disabled:opacity-30">Continuar <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {stage === 'feedback' && (
            <div className="fade-in flex flex-1 flex-col justify-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#eee2d7]"><Sparkles className="h-5 w-5" /></div>
              <p className="text-sm text-[#77716a]">Professora</p>
              <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">{signalCopy[signal]}</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#625c56]">{hintsUsed === 0 ? question.nudge : question.secondNudge}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {hintsUsed < 2 && (
                  <button onClick={() => setHintsUsed((value) => value + 1)} className="flex items-center gap-2 rounded-full border border-[#d7d1ca] bg-white px-5 py-3 text-sm"><Lightbulb className="h-4 w-4" /> {hintsUsed === 0 ? 'Quero uma pista' : 'Mais uma pista'}</button>
                )}
                <button onClick={commitAttemptAndExplain} className="rounded-full bg-[#1c1a18] px-5 py-3 text-sm text-white">Ver a lógica completa</button>
              </div>
            </div>
          )}

          {stage === 'explain' && (
            <div className="fade-in">
              <p className="text-sm text-[#77716a]">O que precisa ficar.</p>
              <h1 className="serif mt-3 text-4xl md:text-5xl">{correct ? 'Você marcou a melhor alternativa.' : `A melhor alternativa era ${question.correctOption}.`}</h1>
              {selectedOption && !correct && <p className="mt-5 max-w-3xl text-sm leading-6 text-[#746e67]">Você marcou {selectedOption.id}: {selectedOption.explanation}</p>}
              <div className="mt-8 space-y-5 text-sm leading-7 text-[#5e5852]">
                <p><strong className="text-[#1c1a18]">Regra:</strong> {question.takeaway}</p>
                {question.options.map((option) => (
                  <p key={option.id}><strong className="text-[#1c1a18]">{option.id}:</strong> {option.explanation}</p>
                ))}
              </div>
              <div className="mt-8 rounded-2xl bg-[#eee2d7] p-5">
                <div className="text-xs uppercase tracking-[.12em] text-[#7f7064]">Pegadinha da FGV</div>
                <p className="mt-2 text-sm leading-6">{question.fgvPattern}</p>
              </div>
              {question.vade && (
                <div className="mt-5 rounded-2xl border border-[#ded9d2] p-5">
                  <div className="text-xs uppercase tracking-[.12em] text-[#837d75]">Vade Mecum · {question.vade.article}</div>
                  <p className="mt-2 text-sm">{question.vade.instruction}</p>
                </div>
              )}
              <div className="mt-8 flex justify-end">
                <button onClick={nextQuestion} className="flex items-center gap-2 rounded-full bg-[#1c1a18] px-6 py-3 text-sm text-white">{index === plan.length - 1 ? 'Fechar sessão' : 'Continuar'} <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {stage === 'materials' && (
            <div className="fade-in flex flex-1 flex-col">
              <p className="text-sm text-[#77716a]">Sessão concluída.</p>
              <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">A explicação termina. A memória não.</h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-[#77716a]">O que aconteceu aqui já foi incorporado ao próximo percurso. Você não precisa decidir o que revisar.</p>
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#ded9d2] bg-white p-5"><FileText className="h-5 w-5" /><div className="mt-6 text-lg">Resumo da sessão</div><p className="mt-2 text-sm leading-6 text-[#77716a]">Regras essenciais das questões vistas hoje, sem transformar isso em apostila infinita.</p></div>
                <div className="rounded-2xl border border-[#ded9d2] bg-white p-5"><BookOpenText className="h-5 w-5" /><div className="mt-6 text-lg">Mapa mental</div><p className="mt-2 text-sm leading-6 text-[#77716a]">Conexões entre conceitos, exceções e os padrões de alternativa que apareceram.</p></div>
              </div>
              <div className="mt-auto flex justify-end pt-10"><button onClick={completeSession} className="flex items-center gap-2 rounded-full bg-[#1c1a18] px-6 py-3 text-sm text-white">Voltar para hoje <ArrowRight className="h-4 w-4" /></button></div>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[.04] p-5">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><Sparkles className="h-4 w-4" /></div><div><div className="text-sm">Professora</div><div className="text-xs text-white/45">presente na sessão</div></div></div>
            <div className="mt-6 h-14 rounded-full bg-white/[.06] p-2"><div className="flex h-full items-center justify-center gap-1">{[8,15,24,12,29,18,10,22,14,26,11].map((height, waveIndex)=><span key={waveIndex} className="w-1 rounded-full bg-white/45" style={{height}} />)}</div></div>
            <button onClick={toggleTeacherVoice} disabled={!speechOutputSupported} className={`mt-5 flex w-full items-center justify-between rounded-full border px-4 py-2.5 text-sm transition disabled:opacity-35 ${teacherVoiceEnabled ? 'border-white/30 bg-white/10' : 'border-white/10'}`}>
              <span className="flex items-center gap-2">{teacherVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{teacherVoiceEnabled ? 'Voz ativa' : speechOutputSupported ? 'Ativar voz' : 'Voz indisponível'}</span>
              <span className="text-xs text-white/35">beta local</span>
            </button>
            <p className="mt-4 text-sm leading-6 text-white/55">Nesta versão, a fala usa a voz do próprio navegador. Depois, este mesmo lugar recebe uma professora realtime com voz natural.</p>
          </div>

          <div className="rounded-[24px] border border-white/10 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[.12em] text-white/40">Sessão</div>
                <div className="mt-3 text-2xl">{question.subject}</div>
              </div>
              {activity.minutes ? <div className="text-sm text-white/45">{formatMinutes(activity.minutes)}</div> : null}
            </div>
            <p className="mt-3 text-xs leading-5 text-white/40">Uma coisa de cada vez. O que vier depois já está sendo decidido sem interromper seu estudo.</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white/70" style={{width: `${((index + 1) / plan.length) * 100}%`}} /></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
