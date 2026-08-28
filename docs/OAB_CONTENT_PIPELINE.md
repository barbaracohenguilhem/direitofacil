# Pipeline de conteúdo do OAB Engine

## Fontes escolhidas

### Currículo oficial
`8faff37d-ad77-4c51-9244-6d20d0529f61_Outline_Completo__Curso_OAB_1_Fase.pdf`

Função no produto: **o que precisa ser aprendido**.

O outline foi convertido em 115 unidades curriculares distribuídas pelas 20 disciplinas da 1ª fase. Cada tema numerado (`x.y`) é uma unidade interna do motor. O aluno não vê essa árvore.

### Especificação pedagógica complementar
`Outline_completo_do_curso_de_preparação_para_a_1ª_fase_do_Exame_da_OAB (1).pdf`

Função no produto: **como ensinar, revisar e avaliar**.

Usamos especialmente as ideias de diagnóstico por tipo de erro, resolução ativa, revisão espaçada, alternância entre matérias, acompanhamento jurisprudencial e análise detalhada das alternativas.

### Banco histórico oficial
`banco_questoes_oab.csv` / `.json` / `.sqlite`

Snapshot recebido: **720 questões**, 80 de cada exame XXXII–XL, usando Prova/Tipo 1 para evitar duplicação das quatro versões de cada caderno.

Campos brutos preservados:
- exame e código;
- número da questão;
- tipo de prova;
- categoria original;
- enunciado;
- alternativas A–D;
- gabarito;
- arquivo e URL da fonte oficial.

## Regra de integridade

O texto oficial da questão e o gabarito são **fonte imutável**. Enriquecimento pedagógico fica em campos separados.

Nunca alterar silenciosamente:
- enunciado;
- alternativas;
- resposta oficial;
- identificação da prova;
- URL da fonte.

## Normalização da grade

O banco recebido usa a classificação antiga de 17 categorias. A partir dos exames XXXVIII–XL, a aplicação normaliza a posição da questão para a grade atual de 20 disciplinas, incluindo:
- Direito Eleitoral;
- Direito Financeiro;
- Direito Previdenciário.

Essa normalização muda apenas o **rótulo editorial da matéria**. Não altera a questão.

## Estados de uma questão

### 1. Fonte oficial importada
Já pode servir como ativo de prova, mas ainda não como aula adaptativa.

Tem:
- enunciado;
- A/B/C/D;
- gabarito;
- matéria;
- fonte.

Status: `review`.

### 2. Classificada
A questão é ligada a um dos 115 conceitos/temas do outline.

Passa a ter:
- `concept_id`;
- `concept_label`;
- matéria normalizada.

Essa etapa permite usar a questão em análises históricas por conceito e, depois, em calibrações alinhadas ao conteúdo já estudado.

### 3. Enriquecida
Para virar uma aula Question First, ainda precisa de:
- explicação da alternativa A;
- explicação da B;
- explicação da C;
- explicação da D;
- palavras-chave de raciocínio;
- padrões de confusão;
- primeira pista;
- segunda pista;
- síntese do que precisa ficar;
- padrão/pegadinha da FGV;
- referência de legislação/Vade Mecum quando aplicável;
- revisão jurídica/editorial.

### 4. Publicada
Somente questões que passam pelo quality gate entram no runtime adaptativo da aula.

Importar uma questão nunca equivale a publicar.

## Fluxo administrativo

1. `/admin/banco-oficial` — importar o snapshot oficial.
2. `/admin/classificacao` — ligar cada questão ao currículo.
3. `/admin/questoes` — enriquecer/revisar e publicar.
4. `/admin/curriculo` — auditar a árvore pedagógica invisível.
5. `/admin/insights` — observar o efeito das questões sobre o modelo de aprendizagem.
6. `/admin/estrategia` — auditar priorização e oportunidade de ponto.

## Separação entre prova e aula

Uma questão oficial crua é suficiente para alguns contextos de avaliação, desde que sua classificação esteja correta.

Uma questão usada como **aula** precisa de enriquecimento pedagógico, porque o produto promete mais do que dizer certo/errado: ele precisa interpretar o raciocínio, oferecer pistas e explicar a anatomia das alternativas.

## Próximo passo de produção

No protótipo, os dados editoriais ainda podem usar `localStorage`. Na beta real, o snapshot de 720 questões deve ser carregado no Postgres/Supabase e a fila de enriquecimento deve operar sobre registros persistentes, com histórico de revisão e sem duplicar o texto oficial.
