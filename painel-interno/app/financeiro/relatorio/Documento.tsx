'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui'
import type { Relatorio } from '@/server/relatorio'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`)

const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function rotuloMes(iso: string) {
  const [, m] = iso.split('-').map(Number)
  return MES_CURTO[m - 1]
}

/** Barras mensais em SVG: o recharts não imprime de forma confiável. */
function Grafico({ serie }: { serie: Relatorio['serie'] }) {
  if (serie.length === 0) return null

  const maximo = Math.max(...serie.map(s => s.realizado + s.projetado), 1)
  const largura = 680
  const altura = 180
  const base = altura - 26
  const passo = largura / serie.length
  const barra = Math.min(passo * 0.6, 44)

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className="w-full" role="img"
      aria-label="Despesa por mês no período">
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1="0" x2={largura} y1={base - base * f} y2={base - base * f}
          stroke="currentColor" opacity="0.12" strokeWidth="1" />
      ))}
      {serie.map((s, i) => {
        const x = i * passo + (passo - barra) / 2
        const hR = (s.realizado / maximo) * base
        const hP = (s.projetado / maximo) * base
        return (
          <g key={s.mes}>
            {hP > 0 && (
              <rect x={x} y={base - hR - hP} width={barra} height={hP}
                className="fill-accent" opacity="0.3" />
            )}
            <rect x={x} y={base - hR} width={barra} height={hR} className="fill-accent" />
            <text x={x + barra / 2} y={altura - 8} textAnchor="middle"
              className="fill-current text-[10px]" opacity="0.6">
              {rotuloMes(s.mes)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function Documento({ r }: { r: Relatorio }) {
  const temProjetado = r.serie.some(s => s.projetado > 0)

  return (
    <div className="min-h-screen bg-ground text-fg">
      {/* Barra de ação — some na impressão */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-surface px-6 py-3 print:hidden">
        <Link href="/financeiro" className="text-sm text-subtle hover:text-fg">← Financeiro</Link>
        <span className="text-sm text-muted">Relatório de {r.periodo.rotulo}</span>
        <Button tamanho="sm" className="ml-auto" onClick={() => window.print()}>
          Gerar PDF
        </Button>
      </div>

      <article className="mx-auto max-w-[820px] bg-surface px-10 py-10 print:max-w-none print:px-0 print:py-0">
        {/* ── Capa ── */}
        <header className="mb-10 border-b-2 border-fg pb-6">
          <div className="mb-6 flex items-center gap-3">
            <Image src="/logo.png" alt="" width={36} height={36} className="rounded-lg" />
            <div>
              <div className="text-sm font-semibold">Synapse Code</div>
              <div className="text-xs text-subtle">Relatório financeiro</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{r.periodo.rotulo}</h1>
          <p className="mt-1 text-sm text-muted">
            Comparado com {r.anterior.rotulo} · emitido em{' '}
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </header>

        {/* ── Ressalvas ── */}
        {r.avisos.length > 0 && (
          <section className="mb-8 rounded border border-warn-line bg-warn-soft px-4 py-3">
            <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-warn">
              Observações sobre estes números
            </h2>
            <ul className="space-y-1 text-sm text-warn">
              {r.avisos.map((a, i) => <li key={i}>· {a}</li>)}
            </ul>
          </section>
        )}

        {/* ── Sumário executivo ── */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
            Sumário
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { r: 'Receita', v: brl(r.receita) },
              { r: 'Despesa', v: brl(r.despesa), extra: pct(r.variacaoDespesa) },
              { r: 'Resultado', v: brl(r.resultado), negativo: r.resultado < 0 },
              { r: 'Recorrente/mês', v: brl(r.recorrenteMensal) },
            ].map(m => (
              <div key={m.r}>
                <dt className="text-[11px] uppercase tracking-wide text-subtle">{m.r}</dt>
                <dd className={cn('tabular mt-0.5 text-lg font-semibold', m.negativo && 'text-crit')}>
                  {m.v}
                </dd>
                {m.extra && (
                  <dd className="tabular text-[11px] text-subtle">{m.extra} vs período anterior</dd>
                )}
              </div>
            ))}
          </dl>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Burn mensal</dt>
              <dd className="tabular text-sm font-medium">{brl(r.burnMensal)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Saldo em caixa</dt>
              <dd className="tabular text-sm font-medium">
                {r.saldoTotal > 0 ? brl(r.saldoTotal) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Runway</dt>
              <dd className="tabular text-sm font-medium">
                {r.runwayMeses !== null ? `${r.runwayMeses} meses` : '—'}
              </dd>
            </div>
          </div>
        </section>

        {/* ── Evolução ── */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
            Despesa por mês
          </h2>
          <Grafico serie={r.serie} />
          {temProjetado && (
            <p className="mt-1 text-[11px] text-subtle">
              Barra cheia: realizado. Barra clara: projetado pelas recorrências.
            </p>
          )}
        </section>

        {/* ── Categorias ── */}
        <section className="mb-8">
          <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
            Despesa por categoria
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-subtle">
                <th className="py-1.5 text-left font-medium">Categoria</th>
                <th className="py-1.5 text-right font-medium">Valor</th>
                <th className="py-1.5 text-right font-medium">%</th>
                <th className="py-1.5 text-right font-medium">Anterior</th>
                <th className="py-1.5 text-right font-medium">Variação</th>
              </tr>
            </thead>
            <tbody>
              {r.categorias.map(c => (
                <tr key={c.categoria} className="border-b border-line">
                  <td className="py-1.5">{c.categoria}</td>
                  <td className="tabular py-1.5 text-right">{brl(c.valor)}</td>
                  <td className="tabular py-1.5 text-right text-subtle">{c.pct}%</td>
                  <td className="tabular py-1.5 text-right text-subtle">
                    {c.anterior > 0 ? brl(c.anterior) : '—'}
                  </td>
                  <td className={cn(
                    'tabular py-1.5 text-right',
                    c.variacao !== null && c.variacao > 0 && 'text-crit',
                    c.variacao !== null && c.variacao < 0 && 'text-ok'
                  )}>
                    {pct(c.variacao)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2">Total</td>
                <td className="tabular py-2 text-right">{brl(r.despesa)}</td>
                <td className="tabular py-2 text-right">100%</td>
                <td className="tabular py-2 text-right">{brl(r.despesaAnterior)}</td>
                <td className="tabular py-2 text-right">{pct(r.variacaoDespesa)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Custo por produto ── */}
        {r.custoPorProduto.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
              Custo por produto
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {r.custoPorProduto.map(c => (
                  <tr key={c.nome} className="border-b border-line">
                    <td className="py-1.5">{c.nome}</td>
                    <td className="tabular py-1.5 text-right">{brl(c.valor)}</td>
                  </tr>
                ))}
                {r.semDono > 0 && (
                  <tr className="border-b border-line text-subtle">
                    <td className="py-1.5">Sem produto atribuído</td>
                    <td className="tabular py-1.5 text-right">{brl(r.semDono)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Maiores lançamentos ── */}
        <section className="mb-8">
          <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
            Dez maiores lançamentos
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {r.maioresLancamentos.map((l, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="tabular w-20 py-1.5 text-subtle">
                    {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit',
                    })}
                  </td>
                  <td className="py-1.5">{l.descricao}</td>
                  <td className="py-1.5 text-subtle">{l.categoria}</td>
                  <td className="tabular py-1.5 text-right">{brl(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="border-t border-line pt-4 text-[11px] text-subtle">
          Synapse Code · Painel Interno · Gerado automaticamente a partir dos lançamentos
          registrados. Valores em reais.
        </footer>
      </article>

      <style>{`
        @media print {
          @page { size: A4; margin: 16mm 14mm; }
          html, body { background: #fff !important; }
          /* Impressão sempre no tema claro: fundo escuro come tinta e some no papel. */
          :root {
            --ground: 255 255 255;
            --surface: 255 255 255;
            --surface-2: 245 245 248;
            --surface-3: 235 235 240;
            --line: 220 220 228;
            --line-strong: 190 190 200;
            --fg: 17 17 20;
            --fg-muted: 70 70 85;
            --fg-subtle: 110 110 125;
            --accent: 91 33 182;
          }
          section { break-inside: auto; }
          table { break-inside: auto; }
          tr { break-inside: avoid; }
          h2 { break-after: avoid; }
        }
      `}</style>
    </div>
  )
}
