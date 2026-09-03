/**
 * Central pessoal: agenda do dia a dia e roadmap por frente.
 *
 * As quatro frentes são fixas porque são as quatro vidas paralelas que o
 * painel precisa manter separadas. Cor não é enfeite aqui: é o que permite
 * bater o olho na linha do tempo e ver que o dia inteiro foi barbearia.
 */

export const FRENTES = ['synapse', 'barbearia', 'fiap', 'pessoal'] as const
export type Frente = (typeof FRENTES)[number]

export const FRENTE_LABEL: Record<Frente, string> = {
  synapse: 'Synapse Code',
  barbearia: 'Barbearia',
  fiap: 'FIAP',
  pessoal: 'Pessoal',
}

/** Hex e não token do painel: identificam a frente, não a superfície. */
export const FRENTE_COR: Record<Frente, string> = {
  synapse: '#3B7DFF',
  barbearia: '#ECA704',
  fiap: '#8B7CF6',
  pessoal: '#22D3B6',
}

export const STATUS = ['planejado', 'andamento', 'pausado', 'concluido'] as const
export type StatusItem = (typeof STATUS)[number]

export const STATUS_LABEL: Record<StatusItem, string> = {
  planejado: 'Planejado',
  andamento: 'Em andamento',
  pausado: 'Pausado',
  concluido: 'Concluído',
}

export const STATUS_COR: Record<StatusItem, string> = {
  planejado: '#8A93A6',
  andamento: '#3B7DFF',
  pausado: '#F5A623',
  concluido: '#2ECC71',
}

export type TipoTarefa = 'tarefa' | 'reuniao'

export type Tarefa = {
  id: string
  titulo: string
  frente: Frente
  tipo: TipoTarefa
  data: string
  /** `null` = tarefa do dia, não do relógio. Fica fora da linha do tempo. */
  hora: string | null
  feito: boolean
}

export type ItemRoadmap = {
  id: string
  frente: Frente
  nome: string
  status: StatusItem
  proximo: string
  ordem: number
}

/** Primeira e última hora da linha do tempo. Fora disso não é dia de trabalho. */
export const HORA_INICIO = 6
export const HORA_FIM = 23

/**
 * Agrupa as tarefas de um dia entre as que têm hora e as que não têm.
 *
 * Separar é o ponto: misturar as duas obrigaria a inventar um horário para
 * quem não tem, e uma tarefa sem hora marcada às 6h vira compromisso das 6h.
 */
export function separarPorHorario(tarefas: Tarefa[]): {
  comHora: Tarefa[]
  semHora: Tarefa[]
} {
  const comHora = tarefas.filter(t => t.hora).sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))
  const semHora = tarefas.filter(t => !t.hora)
  return { comHora, semHora }
}

/** Distribui as tarefas com hora nas faixas da linha do tempo. */
export function porFaixaDeHora(tarefas: Tarefa[]): Map<number, Tarefa[]> {
  const faixas = new Map<number, Tarefa[]>()
  for (const t of tarefas) {
    if (!t.hora) continue
    const h = Number(t.hora.slice(0, 2))
    if (!Number.isFinite(h)) continue
    // Compromisso fora do expediente é encostado na borda em vez de sumir.
    const faixa = Math.min(Math.max(h, HORA_INICIO), HORA_FIM)
    const lista = faixas.get(faixa) ?? []
    lista.push(t)
    faixas.set(faixa, lista)
  }
  return faixas
}

export type ResumoDoDia = { total: number; reunioes: number; feitas: number }

export function resumoDoDia(tarefas: Tarefa[]): ResumoDoDia {
  return {
    total: tarefas.length,
    reunioes: tarefas.filter(t => t.tipo === 'reuniao').length,
    feitas: tarefas.filter(t => t.feito).length,
  }
}

/** Rótulo do dia relativo a hoje, para a agenda não virar lista de datas. */
export function rotuloDoDia(iso: string, hoje: string): string {
  const base = new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
  const dias = Math.round(
    (new Date(iso + 'T00:00:00').getTime() - new Date(hoje + 'T00:00:00').getTime()) / 86_400_000
  )
  if (dias === 0) return `Hoje · ${base}`
  if (dias === 1) return `Amanhã · ${base}`
  if (dias === -1) return `Ontem · ${base}`
  return base
}

/** Soma dias a uma data ISO sem passar por fuso — o dia é o dia local. */
export function somarDias(iso: string, dias: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
