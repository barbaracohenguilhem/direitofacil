'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createMockSession, nextRouteAfterAuth } from '@/features/auth/mock-auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    createMockSession({ email });
    router.push(nextRouteAfterAuth());
  }

  return (
    <main className="min-h-dvh bg-[#f8f6f2] px-5 py-6 text-[#1c1a18]">
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-6xl flex-col">
        <header className="flex items-center justify-between py-3">
          <div className="serif text-xl">direito fácil</div>
          <button onClick={() => router.push('/cadastro')} className="text-sm text-[#77716a]">Criar conta</button>
        </header>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.1fr_.9fr]">
          <section className="max-w-2xl">
            <p className="text-sm text-[#77716a]">Seu caminho continua daqui.</p>
            <h1 className="serif mt-4 text-5xl leading-[1.02] md:text-7xl">Você não precisa escolher o que estudar agora.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#77716a]">Entre. O percurso que já conhece sua rotina e suas respostas cuida do próximo passo.</p>
          </section>

          <section className="rounded-[30px] border border-[#ded9d2] bg-white p-6 shadow-[0_20px_80px_rgba(40,34,27,.06)] md:p-8">
            <div className="text-sm text-[#77716a]">Entrar</div>
            <h2 className="serif mt-2 text-3xl">Bom te ver de novo.</h2>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-xs text-[#77716a]">E-mail</span>
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" className="mt-2 w-full rounded-2xl border border-[#ded9d2] bg-[#fbfaf8] px-4 py-3.5 outline-none transition focus:border-[#918b83]" />
              </label>
              <label className="block">
                <span className="text-xs text-[#77716a]">Senha</span>
                <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="mt-2 w-full rounded-2xl border border-[#ded9d2] bg-[#fbfaf8] px-4 py-3.5 outline-none transition focus:border-[#918b83]" />
              </label>
              <button type="submit" disabled={!email.trim() || !password} className="flex w-full items-center justify-between rounded-full bg-[#1c1a18] px-5 py-4 text-sm font-medium text-white disabled:opacity-30">Entrar <ArrowRight className="h-4 w-4" /></button>
            </form>

            <div className="mt-7 border-t border-[#eeeae4] pt-5 text-xs leading-5 text-[#9a948d]">Autenticação simulada nesta branch. A interface e o redirecionamento já estão prontos para substituir este adapter por Supabase Auth.</div>
          </section>
        </div>
      </div>
    </main>
  );
}
