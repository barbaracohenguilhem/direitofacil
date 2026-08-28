import Link from 'next/link';
import type { ReactNode } from 'react';

export type LegalSection = {
  title: string;
  body: ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated = '28 de agosto de 2026',
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  updated?: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-dvh bg-[#faf9f7] text-[#191816]">
      <div className="mx-auto max-w-[1040px] px-5 pb-20 pt-5 md:px-8 md:pt-7">
        <header className="flex items-center justify-between border-b border-[#e6e1db] pb-5">
          <Link href="/" className="serif text-xl">direito fácil</Link>
          <Link href="/login" className="text-sm text-[#77736d] transition hover:text-[#191816]">Entrar</Link>
        </header>

        <section className="border-b border-[#ddd8d1] py-14 md:py-20">
          <p className="text-xs uppercase tracking-[.14em] text-[#99928a]">{eyebrow}</p>
          <h1 className="serif mt-5 max-w-4xl text-5xl leading-[.95] tracking-[-.045em] md:text-7xl">{title}</h1>
          <div className="mt-8 max-w-2xl text-base leading-7 text-[#6f6962]">{intro}</div>
          <p className="mt-8 text-xs text-[#aaa39a]">Última atualização: {updated}</p>
        </section>

        <div className="grid gap-12 py-12 md:grid-cols-[210px_minmax(0,1fr)] md:py-16">
          <aside className="hidden md:block">
            <div className="sticky top-8 space-y-3 text-xs text-[#99928a]">
              {sections.map((section, index) => (
                <a key={section.title} href={`#secao-${index + 1}`} className="block transition hover:text-[#191816]">{String(index + 1).padStart(2, '0')} · {section.title}</a>
              ))}
            </div>
          </aside>

          <article className="max-w-3xl">
            {sections.map((section, index) => (
              <section key={section.title} id={`secao-${index + 1}`} className="scroll-mt-8 border-b border-[#e6e1db] py-8 first:pt-0 last:border-b-0">
                <div className="text-xs uppercase tracking-[.12em] text-[#aaa39a]">{String(index + 1).padStart(2, '0')}</div>
                <h2 className="serif mt-3 text-3xl leading-tight md:text-4xl">{section.title}</h2>
                <div className="legal-copy mt-5 space-y-4 text-sm leading-7 text-[#625d56]">{section.body}</div>
              </section>
            ))}
          </article>
        </div>

        <footer className="flex flex-col gap-5 border-t border-[#ddd8d1] pt-7 text-xs text-[#8f8880] sm:flex-row sm:items-center sm:justify-between">
          <span>Preparação independente para a 1ª fase da OAB.</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/assinatura">Assinatura e cancelamento</Link>
            <Link href="/suporte">Suporte</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
