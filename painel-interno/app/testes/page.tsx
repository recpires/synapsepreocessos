'use client'

import { useEffect, useState, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────
type Resultado = 'pendente' | 'passou' | 'falhou' | 'estranho'

type Item = { codigo: string; texto: string }
type Secao = { id: string; titulo: string; itens: Item[] }

type ResultadoRow = {
  codigo: string
  resultado: Resultado
  observacao?: string
}

// ── Roteiro completo ───────────────────────────────────────────────────────
const SECOES: Secao[] = [
  { id: 'A', titulo: 'A. Autenticação & Conta', itens: [
    { codigo: 'A1',  texto: 'Cadastro novo via Google (seletor de conta aparece)' },
    { codigo: 'A2',  texto: 'Cadastro via e-mail/senha em /registro (senha forte)' },
    { codigo: 'A3',  texto: 'Registro com senha fraca "123" → bloqueia com mensagem' },
    { codigo: 'A4',  texto: 'Registro com e-mail já existente → erro claro (não 500)' },
    { codigo: 'A5',  texto: 'Login e-mail/senha correto → entra' },
    { codigo: 'A6',  texto: 'Login com senha errada → mensagem de erro, sem vazar detalhe' },
    { codigo: 'A7',  texto: '"Esqueci a senha" → recebe e-mail / fluxo de redefinição' },
    { codigo: 'A8',  texto: 'Redefinir senha com token válido → senha trocada; login novo funciona' },
    { codigo: 'A9',  texto: 'Redefinir com token inválido/expirado → recusa' },
    { codigo: 'A10', texto: 'Logout → não consegue mais abrir /dashboard (vai p/ login)' },
    { codigo: 'A11', texto: 'Ficar >15 min ocioso e usar o app → renova sessão ou volta ao login limpo' },
    { codigo: 'A12', texto: 'Editar perfil (nome) em Configurações → reflete no topo' },
    { codigo: 'A13', texto: 'Trocar a própria senha em Configurações → login novo funciona' },
  ]},
  { id: 'B', titulo: 'B. Dashboard', itens: [
    { codigo: 'B1', texto: 'Abre com KPIs (receita pipeline, conversão, negócios abertos, ganhos)' },
    { codigo: 'B2', texto: 'Gráfico "funil de vendas" / negócios por etapa renderiza' },
    { codigo: 'B3', texto: 'Estado vazio (conta nova, sem dados) não quebra — mostra zeros' },
    { codigo: 'B4', texto: 'Botões "Ver pipeline" / "Ver histórico" navegam certo' },
    { codigo: 'B5', texto: 'Números batem com o que foi criado nos outros módulos' },
  ]},
  { id: 'C', titulo: 'C. Clientes', itens: [
    { codigo: 'C1',  texto: 'Criar cliente (nome só) → aparece na lista' },
    { codigo: 'C2',  texto: 'Criar com todos os campos (CNPJ, site, setor, tamanho, obs.)' },
    { codigo: 'C3',  texto: 'CNPJ inválido / nome 500+ chars → validação' },
    { codigo: 'C4',  texto: 'Editar cliente → persiste' },
    { codigo: 'C5',  texto: 'Buscar/filtrar por nome e por status' },
    { codigo: 'C6',  texto: 'Paginação da lista (criar >20 e navegar páginas)' },
    { codigo: 'C7',  texto: 'Mudar status (ativo/inativo/prospect)' },
    { codigo: 'C8',  texto: 'Definir responsável (owner)' },
    { codigo: 'C9',  texto: 'Excluir → some da lista (soft delete)' },
    { codigo: 'C10', texto: 'Abrir detalhe do cliente → contatos/negócios vinculados aparecem' },
  ]},
  { id: 'D', titulo: 'D. Contatos', itens: [
    { codigo: 'D1', texto: 'Criar contato vinculado a um cliente' },
    { codigo: 'D2', texto: 'Marcar como contato principal' },
    { codigo: 'D3', texto: 'E-mail malformado (abc@) / telefone com letras → validação' },
    { codigo: 'D4', texto: 'Editar e excluir' },
    { codigo: 'D5', texto: 'Contato sem cliente (avulso) — comportamento esperado?' },
  ]},
  { id: 'E', titulo: 'E. Tags', itens: [
    { codigo: 'E1', texto: 'Criar tag com nome + cor #RRGGBB' },
    { codigo: 'E2', texto: 'Cor inválida ("vermelho") → 400' },
    { codigo: 'E3', texto: 'Associar tag a cliente / a contato' },
    { codigo: 'E4', texto: 'Desassociar tag' },
    { codigo: 'E5', texto: 'Nome de tag duplicado no mesmo tenant → comportamento esperado' },
  ]},
  { id: 'F', titulo: 'F. Pipeline & Etapas', itens: [
    { codigo: 'F1', texto: 'Pipeline padrão existe ao criar a conta (etapas pré-criadas)' },
    { codigo: 'F2', texto: 'Criar novo pipeline' },
    { codigo: 'F3', texto: 'Criar/renomear/reordenar etapas' },
    { codigo: 'F4', texto: 'Definir probabilidade e cor da etapa' },
    { codigo: 'F5', texto: 'Marcar etapa como ganho/perdido' },
    { codigo: 'F6', texto: 'Excluir etapa com negócios dentro → comportamento esperado' },
  ]},
  { id: 'G', titulo: 'G. Negócios / Kanban', itens: [
    { codigo: 'G1',  texto: 'Criar negócio (título, valor, cliente, contato, etapa)' },
    { codigo: 'G2',  texto: 'Valor negativo → validação' },
    { codigo: 'G3',  texto: 'Arrastar card entre etapas (drag-and-drop) → persiste' },
    { codigo: 'G4',  texto: 'Marcar como ganho' },
    { codigo: 'G5',  texto: 'Marcar como perdido com motivo' },
    { codigo: 'G6',  texto: 'Marcar como perdido sem motivo → 400' },
    { codigo: 'G7',  texto: 'Histórico de mudança de etapa registrado' },
    { codigo: 'G8',  texto: 'Editar valor/previsão de fechamento' },
    { codigo: 'G9',  texto: 'Excluir negócio' },
    { codigo: 'G10', texto: 'Filtrar pipeline por pipeline específico' },
  ]},
  { id: 'H', titulo: 'H. Atividades', itens: [
    { codigo: 'H1', texto: 'Criar atividade (call/email/meeting/task/note/whatsapp) ligada a negócio/cliente' },
    { codigo: 'H2', texto: 'Tipo inválido ("xyz") → 400' },
    { codigo: 'H3', texto: 'Agendar com data futura / data passada' },
    { codigo: 'H4', texto: 'Concluir atividade (marca completed_at)' },
    { codigo: 'H5', texto: 'Excluir atividade' },
    { codigo: 'H6', texto: 'Listar atividades por negócio e por cliente' },
  ]},
  { id: 'I', titulo: 'I. Inbox (mensagens)', itens: [
    { codigo: 'I1', texto: 'Listar conversas (estado vazio não quebra)' },
    { codigo: 'I2', texto: 'Abrir conversa e ver mensagens (paginação)' },
    { codigo: 'I3', texto: 'Enviar mensagem' },
    { codigo: 'I4', texto: 'Enviar mensagem vazia → 400' },
    { codigo: 'I5', texto: 'Mensagem com 5000+ chars → comportamento esperado' },
    { codigo: 'I6', texto: 'Marcar conversa como lida / resolvida' },
    { codigo: 'I7', texto: 'Vincular conversa a contato/cliente' },
    { codigo: 'I8', texto: 'Badge de não-lidas no menu atualiza' },
  ]},
  { id: 'J', titulo: 'J. Propostas', itens: [
    { codigo: 'J1',  texto: 'Criar proposta a partir de um negócio' },
    { codigo: 'J2',  texto: 'Validade 0 ou 999 dias → 400 (1–365)' },
    { codigo: 'J3',  texto: 'Editar proposta (desconto, condições, observações)' },
    { codigo: 'J4',  texto: 'Adicionar/editar seções e itens' },
    { codigo: 'J5',  texto: 'Gerar/baixar PDF da proposta' },
    { codigo: 'J6',  texto: 'Enviar proposta (gera link público)' },
    { codigo: 'J7',  texto: 'Abrir o link público (sem login) → renderiza' },
    { codigo: 'J8',  texto: 'Assinar a proposta pública sem nome → 400' },
    { codigo: 'J9',  texto: 'Assinar com nome + e-mail válido → registra assinatura' },
    { codigo: 'J10', texto: 'Rejeitar a proposta pública' },
    { codigo: 'J11', texto: 'Duplicar proposta' },
  ]},
  { id: 'K', titulo: 'K. Financeiro (Faturas / Pagamentos)', itens: [
    { codigo: 'K1', texto: 'Criar fatura (descrição, valor, vencimento, forma, tipo)' },
    { codigo: 'K2', texto: 'Valor 0 / vencimento vazio / desconto 150% → 400' },
    { codigo: 'K3', texto: 'Editar fatura' },
    { codigo: 'K4', texto: 'Emitir cobrança (integração Asaas) → gera cobrança/link' },
    { codigo: 'K5', texto: 'Cancelar fatura' },
    { codigo: 'K6', texto: 'Resumo financeiro (/financeiro → totais) bate' },
    { codigo: 'K7', texto: 'Filtrar faturas por status e por cliente' },
    { codigo: 'K8', texto: 'Webhook Asaas: pagar a cobrança de teste e ver a fatura virar "paga"' },
  ]},
  { id: 'L', titulo: 'L. Metas', itens: [
    { codigo: 'L1', texto: 'Criar meta (título, tipo, período, valor alvo, datas, usuário)' },
    { codigo: 'L2', texto: 'DataFim < DataInício → 400' },
    { codigo: 'L3', texto: 'Valor alvo 0 → 400' },
    { codigo: 'L4', texto: 'Editar meta / desativar meta' },
    { codigo: 'L5', texto: 'Recalcular metas → progresso atualiza' },
    { codigo: 'L6', texto: 'Progresso reflete negócios ganhos no período' },
  ]},
  { id: 'M', titulo: 'M. Comissões', itens: [
    { codigo: 'M1', texto: 'Configurar regra de comissão' },
    { codigo: 'M2', texto: 'Criar comissão (usuário, negócio, valor, percentual)' },
    { codigo: 'M3', texto: 'Percentual 200 → 400 (0–100)' },
    { codigo: 'M4', texto: 'Aprovar comissão' },
    { codigo: 'M5', texto: 'Pagar comissão' },
    { codigo: 'M6', texto: 'Cancelar comissão' },
    { codigo: 'M7', texto: 'Resumo de comissões bate' },
  ]},
  { id: 'N', titulo: 'N. Automações', itens: [
    { codigo: 'N1', texto: 'Criar automação (gatilho, condição, ação, config)' },
    { codigo: 'N2', texto: 'Sem gatilho/ação → 400' },
    { codigo: 'N3', texto: 'AcaoConfigJson inválido ({abc) → 400' },
    { codigo: 'N4', texto: 'Ativar / desativar automação' },
    { codigo: 'N5', texto: 'Disparar o gatilho de verdade (ex.: mover negócio) → ação executa' },
    { codigo: 'N6', texto: 'Ver histórico de execução da automação' },
    { codigo: 'N7', texto: 'Editar / excluir automação' },
  ]},
  { id: 'O', titulo: 'O. Formulários (captura de leads)', itens: [
    { codigo: 'O1', texto: 'Criar formulário (nome, pipeline, etapa, campos)' },
    { codigo: 'O2', texto: 'CamposJson/EstiloJson inválido → 400' },
    { codigo: 'O3', texto: 'Abrir o formulário público e submeter' },
    { codigo: 'O4', texto: 'Submissão cria lead/negócio na etapa configurada' },
    { codigo: 'O5', texto: 'Notificação/Inbox da submissão' },
    { codigo: 'O6', texto: 'Editar / excluir formulário' },
  ]},
  { id: 'P', titulo: 'P. Relatórios', itens: [
    { codigo: 'P1', texto: 'Relatório de vendas (filtro por período) renderiza' },
    { codigo: 'P2', texto: 'Relatório de clientes' },
    { codigo: 'P3', texto: 'Relatório financeiro (filtro por período)' },
    { codigo: 'P4', texto: 'Exportar CSV (/relatorios/exportar/{tipo}) → baixa arquivo válido' },
    { codigo: 'P5', texto: 'Período sem dados → estado vazio, não quebra' },
  ]},
  { id: 'Q', titulo: 'Q. Integrações', itens: [
    { codigo: 'Q1', texto: 'Listar integrações disponíveis' },
    { codigo: 'Q2', texto: 'Salvar configuração de uma integração' },
    { codigo: 'Q3', texto: 'Desativar integração' },
    { codigo: 'Q4', texto: 'WhatsApp/Evolution — pendente de montar o servidor Evolution' },
  ]},
  { id: 'R', titulo: 'R. White-label / Personalização', itens: [
    { codigo: 'R1', texto: 'Alterar logo/cores/identidade do tenant' },
    { codigo: 'R2', texto: 'Mudanças refletem na UI (login/app do tenant)' },
    { codigo: 'R3', texto: 'Salvar com dados inválidos → validação' },
    { codigo: 'R4', texto: 'Reset para o padrão' },
  ]},
  { id: 'S', titulo: 'S. Configurações', itens: [
    { codigo: 'S1', texto: 'Editar perfil (nome)' },
    { codigo: 'S2', texto: 'Trocar senha' },
    { codigo: 'S3', texto: 'Demais preferências do tenant salvam e persistem' },
  ]},
  { id: 'T', titulo: 'T. Admin / Superadmin', itens: [
    { codigo: 'T1', texto: 'Login com a conta admin → vai direto para /admin' },
    { codigo: 'T2', texto: 'Dashboard de plataforma: tenants/usuários/clientes/negócios' },
    { codigo: 'T3', texto: 'Números batem com a realidade (cross-tenant)' },
    { codigo: 'T4', texto: 'Conta não-admin tentando /admin → bloqueado' },
    { codigo: 'T5', texto: 'Logout do admin funciona' },
  ]},
  { id: 'U', titulo: '⚠️ U. Multi-tenant & Segurança (crítico)', itens: [
    { codigo: 'U1', texto: 'Tenant A cria cliente "ALFA-SEGREDO"; copiar o ID da URL' },
    { codigo: 'U2', texto: 'Tenant B abre .../clientes/{ID-do-A} → 404/negado' },
    { codigo: 'U3', texto: 'Tenant B lista clientes → nada do A aparece' },
    { codigo: 'U4', texto: 'Repetir o ID cruzado em negócio, fatura, proposta, atividade' },
    { codigo: 'U5', texto: 'ID malformado (/clientes/abc) → erro genérico, sem stack trace' },
    { codigo: 'U6', texto: '/hangfire em produção → 404' },
    { codigo: 'U7', texto: 'Webhook Asaas sem token (POST vazio) → 401' },
    { codigo: 'U8', texto: 'Site sempre HTTPS; nenhum token/e-mail sensível na URL' },
  ]},
  { id: 'V', titulo: 'V. Edge / Robustez', itens: [
    { codigo: 'V1', texto: 'Recarregar (F5) no meio de um formulário → não perde sessão' },
    { codigo: 'V2', texto: 'Voltar/avançar do navegador entre telas → estado coerente' },
    { codigo: 'V3', texto: 'Conexão lenta (DevTools → Network → Slow 3G) → loaders, sem travar' },
    { codigo: 'V4', texto: 'Abrir em mobile/responsivo → layout não quebra' },
    { codigo: 'V5', texto: 'Duplo clique em "salvar/criar" → não cria duplicado' },
    { codigo: 'V6', texto: 'Sessão expirada no meio de uma ação → trata sem tela branca' },
  ]},
]

const TOTAL_ITENS = SECOES.reduce((s, sec) => s + sec.itens.length, 0)

// ── Result config ─────────────────────────────────────────────────────────
const RES_CONFIG: Record<Resultado, { label: string; icon: string; cls: string }> = {
  pendente:  { label: 'Pendente', icon: '○',  cls: 'border-gray-700 text-gray-600 bg-transparent' },
  passou:    { label: 'Passou',   icon: '✅', cls: 'border-emerald-700 text-emerald-400 bg-emerald-900/20' },
  falhou:    { label: 'Falhou',   icon: '❌', cls: 'border-red-700 text-red-400 bg-red-900/20' },
  estranho:  { label: 'Estranho', icon: '⚠️', cls: 'border-amber-700 text-amber-400 bg-amber-900/20' },
}

const CYCLE: Resultado[] = ['pendente', 'passou', 'falhou', 'estranho']

// ── Obs modal ─────────────────────────────────────────────────────────────
function ObsModal({ codigo, obs, onSave, onClose }: {
  codigo: string; obs: string
  onSave: (obs: string) => void; onClose: () => void
}) {
  const [val, setVal] = useState(obs)
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Observação — {codigo}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-sm">✕</button>
        </div>
        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          rows={4}
          placeholder="Descreva o comportamento encontrado, erro, URL, screenshot..."
          className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-[#1a1a24] text-gray-300 text-sm py-2 rounded-lg hover:bg-[#222232] transition-colors">Cancelar</button>
          <button onClick={() => onSave(val)} className="flex-1 bg-violet-600 text-white text-sm py-2 rounded-lg hover:bg-violet-700 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function TestesPage() {
  const supabase = createClient()
  const [resultados, setResultados] = useState<Record<string, ResultadoRow>>({})
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [obsModal, setObsModal] = useState<{ codigo: string; obs: string } | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
    fetchResultados()
  }, [])

  async function fetchResultados() {
    setLoading(true)
    const { data } = await supabase.from('testes_resultados').select('*')
    const map: Record<string, ResultadoRow> = {}
    ;(data ?? []).forEach((r: ResultadoRow) => { map[r.codigo] = r })
    setResultados(map)
    setLoading(false)
  }

  function getRes(codigo: string): Resultado {
    return (resultados[codigo]?.resultado as Resultado) ?? 'pendente'
  }

  function getObs(codigo: string): string {
    return resultados[codigo]?.observacao ?? ''
  }

  async function cycleResult(codigo: string) {
    const current = getRes(codigo)
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]
    // Optimistic
    setResultados(prev => ({
      ...prev,
      [codigo]: { codigo, resultado: next, observacao: prev[codigo]?.observacao }
    }))
    setSaving(codigo)
    await supabase.from('testes_resultados').upsert({
      codigo, resultado: next,
      observacao: resultados[codigo]?.observacao ?? null,
      updated_at: new Date().toISOString(),
      updated_by: userEmail,
    }, { onConflict: 'codigo' })
    setSaving(null)
  }

  async function saveObs(codigo: string, obs: string) {
    setResultados(prev => ({ ...prev, [codigo]: { ...prev[codigo], codigo, resultado: getRes(codigo), observacao: obs } }))
    setObsModal(null)
    await supabase.from('testes_resultados').upsert({
      codigo, resultado: getRes(codigo), observacao: obs || null,
      updated_at: new Date().toISOString(), updated_by: userEmail,
    }, { onConflict: 'codigo' })
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  const counts = { passou: 0, falhou: 0, estranho: 0, pendente: 0 }
  SECOES.forEach(s => s.itens.forEach(i => { counts[getRes(i.codigo)]++ }))
  const progresso = Math.round(((counts.passou + counts.falhou + counts.estranho) / TOTAL_ITENS) * 100)

  function secaoStats(sec: Secao) {
    const c = { passou: 0, falhou: 0, estranho: 0, pendente: 0 }
    sec.itens.forEach(i => c[getRes(i.codigo)]++)
    return c
  }

  return (
    <PainelShell>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Roteiro de Testes — CRM Nexio</h1>
          <p className="text-gray-500 text-sm mt-0.5">Clique no botão do item para ciclar: ○ → ✅ → ❌ → ⚠️</p>
        </div>

        {/* Progress */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Progresso geral</p>
            <span className="text-sm font-bold text-white">{progresso}%</span>
          </div>
          <div className="w-full h-2 bg-[#1e1e2e] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${progresso}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(['passou','falhou','estranho','pendente'] as Resultado[]).map(r => (
              <div key={r} className={`rounded-lg border px-3 py-2 text-center ${RES_CONFIG[r].cls}`}>
                <p className="text-lg font-bold">{counts[r]}</p>
                <p className="text-[10px] uppercase tracking-wide opacity-70">{RES_CONFIG[r].label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        {loading ? (
          <div className="py-20 text-center text-gray-600 text-sm">Carregando...</div>
        ) : (
          <div className="space-y-3">
            {SECOES.map(sec => {
              const sc = secaoStats(sec)
              const isOpen = !collapsed[sec.id]
              const allPassed = sc.passou === sec.itens.length
              const hasFailed = sc.falhou > 0

              return (
                <div key={sec.id} className={`bg-[#111118] border rounded-xl overflow-hidden transition-colors ${
                  hasFailed ? 'border-red-900/50' : allPassed ? 'border-emerald-900/40' : 'border-[#1e1e2e]'
                }`}>
                  {/* Section header */}
                  <button
                    onClick={() => setCollapsed(c => ({ ...c, [sec.id]: !c[sec.id] }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#16161f] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">{sec.titulo}</span>
                      <span className="text-[10px] text-gray-600">{sec.itens.length} itens</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sc.passou > 0  && <span className="text-[10px] text-emerald-400">✅ {sc.passou}</span>}
                      {sc.falhou > 0  && <span className="text-[10px] text-red-400">❌ {sc.falhou}</span>}
                      {sc.estranho > 0 && <span className="text-[10px] text-amber-400">⚠️ {sc.estranho}</span>}
                      <span className={`text-gray-500 text-sm transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                    </div>
                  </button>

                  {/* Items */}
                  {isOpen && (
                    <div className="border-t border-[#1e1e2e] divide-y divide-[#1a1a24]">
                      {sec.itens.map(item => {
                        const res = getRes(item.codigo)
                        const obs = getObs(item.codigo)
                        const cfg = RES_CONFIG[res]
                        return (
                          <div key={item.codigo} className={`flex items-start gap-3 px-5 py-3 ${res === 'falhou' ? 'bg-red-950/10' : res === 'passou' ? 'bg-emerald-950/5' : ''}`}>
                            {/* Toggle button */}
                            <button
                              onClick={() => cycleResult(item.codigo)}
                              disabled={saving === item.codigo}
                              className={`flex-shrink-0 w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-all ${cfg.cls} ${saving === item.codigo ? 'opacity-50' : 'hover:opacity-80'}`}
                              title="Clique para mudar resultado"
                            >
                              {saving === item.codigo ? '…' : cfg.icon}
                            </button>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">{item.codigo}</span>
                                <p className={`text-sm leading-snug ${res === 'passou' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                  {item.texto}
                                </p>
                              </div>
                              {obs && (
                                <p className="text-[11px] text-amber-400/70 mt-1 truncate">↳ {obs}</p>
                              )}
                            </div>

                            {/* Obs button */}
                            <button
                              onClick={() => setObsModal({ codigo: item.codigo, obs })}
                              className={`flex-shrink-0 text-[11px] px-2 py-1 rounded transition-colors ${obs ? 'text-amber-400 hover:text-amber-300' : 'text-gray-700 hover:text-gray-400'}`}
                              title="Adicionar observação"
                            >
                              {obs ? '📝' : '+ obs'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Note */}
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4">
          <p className="text-xs text-amber-400/80">
            <strong>Prioridade:</strong> Seção U (isolamento multi-tenant) e todos os itens de validação 400 são críticos — bug aqui = vazamento entre clientes ou dado corrompido. Resolver antes de qualquer item de UX.
          </p>
        </div>
      </div>

      {/* Obs modal */}
      {obsModal && (
        <ObsModal
          codigo={obsModal.codigo}
          obs={obsModal.obs}
          onSave={obs => saveObs(obsModal.codigo, obs)}
          onClose={() => setObsModal(null)}
        />
      )}
    </PainelShell>
  )
}
