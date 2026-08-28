'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, MessageCircleMore, Send, Sparkles, X } from 'lucide-react';

type Stage = 'ask' | 'diagnose' | 'explain' | 'verify';

type Diagnosis = {
  question: string;
  options: string[];
  explanation: Record<string, string>;
};

function diagnose(topic: string): Diagnosis {
  const normalized = topic.toLowerCase();

  if (normalized.includes('prescri') || normalized.includes('decad')) {
    return {
      question: 'O que exatamente está embaralhando prescrição e decadência para você?',
      options: ['O que cada uma atinge', 'Quando o prazo começa', 'Os efeitos depois que o prazo passa'],
      explanation: {
        'O que cada uma atinge': 'Comece por isso: prescrição atinge a pretensão; decadência atinge o direito potestativo. Antes de decorar prazo, identifique qual posição jurídica está em jogo.',
        'Quando o prazo começa': 'Não tente decorar um único marco. Primeiro classifique o instituto; depois procure a regra específica de início daquele prazo. A FGV costuma misturar instituto certo com termo inicial errado.',
        'Os efeitos depois que o prazo passa': 'Pense no que deixou de poder ser exercido: a exigibilidade de uma pretensão ou o próprio exercício de um direito potestativo. Essa pergunta costuma separar os dois institutos melhor do que decorar números.',
      },
    };
  }

  if (normalized.includes('compet')) {
    return {
      question: 'Quando aparece uma questão de competência, onde você trava primeiro?',
      options: ['Não sei qual ente escolher', 'Confundo privativa, comum e concorrente', 'Entendo a regra, mas erro no caso concreto'],
      explanation: {
        'Não sei qual ente escolher': 'Não comece escolhendo União, Estado ou Município. Primeiro classifique a espécie de competência constitucional. O ente vem depois.',
        'Confundo privativa, comum e concorrente': 'Faça uma pergunta por vez: quem legisla? quem atua materialmente? existe espaço para normas gerais e suplementação? A espécie aparece quando você identifica o tipo de atuação.',
        'Entendo a regra, mas erro no caso concreto': 'Seu problema provavelmente é transferência. Em vez de reler a regra, vale resolver dois casos diferentes e explicar em voz alta por que o ente muda ou permanece o mesmo.',
      },
    };
  }

  if (normalized.includes('prazo') || normalized.includes('contest')) {
    return {
      question: 'A dificuldade está no número de dias ou em saber de onde começa a contar?',
      options: ['Quantidade de dias', 'Termo inicial', 'Cada forma de citação me confunde'],
      explanation: {
        'Quantidade de dias': 'Separe quantidade de prazo de termo inicial. A FGV gosta de combinar um número verdadeiro com um marco de início errado.',
        'Termo inicial': 'Antes de contar, identifique a hipótese processual e a forma de citação. O termo inicial não é universal.',
        'Cada forma de citação me confunde': 'Monte a decisão em duas etapas: qual foi a forma de citação? qual regra do CPC corresponde a ela? Só depois conte. Isso evita tentar lembrar uma frase única para todos os casos.',
      },
    };
  }

  return {
    question: 'Quando você tenta explicar isso com suas próprias palavras, em qual ponto a explicação quebra?',
    options: ['Não sei nem por onde começar', 'Entendo a regra, mas não consigo aplicar', 'Duas ideias parecidas estão se misturando'],
    explanation: {
      'Não sei nem por onde começar': 'Então não vamos começar pela teoria inteira. Procure primeiro a pergunta jurídica central do caso: quem pode fazer o quê, em qual condição e com qual consequência?',
      'Entendo a regra, mas não consigo aplicar': 'Seu problema parece ser aplicação, não memória. O melhor próximo passo é comparar dois casos quase iguais e encontrar o detalhe que muda o resultado.',
      'Duas ideias parecidas estão se misturando': 'Em vez de decorar duas definições, procure o critério que realmente separa os institutos. A FGV costuma explorar exatamente esse ponto de fronteira.',
    },
  };
}

export function SocraticTutor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('ask');
  const [topic, setTopic] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [verification, setVerification] = useState('');

  const diagnosis = useMemo(() => diagnose(topic), [topic]);

  if (!open) return null;

  function reset() {
    setStage('ask');
    setTopic('');
    setChoice(null);
    setVerification('');
  }

  function close() {
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-black/15 p-3 backdrop-blur-[2px] sm:p-5">
      <div className="flex h-[min(720px,calc(100dvh-24px))] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-[#171614] text-[#f8f6f2] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><Sparkles className="h-4 w-4" /></div>
            <div><div className="text-sm">Professora</div><div className="text-xs text-white/45">vamos descobrir onde travou</div></div>
          </div>
          <button onClick={close} className="rounded-full border border-white/10 p-2" aria-label="Fechar tutor"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          {stage === 'ask' && (
            <div className="fade-in my-auto">
              <MessageCircleMore className="h-6 w-6 text-white/60" />
              <h2 className="serif mt-6 text-4xl leading-tight">O que não está fazendo sentido?</h2>
              <p className="mt-4 text-sm leading-6 text-white/55">Pode escrever do jeito que vier. Eu não vou começar respondendo; primeiro quero localizar a dúvida.</p>
              <textarea value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex.: eu sempre confundo prescrição e decadência..." className="mt-7 min-h-[140px] w-full rounded-2xl border border-white/10 bg-white/[.06] p-4 text-sm text-white outline-none placeholder:text-white/25" />
              <button disabled={!topic.trim()} onClick={() => setStage('diagnose')} className="mt-4 flex w-full items-center justify-between rounded-full bg-[#f8f6f2] px-5 py-3 text-sm text-[#171614] disabled:opacity-30">Continuar <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}

          {stage === 'diagnose' && (
            <div className="fade-in my-auto">
              <p className="text-xs uppercase tracking-[.12em] text-white/35">Antes da explicação</p>
              <h2 className="serif mt-4 text-3xl leading-tight">{diagnosis.question}</h2>
              <div className="mt-7 grid gap-3">
                {diagnosis.options.map((option) => (
                  <button key={option} onClick={() => setChoice(option)} className={`rounded-2xl border p-4 text-left text-sm transition ${choice === option ? 'border-white/70 bg-white/10' : 'border-white/10 bg-white/[.03]'}`}>{option}</button>
                ))}
              </div>
              <button disabled={!choice} onClick={() => setStage('explain')} className="mt-5 flex w-full items-center justify-between rounded-full bg-[#f8f6f2] px-5 py-3 text-sm text-[#171614] disabled:opacity-30">É isso <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}

          {stage === 'explain' && choice && (
            <div className="fade-in my-auto">
              <p className="text-sm text-white/45">Então vamos só nesse ponto.</p>
              <h2 className="serif mt-4 text-3xl leading-tight">{diagnosis.explanation[choice]}</h2>
              <p className="mt-6 text-sm leading-6 text-white/55">Agora eu quero saber se isso entrou — não se pareceu claro enquanto você lia.</p>
              <button onClick={() => setStage('verify')} className="mt-7 flex w-full items-center justify-between rounded-full bg-[#f8f6f2] px-5 py-3 text-sm text-[#171614]">Me testa <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}

          {stage === 'verify' && (
            <div className="fade-in my-auto">
              <p className="text-xs uppercase tracking-[.12em] text-white/35">Só para fechar</p>
              <h2 className="serif mt-4 text-3xl leading-tight">Me explica com suas palavras qual é o ponto que você vai observar na próxima questão.</h2>
              <textarea value={verification} onChange={(event) => setVerification(event.target.value)} placeholder="Eu vou olhar primeiro para..." className="mt-7 min-h-[130px] w-full rounded-2xl border border-white/10 bg-white/[.06] p-4 text-sm text-white outline-none placeholder:text-white/25" />
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm leading-6 text-white/55">Na versão com IA, essa resposta será analisada e a professora poderá aprofundar ou encerrar. Aqui estamos testando a experiência e o método.</div>
              <button disabled={!verification.trim()} onClick={close} className="mt-5 flex w-full items-center justify-between rounded-full bg-[#f8f6f2] px-5 py-3 text-sm text-[#171614] disabled:opacity-30">Voltar para o estudo <Send className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
