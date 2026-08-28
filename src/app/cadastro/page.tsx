'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { createMockSession } from '@/features/auth/mock-auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) return;
    createMockSession({ name, email });
    localStorage.removeItem('oab-onboarding-complete');
    router.push('/onboarding');
  }

  return (
    <main className="min-h-dvh bg-[#171614] px-5 py-6 text-[#f8f6f2]">
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-6xl flex-col">
        <header className="flex items-center justify-between py-3">
          <div className="serif text-xl">direito fácil</div>
          <button onClick={() => router.push('/login')} className="text-sm text-white/45">Já tenho conta</button>
        </header>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1fr_440px]">
          <section className="max-w-2xl">
            <p className="text-sm text-white/45">Um curso diferente começa antes da primeira aula.</p>
            <h1 className="serif mt-4 text-5xl leading-[1.02] md:text-7xl">Primeiro, precisamos conhecer a sua vida.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/50">Depois da conta, você não cai numa biblioteca. A próxima tela pergunta quando é sua prova, quando existe tempo de verdade e o que já ocupa sua semana.</p>
            <div className="mt-9 space-y-3 text-sm text-white/50">
              {['Sua rotina define quando.', 'Seu raciocínio redefine o que vem depois.', 'Você não administra o curso.'].map((item) => <div key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}
            </div>
          </section>

          <section className="rounded-[30px] bg-[#f8f6f2] p-6 text-[#1c1a18] md:p-8">
            <div className="text-sm text-[#77716a]">Criar conta</div>
            <h2 className="serif mt-2 text-3xl">Vamos montar seu caminho.</h2>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field label="Nome" value={name} onChange={setName} placeholder="Seu nome" autoComplete="name" />
              <Field label="E-mail" value={email} onChange={setEmail} placeholder="voce@email.com" type="email" autoComplete="email" />
              <Field label="Senha" value={password} onChange={setPassword} placeholder="Pelo menos 6 caracteres" type="password" autoComplete="new-password" />
              <button type="submit" disabled={!name.trim() || !email.trim() || password.length < 6} className="flex w-full items-center justify-between rounded-full bg-[#1c1a18] px-5 py-4 text-sm font-medium text-white disabled:opacity-30">Continuar <ArrowRight className="h-4 w-4" /></button>
            </form>
            <p className="mt-5 text-xs leading-5 text-[#9a948d]">Nesta branch, a conta é simulada localmente. O próximo passo técnico substitui esse adapter por autenticação real sem alterar este fluxo.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string }) {
  return <label className="block"><span className="text-xs text-[#77716a]">{label}</span><input type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-[#ded9d2] bg-white px-4 py-3.5 outline-none transition focus:border-[#918b83]" /></label>;
}
