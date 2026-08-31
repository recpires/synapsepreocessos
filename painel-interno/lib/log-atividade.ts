/**
 * Leitura do log de auditoria.
 *
 * Mora fora da página porque é onde o log fica útil ou inútil: um registro que
 * diz "alterou despesa Figma (valor)" tem a forma de uma resposta sem ser uma.
 * Aqui dá para provar por teste que o número aparece, sem mexer em lançamento
 * de verdade só para conferir na tela.
 */

export type Empresa = { nome_fantasia: string | null; razao_social: string }

export type Atividade = {
  id: string
  autor: string | null
  acao: 'insert' | 'update' | 'delete'
  entidade: string
  resumo: string | null
  antes: Record<string, unknown> | null
  depois: Record<string, unknown> | null
  em: string
  empresa_id: string | null
  empresas: Empresa | Empresa[] | null
}

export const ACAO_LABEL: Record<string, string> = {
  insert: 'criou', update: 'alterou', delete: 'removeu',
}

export const ACAO_TOM: Record<string, 'ok' | 'info' | 'critico'> = {
  insert: 'ok', update: 'info', delete: 'critico',
}

export const ENTIDADE_LABEL: Record<string, string> = {
  empresas: 'empresa',
  projetos: 'projeto',
  contratos: 'contrato',
  propostas: 'proposta',
  proposta_itens: 'item de proposta',
  sites: 'site',
  impostos: 'imposto',
  contas_bancarias: 'conta bancária',
  membros: 'membro',
  contrato_templates: 'template',
  rateio_regras: 'regra de rateio',
  projeto_erros: 'erro de projeto',
  despesas: 'despesa',
  receitas: 'receita',
  dividas: 'dívida',
  divida_parcelas: 'parcela',
  notas_fiscais: 'nota fiscal',
  socios: 'sócio',
  membro_empresas: 'acesso a empresa',
}

/** Entidades onde o número é a informação, não um detalhe. */
const FINANCEIRAS = new Set([
  'despesas', 'receitas', 'dividas', 'divida_parcelas', 'notas_fiscais', 'impostos',
])

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * O embed do PostgREST é um objeto quando a relação é de muitos para um, mas o
 * tipo gerado pelo supabase-js declara lista. Seguir o tipo em vez do dado fez
 * a coluna de empresa vir vazia na tela inteira.
 */
export function nomeDaEmpresa(e: Atividade['empresas']): string | undefined {
  const dona = Array.isArray(e) ? e[0] : e
  return dona?.nome_fantasia ?? dona?.razao_social
}

/** Lê um número de um snapshot do log, que guarda tudo como jsonb. */
function num(fonte: Record<string, unknown> | null, chave: string): number | null {
  const v = fonte?.[chave]
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * O valor em dinheiro, escrito por extenso.
 *
 * "De quanto para quanto" é a pergunta que se faz ao abrir o histórico depois
 * que um total mudou sozinho. Em insert e delete só existe um lado, e é ele
 * que responde quanto entrou ou quanto saiu do resultado.
 */
export function dinheiro(a: Pick<Atividade, 'entidade' | 'antes' | 'depois'>): string | null {
  if (!FINANCEIRAS.has(a.entidade)) return null
  const de = num(a.antes, 'valor')
  const para = num(a.depois, 'valor')
  if (de !== null && para !== null) return `${brl(de)} → ${brl(para)}`
  return para !== null ? brl(para) : de !== null ? brl(de) : null
}

/** Campos alterados, em texto curto. O log guarda só o diff em UPDATE. */
export function camposAlterados(
  a: Pick<Atividade, 'acao' | 'depois'>,
  jaMostrouValor: boolean
): string | null {
  if (a.acao !== 'update' || !a.depois) return null
  const chaves = Object.keys(a.depois)
    .filter(k => k !== 'id' && !(jaMostrouValor && k === 'valor'))
  if (chaves.length === 0) return null
  return chaves.slice(0, 4).join(', ') + (chaves.length > 4 ? ` e mais ${chaves.length - 4}` : '')
}
