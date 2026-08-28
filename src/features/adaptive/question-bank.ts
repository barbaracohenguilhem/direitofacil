import type { AdaptiveQuestion } from './types';

export const QUESTION_BANK: AdaptiveQuestion[] = [
  {
    id: 'etica-resp-1',
    subject: 'Ética',
    conceptId: 'responsabilidade-profissional',
    conceptLabel: 'Responsabilidade profissional',
    openingLine: 'Vamos começar sem explicação. Quero ver como você raciocina.',
    prompt:
      'Uma advogada pratica determinado ato profissional e causa prejuízo ao cliente. Considerando a lógica jurídica aplicável à responsabilização, qual alternativa apresenta a melhor análise?',
    options: [
      { id: 'A', text: 'A responsabilidade é sempre objetiva, independentemente da conduta.', explanation: 'Transforma uma análise contextual em regra absoluta.' },
      { id: 'B', text: 'A responsabilização depende da análise dos pressupostos aplicáveis ao caso concreto.', explanation: 'É a alternativa correta porque preserva a análise dos pressupostos jurídicos do caso.' },
      { id: 'C', text: 'A existência de dano torna irrelevante qualquer análise de nexo causal.', explanation: 'Apaga justamente um dos elementos centrais da responsabilização.' },
      { id: 'D', text: 'A obrigação surge automaticamente sempre que houver prejuízo econômico.', explanation: 'Confunde dano econômico com dever automático de indenizar.' },
    ],
    correctOption: 'B',
    reasoningKeywords: ['nexo', 'conduta', 'pressuposto', 'causal'],
    misconceptionKeywords: ['sempre', 'automático', 'só dano', 'basta dano'],
    nudge: 'Além do prejuízo, o que precisa ligar juridicamente a conduta ao resultado?',
    secondNudge: 'Procure a alternativa que evita transformar o dano, sozinho, em responsabilidade automática.',
    takeaway: 'Dano, por si só, não encerra a análise de responsabilidade. É preciso verificar os pressupostos jurídicos aplicáveis ao caso concreto.',
    fgvPattern: 'A banca adora transformar uma ideia parcialmente verdadeira em regra absoluta com palavras como “sempre”, “automaticamente” e “independentemente”.',
    vade: { article: 'Dispositivo aplicável à responsabilidade profissional', instruction: 'Grife apenas a expressão que vincula a responsabilização à conduta e ao nexo. Evite marcar o artigo inteiro.' },
  },
  {
    id: 'proc-prazo-1',
    subject: 'Processo Civil',
    conceptId: 'prazo-contestacao',
    conceptLabel: 'Contagem do prazo de contestação',
    prompt:
      'Em uma ação com citação regular, a parte ré precisa identificar corretamente o marco de início do prazo de contestação. Qual alternativa melhor expressa a lógica do CPC?',
    options: [
      { id: 'A', text: 'O prazo começa invariavelmente na data em que a petição inicial foi distribuída.', explanation: 'Distribuição não é marco universal do prazo de contestação.' },
      { id: 'B', text: 'O marco depende da forma de citação e da hipótese processual prevista em lei.', explanation: 'Correta: o CPC diferencia o termo inicial conforme a situação.' },
      { id: 'C', text: 'O prazo sempre começa da juntada do mandado, qualquer que seja a forma de citação.', explanation: 'Usa um marco verdadeiro em algumas hipóteses como se fosse universal.' },
      { id: 'D', text: 'O prazo só começa após despacho específico do juiz.', explanation: 'Não há essa exigência como regra.' },
    ],
    correctOption: 'B',
    reasoningKeywords: ['forma de citação', 'hipótese', 'termo inicial', 'cpc'],
    misconceptionKeywords: ['sempre juntada', 'distribuição', 'despacho'],
    nudge: 'O CPC usa o mesmo marco para todas as formas de citação?',
    secondNudge: 'Desconfie da alternativa que usa “sempre”. Pense em como a forma de citação altera o termo inicial.',
    takeaway: 'Em prazos processuais, a FGV frequentemente cobra o termo inicial específico da hipótese, não apenas a quantidade de dias.',
    fgvPattern: 'Prazo correto + marco inicial errado é uma combinação clássica de distrator.',
    vade: { article: 'CPC, regras de termo inicial e contestação', instruction: 'Marque o trecho que diferencia o início do prazo conforme a forma de citação.' },
  },
  {
    id: 'const-comp-1',
    subject: 'Constitucional',
    conceptId: 'competencia-constitucional',
    conceptLabel: 'Competência constitucional',
    prompt:
      'Uma questão descreve determinada atuação estatal e pede para identificar o ente competente. Qual estratégia jurídica é mais segura?',
    options: [
      { id: 'A', text: 'Escolher sempre a União quando o tema tiver relevância nacional.', explanation: 'Relevância política não substitui a repartição constitucional de competências.' },
      { id: 'B', text: 'Identificar primeiro se a Constituição atribui competência privativa, comum ou concorrente.', explanation: 'Correta: a natureza da competência organiza a análise.' },
      { id: 'C', text: 'Presumir competência municipal quando houver impacto local.', explanation: 'Interesse local importa, mas não resolve toda hipótese.' },
      { id: 'D', text: 'Aplicar a competência do ente que regulamentou o tema mais recentemente.', explanation: 'Cronologia do regulamento não define competência constitucional.' },
    ],
    correctOption: 'B',
    reasoningKeywords: ['privativa', 'comum', 'concorrente', 'competência'],
    misconceptionKeywords: ['relevância nacional', 'sempre união', 'mais recente'],
    nudge: 'Antes de olhar para o tema concreto, qual classificação constitucional organiza a resposta?',
    secondNudge: 'A pergunta quer que você reconheça a espécie de competência antes de escolher o ente.',
    takeaway: 'Em competência, comece pela estrutura constitucional: privativa, comum, concorrente ou interesse local. Depois aplique ao caso.',
    fgvPattern: 'Competência trocada: a alternativa descreve uma atuação plausível, mas atribui ao ente errado.',
  },
  {
    id: 'etica-resp-transfer',
    subject: 'Ética',
    conceptId: 'responsabilidade-profissional',
    conceptLabel: 'Responsabilidade profissional',
    isTransfer: true,
    prompt:
      'Em outro caso, um cliente sofreu perda financeira depois de uma atuação profissional inadequada. Qual raciocínio evita a conclusão apressada?',
    options: [
      { id: 'A', text: 'Se houve prejuízo, existe automaticamente dever de indenizar.', explanation: 'Repete o erro de tratar o dano como suficiente.' },
      { id: 'B', text: 'É necessário examinar a relação entre a conduta e o resultado, além dos demais pressupostos aplicáveis.', explanation: 'Correta e transfere a lógica aprendida para um novo contexto.' },
      { id: 'C', text: 'A natureza profissional elimina a necessidade de investigar causalidade.', explanation: 'A natureza da relação não apaga a análise causal.' },
      { id: 'D', text: 'A culpa é irrelevante em toda e qualquer hipótese profissional.', explanation: 'Generalização indevida.' },
    ],
    correctOption: 'B',
    reasoningKeywords: ['relação', 'conduta', 'resultado', 'pressuposto', 'nexo'],
    misconceptionKeywords: ['automaticamente', 'sempre', 'irrelevante'],
    nudge: 'O que ainda precisa ser demonstrado entre atuação e prejuízo?',
    secondNudge: 'Procure a alternativa que exige uma ligação jurídica, e não apenas a existência de dano.',
    takeaway: 'Transferir a regra para um contexto novo é um sinal muito mais forte de aprendizagem do que repetir a resposta da questão anterior.',
    fgvPattern: 'A banca troca o contexto e mantém a mesma estrutura lógica para testar se você reconhece o conceito, não a frase.',
  },
  {
    id: 'civil-presc-1',
    subject: 'Direito Civil',
    conceptId: 'prescricao-decadencia',
    conceptLabel: 'Prescrição e decadência',
    prompt:
      'Ao analisar um prazo material, qual pergunta ajuda mais a diferenciar prescrição de decadência?',
    options: [
      { id: 'A', text: 'Se o prazo está previsto em qualquer lei federal.', explanation: 'A fonte formal não resolve a distinção.' },
      { id: 'B', text: 'Se o prazo atinge a pretensão ou o próprio direito potestativo.', explanation: 'Correta: essa distinção é estrutural.' },
      { id: 'C', text: 'Se o prazo é superior a dois anos.', explanation: 'Duração não define a natureza.' },
      { id: 'D', text: 'Se a parte já procurou um advogado.', explanation: 'Fato irrelevante para a classificação.' },
    ],
    correctOption: 'B',
    reasoningKeywords: ['pretensão', 'direito potestativo', 'prescrição', 'decadência'],
    misconceptionKeywords: ['dois anos', 'lei federal'],
    nudge: 'A distinção está no tamanho do prazo ou no que ele atinge?',
    secondNudge: 'Pense: pretensão versus direito potestativo.',
    takeaway: 'Prescrição e decadência se distinguem pela posição jurídica atingida, não pela duração do prazo.',
    fgvPattern: 'Institutos vizinhos: a banca usa características verdadeiras de ambos e troca apenas o elemento que os separa.',
  },
];

export function getQuestion(id: string) {
  return QUESTION_BANK.find((question) => question.id === id);
}
