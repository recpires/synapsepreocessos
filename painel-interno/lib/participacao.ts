/**
 * Fatia de um sócio no resultado, respeitando quando ele entrou e saiu.
 *
 * A primeira versão multiplicava o resultado do ano pela participação de hoje.
 * Funciona enquanto a sociedade não muda; no ano em que alguém entra ou sai,
 * atribui a essa pessoa meses em que ela não era dona de nada — ou tira dela
 * meses em que era.
 *
 * A conta certa é por lançamento: cada real que entrou ou saiu pertence a quem
 * era sócio na data em que ele se moveu.
 */

export type Vigencia = {
  participacao_pct: number
  /** Nulo = sempre foi sócio, para cadastro que não registrou a data. */
  entrada: string | null
  /** Nulo = ainda é sócio. */
  saida: string | null
}

/** Lançamento com sinal: receita positiva, despesa negativa. */
export type Movimento = { data: string; valor: number }

/**
 * Participação vigente numa data.
 *
 * O intervalo é fechado na entrada e aberto na saída: a data de saída é o
 * primeiro dia sem participação. Assim uma troca de sócio no mesmo dia não
 * conta duas vezes.
 */
export function pctNaData(vigencias: Vigencia[], data: string): number {
  for (const v of vigencias) {
    const entrou = !v.entrada || v.entrada <= data
    const saiu = v.saida !== null && v.saida <= data
    if (entrou && !saiu) return v.participacao_pct
  }
  return 0
}

/**
 * Soma dos movimentos ponderada pela participação de cada data.
 *
 * Devolve em reais, já arredondado ao centavo — arredondar só no fim evita a
 * diferença de centavos que aparece quando se arredonda a cada linha.
 */
export function fatiaNoPeriodo(vigencias: Vigencia[], movimentos: Movimento[]): number {
  if (vigencias.length === 0) return 0
  const total = movimentos.reduce(
    (acc, m) => acc + m.valor * (pctNaData(vigencias, m.data) / 100),
    0
  )
  return Math.round(total * 100) / 100
}

/**
 * A participação mudou dentro da janela?
 *
 * Serve para a tela avisar: uma fatia de 10% ao lado de um valor que não é 10%
 * do resultado parece erro de conta, e sem essa ressalva o usuário confere na
 * calculadora e conclui que o painel está quebrado.
 */
export function variouNoPeriodo(
  vigencias: Vigencia[], inicio: string, fim: string
): boolean {
  const relevantes = vigencias.filter(v => {
    const entrouDepois = v.entrada && v.entrada > inicio && v.entrada <= fim
    const saiuDentro = v.saida && v.saida > inicio && v.saida <= fim
    return entrouDepois || saiuDentro
  })
  return relevantes.length > 0
}
