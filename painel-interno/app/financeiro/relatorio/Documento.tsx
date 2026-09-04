'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui'
import type { Relatorio } from '@/server/relatorio'
import { SeletorPeriodo } from './SeletorPeriodo'
import { SeletorEmpresa } from '@/components/SeletorEmpresa'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`)

const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** O banco guarda a chave; o documento mostra o nome do regime. */
const REGIME_LABEL: Record<string, string> = {
  mei: 'MEI',
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
}

function rotuloMes(iso: string) {
  const [, m] = iso.split('-').map(Number)
  return MES_CURTO[m - 1]
}

/**
 * Doze meses em barras, com o período em destaque.
 *
 * SVG e não recharts: biblioteca de gráfico não imprime de forma confiável.
 * Os meses fora do período ficam esmaecidos — são contexto, e a tendência é
 * o que dá sentido ao número do mês.
 */
function Grafico({ serie }: { serie: Relatorio['serie'] }) {
  if (serie.length === 0) return null

  const maximo = Math.max(...serie.map(s => s.realizado + s.projetado), 1)
  const largura = 680
  const altura = 190
  const base = altura - 34
  const passo = largura / serie.length
  const barra = Math.min(passo * 0.58, 40)
  const brlCurto = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k` : String(Math.round(v))

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className="w-full" role="img"
      aria-label="Despesa mensal nos últimos doze meses">
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1="0" x2={largura} y1={base - base * f} y2={base - base * f}
          stroke="currentColor" opacity={f === 0 ? 0.35 : 0.1} strokeWidth="1" />
      ))}
      {serie.map((s, i) => {
        const x = i * passo + (passo - barra) / 2
        const hR = (s.realizado / maximo) * base
        const hP = (s.projetado / maximo) * base
        const total = s.realizado + s.projetado
        return (
          <g key={s.mes}>
            {hP > 0 && (
              <rect x={x} y={base - hR - hP} width={barra} height={hP}
                className="fill-accent" opacity={s.noPeriodo ? 0.35 : 0.15} />
            )}
            <rect x={x} y={base - hR} width={barra} height={hR}
              className="fill-accent" opacity={s.noPeriodo ? 1 : 0.28} />
            {/* Valor só no período: em doze barras, tudo rotulado vira ruído. */}
            {s.noPeriodo && total > 0 && (
              <text x={x + barra / 2} y={base - hR - hP - 5} textAnchor="middle"
                className="fill-current text-[9px] font-semibold">
                {brlCurto(total)}
              </text>
            )}
            <text x={x + barra / 2} y={altura - 16} textAnchor="middle"
              className="fill-current text-[9px]"
              opacity={s.noPeriodo ? 0.9 : 0.45}
              style={s.noPeriodo ? { fontWeight: 600 } : undefined}>
              {rotuloMes(s.mes)}
            </text>
            <text x={x + barra / 2} y={altura - 5} textAnchor="middle"
              className="fill-current text-[8px]" opacity="0.35">
              {s.mes.slice(2, 4)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * Composição da despesa, em rosca.
 *
 * Tons de uma cor só, do maior para o menor, em vez de fatias multicoloridas:
 * a gradação carrega a ordem de grandeza sozinha e sobrevive à impressão em
 * preto e branco, que é como metade dos relatórios acaba sendo lida. Paleta
 * arbitrária obrigaria a consultar a legenda a cada fatia.
 *
 * Acima de seis categorias o resto vira "Outras": fatia de 2% não é
 * informação, é sujeira na borda.
 */
function Rosca({ categorias, total }: { categorias: Relatorio['categorias']; total: number }) {
  if (categorias.length === 0 || total <= 0) return null

  const MAX = 6
  const ordenadas = [...categorias].sort((a, b) => b.valor - a.valor)
  const principais = ordenadas.slice(0, MAX)
  const resto = ordenadas.slice(MAX)
  const fatias = resto.length
    ? [...principais, {
        categoria: `Outras (${resto.length})`,
        valor: resto.reduce((a, c) => a + c.valor, 0),
        pct: resto.reduce((a, c) => a + c.pct, 0),
      }]
    : principais

  const R = 62, r0 = 38, cx = 74, cy = 74
  const tom = (i: number) => 0.92 - (i / Math.max(fatias.length - 1, 1)) * 0.62

  let angulo = -Math.PI / 2
  const arcos = fatias.map((f, i) => {
    const fracao = f.valor / total
    const varre = fracao * Math.PI * 2
    const fim = angulo + varre
    const grande = varre > Math.PI ? 1 : 0
    const ponto = (raio: number, a: number) =>
      `${(cx + raio * Math.cos(a)).toFixed(2)} ${(cy + raio * Math.sin(a)).toFixed(2)}`
    // Fatia única não fecha com arco: 360° tem início e fim no mesmo ponto.
    const d = fracao >= 0.999
      ? `M ${ponto(R, 0)} A ${R} ${R} 0 1 1 ${ponto(R, Math.PI)} A ${R} ${R} 0 1 1 ${ponto(R, 0)} ` +
        `M ${ponto(r0, 0)} A ${r0} ${r0} 0 1 0 ${ponto(r0, Math.PI)} A ${r0} ${r0} 0 1 0 ${ponto(r0, 0)} Z`
      : `M ${ponto(R, angulo)} A ${R} ${R} 0 ${grande} 1 ${ponto(R, fim)} ` +
        `L ${ponto(r0, fim)} A ${r0} ${r0} 0 ${grande} 0 ${ponto(r0, angulo)} Z`
    angulo = fim
    return { d, opacidade: tom(i), ...f }
  })

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 148 148" className="h-[148px] w-[148px] flex-shrink-0" role="img"
        aria-label="Composição da despesa por categoria">
        {arcos.map((a, i) => (
          <path key={i} d={a.d} className="fill-accent" opacity={a.opacidade}
            fillRule="evenodd" stroke="#fff" strokeWidth="0.75" />
        ))}
      </svg>

      <dl className="min-w-[220px] flex-1 space-y-1">
        {arcos.map((a, i) => (
          <div key={i} className="flex items-baseline gap-2 text-[12px]">
            <span className="mt-[3px] h-2.5 w-2.5 flex-shrink-0 rounded-[2px] bg-accent"
              style={{ opacity: a.opacidade }} />
            <dt className="flex-1 truncate">{a.categoria}</dt>
            <dd className="tabular text-subtle">{a.pct.toFixed(1)}%</dd>
            <dd className="tabular w-24 text-right font-medium">{brl(a.valor)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Documento({
  r, escopo, mes, ano, empresas, identificacao,
}: {
  r: Relatorio
  escopo?: string | null
  /** `YYYY-MM` quando o período é um mês exato; `null` quando é o ano. */
  mes?: string | null
  ano?: number
  empresas?: { id: string; nome: string }[]
  /** Só existe no recorte de uma empresa: o consolidado não tem CNPJ único. */
  identificacao?: { razaoSocial: string; cnpj: string | null; regime: string | null } | null
}) {
  const temProjetado = r.serie.some(s => s.noPeriodo && s.projetado > 0)
  const emitidoEm = new Date().toLocaleDateString('pt-BR')
  const assinatura = [escopo ?? 'Synapse Code', r.periodo.rotulo].join(' · ')

  return (
    <div className="min-h-screen bg-ground text-fg">
      {/* Barra de ação — some na impressão */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-surface px-6 py-3 print:hidden">
        <Link href="/financeiro" className="text-sm text-subtle hover:text-fg">← Financeiro</Link>
        {ano !== undefined && <SeletorPeriodo mes={mes ?? null} ano={ano} />}
        {empresas && <SeletorEmpresa empresas={empresas} />}
        <Button tamanho="sm" className="ml-auto" onClick={() => window.print()}>
          Gerar PDF
        </Button>
      </div>

      <article className="mx-auto max-w-[820px] bg-surface px-10 py-10 print:max-w-none print:px-0 print:py-0">
        {/* ── Capa ── */}
        <header className="mb-9 border-b-2 border-fg pb-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={34} height={34} className="rounded-lg" />
              <div>
                <div className="text-sm font-semibold leading-tight">
                  {identificacao?.razaoSocial ?? escopo ?? 'Synapse Code'}
                </div>
                {/* Nome de fantasia não identifica ninguém numa prestação de
                    contas; o CNPJ, sim. No consolidado não há um a declarar. */}
                <div className="text-[11px] leading-tight text-subtle">
                  {identificacao
                    ? [
                        identificacao.cnpj && `CNPJ ${identificacao.cnpj}`,
                        identificacao.regime && REGIME_LABEL[identificacao.regime],
                      ].filter(Boolean).join(' · ')
                    : 'Consolidado de todas as empresas do grupo'}
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] leading-tight text-subtle">
              <div className="font-medium uppercase tracking-wide">Relatório financeiro</div>
              <div>Emitido em {emitidoEm}</div>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight">{r.periodo.rotulo}</h1>
          <p className="mt-1 text-sm text-muted">
            Comparado com {r.anterior.rotulo}
          </p>
        </header>

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
          <div className="mb-5 break-inside-avoid">
            <Rosca categorias={r.categorias} total={r.despesa} />
          </div>
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

        {/* ── Maiores lançamentos ──
            Só quando o anexo é longo demais para servir de destaque: num mês
            de quinze linhas, o "dez maiores" repete a lista inteira. */}
        {r.lancamentos.length > 30 && (
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
        )}

        {/* ── Anexo: o razão do período ── */}
        {r.lancamentos.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
              Anexo — lançamentos do período ({r.lancamentos.length})
            </h2>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wide text-subtle">
                  <th className="py-1 text-left font-medium">Data</th>
                  <th className="py-1 text-left font-medium">Descrição</th>
                  <th className="py-1 text-left font-medium">Categoria</th>
                  <th className="py-1 text-right font-medium">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {r.lancamentos.map((l, i) => (
                  <tr key={i} className="border-b border-line/60">
                    <td className="tabular w-16 py-1 text-subtle">
                      {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit',
                      })}
                    </td>
                    <td className="py-1">{l.descricao}</td>
                    <td className="py-1 text-subtle">{l.categoria}</td>
                    <td className="tabular py-1 text-right">{brl(l.valor)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-1.5" colSpan={3}>Total</td>
                  <td className="tabular py-1.5 text-right">{brl(r.despesa)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* ── Notas ──
            Saíram da caixa amarela no alto da página. Ali gritavam como alerta
            de sistema e eram a primeira coisa que se lia; aqui são o que de
            fato são — as ressalvas de um documento, no lugar onde se procura
            por elas depois de ver os números. */}
        {r.avisos.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
              Notas
            </h2>
            <ol className="space-y-1.5 text-[12px] leading-relaxed text-muted">
              {r.avisos.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="tabular flex-shrink-0 text-subtle">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* A assinatura fica só no rodapé repetido; aqui ela duplicaria na
            última folha, que é onde os dois se encontram. */}
        <footer className="border-t border-line pt-4 text-[11px] leading-relaxed text-subtle">
          <span className="font-medium text-muted print:hidden">{assinatura} · </span>
          Emitido em {emitidoEm} pelo Painel Interno da Synapse Code, a partir dos
          lançamentos registrados até a data. Valores em reais (BRL).
        </footer>

        {/* Repetido em toda página impressa: uma folha solta do meio do
            relatório não diz de quem é nem de quando. */}
        <div className="hidden print:fixed print:bottom-0 print:left-0 print:right-0 print:block print:text-[8pt] print:text-[#666]">
          <div className="flex justify-between border-t border-[#ddd] pt-1">
            <span>{assinatura}</span>
            <span>Emitido em {emitidoEm}</span>
          </div>
        </div>
      </article>

      <style>{`
        @media print {
          @page { size: A4; margin: 16mm 14mm 18mm; }
          html, body { background: #fff !important; }
          /*
           * Impressão sempre no tema claro: fundo escuro come tinta e some no
           * papel.
           *
           * O !important não é preguiça. O tema escuro é aplicado por
           * :root[data-theme='dark'] e :root:not([data-theme='light']), ambos
           * com especificidade 0,2,0; a media query de impressão não
           * acrescenta especificidade nenhuma, então um :root puro (0,1,0)
           * perdia a disputa e as cores do escuro sobreviviam à impressão. O
           * fundo virava branco — essa regra é html, body e vencia — mas o
           * texto continuava claro. O relatório saía apagado no papel, e na
           * tela nada denunciava isso.
           */
          :root {
            --ground: 255 255 255 !important;
            --surface: 255 255 255 !important;
            --surface-2: 245 245 248 !important;
            --surface-3: 235 235 240 !important;
            --line: 220 220 228 !important;
            --line-strong: 190 190 200 !important;
            --fg: 17 17 20 !important;
            --fg-muted: 70 70 85 !important;
            --fg-subtle: 100 100 115 !important;
            --accent: 91 33 182 !important;
            --accent-text: 76 29 149 !important;
            --accent-soft: 237 233 254 !important;
            --ok: 21 128 61 !important;
            --warn: 146 64 14 !important;
            --warn-soft: 254 249 231 !important;
            --warn-line: 217 180 90 !important;
            --crit: 185 28 28 !important;
            --crit-soft: 254 242 242 !important;
            --crit-line: 220 150 150 !important;
          }
          /* O navegador descarta fundo e cor de fundo por padrão ao imprimir;
             sem isto as barras do gráfico e a rosca saem em branco. */
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { break-inside: auto; }
          table { break-inside: auto; }
          tr { break-inside: avoid; }
          h2 { break-after: avoid; }
        }
      `}</style>
    </div>
  )
}
