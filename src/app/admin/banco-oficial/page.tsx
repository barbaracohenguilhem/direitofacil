'use client';

import Link from 'next/link';
import { ChangeEvent, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Database, FileSpreadsheet, ShieldCheck, Upload } from 'lucide-react';
import { parseOfficialOabBankCsv, type OfficialBankPreview } from '@/features/content/official-bank';
import { upsertContentQuestions } from '@/features/content/repository';

export default function OfficialBankPage() {
  const [preview, setPreview] = useState<OfficialBankPreview | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockingErrors = useMemo(
    () => preview?.issues.filter((issue) => issue.severity === 'error') ?? [],
    [preview],
  );

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImported(false);
    setError(null);
    setFileName(file.name);
    const text = await file.text();
    const result = parseOfficialOabBankCsv(text);
    setPreview(result);
  }

  function importBank() {
    if (!preview?.records.length || blockingErrors.length) return;
    try {
      upsertContentQuestions(preview.records);
      setImported(true);
    } catch {
      setError('O navegador não conseguiu guardar o lote inteiro no armazenamento local. No backend real, este mesmo lote será enviado ao Supabase em batches.');
    }
  }

  return (
    <main className="min-h-dvh bg-[#11110f] px-5 py-7 text-[#f5f2ed] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/questoes" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white/70">
          <ArrowLeft className="h-4 w-4" /> Banco editorial
        </Link>

        <header className="mt-10 max-w-4xl">
          <div className="text-xs uppercase tracking-[.14em] text-white/35">Admin · fonte oficial</div>
          <h1 className="serif mt-3 text-5xl leading-tight md:text-7xl">Importar banco oficial da OAB.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/50">
            Este importador entende diretamente o formato do banco histórico: preserva enunciado, alternativas, gabarito e fonte, corrige a grade das provas mais novas e envia cada questão para revisão antes de ela poder ensinar alguém.
          </p>
        </header>

        <section className="mt-12 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <label className="flex min-h-[340px] cursor-pointer flex-col justify-between rounded-[28px] border border-dashed border-white/15 bg-white/[.03] p-7 transition hover:bg-white/[.05]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10"><Upload className="h-5 w-5" /></div>
              <h2 className="serif mt-8 text-3xl">Escolha o CSV.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/40">Use diretamente o arquivo <code className="text-white/60">banco_questoes_oab.csv</code>. Não precisa adaptar colunas.</p>
            </div>
            <div className="mt-8 border-t border-white/10 pt-5 text-xs text-white/35">{fileName ?? 'Nenhum arquivo escolhido'}</div>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </label>

          <div className="rounded-[28px] border border-white/10 bg-white/[.035] p-7">
            {!preview ? (
              <div className="flex min-h-[286px] flex-col justify-center">
                <Database className="h-6 w-6 text-white/30" />
                <p className="serif mt-6 text-3xl text-white/70">Esperando o banco.</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/35">A pré-validação acontece no navegador antes de qualquer registro entrar no Content Engine.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 text-sm text-emerald-100"><CheckCircle2 className="h-5 w-5" /> Formato do banco oficial reconhecido</div>
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-3">
                  <Metric label="questões" value={preview.validRows} />
                  <Metric label="exames" value={preview.exams} />
                  <Metric label="matérias após normalização" value={preview.subjects} />
                  <Metric label="categorias corrigidas" value={preview.correctedSubjects} />
                  <Metric label="linhas inválidas" value={preview.invalidRows} />
                  <Metric label="erros bloqueadores" value={blockingErrors.length} />
                </div>

                <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
                  <Check text="Enunciados oficiais preservados" />
                  <Check text="Alternativas A–D preservadas" />
                  <Check text="Gabaritos preservados" />
                  <Check text="URLs das provas oficiais preservadas" />
                  <Check text="XXXVIII–XL normalizados para a grade de 20 matérias" />
                  <Check text="Questões entram como Em revisão, nunca publicadas automaticamente" />
                </div>

                {blockingErrors.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-xs leading-5 text-rose-100">
                    Há {blockingErrors.length} erro(s) que precisam ser corrigidos antes da importação.
                  </div>
                )}

                {error && <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-xs leading-5 text-amber-100">{error}</div>}
                {imported && <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-xs leading-5 text-emerald-100">Banco importado para a fila editorial local. Agora as questões podem ser classificadas pelo outline e enriquecidas sem alterar o texto oficial.</div>}

                <button onClick={importBank} disabled={!preview.records.length || blockingErrors.length > 0} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f5f2ed] px-6 py-3 text-sm text-[#11110f] disabled:opacity-30">
                  <FileSpreadsheet className="h-4 w-4" /> Importar {preview.validRows} questões
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 border-t border-white/10 py-9">
          <div className="flex max-w-3xl items-start gap-4">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-white/45" />
            <div>
              <h2 className="text-sm font-medium">Questão oficial não é igual a questão pronta para aula.</h2>
              <p className="mt-2 text-sm leading-6 text-white/40">Para simulação, enunciado e gabarito já são o núcleo. Para a aula Question First, a mesma questão ainda precisa ganhar conceito do outline, explicações A–D, pistas graduais, padrão FGV, palavras-chave de raciocínio e orientação de Vade Mecum. O quality gate mantém essas duas coisas separadas.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><div className="serif text-4xl">{value}</div><div className="mt-1 text-[11px] leading-4 text-white/35">{label}</div></div>;
}

function Check({ text }: { text: string }) {
  return <div className="flex items-center gap-3 text-xs text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-emerald-200/80" />{text}</div>;
}
