import Link from 'next/link';
import { ArrowRight, BookOpenCheck, BrainCircuit, Database, FileQuestion, Route, Target } from 'lucide-react';

const sections = [
  {
    href: '/admin/banco-oficial',
    title: 'Banco oficial',
    copy: 'Importe diretamente o banco histórico da OAB, preserve a fonte e normalize a grade de matérias.',
    icon: Database,
  },
  {
    href: '/admin/classificacao',
    title: 'Classificação',
    copy: 'Ligue cada questão oficial a um dos 115 temas do outline antes do enriquecimento pedagógico.',
    icon: Route,
  },
  {
    href: '/admin/questoes',
    title: 'Banco editorial',
    copy: 'Revise explicações, pistas, padrões FGV, Vade Mecum e libere apenas questões prontas para ensinar.',
    icon: FileQuestion,
  },
  {
    href: '/admin/curriculo',
    title: 'Currículo invisível',
    copy: 'Inspecione a árvore que o aluno nunca vê: ordem, incidência, pré-requisitos e progresso interno.',
    icon: BookOpenCheck,
  },
  {
    href: '/admin/insights',
    title: 'Insights do motor',
    copy: 'Veja força por conceito, revisões futuras, pistas, erros e decisões adaptativas sem expor isso ao aluno.',
    icon: BrainCircuit,
  },
  {
    href: '/admin/estrategia',
    title: 'Estratégia 40/80',
    copy: 'Audite como incidência, tempo restante e oportunidade de ponto influenciam o próximo percurso.',
    icon: Target,
  },
];

export default function AdminPage() {
  return (
    <main className="min-h-dvh bg-[#11110f] px-5 py-8 text-[#f5f2ed] md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl border-b border-white/10 pb-10">
          <div className="text-xs uppercase tracking-[.14em] text-white/35">Direito Fácil · interno</div>
          <h1 className="serif mt-4 text-5xl leading-tight md:text-7xl">O cérebro do curso.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/45">O aluno não vê nada disso. Aqui organizamos as fontes oficiais, o currículo e as evidências que fazem o percurso mudar de pessoa para pessoa.</p>
        </header>

        <section className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {sections.map(({ href, title, copy, icon: Icon }, index) => (
            <Link key={href} href={href} className="group grid gap-4 py-6 transition hover:bg-white/[.025] md:grid-cols-[56px_1fr_48px] md:items-center md:px-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/50"><Icon className="h-5 w-5" /></div>
              <div>
                <div className="flex items-baseline gap-3"><span className="text-[10px] text-white/20">0{index + 1}</span><h2 className="serif text-2xl">{title}</h2></div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">{copy}</p>
              </div>
              <ArrowRight className="hidden h-5 w-5 justify-self-end text-white/25 transition group-hover:translate-x-1 group-hover:text-white/60 md:block" />
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
