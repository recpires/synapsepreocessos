/**
 * Período do relatório financeiro.
 *
 * O intervalo é meio-aberto: `inicio` entra, `fim` não. É assim que
 * `montarRelatorio` consulta (`gte(inicio)` / `lt(fim)`), e é o que evita a
 * dúvida clássica de saber se o dia 30 pertence a este mês ou ao próximo.
 * Setembro de 2026 é `['2026-09-01', '2026-10-01')`.
 *
 * A aritmética é feita em meses absolutos, não com `Date`: montar
 * `${ano}-${mes + 2}` produziu `2026-13-01` em dezembro — uma data que o
 * Postgres recusa e que derrubava o relatório no último mês do ano.
 */

export type Periodo = { inicio: string; fim: string }

const dois = (n: number) => String(n).padStart(2, '0')

/** Primeiro dia de um mês contado em meses absolutos desde o ano 0. */
function primeiroDia(total: number): string {
  return `${Math.floor(total / 12)}-${dois((total % 12) + 1)}-01`
}

function absoluto(ano: number, mes: number): number {
  return ano * 12 + (mes - 1)
}

/** `"2026-09"` → setembro inteiro. Dezembro atravessa o ano sem virar mês 13. */
export function periodoDoMes(mes: string): Periodo {
  const [ano, m] = mes.split('-').map(Number)
  if (!Number.isFinite(ano) || !Number.isFinite(m) || m < 1 || m > 12) {
    throw new RangeError(`Mês inválido: ${mes}`)
  }
  const inicio = absoluto(ano, m)
  return { inicio: primeiroDia(inicio), fim: primeiroDia(inicio + 1) }
}

/** O ano civil inteiro. */
export function periodoDoAno(ano: number): Periodo {
  return { inicio: `${ano}-01-01`, fim: `${ano + 1}-01-01` }
}

/**
 * O que abre sem ninguém escolher nada: o ano corrente até o fim do mês atual.
 *
 * Não vai até 31/12 porque o banco guarda também o que o cron já projetou para
 * os meses à frente, e somar isso faria o relatório do ano parecer maior do que
 * a empresa gastou.
 */
export function periodoPadrao(hoje: Date): Periodo {
  const ano = hoje.getFullYear()
  return {
    inicio: `${ano}-01-01`,
    fim: primeiroDia(absoluto(ano, hoje.getMonth() + 1) + 1),
  }
}

/**
 * Lê um intervalo de volta como mês, quando ele é exatamente um mês.
 *
 * Serve para o seletor mostrar o que está sendo visto: sem isso, abrir um
 * relatório por link deixaria o campo de mês vazio enquanto a tela mostra
 * setembro.
 */
export function mesDoPeriodo(p: Periodo): string | null {
  const i = /^(\d{4})-(\d{2})-01$/.exec(p.inicio)
  const f = /^(\d{4})-(\d{2})-01$/.exec(p.fim)
  if (!i || !f) return null
  const ini = absoluto(Number(i[1]), Number(i[2]))
  const fim = absoluto(Number(f[1]), Number(f[2]))
  return fim - ini === 1 ? `${i[1]}-${i[2]}` : null
}

/** O mês corrente em `YYYY-MM`, para o valor inicial do seletor. */
export function mesAtual(hoje: Date): string {
  return `${hoje.getFullYear()}-${dois(hoje.getMonth() + 1)}`
}

/** Desloca um mês `YYYY-MM`. Usado pelas setas de mês anterior/seguinte. */
export function deslocarMesRotulo(mes: string, n: number): string {
  const [ano, m] = mes.split('-').map(Number)
  const total = absoluto(ano, m) + n
  return `${Math.floor(total / 12)}-${dois((total % 12) + 1)}`
}
