'use client'

import { useEffect, useState } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────
type Resultado = 'pendente' | 'passou' | 'falhou' | 'estranho'
type Item = { codigo: string; texto: string }
type Secao = { id: string; titulo: string; itens: Item[] }
type ResultadoRow = { codigo: string; resultado: Resultado; observacao?: string }

// ── Roteiro completo — Nero Barber ────────────────────────────────────────
const SECOES: Secao[] = [
  { id: 'A', titulo: 'A. Autenticação & Conta', itens: [
    { codigo: 'NB_A1',  texto: 'Cadastro novo via Google (seletor de conta aparece)' },
    { codigo: 'NB_A2',  texto: 'Cadastro via e-mail/senha (senha forte)' },
    { codigo: 'NB_A3',  texto: 'Registro com senha fraca "123" → bloqueia com mensagem' },
    { codigo: 'NB_A4',  texto: 'Registro com e-mail já existente → erro claro (não 500)' },
    { codigo: 'NB_A5',  texto: 'Login correto → entra na área /barber' },
    { codigo: 'NB_A6',  texto: 'Login com senha errada → erro, sem vazar detalhe' },
    { codigo: 'NB_A7',  texto: '"Esqueci a senha" → fluxo de redefinição por e-mail' },
    { codigo: 'NB_A8',  texto: 'Redefinir com token válido → senha trocada; login novo funciona' },
    { codigo: 'NB_A9',  texto: 'Redefinir com token inválido/expirado → recusa' },
    { codigo: 'NB_A10', texto: 'Logout → não abre mais /barber (volta ao login)' },
    { codigo: 'NB_A11', texto: '>15 min ocioso e usar o app → renova sessão ou volta ao login limpo' },
    { codigo: 'NB_A12', texto: 'Editar perfil (nome) → reflete no topo' },
    { codigo: 'NB_A13', texto: 'Trocar a própria senha → login novo funciona' },
  ]},
  { id: 'B', titulo: 'B. Onboarding & Barbearia (tenant)', itens: [
    { codigo: 'NB_B1', texto: 'Conta nova sem barbearia → fluxo de criação da barbearia' },
    { codigo: 'NB_B2', texto: 'Criar barbearia (nome, slug, telefone, endereço)' },
    { codigo: 'NB_B3', texto: 'Slug duplicado → erro/validação' },
    { codigo: 'NB_B4', texto: 'Definir horário de funcionamento por dia da semana' },
    { codigo: 'NB_B5', texto: 'Horário de almoço (lunch_break) habilitado → some dos slots' },
    { codigo: 'NB_B6', texto: 'Dia marcado como fechado → sem horários disponíveis' },
    { codigo: 'NB_B7', texto: 'Upload de logo/foto da barbearia' },
    { codigo: 'NB_B8', texto: 'Dono com 2 barbearias → troca de unidade ativa funciona' },
  ]},
  { id: 'C', titulo: 'C. Dashboard (barbeiro)', itens: [
    { codigo: 'NB_C1', texto: 'Abre com KPIs (receita do mês, atendimentos, ticket médio)' },
    { codigo: 'NB_C2', texto: 'Gráfico de receita/retorno renderiza' },
    { codigo: 'NB_C3', texto: 'Conta nova sem dados → zeros, não quebra' },
    { codigo: 'NB_C4', texto: 'Números batem com o lançado em comanda/caixa' },
    { codigo: 'NB_C5', texto: 'BRT: finalizar atendimento às 22h–23h59 → entra no mês/dia certo' },
    { codigo: 'NB_C6', texto: 'Atalhos navegam (agenda, financeiro, comanda)' },
  ]},
  { id: 'D', titulo: 'D. Serviços', itens: [
    { codigo: 'NB_D1', texto: 'Criar serviço (nome, preço, duração)' },
    { codigo: 'NB_D2', texto: 'Preço 0/negativo, duração 0, nome 500+ chars → validação' },
    { codigo: 'NB_D3', texto: 'Editar serviço → persiste e reflete na agenda' },
    { codigo: 'NB_D4', texto: 'Inativar serviço → some da seleção de novo agendamento' },
    { codigo: 'NB_D5', texto: 'Duração específica por barbeiro (barber_service_durations)' },
    { codigo: 'NB_D6', texto: 'Excluir serviço usado em agendamento → comportamento esperado' },
  ]},
  { id: 'E', titulo: 'E. Equipe / Barbeiros (RBAC)', itens: [
    { codigo: 'NB_E1', texto: 'Adicionar barbeiro (nome, vínculo de profile)' },
    { codigo: 'NB_E2', texto: 'Barbeiro staff loga → vê só o permitido (não vê config de dono)' },
    { codigo: 'NB_E3', texto: 'Staff tenta ação de Admin (gerenciar planos/equipe) → bloqueado' },
    { codigo: 'NB_E4', texto: 'Inativar barbeiro → some da agenda/seleção' },
    { codigo: 'NB_E5', texto: 'Limite de barbeiros do plano atingido → bloqueia com aviso de upgrade' },
    { codigo: 'NB_E6', texto: 'Excluir barbeiro com agendamentos → comportamento esperado' },
  ]},
  { id: 'F', titulo: 'F. Clientes (shop_customers)', itens: [
    { codigo: 'NB_F1', texto: 'Criar cliente (nome só) → aparece na busca' },
    { codigo: 'NB_F2', texto: 'Criar com telefone/e-mail/observações' },
    { codigo: 'NB_F3', texto: 'Telefone com letras / nome enorme → validação' },
    { codigo: 'NB_F4', texto: 'Editar cliente → persiste' },
    { codigo: 'NB_F5', texto: 'Buscar por nome e por telefone' },
    { codigo: 'NB_F6', texto: 'Notas técnicas do cliente salvam' },
    { codigo: 'NB_F7', texto: 'Regressão walk-in: criar agendamento digitando nome novo → cliente aparece na busca depois' },
    { codigo: 'NB_F8', texto: 'Walk-in repetido com mesmo nome → reaproveita (não duplica)' },
    { codigo: 'NB_F9', texto: 'Detalhe do cliente: histórico de atendimentos/pacotes aparece' },
  ]},
  { id: 'G', titulo: 'G. Agenda / Agendamentos', itens: [
    { codigo: 'NB_G1',  texto: 'Criar agendamento (cliente, serviço(s), barbeiro, data, hora)' },
    { codigo: 'NB_G2',  texto: 'Múltiplos serviços no mesmo horário → duração soma' },
    { codigo: 'NB_G3',  texto: 'Sem serviço / sem horário → "Complete os dados essenciais"' },
    { codigo: 'NB_G4',  texto: 'Slots respeitam intervalo de 5 min e horário de funcionamento' },
    { codigo: 'NB_G5',  texto: 'Slot ocupado fica indisponível (sem overlap)' },
    { codigo: 'NB_G6',  texto: 'Data passada bloqueada no seletor' },
    { codigo: 'NB_G7',  texto: 'BRT: agendar às 22h–23h59 → cai no dia correto (não pula)' },
    { codigo: 'NB_G8',  texto: 'Visualizações: dia / semana / mês / lista renderizam' },
    { codigo: 'NB_G9',  texto: 'Arrastar card para outro horário (reagendar) → persiste' },
    { codigo: 'NB_G10', texto: 'Mudar status: pendente→confirmado→concluído / faltou / cancelado' },
    { codigo: 'NB_G11', texto: 'Cancelado some da agenda (a menos que "mostrar cancelados")' },
    { codigo: 'NB_G12', texto: 'Excluir agendamento de hoje/futuro → ok; de dia anterior → bloqueado' },
    { codigo: 'NB_G13', texto: 'Sync Google Calendar (se integrado) cria/edita/remove evento' },
    { codigo: 'NB_G14', texto: 'Notificação WhatsApp: confirmação / lembrete / reativação geram link' },
    { codigo: 'NB_G15', texto: 'Regressão mobile/PWA: tocar no card só abre o detalhe (NÃO cancela / NÃO some da agenda)' },
  ]},
  { id: 'H', titulo: 'H. Comanda / Faturamento', itens: [
    { codigo: 'NB_H1',  texto: 'Abrir comanda de um agendamento ("Faturar")' },
    { codigo: 'NB_H2',  texto: 'Serviço(s) do agendamento aparecem editáveis' },
    { codigo: 'NB_H3',  texto: 'Remover procedimento principal (X) → total recalcula' },
    { codigo: 'NB_H4',  texto: 'Adicionar item: Serviço' },
    { codigo: 'NB_H5',  texto: 'Adicionar item: Produto (com quantidade, baixa estoque)' },
    { codigo: 'NB_H6',  texto: 'Adicionar item: Pacote (vende e ativa pacote do cliente)' },
    { codigo: 'NB_H7',  texto: 'Desconto em R$ e em % aplica sobre o subtotal' },
    { codigo: 'NB_H8',  texto: 'Gorjeta fixa e por % (atalhos 5/10/15/20%)' },
    { codigo: 'NB_H9',  texto: 'Pagamento dividido (2–3 métodos); soma tem que fechar o total' },
    { codigo: 'NB_H10', texto: 'Pagamento faltando/sobrando → bloqueia finalizar com aviso' },
    { codigo: 'NB_H11', texto: 'Cliente com assinatura ativa → auto-detecta, método "Assinatura"' },
    { codigo: 'NB_H12', texto: 'Cliente com pacote ativo → auto-detecta, método "Pacote"' },
    { codigo: 'NB_H13', texto: 'Finalizar → agendamento vira concluído, valores no caixa/dashboard' },
    { codigo: 'NB_H14', texto: 'Procedimento trocado (corte→barba) → service_ids salvos refletem o que foi feito' },
    { codigo: 'NB_H15', texto: 'Reabrir / resetar comanda finalizada → volta a confirmado, itens/valores/pagamento limpos' },
    { codigo: 'NB_H16', texto: 'Reabrir comanda paga com pacote → uso do pacote é estornado' },
    { codigo: 'NB_H17', texto: 'Finalizar só com produto (sem serviço) → não zera serviço à toa' },
  ]},
  { id: 'I', titulo: 'I. Pacotes', itens: [
    { codigo: 'NB_I1',  texto: 'Criar pacote (nome, preço, validade em dias, serviços+quantidades)' },
    { codigo: 'NB_I2',  texto: 'Preço 0, validade 0/negativa, sem serviços → validação' },
    { codigo: 'NB_I3',  texto: 'Vender pacote ao cliente (tela de pacotes) → cria customer_package' },
    { codigo: 'NB_I4',  texto: 'Pré-crédito: vincular atendimentos antigos ao novo pacote' },
    { codigo: 'NB_I5',  texto: 'Vender pacote pela comanda (item Pacote) → ativa para o cliente' },
    { codigo: 'NB_I6',  texto: 'Expiração BRT: validade calculada na data certa (sem off-by-one após 21h)' },
    { codigo: 'NB_I7',  texto: 'Baixa automática: finalizar comanda c/ método Pacote → 1 uso debitado' },
    { codigo: 'NB_I8',  texto: 'Baixa 1-clique no agendamento (lista e card do calendário)' },
    { codigo: 'NB_I9',  texto: 'Baixa 1-clique sem pacote que cubra o serviço → erro claro' },
    { codigo: 'NB_I10', texto: 'Saldo esgotado → não deixa dar baixa / não auto-seleciona' },
    { codigo: 'NB_I11', texto: 'Pacote expirado → não conta como ativo' },
    { codigo: 'NB_I12', texto: 'Contador de usos (realizados/restantes) bate na comanda' },
  ]},
  { id: 'J', titulo: 'J. Assinaturas / Clube de Assinatura', itens: [
    { codigo: 'NB_J1', texto: 'Criar plano de assinatura (nome, preço, serviços, limites de uso)' },
    { codigo: 'NB_J2', texto: 'Limite de uso 0 = ilimitado vs limite numérico' },
    { codigo: 'NB_J3', texto: 'Cliente assina (cobrança recorrente Asaas) → status active/trialing' },
    { codigo: 'NB_J4', texto: 'Comanda detecta assinatura e abate o uso' },
    { codigo: 'NB_J5', texto: 'Uso ilimitado nunca esgota; uso limitado esgota e bloqueia' },
    { codigo: 'NB_J6', texto: 'Cancelar assinatura → para de auto-detectar na comanda' },
    { codigo: 'NB_J7', texto: 'Falha de cobrança/inadimplência → status reflete' },
  ]},
  { id: 'K', titulo: 'K. Caixa (PDV diário)', itens: [
    { codigo: 'NB_K1', texto: 'Abrir caixa (saldo inicial)' },
    { codigo: 'NB_K2', texto: 'Venda rápida (quickSale) sem agendamento' },
    { codigo: 'NB_K3', texto: 'Atendimentos finalizados entram no caixa do dia' },
    { codigo: 'NB_K4', texto: 'Fechar caixa → total receita/serviços/produtos/gorjetas bate' },
    { codigo: 'NB_K5', texto: 'BRT: atendimento 22h–23h59 entra no caixa do dia correto' },
    { codigo: 'NB_K6', texto: 'Tentar abrir 2 caixas no mesmo dia → bloqueia (UNIQUE)' },
    { codigo: 'NB_K7', texto: 'Histórico de caixas anteriores abre e bate' },
    { codigo: 'NB_K8', texto: 'Pacote vendido na comanda aparece no breakdown (confirmar categoria)' },
  ]},
  { id: 'L', titulo: 'L. Financeiro', itens: [
    { codigo: 'NB_L1', texto: '/barber/financeiro abre com totais do mês atual' },
    { codigo: 'NB_L2', texto: 'Filtro por mês muda os números (bug histórico: searchParams Promise não-awaited)' },
    { codigo: 'NB_L3', texto: 'BRT: receita das 21h–23h59 cai no mês certo (não vaza p/ o mês seguinte)' },
    { codigo: 'NB_L4', texto: 'Extrato detalhado lista lançamentos do período' },
    { codigo: 'NB_L5', texto: 'Período sem dados → estado vazio, não quebra' },
    { codigo: 'NB_L6', texto: 'Total bate com caixa + comandas do período' },
  ]},
  { id: 'M', titulo: 'M. Estoque / Produtos', itens: [
    { codigo: 'NB_M1', texto: 'Criar produto (nome, preço, estoque)' },
    { codigo: 'NB_M2', texto: 'Preço/estoque negativo → validação' },
    { codigo: 'NB_M3', texto: 'Vender produto na comanda → estoque decrementa' },
    { codigo: 'NB_M4', texto: 'Produto com estoque 0 → não aparece/ável na comanda' },
    { codigo: 'NB_M5', texto: 'Alerta de nível crítico / histórico de movimentação' },
  ]},
  { id: 'N', titulo: 'N. Vitrine pública & QR Code', itens: [
    { codigo: 'NB_N1', texto: 'Abrir /vitrine/{slug} sem login → renderiza serviços/barbeiros' },
    { codigo: 'NB_N2', texto: 'Slug inexistente → 404 amigável' },
    { codigo: 'NB_N3', texto: 'Agendar pela vitrine (cliente final) → cria agendamento' },
    { codigo: 'NB_N4', texto: 'Horários respeitam funcionamento/almoço/ocupação' },
    { codigo: 'NB_N5', texto: 'QR Code da vitrine aponta para o slug certo' },
    { codigo: 'NB_N6', texto: 'Vitrine TV / ranking renderiza' },
    { codigo: 'NB_N7', texto: 'Tema escuro (padrão) e tipografia (Playfair/Inter) corretos' },
  ]},
  { id: 'O', titulo: 'O. Planos & Limites (gating)', itens: [
    { codigo: 'NB_O1', texto: 'Página de planos com comparativo renderiza' },
    { codigo: 'NB_O2', texto: 'Plano Free no limite de barbeiros → bloqueia adicionar' },
    { codigo: 'NB_O3', texto: 'Split de pagamento só Pro+ → Free/básico bloqueado' },
    { codigo: 'NB_O4', texto: 'Multi-unidade só Premium+ → bloqueio + CTA upgrade' },
    { codigo: 'NB_O5', texto: 'Loja de módulos: comprar módulo avulso libera a feature' },
    { codigo: 'NB_O6', texto: 'Downgrade com uso acima do novo limite → comportamento esperado' },
  ]},
  { id: 'P', titulo: 'P. Multi-unidade / Dashboard Consolidado', itens: [
    { codigo: 'NB_P1', texto: 'Dono Premium+ com 2+ unidades → painel consolidado abre' },
    { codigo: 'NB_P2', texto: 'Números somam corretamente entre unidades' },
    { codigo: 'NB_P3', texto: 'Trocar unidade ativa isola dados da unidade' },
    { codigo: 'NB_P4', texto: 'Plano sem multi-unidade → consolidado bloqueado' },
  ]},
  { id: 'Q', titulo: 'Q. Pagamentos Asaas', itens: [
    { codigo: 'NB_Q1', texto: 'Emitir cobrança (link/QR Pix) de uma fatura/assinatura' },
    { codigo: 'NB_Q2', texto: 'Tokenização de cartão (assinatura recorrente)' },
    { codigo: 'NB_Q3', texto: 'Split payment respeita config Asaas (clientes Enterprise)' },
    { codigo: 'NB_Q4', texto: 'Webhook Asaas: pagar cobrança de teste → status vira "pago"' },
    { codigo: 'NB_Q5', texto: 'Webhook sem/com token inválido → 401, idempotente' },
    { codigo: 'NB_Q6', texto: 'Webhook reenviado (mesmo evento) → não duplica (idempotência)' },
  ]},
  { id: 'R', titulo: 'R. Contratos eletrônicos', itens: [
    { codigo: 'NB_R1', texto: 'Gerar contrato e enviar para assinatura por e-mail' },
    { codigo: 'NB_R2', texto: 'Abrir link de assinatura (sem login) → renderiza' },
    { codigo: 'NB_R3', texto: 'Assinar sem nome → bloqueia' },
    { codigo: 'NB_R4', texto: 'Assinar com dados válidos → registra (data/hora/IP)' },
    { codigo: 'NB_R5', texto: 'Contrato já assinado → não permite reassinar' },
  ]},
  { id: 'S', titulo: 'S. Notificações (WhatsApp)', itens: [
    { codigo: 'NB_S1', texto: 'Gerar link de confirmação/lembrete/reativação com texto certo' },
    { codigo: 'NB_S2', texto: 'Cliente sem telefone → ação some/avisa' },
    { codigo: 'NB_S3', texto: 'Mensagem com nome/serviço/horário corretos (BRT)' },
  ]},
  { id: 'T', titulo: 'T. Marketing', itens: [
    { codigo: 'NB_T1', texto: 'Criar campanha (segmento, canal, mensagem)' },
    { codigo: 'NB_T2', texto: 'Campos inválidos → validação' },
    { codigo: 'NB_T3', texto: 'Disparo de teste / agendamento de campanha' },
  ]},
  { id: 'U', titulo: 'U. Atualizações (changelog)', itens: [
    { codigo: 'NB_U1', texto: '/barber/atualizacoes lista versões (timeline)' },
    { codigo: 'NB_U2', texto: 'Selo de novidade aparece quando há versão nova não vista' },
    { codigo: 'NB_U3', texto: 'Abrir a página marca como visto (some o selo)' },
    { codigo: 'NB_U4', texto: 'Última versão (v1.5.0) reflete as entregas recentes' },
  ]},
  { id: 'V', titulo: '⚠️ V. Multi-tenant & Segurança (crítico)', itens: [
    { codigo: 'NB_V1',  texto: 'Barbearia A cria cliente "ALFA-SEGREDO"; copiar o ID da URL' },
    { codigo: 'NB_V2',  texto: 'Barbearia B abre .../{ID-do-A} → 404/negado' },
    { codigo: 'NB_V3',  texto: 'Barbearia B lista clientes/agenda → nada do A aparece' },
    { codigo: 'NB_V4',  texto: 'Repetir ID cruzado em agendamento, comanda, pacote, assinatura' },
    { codigo: 'NB_V5',  texto: 'Staff barber só enxerga a barbearia vinculada' },
    { codigo: 'NB_V6',  texto: 'ID malformado (/.../abc) → erro genérico, sem stack trace' },
    { codigo: 'NB_V7',  texto: 'RLS: toda query filtra barbershop_id (tentar burlar via API)' },
    { codigo: 'NB_V8',  texto: 'Webhook Asaas sem token (POST vazio) → 401' },
    { codigo: 'NB_V9',  texto: 'Site sempre HTTPS; nenhum token/CPF/e-mail na URL' },
    { codigo: 'NB_V10', texto: 'CPF/token Asaas: dados sensíveis criptografados (não em texto puro)' },
  ]},
  { id: 'W', titulo: 'W. PWA', itens: [
    { codigo: 'NB_W1', texto: 'Prompt de instalação aparece (InstallPrompt)' },
    { codigo: 'NB_W2', texto: 'App instalado abre em standalone, retrato, tema preto' },
    { codigo: 'NB_W3', texto: 'Ícones 192/512 e nome "Nero Barber" corretos' },
    { codigo: 'NB_W4', texto: 'Cache do service worker: após deploy, fechar/reabrir o PWA (até 2x) carrega a versão nova' },
    { codigo: 'NB_W5', texto: 'Offline/conexão ruim → comportamento aceitável (sem tela branca)' },
    { codigo: 'NB_W6', texto: 'Regressão: tocar agendamento no PWA abre detalhe (não cancela)' },
  ]},
  { id: 'X', titulo: 'X. Edge / Robustez (cruza vários módulos)', itens: [
    { codigo: 'NB_X1', texto: 'BRT pós-21h: criar agendamento, finalizar comanda e conferir data em agenda + caixa + financeiro + dashboard (tudo no mesmo dia)' },
    { codigo: 'NB_X2', texto: 'Virada de mês (rodar dia 1 de manhã / último dia à noite)' },
    { codigo: 'NB_X3', texto: 'Recarregar (F5) no meio de um formulário → não perde sessão' },
    { codigo: 'NB_X4', texto: 'Voltar/avançar do navegador entre telas → estado coerente' },
    { codigo: 'NB_X5', texto: 'Conexão lenta (Slow 3G) → loaders, sem travar' },
    { codigo: 'NB_X6', texto: 'Mobile/responsivo → layout não quebra (agenda, comanda)' },
    { codigo: 'NB_X7', texto: 'Duplo clique em "finalizar/criar" → não duplica' },
    { codigo: 'NB_X8', texto: 'Sessão expirada no meio de uma ação → trata sem tela branca' },
    { codigo: 'NB_X9', texto: 'searchParams/params (Next 16) sempre await → filtros funcionam' },
  ]},
]

const TOTAL_ITENS = SECOES.reduce((s, sec) => s + sec.itens.length, 0)

// ── Result config ─────────────────────────────────────────────────────────
const RES_CONFIG: Record<Resultado, { label: string; icon: string; cls: string }> = {
  pendente: { label: 'Pendente', icon: '○',  cls: 'border-gray-700 text-gray-600 bg-transparent' },
  passou:   { label: 'Passou',   icon: '✅', cls: 'border-emerald-700 text-emerald-400 bg-emerald-900/20' },
  falhou:   { label: 'Falhou',   icon: '❌', cls: 'border-red-700 text-red-400 bg-red-900/20' },
  estranho: { label: 'Estranho', icon: '⚠️', cls: 'border-amber-700 text-amber-400 bg-amber-900/20' },
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
          className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-[#1a1a24] text-gray-300 text-sm py-2 rounded-lg hover:bg-[#222232] transition-colors">Cancelar</button>
          <button onClick={() => onSave(val)} className="flex-1 bg-amber-600 text-white text-sm py-2 rounded-lg hover:bg-amber-700 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function TestesNeroPage() {
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
    const { data } = await supabase
      .from('testes_resultados')
      .select('*')
      .like('codigo', 'NB_%')
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
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">💈</span>
              <h1 className="text-2xl font-bold text-white">Roteiro de Testes — Nero Barber</h1>
            </div>
            <p className="text-gray-500 text-sm">Clique no botão do item para ciclar: ○ → ✅ → ❌ → ⚠️</p>
          </div>
          <a
            href="/testes"
            className="text-xs text-gray-500 hover:text-white transition-colors border border-[#1e1e2e] rounded-lg px-3 py-2"
          >
            ← CRM Nexio
          </a>
        </div>

        {/* Eixos críticos callout */}
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-amber-400 mb-2">⚠️ Eixos críticos — testar com carinho redobrado</p>
          <p className="text-xs text-amber-300/70">1. <strong>Timezone BRT (UTC-3)</strong> — servidor roda UTC. Testar após 21h BRT e na virada de mês/dia (seções C5, G7, I6, K5, L3, X1, X2)</p>
          <p className="text-xs text-amber-300/70">2. <strong>Multi-tenant</strong> — isolamento por barbershop_id (seção V)</p>
          <p className="text-xs text-amber-300/70">3. <strong>PWA / service worker</strong> — cache pode servir versão antiga (seção W)</p>
          <p className="text-xs text-amber-300/70">4. <strong>Regressões recentes</strong> — G15/W6 (toque mobile), H14–H17 (comanda reset), I5–I9 (pacotes), F7–F8 (walk-in)</p>
        </div>

        {/* Progress */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Progresso geral</p>
            <span className="text-sm font-bold text-white">{progresso}% <span className="text-gray-600 font-normal">({counts.passou + counts.falhou + counts.estranho}/{TOTAL_ITENS})</span></span>
          </div>
          <div className="w-full h-2 bg-[#1e1e2e] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progresso}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(['passou', 'falhou', 'estranho', 'pendente'] as Resultado[]).map(r => (
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
                      {sc.passou > 0   && <span className="text-[10px] text-emerald-400">✅ {sc.passou}</span>}
                      {sc.falhou > 0   && <span className="text-[10px] text-red-400">❌ {sc.falhou}</span>}
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
                          <div
                            key={item.codigo}
                            className={`flex items-start gap-3 px-5 py-3 ${
                              res === 'falhou' ? 'bg-red-950/10' : res === 'passou' ? 'bg-emerald-950/5' : ''
                            }`}
                          >
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

        {/* Priority note */}
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4">
          <p className="text-xs text-amber-400/80">
            <strong>Prioridade ao revisar:</strong> (1) Seção V (isolamento multi-tenant) + timezone BRT — bug aqui = vazamento entre barbearias ou dinheiro/data errados. (2) Regressões G15/W6 (toque mobile/PWA), H14–H17 (comanda reset), I5–I9 (pacote). (3) Validações de quebra. Depois funcional/UX/performance.
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
