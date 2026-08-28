'use client';

import { useState } from 'react';
import { ArrowRight, Lightbulb, Mic, PenLine, RotateCcw, Sparkles } from 'lucide-react';

const options = [
  { id: 'A', text: 'A responsabilidade é sempre objetiva, independentemente da conduta.' },
  { id: 'B', text: 'A responsabilização depende da análise dos pressupostos aplicáveis ao caso concreto.' },
  { id: 'C', text: 'A existência de dano torna irrelevante qualquer análise de nexo causal.' },
  { id: 'D', text: 'A obrigação surge automaticamente sempre que houver prejuízo econômico.' },
];

type Stage = 'question' | 'why' | 'feedback' | 'explain';

export default function SessionPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('question');
  const [reasoning, setReasoning] = useState('');
  const [hint, setHint] = useState(false);

  function choose(id: string) {
    setSelected(id);
    setStage('why');
  }

  function submitReasoning() {
    setStage('feedback');
  }

  function reset() {
    setSelected(null);
    setReasoning('');
    setHint(false);
    setStage('question');
  }

  return (
    <main className="min-h-dvh bg-[#171614] text-[#f8f6f2]">
      <header className="border-b border-white/10 px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="serif text-lg">direito fácil</div>
          <div className="text-xs text-white/45">Sessão de hoje · 1 de 5</div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-61px)] max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_320px] lg:py-12">
        <section className="flex min-h-[620px] flex-col rounded-[28px] bg-[#f8f6f2] p-6 text-[#1c1a18] md:p-10">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[.14em] text-[#8a857e]">Ética · questão de abertura</span>
            <div className="flex gap-1">{[0,1,2,3,4].map((i) => <span key={i} className={`h-1.5 w-8 rounded-full ${i === 0 ? 'bg-[#1c1a18]' : 'bg-[#ded9d2]'}`} />)}</div>
          </div>

          {stage === 'question' && (
            <div className="fade-in">
              <p className="mb-5 text-sm text-[#77716a]">A professora ainda não explicou nada. Tente primeiro.</p>
              <h1 className="serif max-w-4xl text-3xl leading-tight md:text-4xl">Uma advogada pratica determinado ato profissional e causa prejuízo ao cliente. Considerando a lógica jurídica aplicável à responsabilização, qual alternativa apresenta a melhor análise?</h1>
              <div className="mt-9 grid gap-3">
                {options.map((option) => (
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
              <textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Eu escolhi essa porque..." className="mt-8 min-h-[170px] w-full rounded-2xl border border-[#ded9d2] bg-white p-5 text-base outline-none transition focus:border-[#8f8880]" />
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-full border border-[#ded9d2] bg-white px-4 py-2.5 text-sm"><Mic className="h-4 w-4" /> Responder falando</button>
                <button className="flex items-center gap-2 rounded-full border border-[#ded9d2] bg-white px-4 py-2.5 text-sm"><PenLine className="h-4 w-4" /> Escrever</button>
              </div>
              <div className="mt-auto flex justify-end pt-8">
                <button onClick={submitReasoning} disabled={!reasoning.trim()} className="flex items-center gap-2 rounded-full bg-[#1c1a18] px-6 py-3 text-sm text-white disabled:opacity-30">Continuar <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {stage === 'feedback' && (
            <div className="fade-in flex flex-1 flex-col justify-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#eee2d7]"><Sparkles className="h-5 w-5" /></div>
              <p className="text-sm text-[#77716a]">Professora</p>
              <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">Você chegou perto do ponto certo, mas ainda está tratando o dano como se ele resolvesse o caso sozinho.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#625c56]">Antes de decidir, eu quero que você volte para uma pergunta mais básica: além do prejuízo, o que precisa ligar juridicamente a conduta ao resultado?</p>
              {hint && <div className="mt-6 max-w-2xl rounded-2xl bg-[#eeeae4] p-5 text-sm leading-6 text-[#5d5751]"><strong>Pista:</strong> pense no elemento que conecta a conduta ao dano. A existência de ambos, isoladamente, ainda não fecha a análise.</div>}
              <div className="mt-8 flex flex-wrap gap-3">
                {!hint && <button onClick={() => setHint(true)} className="flex items-center gap-2 rounded-full border border-[#d7d1ca] bg-white px-5 py-3 text-sm"><Lightbulb className="h-4 w-4" /> Quero uma pista</button>}
                <button onClick={() => setStage('explain')} className="rounded-full bg-[#1c1a18] px-5 py-3 text-sm text-white">Ver a lógica completa</button>
              </div>
            </div>
          )}

          {stage === 'explain' && (
            <div className="fade-in">
              <p className="text-sm text-[#77716a]">O que precisa ficar.</p>
              <h1 className="serif mt-3 text-4xl md:text-5xl">A alternativa B é a melhor.</h1>
              <div className="mt-8 space-y-5 text-sm leading-7 text-[#5e5852]">
                <p><strong className="text-[#1c1a18]">Por quê?</strong> Porque responsabilização não nasce apenas da existência de prejuízo. É preciso verificar os pressupostos jurídicos aplicáveis ao caso, inclusive a ligação entre conduta e resultado.</p>
                <p><strong className="text-[#1c1a18]">A:</strong> transforma em regra absoluta algo que depende do regime jurídico aplicável.</p>
                <p><strong className="text-[#1c1a18]">C:</strong> tenta apagar justamente a análise do nexo causal.</p>
                <p><strong className="text-[#1c1a18]">D:</strong> confunde prejuízo econômico com obrigação automática de indenizar.</p>
              </div>
              <div className="mt-8 rounded-2xl bg-[#eee2d7] p-5">
                <div className="text-xs uppercase tracking-[.12em] text-[#7f7064]">Pegadinha da FGV</div>
                <p className="mt-2 text-sm leading-6">Alternativas erradas frequentemente usam uma ideia verdadeira e a transformam em regra absoluta com palavras como “sempre”, “automaticamente” ou “independentemente”.</p>
              </div>
              <div className="mt-5 rounded-2xl border border-[#ded9d2] p-5">
                <div className="text-xs uppercase tracking-[.12em] text-[#837d75]">Vade Mecum</div>
                <p className="mt-2 text-sm">Nesta versão, a instrução de marcação é simulada. No conteúdo real, aparecerá aqui exatamente o dispositivo e o trecho que vale grifar.</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={reset} className="flex items-center gap-2 text-sm text-[#77716a]"><RotateCcw className="h-4 w-4" /> Rever demonstração</button>
                <button className="flex items-center gap-2 rounded-full bg-[#1c1a18] px-6 py-3 text-sm text-white">Próxima questão <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[.04] p-5">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><Sparkles className="h-4 w-4" /></div><div><div className="text-sm">Professora</div><div className="text-xs text-white/45">presente na sessão</div></div></div>
            <div className="mt-6 h-14 rounded-full bg-white/[.06] p-2"><div className="flex h-full items-center justify-center gap-1">{[8,15,24,12,29,18,10,22,14,26,11].map((h,i)=><span key={i} className="w-1 rounded-full bg-white/45" style={{height:h}} />)}</div></div>
            <p className="mt-5 text-sm leading-6 text-white/55">A voz ao vivo entra depois. A interface já nasce preparada para uma professora que pergunta, espera, ouve e adapta a explicação.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 p-5">
            <div className="text-xs uppercase tracking-[.12em] text-white/40">Sessão</div>
            <div className="mt-3 text-2xl">47 min</div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[18%] rounded-full bg-white/70" /></div>
            <p className="mt-4 text-xs leading-5 text-white/40">O conteúdo seguinte não é escolhido por você. Ele muda com o que esta sessão revelar.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
