'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui'
import type { PropostaCompleta } from '@/types/propostas'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dia = (d: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : null)

export function Documento({ p }: { p: PropostaCompleta }) {
  const inclusos = p.itens.filter(i => !i.opcional)
  const opcionais = p.itens.filter(i => i.opcional)

  return (
    <div className="min-h-screen bg-ground text-fg">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-surface px-6 py-3 print:hidden">
        <Link href={`/comercial/propostas/${p.id}`} className="text-sm text-subtle hover:text-fg">
          ← Editar
        </Link>
        <span className="font-mono text-sm text-muted">{p.numero}</span>
        <Button tamanho="sm" className="ml-auto" onClick={() => window.print()}>
          Gerar PDF
        </Button>
      </div>

      <article className="mx-auto max-w-[820px] bg-surface px-10 py-10 print:max-w-none print:px-0 print:py-0">
        <header className="mb-10 border-b-2 border-fg pb-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={36} height={36} className="rounded-lg" />
              <div>
                <div className="text-sm font-semibold">Synapse Code</div>
                <div className="text-xs text-subtle">Soluções em tecnologia</div>
              </div>
            </div>
            <div className="text-right text-xs text-subtle">
              <div>Proposta <span className="font-mono text-fg">{p.numero}</span></div>
              <div>{new Date(p.created_at).toLocaleDateString('pt-BR')}</div>
              {p.validade && <div>Válida até {dia(p.validade)}</div>}
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{p.titulo}</h1>
          {p.empresa_nome && <p className="mt-1 text-sm text-muted">Para {p.empresa_nome}</p>}
        </header>

        {p.contexto && (
          <section className="mb-8">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">
              O que entendemos do seu negócio
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.contexto}</p>
          </section>
        )}

        {p.escopo && (
          <section className="mb-8">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">
              O que propomos
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.escopo}</p>
          </section>
        )}

        <section className="mb-8">
          <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
            Escopo e investimento
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-subtle">
                <th className="py-1.5 text-left font-medium">Item</th>
                <th className="py-1.5 text-right font-medium">Qtd</th>
                <th className="py-1.5 text-right font-medium">Unitário</th>
                <th className="py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {inclusos.map(i => (
                <tr key={i.id} className="border-b border-line align-top">
                  <td className="py-2">
                    <div>{i.descricao}</div>
                    {i.detalhe && <div className="text-xs text-subtle">{i.detalhe}</div>}
                    {i.cobranca === 'mensal' && (
                      <div className="text-xs text-subtle">cobrança mensal</div>
                    )}
                  </td>
                  <td className="tabular py-2 text-right">{i.quantidade}</td>
                  <td className="tabular py-2 text-right">{brl(i.valor_unit)}</td>
                  <td className="tabular py-2 text-right">{brl(i.quantidade * i.valor_unit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {p.valor_total > 0 && (
                <tr className="font-semibold">
                  <td className="py-2" colSpan={3}>Investimento único</td>
                  <td className="tabular py-2 text-right">{brl(p.valor_total)}</td>
                </tr>
              )}
              {p.valor_mensal > 0 && (
                <tr className="font-semibold">
                  <td className="py-1" colSpan={3}>Mensalidade</td>
                  <td className="tabular py-1 text-right">{brl(p.valor_mensal)}<span className="text-xs font-normal text-subtle">/mês</span></td>
                </tr>
              )}
            </tfoot>
          </table>
        </section>

        {opcionais.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <h2 className="mb-3 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-subtle">
              Opcionais
            </h2>
            <p className="mb-2 text-xs text-subtle">Não incluídos no investimento acima.</p>
            <table className="w-full text-sm">
              <tbody>
                {opcionais.map(i => (
                  <tr key={i.id} className="border-b border-line">
                    <td className="py-2">
                      <div>{i.descricao}</div>
                      {i.detalhe && <div className="text-xs text-subtle">{i.detalhe}</div>}
                    </td>
                    <td className="tabular py-2 text-right">{brl(i.quantidade * i.valor_unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {p.condicoes && (
          <section className="mb-8 break-inside-avoid">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">Condições</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{p.condicoes}</p>
          </section>
        )}

        <footer className="mt-12 border-t border-line pt-6 text-sm">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="mb-10 border-b border-fg" />
              <div className="text-xs text-subtle">Synapse Code</div>
            </div>
            <div>
              <div className="mb-10 border-b border-fg" />
              <div className="text-xs text-subtle">{p.empresa_nome ?? 'Contratante'}</div>
            </div>
          </div>
          <p className="mt-8 text-[11px] text-subtle">
            Synapse Code · contato.synapsecode@gmail.com · Proposta {p.numero}
          </p>
        </footer>
      </article>

      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 16mm; }
          html, body { background: #fff !important; }
          /* Impressão sempre no tema claro. */
          :root {
            --ground: 255 255 255;
            --surface: 255 255 255;
            --surface-2: 245 245 248;
            --line: 220 220 228;
            --line-strong: 190 190 200;
            --fg: 17 17 20;
            --fg-muted: 70 70 85;
            --fg-subtle: 110 110 125;
            --accent: 91 33 182;
          }
          tr { break-inside: avoid; }
          h2 { break-after: avoid; }
          footer { break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
