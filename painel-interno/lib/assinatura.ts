/**
 * O que sai quando se cancela uma assinatura.
 *
 * Cancelar desfaz previsão, nunca histórico. A data de corte é digitada à mão,
 * e uma data escolhida no passado apagaria despesa já paga — por isso o
 * `confirmado` é uma guarda separada, não uma consequência do corte.
 *
 * Devolve a lista de ids em vez de um critério de query: a exclusão passa a
 * apagar exatamente as linhas que a tela contou, e não o que um encadeamento
 * de filtros resolver no servidor.
 */

export type LinhaDeSerie = {
  id: string
  data: string
  valor: number | string
  confirmado?: boolean | null
  serie_id?: string | null
}

export type Cancelamento = {
  /** As previsões que serão removidas. */
  ids: string[]
  /** Quantas linhas somem e quanto somam — o que o aviso mostra. */
  linhas: number
  total: number
  /** Já pagas dentro do corte: ficam, e vale dizer quantas são. */
  protegidas: number
}

export function previsoesACancelar(
  linhas: LinhaDeSerie[],
  serieId: string,
  cutoff: string,
): Cancelamento {
  const daSerie = linhas.filter(l => l.serie_id === serieId && l.data >= cutoff)
  const previstas = daSerie.filter(l => l.confirmado !== true)
  return {
    ids: previstas.map(l => l.id),
    linhas: previstas.length,
    total: previstas.reduce((s, l) => s + (Number(l.valor) || 0), 0),
    protegidas: daSerie.length - previstas.length,
  }
}
