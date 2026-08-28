'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, LockKeyhole, Sparkles } from 'lucide-react';
import { loadLearnerState, saveLearnerState } from '@/features/adaptive/engine';
import { applyCalibrationEvidence, buildCalibrationQuestions, getCalibrationReadiness } from '@/features/calibration/engine';
import type { LearnerState } from '@/features/adaptive/types';

type CalibrationResult = {
  createdAt: string;
  correct: number;
  total: number;
  durationMs: number;
  bySubject: Record<string, { correct: number; total: number }>;
};

const RESULTS_KEY = 'direitofacil.calibration-results.v1';

function saveResult(result: CalibrationResult) {
  try {
    const current = JSON.parse(localStorage.getItem(RESULTS_KEY) ?? '[]') as CalibrationResult[];
    localStorage.setItem(RESULTS_KEY, JSON.stringify([...current, result].slice(-12)));
  } catch {
    localStorage.setItem(RESULTS_KEY, JSON.stringify([result]));
  }
}

export default function CalibrationPage() {
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CalibrationResult | null>(null);

  useEffect(() => {
    setLearner(loadLearnerState());
  }, []);

  const readiness = useMemo(() => (learner ? getCalibrationReadiness(learner) : null), [learner]);
  const questions = useMemo(
    () => (learner && readiness ? buildCalibrationQuestions(learner, readiness.size) : []),
    [learner, readiness],
  );
  const question = questions[index];

  function begin() {
    startedAt.current = Date.now();
    setStarted(true);
  }

  function choose(option: string) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: option }));
  }

  function next() {
    if (!question || !answers[question.id]) return;
    if (index < questions.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    const bySubject: CalibrationResult['bySubject'] = {};
    let correct = 0;
    const evidence = questions.map((item) => {
      const hit = answers[item.id] === item.correctOption;
      if (hit) correct += 1;
      const row = bySubject[item.subject] ?? { correct: 0, total: 0 };
      row.total += 1;
      if (hit) row.correct += 1;
      bySubject[item.subject] = row;
      return { questionId: item.id, correct: hit };
    });

    const finalResult: CalibrationResult = {
      createdAt: new Date().toISOString(),
      correct,
      total: questions.length,
      durationMs: Date.now() - startedAt.current,
      bySubject,
    };

    if (learner) {
      const recalibratedLearner = applyCalibrationEvidence(learner, evidence);
      saveLearnerState(recalibratedLearner);
      setLearner(recalibratedLearner);
    }

    saveResult(finalResult);
    setResult(finalResult);
    setFinished(true);
  }

  if (!learner || !readiness) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#f8f6f2] text-sm text-[#8a847e]">Preparando…</main>;
  }

  if (!readiness.ready) {
    return (
      <main className="min-h-dvh bg-[#f8f6f2] px-5 py-8 text-[#1c1a18]">
        <div className="mx-auto flex min-h-[80dvh] max-w-3xl flex-col justify-center">
          <button onClick={() => router.push('/hoje')} className="mb-12 flex w-fit items-center gap-2 text-sm text-[#77716a]"><ArrowLeft className="h-4 w-4" /> Voltar</button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eee2d7]"><LockKeyhole className="h-5 w-5" /></div>
          <h1 className="serif mt-7 text-5xl leading-tight md:text-7xl">Ainda não é hora.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#77716a]">Você não precisa decidir quando fazer um simulado. Ele aparece sozinho quando já houver informação suficiente para que o resultado mude alguma coisa no seu percurso.</p>
          <button onClick={() => router.push('/hoje')} className="mt-9 flex w-fit items-center gap-2 rounded-full bg-[#1c1a18] px-6 py-3 text-sm text-white">Continuar meu caminho <ArrowRight className="h-4 w-4" /></button>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="min-h-dvh bg-[#171614] px-5 py-8 text-[#f8f6f2]">
        <div className="mx-auto flex min-h-[82dvh] max-w-4xl flex-col justify-center">
          <Sparkles className="h-6 w-6 text-white/55" />
          <p className="mt-7 text-sm text-white/45">Uma pausa no percurso.</p>
          <h1 className="serif mt-3 max-w-3xl text-5xl leading-tight md:text-7xl">Você está pronta para uma calibração.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/55">Durante a calibração não há professora, pista ou justificativa. Entram apenas conceitos que já passaram pelo seu caminho; a ideia é ver como eles se sustentam sem ajuda.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
            <span className="rounded-full border border-white/10 px-4 py-2">{questions.length} questões</span>
            <span className="rounded-full border border-white/10 px-4 py-2">sem feedback durante</span>
            <span className="rounded-full border border-white/10 px-4 py-2">resultado recalibra o caminho</span>
          </div>
          <button onClick={begin} disabled={!questions.length} className="mt-10 flex w-fit items-center gap-2 rounded-full bg-[#f8f6f2] px-6 py-3 text-sm text-[#171614] disabled:opacity-30">Começar calibração <ArrowRight className="h-4 w-4" /></button>
        </div>
      </main>
    );
  }

  if (finished && result) {
    const subjects = Object.entries(result.bySubject);
    return (
      <main className="min-h-dvh bg-[#f8f6f2] px-5 py-8 text-[#1c1a18]">
        <div className="mx-auto max-w-5xl py-10 md:py-16">
          <CheckCircle2 className="h-6 w-6" />
          <p className="mt-7 text-sm text-[#77716a]">Calibração concluída.</p>
          <h1 className="serif mt-3 max-w-3xl text-5xl leading-tight md:text-7xl">Agora sabemos um pouco mais sobre o que precisa voltar.</h1>
          <div className="mt-10 grid gap-4 md:grid-cols-[.75fr_1.25fr]">
            <div className="rounded-[26px] bg-[#171614] p-6 text-[#f8f6f2]">
              <div className="text-sm text-white/45">Resultado desta calibração</div>
              <div className="serif mt-5 text-6xl">{result.correct}/{result.total}</div>
              <div className="mt-5 flex items-center gap-2 text-sm text-white/45"><Clock3 className="h-4 w-4" /> {Math.max(1, Math.round(result.durationMs / 60_000))} min</div>
            </div>
            <div className="rounded-[26px] border border-[#ded9d2] bg-white p-6">
              <div className="text-sm text-[#77716a]">O que apareceu na prova</div>
              <div className="mt-6 space-y-4">
                {subjects.map(([subject, values]) => (
                  <div key={subject} className="flex items-center justify-between border-b border-[#eeeae4] pb-4 last:border-0 last:pb-0"><span>{subject}</span><span className="text-sm text-[#77716a]">{values.correct} de {values.total}</span></div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-6 text-[#77716a]">Esses dados já foram incorporados ao histórico silencioso de aprendizagem. Você não precisa decidir o que revisar agora; o próximo percurso faz isso.</p>
          <button onClick={() => router.push('/hoje')} className="mt-8 flex items-center gap-2 rounded-full bg-[#1c1a18] px-6 py-3 text-sm text-white">Voltar para hoje <ArrowRight className="h-4 w-4" /></button>
        </div>
      </main>
    );
  }

  if (!question) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#171614] text-sm text-white/45">Preparando a próxima questão…</main>;
  }

  return (
    <main className="min-h-dvh bg-[#171614] px-5 py-6 text-[#f8f6f2]">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <span className="serif text-lg">direito fácil</span>
          <span className="text-xs text-white/40">Calibração · {index + 1} de {questions.length}</span>
        </header>

        <section className="py-10 md:py-16">
          <p className="text-xs uppercase tracking-[.12em] text-white/35">{question.subject}</p>
          <h1 className="serif mt-5 text-3xl leading-tight md:text-5xl">{question.prompt}</h1>
          <div className="mt-10 grid gap-3">
            {question.options.map((option) => (
              <button key={option.id} onClick={() => choose(option.id)} className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition ${answers[question.id] === option.id ? 'border-white/70 bg-white/10' : 'border-white/10 bg-white/[.03]'}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-sm">{option.id}</span>
                <span className="pt-1 text-sm leading-6 text-white/75">{option.text}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-end"><button disabled={!answers[question.id]} onClick={next} className="flex items-center gap-2 rounded-full bg-[#f8f6f2] px-6 py-3 text-sm text-[#171614] disabled:opacity-30">{index === questions.length - 1 ? 'Finalizar' : 'Próxima'} <ArrowRight className="h-4 w-4" /></button></div>
        </section>
      </div>
    </main>
  );
}
