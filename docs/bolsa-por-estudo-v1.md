# Bolsa por Estudo — modelo econômico v1

Status: proposta de produto para aprovação antes do lançamento.

## Princípio

A Bolsa por Estudo recompensa dedicação real ao plano personalizado. Ela não recompensa inteligência prévia, quantidade absoluta de horas, nota bruta nem percentual de acertos.

Duas pessoas com rotinas diferentes podem obter a mesma bolsa cumprindo, com qualidade, o plano que foi realisticamente construído para cada uma.

## Preço proposto

Mensalidade-base: **R$ 159,90**.

O desempenho de dedicação de um ciclo reduz a mensalidade do ciclo seguinte:

| Índice de dedicação | Próxima mensalidade | Benefício |
| --- | ---: | ---: |
| 0–59 | R$ 159,90 | — |
| 60–74 | R$ 139,90 | R$ 20,00 |
| 75–89 | R$ 119,90 | R$ 40,00 |
| 90–100 | R$ 99,90 | R$ 60,00 |

O desconto não é retroativo, não vira saque e não acumula indefinidamente. O benefício é aplicado somente ao ciclo imediatamente seguinte, desde que a assinatura permaneça ativa.

## Índice de dedicação — 0 a 100

### 1. Compromisso com o plano adaptado — 50 pontos

Mede quanto do plano vigente foi efetivamente concluído.

- usa minutos/blocos planejados após todas as remarcações válidas;
- não compara o aluno com outros alunos;
- não exige um número mínimo universal de horas;
- se o plano previa 3 horas na semana e a pessoa cumpriu as 3 horas, pode ter aderência equivalente a alguém cujo plano previa 12 horas.

### 2. Consistência — 25 pontos

Mede presença ao longo do ciclo, e não sequência perfeita de dias.

- considera semanas em que houve estudo significativo;
- dias impossíveis informados ao sistema não geram punição;
- quando o aluno usa “Aconteceu vida?” e o plano redistribui a carga, a referência passa a ser o plano novo;
- recuperar uma sessão redistribuída preserva a consistência.

### 3. Aprendizagem ativa — 25 pontos

Mede se o estudo foi realmente realizado, sem usar o percentual de acertos.

São sinais válidos, por exemplo:

- responder questões com interação completa;
- registrar justificativa quando solicitado;
- realizar revisões que o motor trouxe de volta;
- completar calibrações quando liberadas;
- permanecer ativo na atividade em vez de apenas deixar uma tela aberta.

Acertar ou errar não adiciona nem remove pontos da Bolsa.

## O que NÃO entra na Bolsa

- percentual de acertos;
- mastery/força do conceito;
- nota projetada na OAB;
- quantidade absoluta de horas em comparação com outros alunos;
- velocidade de aprendizagem;
- ranking;
- participação social obrigatória;
- pagar por mais tempo antecipadamente.

## Proteções contra gaming

Atividade só conta quando produz evidência pedagógica válida.

Não contam como estudo válido:

- deixar página aberta sem interação;
- clicar rapidamente em alternativas de forma incompatível com leitura;
- repetir a mesma ação apenas para gerar eventos;
- sessões simultâneas incompatíveis;
- automações/bots;
- manipulação evidente do relógio/dispositivo.

Detecção de anomalia não reduz a bolsa automaticamente. Ela retira eventos suspeitos do cálculo ou envia o ciclo para revisão, evitando punições silenciosas.

## Regra de justiça para mudanças de rotina

A Bolsa é calculada sobre o plano que estava vigente depois das adaptações legítimas.

Se a vida mudou, a pessoa pode atualizar disponibilidade. O sistema recalcula o plano e a Bolsa passa a considerar o novo compromisso realista. Isso evita transformar o benefício em punição por trabalho, faculdade, doença ou outros imprevistos.

Mudanças excessivas ou retroativas podem entrar em revisão antifraude, mas não existe “streak” ou punição visual.

## Período de cálculo

- primeiro ciclo: começa na ativação da assinatura;
- ciclos seguintes: janela correspondente ao período de cobrança;
- para ciclos muito curtos, exigir ao menos 14 dias e evidência mínima antes de conceder bolsa;
- se não houver evidência suficiente, mantém-se o preço vigente sem classificar negativamente o aluno.

## UX

O aluno pode ver:

- mensalidade atual;
- quanto pode custar a próxima;
- faixa atual de dedicação;
- quais comportamentos gerais contam: cumprir o plano, voltar com consistência e estudar ativamente.

O aluno não deve ver uma fórmula granular que incentive otimização artificial de cliques/minutos.

Copy sugerida:

> Sua dedicação pode reduzir a próxima mensalidade.
>
> Não importa começar sabendo mais. Importa aparecer para o plano que foi construído para você.

## Contabilidade e auditoria

O benefício deve ser registrado como crédito/desconto em ledger separado dos eventos de aprendizagem. Nunca alterar silenciosamente o preço a partir de uma fórmula sem registrar:

- ciclo de origem;
- índice de dedicação;
- faixa concedida;
- valor da mensalidade cheia;
- valor do benefício;
- valor final cobrado;
- data de concessão;
- eventual revisão/estorno com motivo.

## Antes do lançamento

Validar:

1. preço-base e pisos com custo real de IA/voz, meios de pagamento, impostos e suporte;
2. regras consumeristas e texto promocional da Bolsa;
3. comportamento em cancelamento, inadimplência, reativação e troca de data-meta/prova;
4. métricas em beta para verificar se as faixas 60/75/90 distribuem a bolsa de forma sustentável e justa.
