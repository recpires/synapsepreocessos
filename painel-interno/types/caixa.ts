/**
 * Constantes de caixa e impostos.
 *
 * Ficam fora de `server/caixa.ts` porque um arquivo `'use server'` só pode
 * exportar funções async — exportar um array de lá quebra o build.
 */

export const TIPOS_IMPOSTO = [
  'DAS (Simples Nacional)', 'ISS', 'DARE', 'IRPJ', 'CSLL', 'INSS', 'FGTS', 'Outro',
] as const

export const TIPOS_CONTA = ['corrente', 'poupanca', 'investimento', 'caixa'] as const

export const LABEL_TIPO_CONTA: Record<string, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  investimento: 'Investimento',
  caixa: 'Dinheiro em caixa',
}
