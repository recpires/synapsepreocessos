export type TipoEmpresa = 'cliente' | 'fornecedor' | 'parceiro' | 'propria'
export type TipoProjeto = 'saas' | 'sob_medida' | 'site' | 'manutencao' | 'interno'
export type FaseProjeto =
  | 'descoberta' | 'especificacao' | 'desenvolvimento'
  | 'qa' | 'homologacao' | 'operacao' | 'pausado' | 'encerrado'
export type Saude = 'verde' | 'amarelo' | 'vermelho'
export type StatusFase = 'nao_iniciada' | 'em_andamento' | 'concluida' | 'bloqueada'
export type Severidade = 'critica' | 'alta' | 'media' | 'baixa'
export type StatusErro = 'aberto' | 'investigando' | 'corrigido' | 'nao_reproduz' | 'nao_sera_corrigido'
export type Ambiente = 'producao' | 'homologacao' | 'desenvolvimento'

/** Colunas do kanban, na ordem. `pausado` e `encerrado` ficam fora do quadro. */
export const FASES_KANBAN: FaseProjeto[] = [
  'descoberta', 'especificacao', 'desenvolvimento', 'qa', 'homologacao', 'operacao',
]

/**
 * Fases que não são etapa de trabalho e por isso não viram coluna.
 *
 * Ficam numa faixa abaixo do quadro, e não fora dele: card arrastado para uma
 * fase sem lugar na tela desaparecia sem volta — o projeto seguia no banco e
 * sumia da única tela onde se mexe nele.
 */
export const FASES_FORA_DO_QUADRO: FaseProjeto[] = ['pausado', 'encerrado']

export const FASE_LABEL: Record<FaseProjeto, string> = {
  descoberta:      'Descoberta',
  especificacao:   'Especificação',
  desenvolvimento: 'Desenvolvimento',
  qa:              'QA & Testes',
  homologacao:     'Homologação',
  operacao:        'Em operação',
  pausado:         'Pausado',
  encerrado:       'Encerrado',
}

/** Limite de trabalho em andamento. Estourar acende aviso, não bloqueia. */
export const FASE_WIP: Partial<Record<FaseProjeto, number>> = {
  desenvolvimento: 3,
  qa: 2,
}

export const SAUDE_LABEL: Record<Saude, string> = {
  verde: 'No prazo', amarelo: 'Atenção', vermelho: 'Em risco',
}

export const SEVERIDADE_LABEL: Record<Severidade, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa',
}

export const STATUS_ERRO_LABEL: Record<StatusErro, string> = {
  aberto: 'Aberto',
  investigando: 'Investigando',
  corrigido: 'Corrigido',
  nao_reproduz: 'Não reproduz',
  nao_sera_corrigido: 'Não será corrigido',
}

export const TIPO_PROJETO_LABEL: Record<TipoProjeto, string> = {
  saas: 'SaaS próprio',
  sob_medida: 'Sob medida',
  site: 'Site',
  manutencao: 'Manutenção',
  interno: 'Interno',
}

export type Empresa = {
  id: string
  tipo: TipoEmpresa
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  segmento: string | null
  site: string | null
  responsavel: string | null
  ativa: boolean
}

export type Projeto = {
  id: string
  nome: string
  empresa_id: string | null
  produto_id: string | null
  tipo: TipoProjeto
  fase_atual: FaseProjeto
  saude: Saude
  maturidade_pct: number
  data_inicio: string | null
  prazo: string | null
  valor_contratado: number | null
  responsavel: string | null
  repo: string | null
  observacao: string | null
  arquivado: boolean
}

/** Projeto com o que o card do kanban precisa mostrar sem abrir a ficha. */
export type ProjetoCard = Projeto & {
  empresa_nome: string | null
  erros_criticos: number
  erros_abertos: number
  /** Pausa herdada do produto. Projeto de cliente sem produto usa a fase. */
  produto_pausado: boolean
}

/**
 * Projeto parado por decisão, não por atraso.
 *
 * A pausa de um SaaS próprio mora em `produtos.status`; a de um projeto de
 * cliente, que não tem produto, na fase. Quem está em pausa não conta como
 * risco — vermelho ali é o estado esperado.
 */
export function estaPausado(p: {
  fase_atual: FaseProjeto
  produto_pausado?: boolean
}): boolean {
  return p.fase_atual === 'pausado' || p.fase_atual === 'encerrado' || p.produto_pausado === true
}

export type ProjetoFase = {
  id: string
  projeto_id: string
  ordem: number
  nome: string
  status: StatusFase
  inicio_prev: string | null
  fim_prev: string | null
  inicio_real: string | null
  fim_real: string | null
  pct: number
  entregaveis: string | null
}

export type ProjetoErro = {
  id: string
  projeto_id: string
  codigo: string
  titulo: string
  descricao: string | null
  severidade: Severidade
  status: StatusErro
  ambiente: Ambiente
  origem: string | null
  reproducao: string | null
  causa_raiz: string | null
  correcao: string | null
  commit_fix: string | null
  responsavel: string | null
  detectado_em: string
  resolvido_em: string | null
}

export type CamadaMaturidade = {
  camada: string
  peso: number
  ordem: number
  ajuda: string | null
}

export type NotaMaturidade = {
  camada: string
  peso: number
  nota: number
  evidencia: string | null
  avaliado_em: string
}
