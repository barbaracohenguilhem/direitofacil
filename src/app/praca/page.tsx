'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageCircleQuestion, Send, Sparkles, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ChatMessage = { id: string; author: string; text: string; context: string };
type Doubt = { id: string; author: string; question: string; subject: string; answer?: string; answeredBy?: string };

const initialMessages: ChatMessage[] = [
  { id: 'm1', author: 'Marina', text: 'Acabei uma sessão de Processo Civil. A questão parecia impossível até eu perceber a palavra “sempre”.', context: 'Processo Civil' },
  { id: 'm2', author: 'Leo', text: 'Hoje meu plano misturou Constitucional com Ética e passou muito mais rápido.', context: 'Sessão concluída' },
];

const initialDoubts: Doubt[] = [
  {
    id: 'd1',
    author: 'Clara',
    subject: 'Direito Civil',
    question: 'Eu entendi a definição, mas ainda confundo o que exatamente é atingido na prescrição e na decadência. Alguém consegue explicar sem decorar prazo?',
    answer: 'Pensa primeiro na posição jurídica: prescrição atinge a pretensão; decadência, o direito potestativo. Depois você olha o prazo específico. Se começar pelo número, fica muito mais fácil misturar.',
    answeredBy: 'Rafael',
  },
];

export default function PracaPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'juntos' | 'duvidas'>('juntos');
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [doubts, setDoubts] = useState(initialDoubts);
  const [questionDraft, setQuestionDraft] = useState('');

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages((current) => [...current, { id: `m-${Date.now()}`, author: 'Você', text: draft.trim(), context: 'Agora' }]);
    setDraft('');
  }

  function sendDoubt() {
    if (!questionDraft.trim()) return;
    setDoubts((current) => [
      { id: `d-${Date.now()}`, author: 'Você', subject: 'Sua sessão atual', question: questionDraft.trim() },
      ...current,
    ]);
    setQuestionDraft('');
  }

  return (
    <main className="min-h-dvh bg-[#f8f6f2] text-[#1c1a18]">
      <header className="border-b border-[#ded9d2] bg-[#f8f6f2]/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={() => router.push('/hoje')} className="flex items-center gap-2 text-sm text-[#746e67]"><ArrowLeft className="h-4 w-4" /> Hoje</button>
          <div className="serif text-lg">A Praça</div>
          <div className="w-[54px]" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm text-[#77716a]">Uma comunidade, não uma competição.</p>
            <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight md:text-6xl">Estudar sozinho não precisa parecer sozinho.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#77716a]">Aqui não existe ranking, pódio ou corrida por XP. A ideia é simples: presença, conversa e ajuda entre quem está atravessando a mesma prova.</p>
          </div>

          <aside className="rounded-[24px] border border-[#ded9d2] bg-white p-5">
            <UsersRound className="h-5 w-5" />
            <div className="mt-5 text-sm text-[#77716a]">Presença agora</div>
            <div className="mt-1 text-xl">Conexão em tempo real</div>
            <p className="mt-3 text-xs leading-5 text-[#8a847e]">Neste protótipo local não mostramos uma contagem fictícia. Quando o backend entrar, aparecerão pessoas online e áreas de estudo reais.</p>
          </aside>
        </section>

        <div className="mt-12 flex gap-2 border-b border-[#ded9d2]">
          <button onClick={() => setTab('juntos')} className={`border-b-2 px-1 pb-3 text-sm ${tab === 'juntos' ? 'border-[#1c1a18] text-[#1c1a18]' : 'border-transparent text-[#8a847e]'}`}>Estudando juntos</button>
          <button onClick={() => setTab('duvidas')} className={`border-b-2 px-1 pb-3 text-sm ${tab === 'duvidas' ? 'border-[#1c1a18] text-[#1c1a18]' : 'border-transparent text-[#8a847e]'}`}>Dúvidas</button>
        </div>

        {tab === 'juntos' && (
          <section className="fade-in mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-[26px] border border-[#ded9d2] bg-white p-5 md:p-7">
              <div className="space-y-7">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee2d7] text-xs font-medium">{message.author.slice(0, 1)}</div>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2"><span className="text-sm font-medium">{message.author}</span><span className="text-xs text-[#9a948d]">{message.context}</span></div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#625c56]">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-2 border-t border-[#ded9d2] pt-5">
                <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Compartilhar alguma coisa..." className="min-w-0 flex-1 rounded-full border border-[#ded9d2] bg-[#faf9f7] px-4 py-3 text-sm outline-none" />
                <button onClick={sendMessage} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1c1a18] text-white" aria-label="Enviar"><Send className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="rounded-[24px] bg-[#171614] p-5 text-[#f8f6f2]">
              <Sparkles className="h-5 w-5" />
              <h2 className="serif mt-6 text-2xl">Sem performance.</h2>
              <p className="mt-4 text-sm leading-6 text-white/55">Medalhas futuras reconhecem trajetória individual — consistência, explicação, ajuda — mas nunca criam uma classificação entre alunos.</p>
            </div>
          </section>
        )}

        {tab === 'duvidas' && (
          <section className="fade-in mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {doubts.map((doubt) => (
                <article key={doubt.id} className="rounded-[26px] border border-[#ded9d2] bg-white p-5 md:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div><span className="text-sm font-medium">{doubt.author}</span><span className="ml-2 text-xs text-[#9a948d]">{doubt.subject}</span></div>
                    <MessageCircleQuestion className="h-4 w-4 text-[#8a847e]" />
                  </div>
                  <p className="mt-5 text-base leading-7">{doubt.question}</p>
                  {doubt.answer ? (
                    <div className="mt-6 rounded-2xl bg-[#f1ede8] p-5">
                      <div className="flex items-center gap-2 text-xs text-[#6f685f]"><CheckCircle2 className="h-4 w-4" /> Resposta validada · {doubt.answeredBy}</div>
                      <p className="mt-3 text-sm leading-6 text-[#5f5952]">{doubt.answer}</p>
                    </div>
                  ) : (
                    <div className="mt-6 text-sm text-[#8a847e]">Aguardando alguém ajudar. Quando houver backend, respostas poderão ser validadas antes de gerar qualquer bônus.</div>
                  )}
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-[24px] border border-[#ded9d2] bg-white p-5">
              <div className="text-sm font-medium">Perguntar para a Praça</div>
              <p className="mt-2 text-xs leading-5 text-[#8a847e]">A dúvida deve ser sobre entendimento, não sobre “qual é a resposta?”.</p>
              <textarea value={questionDraft} onChange={(event) => setQuestionDraft(event.target.value)} placeholder="O que exatamente está te confundindo?" className="mt-5 min-h-[130px] w-full resize-none rounded-2xl border border-[#ded9d2] bg-[#faf9f7] p-4 text-sm outline-none" />
              <button onClick={sendDoubt} className="mt-3 flex w-full items-center justify-between rounded-full bg-[#1c1a18] px-5 py-3 text-sm text-white">Publicar dúvida <ArrowLeft className="h-4 w-4 rotate-180" /></button>
              <p className="mt-5 text-xs leading-5 text-[#9a948d]">Bônus por ajuda será desenhado depois. Não haverá leaderboard.</p>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
