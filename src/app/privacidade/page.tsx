import { LegalPage } from '@/components/legal/legal-page';

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidade"
      title="Personalização não precisa ser uma caixa-preta."
      intro={<><p>O Direito Fácil usa informações sobre rotina e aprendizagem para decidir quando e o que apresentar. Esta página explica quais sinais entram nessa personalização e quais não precisamos guardar.</p><p className="mt-4"><strong>Versão de pré-lançamento:</strong> a identificação jurídica completa da controladora e o canal formal do encarregado de dados serão inseridos antes da operação comercial.</p></>}
      sections={[
        {
          title: 'Quais dados usamos',
          body: <><p>Podemos tratar dados de conta e contato; data da prova; disponibilidade semanal; horários e compromissos que você decidir informar; preferências de duração de sessão; progresso de estudo; respostas às questões; tempo de resposta; quantidade de pistas utilizadas; resultado de revisões e calibrações; e interações necessárias para funcionamento da comunidade.</p><p>Se você optar por conectar um calendário no futuro, a integração será opcional e limitada aos dados necessários para localizar conflitos e janelas de estudo, conforme as permissões apresentadas no momento da conexão.</p></>,
        },
        {
          title: 'O que a personalização observa',
          body: <><p>O percurso pode considerar sinais como acerto ou erro, qualidade pedagógica inferida da justificativa, tempo até a resposta, necessidade de pistas, retenção depois de alguns dias, repetição de confusões e desempenho em calibrações.</p><p>Esses sinais existem para adaptar o estudo. Não são usados para criar rankings públicos, expor fragilidades a outros alunos ou punir financeiramente quem começa sabendo menos.</p></>,
        },
        {
          title: 'Justificativas por texto ou voz',
          body: <><p>A experiência pede que o aluno explique por que escolheu uma alternativa. O desenho de produção prioriza guardar o <strong>sinal pedagógico derivado</strong> — por exemplo, raciocínio sólido, parcial ou confuso — em vez de conservar indefinidamente todo texto ou transcrição livre.</p><p>Quando recursos de voz ou IA forem ativados, a página de privacidade será atualizada para informar os fornecedores envolvidos, os dados enviados e os prazos de retenção aplicáveis.</p></>,
        },
        {
          title: 'Para que usamos os dados',
          body: <ul className="list-disc space-y-2 pl-5"><li>criar e reorganizar o cronograma pessoal;</li><li>selecionar questões, revisões e novos conceitos;</li><li>avaliar quando um conteúdo precisa reaparecer;</li><li>decidir quando uma calibração passa a ser pedagogicamente útil;</li><li>manter conta, segurança, suporte e comunidade;</li><li>medir qualidade do produto e corrigir falhas;</li><li>cumprir obrigações legais e contratuais.</li></ul>,
        },
        {
          title: 'Princípios de tratamento',
          body: <><p>O produto é desenhado segundo princípios de finalidade, adequação, necessidade, transparência, segurança, prevenção e não discriminação. Isso significa, entre outras coisas, não coletar uma informação só porque tecnicamente é possível coletá-la.</p><p>As métricas pedagógicas podem permanecer discretas na interface do aluno, mas o fato de elas existirem e serem usadas para personalização não deve ser escondido.</p></>,
        },
        {
          title: 'Compartilhamento e fornecedores',
          body: <><p>Dados poderão ser processados por fornecedores estritamente necessários à operação — por exemplo, hospedagem, autenticação, banco de dados, pagamentos, calendário, e recursos de IA/voz quando ativados. A versão comercial deverá listar os fornecedores relevantes e suas funções.</p><p>Não vendemos dados pessoais a anunciantes.</p></>,
        },
        {
          title: 'Retenção e segurança',
          body: <><p>Dados devem ser mantidos somente pelo período compatível com as finalidades informadas, obrigações legais, prevenção de fraude e exercício regular de direitos. Controles técnicos incluem autenticação, políticas de acesso por usuário, segregação de dados e registros de operação.</p><p>O schema de produção foi desenhado para que o aluno acesse seus próprios dados e para que conteúdo administrativo seja separado por permissões.</p></>,
        },
        {
          title: 'Seus direitos',
          body: <><p>Nos termos da legislação aplicável, titulares podem solicitar informações sobre tratamento, confirmação e acesso aos dados, correção de informações inexatas e, quando cabível, anonimização, bloqueio, eliminação, portabilidade, informações sobre compartilhamento e revogação de consentimento.</p><p>Até o lançamento comercial, o canal formal de privacidade será incluído nesta página. Pedidos também poderão começar pelo suporte da plataforma.</p></>,
        },
      ]}
    />
  );
}
