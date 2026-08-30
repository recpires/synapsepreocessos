import type { TipoEmpresa } from './projetos'

export const TIPO_EMPRESA_LABEL: Record<TipoEmpresa, string> = {
  cliente: 'Cliente',
  fornecedor: 'Fornecedor',
  parceiro: 'Parceiro',
  propria: 'Synapse Code',
}

export const TIPOS_EMPRESA: TipoEmpresa[] = ['cliente', 'fornecedor', 'parceiro', 'propria']

export type Endereco = {
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
}

export type EmpresaCompleta = {
  id: string
  tipo: TipoEmpresa
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  inscricao_estadual: string | null
  endereco: Endereco
  segmento: string | null
  site: string | null
  observacao: string | null
  responsavel: string | null
  ativa: boolean
  created_at: string
}

/** Linha da lista: a empresa com os contadores que evitam abrir a ficha. */
export type EmpresaLinha = EmpresaCompleta & {
  contatos: number
  projetos: number
  documentos: number
  contratos: number
}

export type Contato = {
  id: string
  empresa_id: string
  nome: string
  cargo: string | null
  email: string | null
  whatsapp: string | null
  principal: boolean
}

export type DocumentoEmpresa = {
  id: string
  nome: string
  descricao: string | null
  categoria: string
  arquivo_url: string | null
  arquivo_nome: string | null
  created_at: string
}

export type ContratoEmpresa = {
  id: string
  cliente: string
  tipo: string
  status: string
  valor: number | null
  data_inicio: string
  data_vencimento: string | null
  arquivo_url: string | null
}

// ── Sites ────────────────────────────────────────────────────────────────────

export type Site = {
  id: string
  empresa_id: string | null
  projeto_id: string | null
  nome: string
  dominio: string | null
  url: string | null
  stack: string[]
  hospedagem: string | null
  registrar: string | null
  repo: string | null
  status: string
  publicado_em: string | null
  ssl_expira: string | null
  dominio_expira: string | null
  manutencao_mensal: number | null
  observacao: string | null
}

export type SiteLinha = Site & { empresa_nome: string | null }

export const STATUS_SITE = ['no_ar', 'em_construcao', 'pausado', 'encerrado'] as const

export const STATUS_SITE_LABEL: Record<string, string> = {
  no_ar: 'No ar',
  em_construcao: 'Em construção',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
}

/**
 * Dias até uma data. Negativo = já venceu.
 * Compara só a parte de data, para não errar por fuso.
 */
export function diasAte(data: string | null): number | null {
  if (!data) return null
  const hoje = new Date()
  const zero = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  const [a, m, d] = data.split('-').map(Number)
  return Math.round((Date.UTC(a, m - 1, d) - zero) / 86_400_000)
}

/** Vencimento vira alerta a 30 dias. Abaixo de 0 já venceu. */
export function tomDoVencimento(dias: number | null): 'ok' | 'atencao' | 'critico' | 'neutro' {
  if (dias === null) return 'neutro'
  if (dias < 0) return 'critico'
  if (dias <= 30) return 'atencao'
  return 'ok'
}

// ── Contratos ────────────────────────────────────────────────────────────────
// Vieram de types/contratos.ts, que foi aposentado: aquele arquivo existia
// sobretudo para hospedar 190 linhas de HTML de template, e os templates agora
// moram na tabela `contrato_templates`.

export type LadoContrato = 'cliente' | 'empresa'

export type Contrato = {
  id: string
  cliente: string
  tipo: string
  status: 'vigente' | 'em_renovacao' | 'pendente_assinatura' | 'encerrado'
  valor?: number
  data_inicio: string
  data_vencimento?: string
  responsavel: string
  observacao?: string
  arquivo_url?: string
  arquivo_nome?: string
  gerado_por_template?: boolean
  template_tipo?: string
  /** A contraparte: o cliente ou o fornecedor do outro lado do contrato. */
  empresa_id?: string | null
  /** Qual CNPJ *nosso* responde pelo contrato. Distinto de `empresa_id`. */
  empresa_propria_id?: string | null
  projeto_id?: string | null
  /** 'cliente' = acordo com terceiro · 'empresa' = a Synapse é a contratante */
  lado?: LadoContrato
  created_at: string
  created_by: string
}

export type ContratoInsert = Omit<Contrato, 'id' | 'created_at'>

export const TIPOS_CONTRATO = [
  'Desenvolvimento', 'SaaS', 'NDA', 'Manutenção', 'Consultoria', 'Outro',
] as const

/** Categorias usadas quando a Synapse é a contratante (despesas) */
export const TIPOS_CONTRATO_EMPRESA = [
  'Aluguel / Imóvel', 'Contabilidade', 'Hospedagem / Cloud', 'Software / Licença',
  'Fornecedor', 'Funcionário / CLT', 'PJ / Freelancer', 'Telecom / Internet',
  'Marketing', 'Jurídico', 'Seguro', 'Outro',
] as const

export const STATUS_CONTRATO = [
  'vigente', 'em_renovacao', 'pendente_assinatura', 'encerrado',
] as const

export const RESPONSAVEIS = ['Rodrigo', 'Wilian'] as const

/** Tokens do design system — antes eram classes fixas do tema escuro. */
export const STATUS_CORES: Record<string, string> = {
  vigente:             'bg-ok-soft text-ok border border-ok-line',
  em_renovacao:        'bg-warn-soft text-warn border border-warn-line',
  pendente_assinatura: 'bg-info-soft text-info border border-info-line',
  encerrado:           'bg-surface-2 text-muted border border-line',
}

export const STATUS_LABEL: Record<string, string> = {
  vigente:             'Vigente',
  em_renovacao:        'Em renovação',
  pendente_assinatura: 'Pend. assinatura',
  encerrado:           'Encerrado',
}
