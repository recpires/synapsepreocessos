export type Despesa = {
  id: string
  data: string
  descricao: string
  categoria: string
  produto: string
  forma_pagamento: string
  condicao: string
  valor: number
  tipo: 'fixo' | 'variavel' | 'pontual'
  recorrente: boolean
  periodicidade?: string
  proxima_data?: string
  observacao?: string
  anexo_url?: string
  anexo_nome?: string
  created_at: string
  created_by: string
}

export type DespesaInsert = Omit<Despesa, 'id' | 'created_at'>

export type Receita = {
  id: string
  data: string
  descricao?: string
  produto: string
  cliente?: string
  cliente_id?: string
  valor: number
  tipo: 'recorrente' | 'pontual' | 'setup'
  forma_pagamento?: string
  status: 'recebido' | 'confirmado' | 'estornado' | 'cancelado'
  origem: 'manual' | 'asaas' | string
  origem_id?: string
  observacao?: string
  payload_raw?: unknown
  created_at: string
  updated_at?: string
  created_by?: string
}

export type ReceitaInsert = Omit<Receita, 'id' | 'created_at' | 'updated_at'>

export const FORMAS_RECEBIMENTO = [
  'PIX',
  'Cartão',
  'Boleto',
  'Transferência',
  'Dinheiro',
  'Outro',
] as const

export const CATEGORIAS = [
  'Infraestrutura',
  'Ferramentas',
  'IA / APIs',
  'Hardware',
  'Marketing',
  'Educação',
  'Impostos',
  'Pessoal',
  'Outros',
] as const

export const FORMAS_PAGAMENTO = [
  'Cartão Santander',
  'PIX',
  'Itaú',
  'Boleto',
] as const

export const PRODUTOS_LISTA = [
  'Geral',
  'Nero Barber',
  'Psi Aura',
  'CRM Nexio',
  'Kubic Eng',
  'Arquetipos App',
  'Agentes IA',
  'Design',
] as const

export const CATEGORIA_CORES: Record<string, string> = {
  'Infraestrutura': 'bg-blue-900/40 text-blue-300 border border-blue-800',
  'IA / APIs':      'bg-violet-900/40 text-violet-300 border border-violet-800',
  'Ferramentas':    'bg-emerald-900/40 text-emerald-300 border border-emerald-800',
  'Hardware':       'bg-orange-900/40 text-orange-300 border border-orange-800',
  'Marketing':      'bg-pink-900/40 text-pink-300 border border-pink-800',
  'Educação':       'bg-yellow-900/40 text-yellow-300 border border-yellow-800',
  'Impostos':       'bg-red-900/40 text-red-300 border border-red-800',
  'Pessoal':        'bg-teal-900/40 text-teal-300 border border-teal-800',
  'Outros':         'bg-gray-800 text-gray-400 border border-gray-700',
}
