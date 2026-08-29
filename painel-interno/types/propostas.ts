export type StatusProposta =
  | 'rascunho' | 'enviada' | 'em_negociacao' | 'aceita' | 'recusada' | 'expirada'

export const STATUS_PROPOSTA_LABEL: Record<StatusProposta, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  em_negociacao: 'Em negociação',
  aceita: 'Aceita',
  recusada: 'Recusada',
  expirada: 'Expirada',
}

export const STATUS_PROPOSTA_TOM: Record<StatusProposta, 'neutro' | 'info' | 'atencao' | 'ok' | 'critico'> = {
  rascunho: 'neutro',
  enviada: 'info',
  em_negociacao: 'atencao',
  aceita: 'ok',
  recusada: 'critico',
  expirada: 'critico',
}

/** Para onde cada status pode ir. Impede voltar de aceita para rascunho. */
export const TRANSICOES: Record<StatusProposta, StatusProposta[]> = {
  rascunho: ['enviada'],
  enviada: ['em_negociacao', 'aceita', 'recusada'],
  em_negociacao: ['aceita', 'recusada'],
  aceita: [],
  recusada: [],
  expirada: ['em_negociacao'],
}

export type ItemProposta = {
  id: string
  proposta_id: string
  ordem: number
  descricao: string
  detalhe: string | null
  quantidade: number
  valor_unit: number
  cobranca: 'unico' | 'mensal'
  horas_est: number | null
  opcional: boolean
}

export type Proposta = {
  id: string
  numero: string
  empresa_id: string | null
  lead_id: string | null
  projeto_id: string | null
  titulo: string
  contexto: string | null
  escopo: string | null
  status: StatusProposta
  validade: string | null
  condicoes: string | null
  observacao: string | null
  valor_total: number
  valor_mensal: number
  enviada_em: string | null
  aceita_em: string | null
  motivo_recusa: string | null
  created_at: string
}

export type PropostaLinha = Proposta & { empresa_nome: string | null }

export type PropostaCompleta = PropostaLinha & { itens: ItemProposta[] }

/** Dias até a validade. Negativo = expirada. */
export function diasDeValidade(validade: string | null): number | null {
  if (!validade) return null
  const hoje = new Date()
  const zero = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  const [a, m, d] = validade.split('-').map(Number)
  return Math.round((Date.UTC(a, m - 1, d) - zero) / 86_400_000)
}

/** Status ainda em jogo — conta como pipeline aberto. */
export function estaAberta(s: StatusProposta) {
  return s === 'rascunho' || s === 'enviada' || s === 'em_negociacao'
}

export const CONDICOES_PADRAO = `Pagamento: 50% na assinatura e 50% na entrega.
Prazo de entrega contado a partir da aprovação do escopo.
Alterações fora do escopo são orçadas à parte.
Proposta válida até a data indicada acima.`
