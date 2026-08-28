'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  FileText,
  Lightbulb,
  Mic,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  applyAttempt,
  buildNextActivities,
  finishSession,
  inferReasoningSignal,
  loadLearnerState,
  saveLearnerState,
} from '@/features/adaptive/engine';
import type {
  AdaptiveQuestion,
  LearnerState,
  PlannedActivity,
  ReasoningSignal,
} from '@/features/adaptive/types';
import { getRuntimeQuestion, getRuntimeQuestionBank } from '@/features/content/repository';
import { loadStudyPlan, localDateKey, markDayDone } from '@/features/planning/engine';
import { trackLearningEvent } from '@/features/telemetry/engine';
import { useBrowserVoice } from '@/features/voice/use-browser-voice';

type Stage = 'question' | 'why' | 'feedback' | 'explain' | 'materials';
type SessionActivity = PlannedActivity & { minutes?: number };

const signalCopy: Record<ReasoningSignal, string> = {
  solid: 'Isso. E o mais importante: você chegou aqui pelo motivo certo.',
  partial: 'Você já tem uma parte importante da lógica. Falta só separar uma coisa.',
  lucky: 'Você marcou a melhor alternativa, mas o caminho que te trouxe até ela ainda não está firme.',
  confused: 'Tem uma regra verdadeira misturada com outra ideia aqui. Vamos separar as duas.',
  unknown: 'Ainda não apareceu uma regra clara no seu raciocínio. Ótimo: agora sabemos exatamente por onde começar.',
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
    const today = studyPlan?.days.find(
      (day) => day.date === localDateKey() && day.status === 'planned',
    );

    const scheduled: SessionActivity[] = (today?.blocks ?? [])
      .filter((block) => block.questionId && getRuntimeQuestion(block.questionId))
      .map((block) => ({
        questionId: block.questionId as string,
        reason: block.adaptiveReason ?? 'new',
        minutes: block.minutes,
      }));

    const fallbackLimit = Math.max(2, Math.min(5, today?.blocks.length || 5));
    const fallback: SessionActivity[] = buildNextActivities(state, fallbackLimit);
    const nextPlan = scheduled.length ? scheduled : fallback;
    const runtimeBank = getRuntimeQuestionBank();

    setLearner(state);
    setScheduledMinutes(today?.plannedMinutes ?? null);
    setPlan(
      nextPlan.length
        ? nextPlan
        : runtimeBank
            .slice(0, 5)
            .map((question) => ({ questionId: question.id, reason: 'new' as const })),
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
    () => (activity ? getRuntimeQuestion(activity.questionId) : undefined),
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
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#faf9f7] text-sm text-[#8d867e]">
        Preparando sua sessão…
      </main>
    );
  }

  const selectedOption = question.options.find((option) => option.id === selected);
  const correct = selected === question.correctOption;
  const progress = plan.length ? ((index + 1) / plan.length) * 100 : 0;

  return (
    <main className="min-h-dvh bg-[#faf9f7] text-[#191816]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2dc] bg-[#faf9f7]/95 px-5 backdrop-blur-md md:px-8">
        <div className="mx-auto flex h-[70px] max-w-[1160px] items-center justify-between gap-5">
          <button
            onClick={() => router.push('/hoje')}
            className="flex items-center gap-2 text-sm text-[#77736d] transition hover:text-[#191816]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Hoje</span>
          </button>

          <div className="min-w-0 flex-1 px-3 text-center">
            <div className="text-[10px] uppercase tracking-[.14em] text-[#a29b93]">
              {question.subject} · {index + 1} de {plan.length}
            </div>
            <div className="mx-auto mt-2 h-px max-w-[320px] overflow-hidden bg-[#ddd8d1]">
              <div className="h-full bg-[#191816] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={toggleTeacherVoice}
            disabled={!speechOutputSupported}
            className={`flex items-center gap-2 text-sm transition disabled:opacity-30 ${teacherVoiceEnabled ? 'text-[#191816]' : 'text-[#8d867e]'}`}
          >
            {teacherVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{teacherVoiceEnabled ? 'Voz ativa' : 'Ouvir'}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1160px] gap-10 px-5 py-10 md:px-8 md:py-14 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-[110px] lg:h-fit">
          <div className="flex items-center gap-3 lg:block">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#191816] text-white lg:h-14 lg:w-14">
              <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />
              {teacherVoiceEnabled && (
                <span className="absolute -inset-1 rounded-full border border-[#8d867e]/35 animate-pulse" />
              )}
            </div>
            <div className="lg:mt-5">
              <div className="text-sm font-medium">Professora</div>
              <div className="mt-0.5 text-xs text-[#99928a]">
                {teacherVoiceEnabled ? 'falando quando precisar' : 'presente na sessão'}
              </div>
            </div>
          </div>

          <div className="mt-5 hidden lg:block">
            <div className="flex h-8 items-center gap-[3px]">
              {[7, 13, 22, 10, 27, 16, 8, 20, 12, 24, 9].map((height, waveIndex) => (
                <span
                  key={waveIndex}
                  className="w-[2px] rounded-full bg-[#b5aea6]"
                  style={{ height }}
                />
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-[#99928a]">
              Primeiro você tenta. Ela entra quando existe algo útil para perguntar, corrigir ou destravar.
            </p>
            {scheduledMinutes ? (
              <p className="mt-5 border-t border-[#e5e0da] pt-4 text-xs text-[#aaa39a]">
                Sessão de {scheduledMinutes} min
              </p>
            ) : null}
          </div>
        </aside>

        <section className="min-h-[650px] max-w-[820px]">
          {stage === 'question' && (
            <div className="fade-in">
              <p className="text-sm leading-6 text-[#8d867e]">
                {question.openingLine ?? 'Sem explicação primeiro. Quero ver onde sua cabeça vai.'}
              </p>
              <h1 className="serif mt-5 text-[clamp(2.25rem,5vw,4.6rem)] leading-[1.02] tracking-[-.035em]">
                {question.prompt}
              </h1>

              <div className="mt-10 border-t border-[#dcd6cf]">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => choose(option.id)}
                    className="group grid w-full grid-cols-[38px_1fr_20px] items-start gap-4 border-b border-[#e5e0da] py-5 text-left transition md:grid-cols-[48px_1fr_24px] md:py-6"
                  >
                    <span className="pt-0.5 text-sm text-[#9b948c] transition group-hover:text-[#191816]">{option.id}</span>
                    <span className="text-base leading-7 text-[#4f4a44] transition group-hover:text-[#191816] md:text-lg md:leading-8">{option.text}</span>
                    <ArrowRight className="mt-1 h-4 w-4 -translate-x-1 text-[#c2bbb3] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === 'why' && (
            <div className="fade-in flex min-h-[620px] flex-col">
              <p className="text-sm text-[#8d867e]">Você marcou {selected}.</p>
              <h1 className="serif mt-4 text-[clamp(3.6rem,8vw,7rem)] leading-[.9] tracking-[-.055em]">Por quê?</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#77736d]">
                Não precisa escrever bonito. Explique como se estivesse tentando convencer alguém de que sua alternativa faz sentido.
              </p>

              <div className="mt-10 border-b border-[#bfb8b0] pb-4">
                <textarea
                  value={reasoning}
                  onChange={(event) => setReasoning(event.target.value)}
                  placeholder="Eu escolhi essa porque…"
                  className="min-h-[155px] w-full resize-none bg-transparent text-xl leading-8 outline-none placeholder:text-[#bbb4ac] md:text-2xl md:leading-9"
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!speechInputSupported}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition disabled:opacity-35 ${listening ? 'border-[#191816] bg-[#191816] text-white' : 'border-[#d7d1ca] bg-white text-[#625d56]'}`}
                >
                  <Mic className="h-4 w-4" />
                  {listening ? 'Estou ouvindo…' : speechInputSupported ? 'Responder falando' : 'Voz indisponível'}
                </button>
                <button
                  onClick={submitReasoning}
                  disabled={!reasoning.trim()}
                  className="group flex items-center gap-3 rounded-full bg-[#191816] px-6 py-3.5 text-sm font-medium text-white transition disabled:opacity-25"
                >
                  Continuar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
              </div>
              {listening && <p className="mt-3 text-xs text-[#99928a]">Pode falar normalmente. A transcrição aparece acima.</p>}
            </div>
          )}

          {stage === 'feedback' && (
            <div className="fade-in flex min-h-[620px] flex-col justify-center">
              <div className="flex items-center gap-3 text-sm text-[#8d867e]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#191816] text-white"><Sparkles className="h-3.5 w-3.5" /></span>
                Professora
              </div>

              <h1 className="serif mt-8 max-w-4xl text-[clamp(2.8rem,6vw,5.5rem)] leading-[.98] tracking-[-.045em]">
                {signalCopy[signal]}
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#625d56]">
                {hintsUsed === 0 ? question.nudge : question.secondNudge}
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {hintsUsed < 2 && (
                  <button
                    onClick={() => setHintsUsed((value) => value + 1)}
                    className="flex items-center gap-2 rounded-full border border-[#d7d1ca] bg-white px-5 py-3 text-sm text-[#625d56]"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {hintsUsed === 0 ? 'Me dá uma pista' : 'Mais uma pista'}
                  </button>
                )}
                <button
                  onClick={commitAttemptAndExplain}
                  className="flex items-center gap-3 rounded-full bg-[#191816] px-5 py-3 text-sm text-white"
                >
                  Entender a lógica <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 'explain' && (
            <div className="fade-in pb-10">
              <p className="text-sm text-[#8d867e]">Agora sim: a regra.</p>
              <h1 className="serif mt-4 max-w-3xl text-[clamp(2.8rem,6vw,5.1rem)] leading-[.98] tracking-[-.045em]">
                {correct ? 'Você marcou a melhor alternativa.' : `A melhor alternativa era ${question.correctOption}.`}
              </h1>

              {selectedOption && !correct && (
                <p className="mt-7 max-w-2xl text-base leading-7 text-[#77736d]">
                  Você marcou {selectedOption.id}. {selectedOption.explanation}
                </p>
              )}

              <div className="mt-10 border-y border-[#dcd6cf]">
                <div className="grid gap-3 py-6 md:grid-cols-[125px_1fr]">
                  <div className="text-xs uppercase tracking-[.12em] text-[#99928a]">Guarde isso</div>
                  <p className="text-base leading-7 text-[#4f4a44]">{question.takeaway}</p>
                </div>

                {question.options.map((option) => (
                  <div key={option.id} className="grid gap-3 border-t border-[#e8e3dd] py-5 md:grid-cols-[125px_1fr]">
                    <div className="text-sm text-[#8d867e]">Alternativa {option.id}</div>
                    <p className="text-sm leading-6 text-[#625d56]">{option.explanation}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-8 border-b border-[#dcd6cf] pb-10 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[.12em] text-[#9b7e69]">Como a FGV tentou te pegar</div>
                  <p className="mt-4 text-base leading-7 text-[#5b5149]">{question.fgvPattern}</p>
                </div>
                {question.vade ? (
                  <div>
                    <div className="text-xs uppercase tracking-[.12em] text-[#8d867e]">No Vade Mecum · {question.vade.article}</div>
                    <p className="mt-4 text-base leading-7 text-[#625d56]">{question.vade.instruction}</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs uppercase tracking-[.12em] text-[#8d867e]">Sem marcação agora</div>
                    <p className="mt-4 text-sm leading-6 text-[#99928a]">Nem toda questão precisa virar marca-texto. O Vade só entra quando realmente ajuda.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={nextQuestion}
                  className="group flex items-center gap-3 rounded-full bg-[#191816] px-6 py-3.5 text-sm text-white"
                >
                  {index === plan.length - 1 ? 'Fechar a sessão' : 'Próxima'}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}

          {stage === 'materials' && (
            <div className="fade-in flex min-h-[650px] flex-col justify-center pb-10">
              <p className="text-sm text-[#8d867e]">Por hoje, é isso.</p>
              <h1 className="serif mt-5 max-w-4xl text-[clamp(3.7rem,8vw,7.3rem)] leading-[.88] tracking-[-.055em]">
                A explicação termina.<br /><span className="text-[#8d867e]">A memória não.</span>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-7 text-[#77736d]">
                O que aconteceu nesta sessão já entrou no próximo percurso. Você não precisa decidir o que revisar amanhã.
              </p>

              <div className="mt-12 border-y border-[#dcd6cf]">
                <button onClick={() => router.push('/materiais')} className="group grid w-full grid-cols-[42px_1fr_auto] items-center gap-4 py-5 text-left">
                  <FileText className="h-5 w-5 text-[#8d867e]" />
                  <div><div className="text-lg">Resumo essencial</div><div className="mt-1 text-xs text-[#99928a]">Só o que vale levar desta sessão.</div></div>
                  <ArrowRight className="h-4 w-4 text-[#aaa39a] transition group-hover:translate-x-1" />
                </button>
                <button onClick={() => router.push('/materiais')} className="group grid w-full grid-cols-[42px_1fr_auto] items-center gap-4 border-t border-[#e8e3dd] py-5 text-left">
                  <BookOpenText className="h-5 w-5 text-[#8d867e]" />
                  <div><div className="text-lg">Mapa + Vade Mecum</div><div className="mt-1 text-xs text-[#99928a]">Conexões, exceções e marcações desbloqueadas hoje.</div></div>
                  <ArrowRight className="h-4 w-4 text-[#aaa39a] transition group-hover:translate-x-1" />
                </button>
              </div>

              <button
                onClick={completeSession}
                className="group mt-10 flex w-fit items-center gap-3 rounded-full bg-[#191816] px-6 py-3.5 text-sm text-white"
              >
                Voltar para hoje <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
