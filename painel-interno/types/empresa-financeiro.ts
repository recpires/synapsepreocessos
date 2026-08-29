/**
 * Financeiro por empresa própria.
 *
 * Fica em `types/` e não em `server/` porque um arquivo `'use server'` só pode
 * exportar função async — constante exportada de lá quebra o build. Foi
 * exatamente o que aconteceu com `TIPOS_IMPOSTO`.
 */

export type RegimeTributario = 'mei' | 'simples' | 'presumido' | 'real'

export const REGIMES: RegimeTributario[] = ['mei', 'simples', 'presumido', 'real']

export const REGIME_LABEL: Record<RegimeTributario, string> = {
  mei: 'MEI',
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
}

/**
 * Tetos vigentes, em reais, só como sugestão ao cadastrar.
 *
 * O valor real fica gravado em `empresas.teto_faturamento`: teto muda por lei,
 * e número fixo no código envelhece calado até o dia em que engana.
 */
export const TETO_SUGERIDO: Partial<Record<RegimeTributario, number>> = {
  mei: 81_000,
  simples: 4_800_000,
}

export type TipoDivida =
  | 'emprestimo' | 'financiamento' | 'parcelamento_compra'
  | 'parcelamento_imposto' | 'conta_pagar'

export const TIPOS_DIVIDA: TipoDivida[] = [
  'emprestimo', 'financiamento', 'parcelamento_compra',
  'parcelamento_imposto', 'conta_pagar',
]

export const TIPO_DIVIDA_LABEL: Record<TipoDivida, string> = {
  emprestimo: 'Empréstimo',
  financiamento: 'Financiamento',
  parcelamento_compra: 'Compra parcelada',
  parcelamento_imposto: 'Imposto parcelado',
  conta_pagar: 'Conta a pagar',
}

export type StatusDivida = 'ativa' | 'quitada' | 'renegociada' | 'cancelada'

export const STATUS_DIVIDA_LABEL: Record<StatusDivida, string> = {
  ativa: 'Ativa', quitada: 'Quitada',
  renegociada: 'Renegociada', cancelada: 'Cancelada',
}

export type StatusNF = 'emitida' | 'cancelada' | 'substituida'

export const STATUS_NF_LABEL: Record<StatusNF, string> = {
  emitida: 'Emitida', cancelada: 'Cancelada', substituida: 'Substituída',
}

/** As seis retenções que aparecem numa NFS-e brasileira, na ordem da guia. */
export const RETENCOES = ['iss', 'irrf', 'pis', 'cofins', 'csll', 'inss'] as const
export type Retencao = (typeof RETENCOES)[number]

export const RETENCAO_LABEL: Record<Retencao, string> = {
  iss: 'ISS', irrf: 'IRRF', pis: 'PIS',
  cofins: 'COFINS', csll: 'CSLL', inss: 'INSS',
}

export type NotaFiscal = {
  id: string
  empresa_id: string
  tomador_id: string | null
  tomador_nome: string | null
  numero: string
  serie: string | null
  tipo: 'servico' | 'produto'
  data_emissao: string
  competencia: string
  valor_servicos: number
  iss: number
  irrf: number
  pis: number
  cofins: number
  csll: number
  inss: number
  valor_liquido: number
  status: StatusNF
  receita_id: string | null
  projeto_id: string | null
  observacao: string | null
}

export type Divida = {
  id: string
  empresa_id: string
  tipo: TipoDivida
  credor: string
  descricao: string | null
  documento: string | null
  valor_principal: number
  valor_total: number
  taxa_juros_mes: number | null
  parcelas_total: number
  data_contratacao: string
  status: StatusDivida
  observacao: string | null
}

/** `dividas_resumo`: o saldo sai da soma das parcelas, não de coluna gravada. */
export type DividaResumo = Divida & {
  empresa_nome: string
  saldo_devedor: number
  total_pago: number
  parcelas_abertas: number
  parcelas_atrasadas: number
  proximo_vencimento: string | null
}

export type Parcela = {
  id: string
  divida_id: string
  numero: number
  vencimento: string
  valor: number
  pago_em: string | null
  valor_pago: number | null
  despesa_id: string | null
  observacao: string | null
}

export type EmpresaPropria = {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  regime_tributario: RegimeTributario | null
  teto_faturamento: number | null
  abertura: string | null
  ativa: boolean
}

/** Uma linha de `teto_faturamento`, a view dos 12 meses corridos. */
export type UsoDoTeto = {
  empresa_id: string
  razao_social: string
  regime_tributario: RegimeTributario | null
  teto_faturamento: number | null
  faturado_12m: number
  uso_pct: number | null
}

export type Socio = {
  id: string
  empresa_id: string
  nome: string
  /** Preenchido quando o sócio também é usuário do painel. */
  membro_id: string | null
  participacao_pct: number
  papel: string | null
  entrada: string | null
  saida: string | null
  observacao: string | null
}

/** O que a tela de uma empresa mostra: faturado, recebido, gasto, devido. */
export type PosicaoEmpresa = {
  empresa: EmpresaPropria
  teto: UsoDoTeto | null
  faturadoAno: number
  recebidoAno: number
  despesaAno: number
  resultadoAno: number
  saldoDevedor: number
  parcelasAtrasadas: number
  notas: number
  /**
   * Fatia de quem está olhando. `null` quando a pessoa não é sócia declarada
   * — que é diferente de 0%: uma coisa é não ter parte, outra é o cadastro
   * ainda não dizer.
   */
  minhaParticipacaoPct: number | null
  /** Resultado do ano vezes a fatia. `null` pelo mesmo motivo acima. */
  minhaParte: number | null
  /** Quanto do capital já foi declarado. Menos de 100 = cadastro incompleto. */
  declaradoPct: number
}

/**
 * Parcelas de uma dívida, em datas mensais a partir da primeira.
 *
 * A última parcela absorve a sobra do arredondamento: doze de R$ 83,33 não
 * fecham R$ 1.000, e a diferença que some aqui reaparece como saldo devedor
 * que nunca zera.
 */
export function gerarParcelas(
  valorTotal: number,
  quantidade: number,
  primeiroVencimento: string
): { numero: number; vencimento: string; valor: number }[] {
  const centavos = Math.round(valorTotal * 100)
  const base = Math.floor(centavos / quantidade)
  const sobra = centavos - base * quantidade

  const [ano, mes, dia] = primeiroVencimento.split('-').map(Number)

  return Array.from({ length: quantidade }, (_, i) => {
    // `Date.UTC` com mês estourado normaliza sozinho, e dia 31 em mês curto
    // cai no mês seguinte — por isso o dia é fixado depois, no menor entre o
    // pedido e o último do mês.
    const alvo = new Date(Date.UTC(ano, mes - 1 + i, 1))
    const ultimoDia = new Date(Date.UTC(ano, mes + i, 0)).getUTCDate()
    alvo.setUTCDate(Math.min(dia, ultimoDia))

    return {
      numero: i + 1,
      vencimento: alvo.toISOString().slice(0, 10),
      valor: (base + (i === quantidade - 1 ? sobra : 0)) / 100,
    }
  })
}
