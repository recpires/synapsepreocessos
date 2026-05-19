'use client'

import { useEffect, useState } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────
type Resultado = 'pendente' | 'passou' | 'falhou' | 'estranho'
type Item    = { codigo: string; texto: string }
type Secao   = { id: string; titulo: string; itens: Item[] }
type ResultadoRow = { codigo: string; resultado: Resultado; observacao?: string }
type Produto = 'crm' | 'nero' | 'kubic'

// ══════════════════════════════════════════════════════════════════════════
// SEÇÕES — CRM NEXIO
// ══════════════════════════════════════════════════════════════════════════
const SECOES_CRM: Secao[] = [
  { id:'A', titulo:'A. Autenticação & Conta', itens:[
    { codigo:'A1',  texto:'Cadastro novo via Google (seletor de conta aparece)' },
    { codigo:'A2',  texto:'Cadastro via e-mail/senha em /registro (senha forte)' },
    { codigo:'A3',  texto:'Registro com senha fraca "123" → bloqueia com mensagem' },
    { codigo:'A4',  texto:'Registro com e-mail já existente → erro claro (não 500)' },
    { codigo:'A5',  texto:'Login e-mail/senha correto → entra' },
    { codigo:'A6',  texto:'Login com senha errada → mensagem de erro, sem vazar detalhe' },
    { codigo:'A7',  texto:'"Esqueci a senha" → recebe e-mail / fluxo de redefinição' },
    { codigo:'A8',  texto:'Redefinir senha com token válido → senha trocada; login novo funciona' },
    { codigo:'A9',  texto:'Redefinir com token inválido/expirado → recusa' },
    { codigo:'A10', texto:'Logout → não consegue mais abrir /dashboard (vai p/ login)' },
    { codigo:'A11', texto:'Ficar >15 min ocioso → renova sessão ou volta ao login limpo' },
    { codigo:'A12', texto:'Editar perfil (nome) em Configurações → reflete no topo' },
    { codigo:'A13', texto:'Trocar a própria senha em Configurações → login novo funciona' },
  ]},
  { id:'B', titulo:'B. Dashboard', itens:[
    { codigo:'B1', texto:'Abre com KPIs (receita pipeline, conversão, negócios abertos, ganhos)' },
    { codigo:'B2', texto:'Gráfico "funil de vendas" / negócios por etapa renderiza' },
    { codigo:'B3', texto:'Estado vazio (conta nova, sem dados) não quebra — mostra zeros' },
    { codigo:'B4', texto:'Botões "Ver pipeline" / "Ver histórico" navegam certo' },
    { codigo:'B5', texto:'Números batem com o que foi criado nos outros módulos' },
  ]},
  { id:'C', titulo:'C. Clientes', itens:[
    { codigo:'C1',  texto:'Criar cliente (nome só) → aparece na lista' },
    { codigo:'C2',  texto:'Criar com todos os campos (CNPJ, site, setor, tamanho, obs.)' },
    { codigo:'C3',  texto:'CNPJ inválido / nome 500+ chars → validação' },
    { codigo:'C4',  texto:'Editar cliente → persiste' },
    { codigo:'C5',  texto:'Buscar/filtrar por nome e por status' },
    { codigo:'C6',  texto:'Paginação da lista (criar >20 e navegar páginas)' },
    { codigo:'C7',  texto:'Mudar status (ativo/inativo/prospect)' },
    { codigo:'C8',  texto:'Definir responsável (owner)' },
    { codigo:'C9',  texto:'Excluir → some da lista (soft delete)' },
    { codigo:'C10', texto:'Abrir detalhe do cliente → contatos/negócios vinculados aparecem' },
  ]},
  { id:'D', titulo:'D. Contatos', itens:[
    { codigo:'D1', texto:'Criar contato vinculado a um cliente' },
    { codigo:'D2', texto:'Marcar como contato principal' },
    { codigo:'D3', texto:'E-mail malformado (abc@) / telefone com letras → validação' },
    { codigo:'D4', texto:'Editar e excluir' },
    { codigo:'D5', texto:'Contato sem cliente (avulso) — comportamento esperado?' },
  ]},
  { id:'E', titulo:'E. Tags', itens:[
    { codigo:'E1', texto:'Criar tag com nome + cor #RRGGBB' },
    { codigo:'E2', texto:'Cor inválida ("vermelho") → 400' },
    { codigo:'E3', texto:'Associar tag a cliente / a contato' },
    { codigo:'E4', texto:'Desassociar tag' },
    { codigo:'E5', texto:'Nome de tag duplicado no mesmo tenant → comportamento esperado' },
  ]},
  { id:'F', titulo:'F. Pipeline & Etapas', itens:[
    { codigo:'F1', texto:'Pipeline padrão existe ao criar a conta (etapas pré-criadas)' },
    { codigo:'F2', texto:'Criar novo pipeline' },
    { codigo:'F3', texto:'Criar/renomear/reordenar etapas' },
    { codigo:'F4', texto:'Definir probabilidade e cor da etapa' },
    { codigo:'F5', texto:'Marcar etapa como ganho/perdido' },
    { codigo:'F6', texto:'Excluir etapa com negócios dentro → comportamento esperado' },
  ]},
  { id:'G', titulo:'G. Negócios / Kanban', itens:[
    { codigo:'G1',  texto:'Criar negócio (título, valor, cliente, contato, etapa)' },
    { codigo:'G2',  texto:'Valor negativo → validação' },
    { codigo:'G3',  texto:'Arrastar card entre etapas (drag-and-drop) → persiste' },
    { codigo:'G4',  texto:'Marcar como ganho' },
    { codigo:'G5',  texto:'Marcar como perdido com motivo' },
    { codigo:'G6',  texto:'Marcar como perdido sem motivo → 400' },
    { codigo:'G7',  texto:'Histórico de mudança de etapa registrado' },
    { codigo:'G8',  texto:'Editar valor/previsão de fechamento' },
    { codigo:'G9',  texto:'Excluir negócio' },
    { codigo:'G10', texto:'Filtrar pipeline por pipeline específico' },
  ]},
  { id:'H', titulo:'H. Atividades', itens:[
    { codigo:'H1', texto:'Criar atividade (call/email/meeting/task/note/whatsapp) ligada a negócio/cliente' },
    { codigo:'H2', texto:'Tipo inválido ("xyz") → 400' },
    { codigo:'H3', texto:'Agendar com data futura / data passada' },
    { codigo:'H4', texto:'Concluir atividade (marca completed_at)' },
    { codigo:'H5', texto:'Excluir atividade' },
    { codigo:'H6', texto:'Listar atividades por negócio e por cliente' },
  ]},
  { id:'I', titulo:'I. Inbox (mensagens)', itens:[
    { codigo:'I1', texto:'Listar conversas (estado vazio não quebra)' },
    { codigo:'I2', texto:'Abrir conversa e ver mensagens (paginação)' },
    { codigo:'I3', texto:'Enviar mensagem' },
    { codigo:'I4', texto:'Enviar mensagem vazia → 400' },
    { codigo:'I5', texto:'Mensagem com 5000+ chars → comportamento esperado' },
    { codigo:'I6', texto:'Marcar conversa como lida / resolvida' },
    { codigo:'I7', texto:'Vincular conversa a contato/cliente' },
    { codigo:'I8', texto:'Badge de não-lidas no menu atualiza' },
  ]},
  { id:'J', titulo:'J. Propostas', itens:[
    { codigo:'J1',  texto:'Criar proposta a partir de um negócio' },
    { codigo:'J2',  texto:'Validade 0 ou 999 dias → 400 (1–365)' },
    { codigo:'J3',  texto:'Editar proposta (desconto, condições, observações)' },
    { codigo:'J4',  texto:'Adicionar/editar seções e itens' },
    { codigo:'J5',  texto:'Gerar/baixar PDF da proposta' },
    { codigo:'J6',  texto:'Enviar proposta (gera link público)' },
    { codigo:'J7',  texto:'Abrir o link público (sem login) → renderiza' },
    { codigo:'J8',  texto:'Assinar a proposta pública sem nome → 400' },
    { codigo:'J9',  texto:'Assinar com nome + e-mail válido → registra assinatura' },
    { codigo:'J10', texto:'Rejeitar a proposta pública' },
    { codigo:'J11', texto:'Duplicar proposta' },
  ]},
  { id:'K', titulo:'K. Financeiro (Faturas / Pagamentos)', itens:[
    { codigo:'K1', texto:'Criar fatura (descrição, valor, vencimento, forma, tipo)' },
    { codigo:'K2', texto:'Valor 0 / vencimento vazio / desconto 150% → 400' },
    { codigo:'K3', texto:'Editar fatura' },
    { codigo:'K4', texto:'Emitir cobrança (integração Asaas) → gera cobrança/link' },
    { codigo:'K5', texto:'Cancelar fatura' },
    { codigo:'K6', texto:'Resumo financeiro (/financeiro → totais) bate' },
    { codigo:'K7', texto:'Filtrar faturas por status e por cliente' },
    { codigo:'K8', texto:'Webhook Asaas: pagar a cobrança de teste e ver a fatura virar "paga"' },
  ]},
  { id:'L', titulo:'L. Metas', itens:[
    { codigo:'L1', texto:'Criar meta (título, tipo, período, valor alvo, datas, usuário)' },
    { codigo:'L2', texto:'DataFim < DataInício → 400' },
    { codigo:'L3', texto:'Valor alvo 0 → 400' },
    { codigo:'L4', texto:'Editar meta / desativar meta' },
    { codigo:'L5', texto:'Recalcular metas → progresso atualiza' },
    { codigo:'L6', texto:'Progresso reflete negócios ganhos no período' },
  ]},
  { id:'M', titulo:'M. Comissões', itens:[
    { codigo:'M1', texto:'Configurar regra de comissão' },
    { codigo:'M2', texto:'Criar comissão (usuário, negócio, valor, percentual)' },
    { codigo:'M3', texto:'Percentual 200 → 400 (0–100)' },
    { codigo:'M4', texto:'Aprovar comissão' },
    { codigo:'M5', texto:'Pagar comissão' },
    { codigo:'M6', texto:'Cancelar comissão' },
    { codigo:'M7', texto:'Resumo de comissões bate' },
  ]},
  { id:'N', titulo:'N. Automações', itens:[
    { codigo:'N1', texto:'Criar automação (gatilho, condição, ação, config)' },
    { codigo:'N2', texto:'Sem gatilho/ação → 400' },
    { codigo:'N3', texto:'AcaoConfigJson inválido ({abc) → 400' },
    { codigo:'N4', texto:'Ativar / desativar automação' },
    { codigo:'N5', texto:'Disparar o gatilho de verdade (ex.: mover negócio) → ação executa' },
    { codigo:'N6', texto:'Ver histórico de execução da automação' },
    { codigo:'N7', texto:'Editar / excluir automação' },
  ]},
  { id:'O', titulo:'O. Formulários (captura de leads)', itens:[
    { codigo:'O1', texto:'Criar formulário (nome, pipeline, etapa, campos)' },
    { codigo:'O2', texto:'CamposJson/EstiloJson inválido → 400' },
    { codigo:'O3', texto:'Abrir o formulário público e submeter' },
    { codigo:'O4', texto:'Submissão cria lead/negócio na etapa configurada' },
    { codigo:'O5', texto:'Notificação/Inbox da submissão' },
    { codigo:'O6', texto:'Editar / excluir formulário' },
  ]},
  { id:'P', titulo:'P. Relatórios', itens:[
    { codigo:'P1', texto:'Relatório de vendas (filtro por período) renderiza' },
    { codigo:'P2', texto:'Relatório de clientes' },
    { codigo:'P3', texto:'Relatório financeiro (filtro por período)' },
    { codigo:'P4', texto:'Exportar CSV (/relatorios/exportar/{tipo}) → baixa arquivo válido' },
    { codigo:'P5', texto:'Período sem dados → estado vazio, não quebra' },
  ]},
  { id:'Q', titulo:'Q. Integrações', itens:[
    { codigo:'Q1', texto:'Listar integrações disponíveis' },
    { codigo:'Q2', texto:'Salvar configuração de uma integração' },
    { codigo:'Q3', texto:'Desativar integração' },
    { codigo:'Q4', texto:'WhatsApp/Evolution — pendente de montar o servidor Evolution' },
  ]},
  { id:'R', titulo:'R. White-label / Personalização', itens:[
    { codigo:'R1', texto:'Alterar logo/cores/identidade do tenant' },
    { codigo:'R2', texto:'Mudanças refletem na UI (login/app do tenant)' },
    { codigo:'R3', texto:'Salvar com dados inválidos → validação' },
    { codigo:'R4', texto:'Reset para o padrão' },
  ]},
  { id:'S', titulo:'S. Configurações', itens:[
    { codigo:'S1', texto:'Editar perfil (nome)' },
    { codigo:'S2', texto:'Trocar senha' },
    { codigo:'S3', texto:'Demais preferências do tenant salvam e persistem' },
  ]},
  { id:'T', titulo:'T. Admin / Superadmin', itens:[
    { codigo:'T1', texto:'Login com a conta admin → vai direto para /admin' },
    { codigo:'T2', texto:'Dashboard de plataforma: tenants/usuários/clientes/negócios' },
    { codigo:'T3', texto:'Números batem com a realidade (cross-tenant)' },
    { codigo:'T4', texto:'Conta não-admin tentando /admin → bloqueado' },
    { codigo:'T5', texto:'Logout do admin funciona' },
  ]},
  { id:'U', titulo:'⚠️ U. Multi-tenant & Segurança (crítico)', itens:[
    { codigo:'U1', texto:'Tenant A cria cliente "ALFA-SEGREDO"; copiar o ID da URL' },
    { codigo:'U2', texto:'Tenant B abre .../clientes/{ID-do-A} → 404/negado' },
    { codigo:'U3', texto:'Tenant B lista clientes → nada do A aparece' },
    { codigo:'U4', texto:'Repetir o ID cruzado em negócio, fatura, proposta, atividade' },
    { codigo:'U5', texto:'ID malformado (/clientes/abc) → erro genérico, sem stack trace' },
    { codigo:'U6', texto:'/hangfire em produção → 404' },
    { codigo:'U7', texto:'Webhook Asaas sem token (POST vazio) → 401' },
    { codigo:'U8', texto:'Site sempre HTTPS; nenhum token/e-mail sensível na URL' },
  ]},
  { id:'V', titulo:'V. Edge / Robustez', itens:[
    { codigo:'V1', texto:'Recarregar (F5) no meio de um formulário → não perde sessão' },
    { codigo:'V2', texto:'Voltar/avançar do navegador entre telas → estado coerente' },
    { codigo:'V3', texto:'Conexão lenta (Slow 3G) → loaders, sem travar' },
    { codigo:'V4', texto:'Abrir em mobile/responsivo → layout não quebra' },
    { codigo:'V5', texto:'Duplo clique em "salvar/criar" → não cria duplicado' },
    { codigo:'V6', texto:'Sessão expirada no meio de uma ação → trata sem tela branca' },
  ]},
]

// ══════════════════════════════════════════════════════════════════════════
// SEÇÕES — NERO BARBER  (prefix NB_)
// ══════════════════════════════════════════════════════════════════════════
const SECOES_NB: Secao[] = [
  { id:'A', titulo:'A. Autenticação & Conta', itens:[
    { codigo:'NB_A1',  texto:'Cadastro novo via Google (seletor de conta aparece)' },
    { codigo:'NB_A2',  texto:'Cadastro via e-mail/senha (senha forte)' },
    { codigo:'NB_A3',  texto:'Registro com senha fraca "123" → bloqueia com mensagem' },
    { codigo:'NB_A4',  texto:'Registro com e-mail já existente → erro claro (não 500)' },
    { codigo:'NB_A5',  texto:'Login correto → entra na área /barber' },
    { codigo:'NB_A6',  texto:'Login com senha errada → erro, sem vazar detalhe' },
    { codigo:'NB_A7',  texto:'"Esqueci a senha" → fluxo de redefinição por e-mail' },
    { codigo:'NB_A8',  texto:'Redefinir com token válido → senha trocada; login novo funciona' },
    { codigo:'NB_A9',  texto:'Redefinir com token inválido/expirado → recusa' },
    { codigo:'NB_A10', texto:'Logout → não abre mais /barber (volta ao login)' },
    { codigo:'NB_A11', texto:'>15 min ocioso → renova sessão ou volta ao login limpo' },
    { codigo:'NB_A12', texto:'Editar perfil (nome) → reflete no topo' },
    { codigo:'NB_A13', texto:'Trocar a própria senha → login novo funciona' },
  ]},
  { id:'B', titulo:'B. Onboarding & Barbearia (tenant)', itens:[
    { codigo:'NB_B1', texto:'Conta nova sem barbearia → fluxo de criação da barbearia' },
    { codigo:'NB_B2', texto:'Criar barbearia (nome, slug, telefone, endereço)' },
    { codigo:'NB_B3', texto:'Slug duplicado → erro/validação' },
    { codigo:'NB_B4', texto:'Definir horário de funcionamento por dia da semana' },
    { codigo:'NB_B5', texto:'Horário de almoço (lunch_break) habilitado → some dos slots' },
    { codigo:'NB_B6', texto:'Dia marcado como fechado → sem horários disponíveis' },
    { codigo:'NB_B7', texto:'Upload de logo/foto da barbearia' },
    { codigo:'NB_B8', texto:'Dono com 2 barbearias → troca de unidade ativa funciona' },
  ]},
  { id:'C', titulo:'C. Dashboard (barbeiro)', itens:[
    { codigo:'NB_C1', texto:'Abre com KPIs (receita do mês, atendimentos, ticket médio)' },
    { codigo:'NB_C2', texto:'Gráfico de receita/retorno renderiza' },
    { codigo:'NB_C3', texto:'Conta nova sem dados → zeros, não quebra' },
    { codigo:'NB_C4', texto:'Números batem com o lançado em comanda/caixa' },
    { codigo:'NB_C5', texto:'BRT: finalizar atendimento às 22h–23h59 → entra no mês/dia certo' },
    { codigo:'NB_C6', texto:'Atalhos navegam (agenda, financeiro, comanda)' },
  ]},
  { id:'D', titulo:'D. Serviços', itens:[
    { codigo:'NB_D1', texto:'Criar serviço (nome, preço, duração)' },
    { codigo:'NB_D2', texto:'Preço 0/negativo, duração 0, nome 500+ chars → validação' },
    { codigo:'NB_D3', texto:'Editar serviço → persiste e reflete na agenda' },
    { codigo:'NB_D4', texto:'Inativar serviço → some da seleção de novo agendamento' },
    { codigo:'NB_D5', texto:'Duração específica por barbeiro (barber_service_durations)' },
    { codigo:'NB_D6', texto:'Excluir serviço usado em agendamento → comportamento esperado' },
  ]},
  { id:'E', titulo:'E. Equipe / Barbeiros (RBAC)', itens:[
    { codigo:'NB_E1', texto:'Adicionar barbeiro (nome, vínculo de profile)' },
    { codigo:'NB_E2', texto:'Barbeiro staff loga → vê só o permitido (não vê config de dono)' },
    { codigo:'NB_E3', texto:'Staff tenta ação de Admin (gerenciar planos/equipe) → bloqueado' },
    { codigo:'NB_E4', texto:'Inativar barbeiro → some da agenda/seleção' },
    { codigo:'NB_E5', texto:'Limite de barbeiros do plano atingido → bloqueia com aviso de upgrade' },
    { codigo:'NB_E6', texto:'Excluir barbeiro com agendamentos → comportamento esperado' },
  ]},
  { id:'F', titulo:'F. Clientes (shop_customers)', itens:[
    { codigo:'NB_F1', texto:'Criar cliente (nome só) → aparece na busca' },
    { codigo:'NB_F2', texto:'Criar com telefone/e-mail/observações' },
    { codigo:'NB_F3', texto:'Telefone com letras / nome enorme → validação' },
    { codigo:'NB_F4', texto:'Editar cliente → persiste' },
    { codigo:'NB_F5', texto:'Buscar por nome e por telefone' },
    { codigo:'NB_F6', texto:'Notas técnicas do cliente salvam' },
    { codigo:'NB_F7', texto:'Regressão walk-in: nome novo digitado → cliente aparece na busca depois' },
    { codigo:'NB_F8', texto:'Walk-in repetido com mesmo nome → reaproveita (não duplica)' },
    { codigo:'NB_F9', texto:'Detalhe do cliente: histórico de atendimentos/pacotes aparece' },
  ]},
  { id:'G', titulo:'G. Agenda / Agendamentos', itens:[
    { codigo:'NB_G1',  texto:'Criar agendamento (cliente, serviço(s), barbeiro, data, hora)' },
    { codigo:'NB_G2',  texto:'Múltiplos serviços no mesmo horário → duração soma' },
    { codigo:'NB_G3',  texto:'Sem serviço / sem horário → "Complete os dados essenciais"' },
    { codigo:'NB_G4',  texto:'Slots respeitam intervalo de 5 min e horário de funcionamento' },
    { codigo:'NB_G5',  texto:'Slot ocupado fica indisponível (sem overlap)' },
    { codigo:'NB_G6',  texto:'Data passada bloqueada no seletor' },
    { codigo:'NB_G7',  texto:'BRT: agendar às 22h–23h59 → cai no dia correto (não pula)' },
    { codigo:'NB_G8',  texto:'Visualizações: dia / semana / mês / lista renderizam' },
    { codigo:'NB_G9',  texto:'Arrastar card para outro horário (reagendar) → persiste' },
    { codigo:'NB_G10', texto:'Mudar status: pendente→confirmado→concluído / faltou / cancelado' },
    { codigo:'NB_G11', texto:'Cancelado some da agenda (a menos que "mostrar cancelados")' },
    { codigo:'NB_G12', texto:'Excluir agendamento de hoje/futuro → ok; de dia anterior → bloqueado' },
    { codigo:'NB_G13', texto:'Sync Google Calendar (se integrado) cria/edita/remove evento' },
    { codigo:'NB_G14', texto:'Notificação WhatsApp: confirmação / lembrete / reativação geram link' },
    { codigo:'NB_G15', texto:'Regressão mobile/PWA: tocar no card só abre detalhe (NÃO cancela)' },
  ]},
  { id:'H', titulo:'H. Comanda / Faturamento', itens:[
    { codigo:'NB_H1',  texto:'Abrir comanda de um agendamento ("Faturar")' },
    { codigo:'NB_H2',  texto:'Serviço(s) do agendamento aparecem editáveis' },
    { codigo:'NB_H3',  texto:'Remover procedimento principal (X) → total recalcula' },
    { codigo:'NB_H4',  texto:'Adicionar item: Serviço' },
    { codigo:'NB_H5',  texto:'Adicionar item: Produto (com quantidade, baixa estoque)' },
    { codigo:'NB_H6',  texto:'Adicionar item: Pacote (vende e ativa pacote do cliente)' },
    { codigo:'NB_H7',  texto:'Desconto em R$ e em % aplica sobre o subtotal' },
    { codigo:'NB_H8',  texto:'Gorjeta fixa e por % (atalhos 5/10/15/20%)' },
    { codigo:'NB_H9',  texto:'Pagamento dividido (2–3 métodos); soma tem que fechar o total' },
    { codigo:'NB_H10', texto:'Pagamento faltando/sobrando → bloqueia finalizar com aviso' },
    { codigo:'NB_H11', texto:'Cliente com assinatura ativa → auto-detecta, método "Assinatura"' },
    { codigo:'NB_H12', texto:'Cliente com pacote ativo → auto-detecta, método "Pacote"' },
    { codigo:'NB_H13', texto:'Finalizar → agendamento vira concluído, valores no caixa/dashboard' },
    { codigo:'NB_H14', texto:'Procedimento trocado (corte→barba) → service_ids salvos refletem o que foi feito' },
    { codigo:'NB_H15', texto:'Reabrir / resetar comanda finalizada → itens/valores/pagamento limpos' },
    { codigo:'NB_H16', texto:'Reabrir comanda paga com pacote → uso do pacote é estornado' },
    { codigo:'NB_H17', texto:'Finalizar só com produto (sem serviço) → não zera serviço à toa' },
  ]},
  { id:'I', titulo:'I. Pacotes', itens:[
    { codigo:'NB_I1',  texto:'Criar pacote (nome, preço, validade em dias, serviços+quantidades)' },
    { codigo:'NB_I2',  texto:'Preço 0, validade 0/negativa, sem serviços → validação' },
    { codigo:'NB_I3',  texto:'Vender pacote ao cliente → cria customer_package' },
    { codigo:'NB_I4',  texto:'Pré-crédito: vincular atendimentos antigos ao novo pacote' },
    { codigo:'NB_I5',  texto:'Vender pacote pela comanda (item Pacote) → ativa para o cliente' },
    { codigo:'NB_I6',  texto:'Expiração BRT: validade calculada na data certa (sem off-by-one após 21h)' },
    { codigo:'NB_I7',  texto:'Baixa automática: finalizar comanda c/ método Pacote → 1 uso debitado' },
    { codigo:'NB_I8',  texto:'Baixa 1-clique no agendamento (lista e card do calendário)' },
    { codigo:'NB_I9',  texto:'Baixa 1-clique sem pacote que cubra o serviço → erro claro' },
    { codigo:'NB_I10', texto:'Saldo esgotado → não deixa dar baixa / não auto-seleciona' },
    { codigo:'NB_I11', texto:'Pacote expirado → não conta como ativo' },
    { codigo:'NB_I12', texto:'Contador de usos (realizados/restantes) bate na comanda' },
  ]},
  { id:'J', titulo:'J. Assinaturas / Clube', itens:[
    { codigo:'NB_J1', texto:'Criar plano de assinatura (nome, preço, serviços, limites de uso)' },
    { codigo:'NB_J2', texto:'Limite de uso 0 = ilimitado vs limite numérico' },
    { codigo:'NB_J3', texto:'Cliente assina (cobrança recorrente Asaas) → status active/trialing' },
    { codigo:'NB_J4', texto:'Comanda detecta assinatura e abate o uso' },
    { codigo:'NB_J5', texto:'Uso ilimitado nunca esgota; uso limitado esgota e bloqueia' },
    { codigo:'NB_J6', texto:'Cancelar assinatura → para de auto-detectar na comanda' },
    { codigo:'NB_J7', texto:'Falha de cobrança/inadimplência → status reflete' },
  ]},
  { id:'K', titulo:'K. Caixa (PDV diário)', itens:[
    { codigo:'NB_K1', texto:'Abrir caixa (saldo inicial)' },
    { codigo:'NB_K2', texto:'Venda rápida (quickSale) sem agendamento' },
    { codigo:'NB_K3', texto:'Atendimentos finalizados entram no caixa do dia' },
    { codigo:'NB_K4', texto:'Fechar caixa → total receita/serviços/produtos/gorjetas bate' },
    { codigo:'NB_K5', texto:'BRT: atendimento 22h–23h59 entra no caixa do dia correto' },
    { codigo:'NB_K6', texto:'Tentar abrir 2 caixas no mesmo dia → bloqueia (UNIQUE)' },
    { codigo:'NB_K7', texto:'Histórico de caixas anteriores abre e bate' },
    { codigo:'NB_K8', texto:'Pacote vendido na comanda aparece no breakdown (confirmar categoria)' },
  ]},
  { id:'L', titulo:'L. Financeiro', itens:[
    { codigo:'NB_L1', texto:'/barber/financeiro abre com totais do mês atual' },
    { codigo:'NB_L2', texto:'Filtro por mês muda os números (bug histórico: searchParams Promise não-awaited)' },
    { codigo:'NB_L3', texto:'BRT: receita das 21h–23h59 cai no mês certo (não vaza p/ mês seguinte)' },
    { codigo:'NB_L4', texto:'Extrato detalhado lista lançamentos do período' },
    { codigo:'NB_L5', texto:'Período sem dados → estado vazio, não quebra' },
    { codigo:'NB_L6', texto:'Total bate com caixa + comandas do período' },
  ]},
  { id:'M', titulo:'M. Estoque / Produtos', itens:[
    { codigo:'NB_M1', texto:'Criar produto (nome, preço, estoque)' },
    { codigo:'NB_M2', texto:'Preço/estoque negativo → validação' },
    { codigo:'NB_M3', texto:'Vender produto na comanda → estoque decrementa' },
    { codigo:'NB_M4', texto:'Produto com estoque 0 → não aparece/ável na comanda' },
    { codigo:'NB_M5', texto:'Alerta de nível crítico / histórico de movimentação' },
  ]},
  { id:'N', titulo:'N. Vitrine pública & QR Code', itens:[
    { codigo:'NB_N1', texto:'Abrir /vitrine/{slug} sem login → renderiza serviços/barbeiros' },
    { codigo:'NB_N2', texto:'Slug inexistente → 404 amigável' },
    { codigo:'NB_N3', texto:'Agendar pela vitrine (cliente final) → cria agendamento' },
    { codigo:'NB_N4', texto:'Horários respeitam funcionamento/almoço/ocupação' },
    { codigo:'NB_N5', texto:'QR Code da vitrine aponta para o slug certo' },
    { codigo:'NB_N6', texto:'Vitrine TV / ranking renderiza' },
    { codigo:'NB_N7', texto:'Tema escuro (padrão) e tipografia (Playfair/Inter) corretos' },
  ]},
  { id:'O', titulo:'O. Planos & Limites (gating)', itens:[
    { codigo:'NB_O1', texto:'Página de planos com comparativo renderiza' },
    { codigo:'NB_O2', texto:'Plano Free no limite de barbeiros → bloqueia adicionar' },
    { codigo:'NB_O3', texto:'Split de pagamento só Pro+ → Free/básico bloqueado' },
    { codigo:'NB_O4', texto:'Multi-unidade só Premium+ → bloqueio + CTA upgrade' },
    { codigo:'NB_O5', texto:'Loja de módulos: comprar módulo avulso libera a feature' },
    { codigo:'NB_O6', texto:'Downgrade com uso acima do novo limite → comportamento esperado' },
  ]},
  { id:'P', titulo:'P. Multi-unidade / Dashboard Consolidado', itens:[
    { codigo:'NB_P1', texto:'Dono Premium+ com 2+ unidades → painel consolidado abre' },
    { codigo:'NB_P2', texto:'Números somam corretamente entre unidades' },
    { codigo:'NB_P3', texto:'Trocar unidade ativa isola dados da unidade' },
    { codigo:'NB_P4', texto:'Plano sem multi-unidade → consolidado bloqueado' },
  ]},
  { id:'Q', titulo:'Q. Pagamentos Asaas', itens:[
    { codigo:'NB_Q1', texto:'Emitir cobrança (link/QR Pix) de uma fatura/assinatura' },
    { codigo:'NB_Q2', texto:'Tokenização de cartão (assinatura recorrente)' },
    { codigo:'NB_Q3', texto:'Split payment respeita config Asaas (clientes Enterprise)' },
    { codigo:'NB_Q4', texto:'Webhook Asaas: pagar cobrança de teste → status vira "pago"' },
    { codigo:'NB_Q5', texto:'Webhook sem/com token inválido → 401, idempotente' },
    { codigo:'NB_Q6', texto:'Webhook reenviado (mesmo evento) → não duplica (idempotência)' },
  ]},
  { id:'R', titulo:'R. Contratos eletrônicos', itens:[
    { codigo:'NB_R1', texto:'Gerar contrato e enviar para assinatura por e-mail' },
    { codigo:'NB_R2', texto:'Abrir link de assinatura (sem login) → renderiza' },
    { codigo:'NB_R3', texto:'Assinar sem nome → bloqueia' },
    { codigo:'NB_R4', texto:'Assinar com dados válidos → registra (data/hora/IP)' },
    { codigo:'NB_R5', texto:'Contrato já assinado → não permite reassinar' },
  ]},
  { id:'S', titulo:'S. Notificações (WhatsApp)', itens:[
    { codigo:'NB_S1', texto:'Gerar link de confirmação/lembrete/reativação com texto certo' },
    { codigo:'NB_S2', texto:'Cliente sem telefone → ação some/avisa' },
    { codigo:'NB_S3', texto:'Mensagem com nome/serviço/horário corretos (BRT)' },
  ]},
  { id:'T', titulo:'T. Marketing', itens:[
    { codigo:'NB_T1', texto:'Criar campanha (segmento, canal, mensagem)' },
    { codigo:'NB_T2', texto:'Campos inválidos → validação' },
    { codigo:'NB_T3', texto:'Disparo de teste / agendamento de campanha' },
  ]},
  { id:'U', titulo:'U. Atualizações (changelog)', itens:[
    { codigo:'NB_U1', texto:'/barber/atualizacoes lista versões (timeline)' },
    { codigo:'NB_U2', texto:'Selo de novidade aparece quando há versão nova não vista' },
    { codigo:'NB_U3', texto:'Abrir a página marca como visto (some o selo)' },
    { codigo:'NB_U4', texto:'Última versão (v1.5.0) reflete as entregas recentes' },
  ]},
  { id:'V', titulo:'⚠️ V. Multi-tenant & Segurança (crítico)', itens:[
    { codigo:'NB_V1',  texto:'Barbearia A cria cliente "ALFA-SEGREDO"; copiar o ID da URL' },
    { codigo:'NB_V2',  texto:'Barbearia B abre .../{ID-do-A} → 404/negado' },
    { codigo:'NB_V3',  texto:'Barbearia B lista clientes/agenda → nada do A aparece' },
    { codigo:'NB_V4',  texto:'Repetir ID cruzado em agendamento, comanda, pacote, assinatura' },
    { codigo:'NB_V5',  texto:'Staff barber só enxerga a barbearia vinculada' },
    { codigo:'NB_V6',  texto:'ID malformado (/.../abc) → erro genérico, sem stack trace' },
    { codigo:'NB_V7',  texto:'RLS: toda query filtra barbershop_id (tentar burlar via API)' },
    { codigo:'NB_V8',  texto:'Webhook Asaas sem token (POST vazio) → 401' },
    { codigo:'NB_V9',  texto:'Site sempre HTTPS; nenhum token/CPF/e-mail na URL' },
    { codigo:'NB_V10', texto:'CPF/token Asaas: dados sensíveis criptografados (não em texto puro)' },
  ]},
  { id:'W', titulo:'W. PWA', itens:[
    { codigo:'NB_W1', texto:'Prompt de instalação aparece (InstallPrompt)' },
    { codigo:'NB_W2', texto:'App instalado abre em standalone, retrato, tema preto' },
    { codigo:'NB_W3', texto:'Ícones 192/512 e nome "Nero Barber" corretos' },
    { codigo:'NB_W4', texto:'Cache do service worker: após deploy, fechar/reabrir carrega a versão nova' },
    { codigo:'NB_W5', texto:'Offline/conexão ruim → comportamento aceitável (sem tela branca)' },
    { codigo:'NB_W6', texto:'Regressão: tocar agendamento no PWA abre detalhe (não cancela)' },
  ]},
  { id:'X', titulo:'X. Edge / Robustez (cross-módulo)', itens:[
    { codigo:'NB_X1', texto:'BRT pós-21h: agendamento, comanda e data bate em agenda+caixa+financeiro+dashboard' },
    { codigo:'NB_X2', texto:'Virada de mês (rodar dia 1 de manhã / último dia à noite)' },
    { codigo:'NB_X3', texto:'Recarregar (F5) no meio de um formulário → não perde sessão' },
    { codigo:'NB_X4', texto:'Voltar/avançar do navegador entre telas → estado coerente' },
    { codigo:'NB_X5', texto:'Conexão lenta (Slow 3G) → loaders, sem travar' },
    { codigo:'NB_X6', texto:'Mobile/responsivo → layout não quebra (agenda, comanda)' },
    { codigo:'NB_X7', texto:'Duplo clique em "finalizar/criar" → não duplica' },
    { codigo:'NB_X8', texto:'Sessão expirada no meio de uma ação → trata sem tela branca' },
    { codigo:'NB_X9', texto:'searchParams/params (Next 16) sempre await → filtros funcionam' },
  ]},
]

// ══════════════════════════════════════════════════════════════════════════
// SEÇÕES — KUBICENG  (prefix KB_)
// ══════════════════════════════════════════════════════════════════════════
const SECOES_KB: Secao[] = [
  { id:'A', titulo:'A. Autenticação & Conta', itens:[
    { codigo:'KB_A1',  texto:'Cadastro via /cadastro com nome, e-mail, senha forte + plano "pro" → trial 7 dias' },
    { codigo:'KB_A2',  texto:'Registro com senha fraca "123" → bloqueia com mensagem clara' },
    { codigo:'KB_A3',  texto:'Registro com nome < 2 chars → 400 com mensagem Zod' },
    { codigo:'KB_A4',  texto:'Registro com e-mail inválido "abc@" → 400' },
    { codigo:'KB_A5',  texto:'Registro com e-mail já existente → 400 "Este e-mail já está em uso"' },
    { codigo:'KB_A6',  texto:'Registro com planSlug inexistente → 404 "Plano selecionado não encontrado"' },
    { codigo:'KB_A7',  texto:'Login com credenciais corretas → entra + JWT no localStorage' },
    { codigo:'KB_A8',  texto:'Login com senha errada → 401 "E-mail ou senha incorretos"' },
    { codigo:'KB_A9',  texto:'Login com e-mail inexistente → 401 (mesma mensagem, sem vazar)' },
    { codigo:'KB_A10', texto:'Login com e-mail malformado → 400 Zod' },
    { codigo:'KB_A11', texto:'/auth/me sem JWT → 401' },
    { codigo:'KB_A12', texto:'/auth/me com JWT válido → devolve user + subscription + features do plano' },
    { codigo:'KB_A13', texto:'/auth/me com JWT expirado/inválido → 401 "Sessão expirada"' },
    { codigo:'KB_A14', texto:'Logout → token removido, redireciona para landing' },
    { codigo:'KB_A15', texto:'Acessar /app direto sem login → redireciona para landing' },
    { codigo:'KB_A16', texto:'Trial de 7 dias é configurado corretamente em subscription.trialEnd' },
    { codigo:'KB_A17', texto:'(futuro) Esqueci a senha — botão não visível ou retorna placeholder' },
  ]},
  { id:'B', titulo:'B. Dashboard', itens:[
    { codigo:'KB_B1',  texto:'Abre /app logado → renderiza header "Olá, {nome}!"' },
    { codigo:'KB_B2',  texto:'KPI "Obras Ativas" mostra count correto' },
    { codigo:'KB_B3',  texto:'KPI "Receita Aprovada" soma medicao.liquido onde status=aprovado' },
    { codigo:'KB_B4',  texto:'KPI "Alertas Críticos" = contas vencidas + estoque crítico' },
    { codigo:'KB_B5',  texto:'KPI "Compras Pendentes" = count de requisicao com status pendente_aprovacao' },
    { codigo:'KB_B6',  texto:'Conta nova sem dados → KPIs zerados, sem crash' },
    { codigo:'KB_B7',  texto:'Endpoint /dashboard/kpis retorna { success: true, data: {...} }' },
    { codigo:'KB_B8',  texto:'Filtro por projectId → KPIs refletem só aquela obra' },
    { codigo:'KB_B9',  texto:'Endpoint /alertas retorna lista populada conforme estados' },
    { codigo:'KB_B10', texto:'Selecionar obra na sidebar atualiza os KPIs automaticamente' },
    { codigo:'KB_B11', texto:'Curva-S renderiza (mesmo com dados sintéticos)' },
    { codigo:'KB_B12', texto:'Mapa de obras renderiza sem crash mesmo sem obras' },
    { codigo:'KB_B13', texto:'Componente Alertas exibe lista com cores por severidade' },
  ]},
  { id:'C', titulo:'C. Engenharia — Obras (Projects)', itens:[
    { codigo:'KB_C1',  texto:'Criar obra com nome + versão → POST /projects retorna 201' },
    { codigo:'KB_C2',  texto:'Criar obra sem nome → 400 "Nome é obrigatório"' },
    { codigo:'KB_C3',  texto:'Criar obra com nome 500+ chars → comportamento esperado' },
    { codigo:'KB_C4',  texto:'Criar obra com data futura / data passada / data no formato errado' },
    { codigo:'KB_C5',  texto:'Plano "start" (maxProjects=1) já com 1 obra → 2ª criação retorna 403' },
    { codigo:'KB_C6',  texto:'Listar obras GET /projects → só vê as próprias (filtro userId)' },
    { codigo:'KB_C7',  texto:'Editar obra PUT /projects/:id → persiste' },
    { codigo:'KB_C8',  texto:'Editar obra de outro user → 403 "Você não tem permissão"' },
    { codigo:'KB_C9',  texto:'Excluir obra DELETE /projects/:id → 204 + cascade (cronograma, RDO, contas...)' },
    { codigo:'KB_C10', texto:'Excluir obra de outro user → 403' },
    { codigo:'KB_C11', texto:'Status da obra (aprovado, revisao, em_analise) — testar todos' },
    { codigo:'KB_C12', texto:'UI: selecionar obra na sidebar persiste entre módulos' },
    { codigo:'KB_C13', texto:'UI: criar obra via modal da sidebar funciona' },
  ]},
  { id:'D', titulo:'D. Cronograma (ScheduleItem)', itens:[
    { codigo:'KB_D1', texto:'Criar item de cronograma POST /projects/:id/schedule com etapa, datas, progress, status' },
    { codigo:'KB_D2', texto:'Item sem etapa / startDate > endDate → 400' },
    { codigo:'KB_D3', texto:'Progress < 0 ou > 100 → 400 (Zod min 0 max 100)' },
    { codigo:'KB_D4', texto:'Listar cronograma de obra própria → OK' },
    { codigo:'KB_D5', texto:'Acessar cronograma de obra alheia → 403' },
    { codigo:'KB_D6', texto:'(gap) Atualizar progresso de item — endpoint não existe ainda ⚠️' },
    { codigo:'KB_D7', texto:'(gap) Excluir item — endpoint não existe ainda' },
    { codigo:'KB_D8', texto:'UI: gantt/timeline renderiza itens em ordem por startDate' },
  ]},
  { id:'E', titulo:'E. Orçamento (BudgetItem)', itens:[
    { codigo:'KB_E1', texto:'Listar orçamento GET /projects/:id/budget → retorna lista' },
    { codigo:'KB_E2', texto:'(gap) Criar item de orçamento — endpoint POST não existe ainda ⚠️' },
    { codigo:'KB_E3', texto:'(gap) Editar / excluir — endpoints não existem' },
    { codigo:'KB_E4', texto:'Comparativo orçado vs realizado é só leitura por enquanto' },
  ]},
  { id:'F', titulo:'F. Suprimentos — Requisições', itens:[
    { codigo:'KB_F1',  texto:'Criar requisição POST /requisicoes com item, obra, solicitante, valor, projectId → 201' },
    { codigo:'KB_F2',  texto:'Criar com valor negativo → 400 (Zod .positive())' },
    { codigo:'KB_F3',  texto:'Criar sem item / obra / solicitante → 400' },
    { codigo:'KB_F4',  texto:'Criar com projectId de outra empresa → 403' },
    { codigo:'KB_F5',  texto:'Listar requisições da própria empresa → vem cotacoes: [] incluído' },
    { codigo:'KB_F6',  texto:'Aprovar requisição PATCH /requisicoes/:id/aprovar → status=aprovado' },
    { codigo:'KB_F7',  texto:'Aprovar requisição alheia → 403' },
    { codigo:'KB_F8',  texto:'Mover para cotação PATCH /requisicoes/:id/cotar → status=cotacao' },
    { codigo:'KB_F9',  texto:'Filtro por projectId funciona' },
    { codigo:'KB_F10', texto:'UI: fluxo pendente → cotação → aprovado → OC' },
  ]},
  { id:'G', titulo:'G. Suprimentos — Cotações & Ordens de Compra', itens:[
    { codigo:'KB_G1',  texto:'Criar cotação POST /cotacoes vinculada a requisição própria → 201' },
    { codigo:'KB_G2',  texto:'Cotação com preço negativo → 400' },
    { codigo:'KB_G3',  texto:'Cotação vinculada a requisição alheia → 403' },
    { codigo:'KB_G4',  texto:'Listar cotações → join com requisicao OK' },
    { codigo:'KB_G5',  texto:'Selecionar cotação → cria OC automaticamente + desmarca outras' },
    { codigo:'KB_G6',  texto:'Selecionar cotação alheia → 403' },
    { codigo:'KB_G7',  texto:'BUG: cotação com requisicao.projectId null cria OC órfã (validar Sprint 1.2)' },
    { codigo:'KB_G8',  texto:'Criar OC direta POST /ordens-compra → 201' },
    { codigo:'KB_G9',  texto:'OC sem fornecedor / valor → 400' },
    { codigo:'KB_G10', texto:'Atualizar status da OC → aguardando / transito / entregue / cancelado' },
    { codigo:'KB_G11', texto:'Status inválido ("xyz") → 400 (enum Zod)' },
    { codigo:'KB_G12', texto:'Status de OC alheia → 403' },
  ]},
  { id:'H', titulo:'H. Execução — RDO', itens:[
    { codigo:'KB_H1', texto:'Criar RDO POST /rdos com obra, clima, efetivo, atividades' },
    { codigo:'KB_H2', texto:'RDO sem obra / sem clima → 400' },
    { codigo:'KB_H3', texto:'efetivoProprio ou efetivoTerceiro negativo → comportamento (bug latente)' },
    { codigo:'KB_H4', texto:'Atividades como array vazio → OK' },
    { codigo:'KB_H5', texto:'RDO com data passada → OK' },
    { codigo:'KB_H6', texto:'Listar RDOs próprios GET /rdos' },
    { codigo:'KB_H7', texto:'Detalhe GET /rdos/:id → 200 se próprio, 404 se alheio' },
    { codigo:'KB_H8', texto:'GAP: Campo fotos: Int é só contagem (validar Sprint 7.1)' },
    { codigo:'KB_H9', texto:'UI: fluxo de criação de RDO no mobile — validar responsivo' },
  ]},
  { id:'I', titulo:'I. Execução — FVS & FVM', itens:[
    { codigo:'KB_I1', texto:'Criar FVS POST /fvs → 201, status=pendente' },
    { codigo:'KB_I2', texto:'FVS sem título / responsável → 400' },
    { codigo:'KB_I3', texto:'Listar FVS → OK' },
    { codigo:'KB_I4', texto:'Assinar FVS PATCH /fvs/:id/assinar com status aprovado ou recusado' },
    { codigo:'KB_I5', texto:'Assinar FVS alheia → 403' },
    { codigo:'KB_I6', texto:'Criar FVM POST /fvm' },
    { codigo:'KB_I7', texto:'FVM com status inválido → 400 (enum pendente/aprovado/recusado)' },
    { codigo:'KB_I8', texto:'Listar FVM por obra → OK' },
  ]},
  { id:'J', titulo:'J. Execução — Estoque', itens:[
    { codigo:'KB_J1',  texto:'Criar item de estoque com material, qtdAtual, qtdMinima, unidade' },
    { codigo:'KB_J2',  texto:'Item sem material → 400' },
    { codigo:'KB_J3',  texto:'qtdAtual negativa → comportamento (Zod hoje não barra)' },
    { codigo:'KB_J4',  texto:'Listar estoque por obra própria → OK' },
    { codigo:'KB_J5',  texto:'Entrada POST /estoque/entrada → incrementa qtdAtual + cria MovimentacaoEstoque' },
    { codigo:'KB_J6',  texto:'Entrada com quantidade = 0 ou negativa → 400 (Zod .positive())' },
    { codigo:'KB_J7',  texto:'Entrada em item alheio → 403' },
    { codigo:'KB_J8',  texto:'Saída POST /estoque/saida → decrementa qtdAtual' },
    { codigo:'KB_J9',  texto:'Saída maior que qtdAtual → comportamento (hoje fica negativo — bug)' },
    { codigo:'KB_J10', texto:'Alerta de estoque crítico aparece no dashboard quando qtdAtual < qtdMinima' },
  ]},
  { id:'K', titulo:'K. Financeiro — Contas a Pagar', itens:[
    { codigo:'KB_K1',  texto:'Criar conta com fornecedor, valor positivo, vencimento, projectId' },
    { codigo:'KB_K2',  texto:'Valor 0 ou negativo → 400 (Zod .positive())' },
    { codigo:'KB_K3',  texto:'Vencimento em formato inválido → 400' },
    { codigo:'KB_K4',  texto:'Sem projectId → 400' },
    { codigo:'KB_K5',  texto:'ProjectId de outra empresa → 403' },
    { codigo:'KB_K6',  texto:'Listar contas → ordena por vencimento ascendente' },
    { codigo:'KB_K7',  texto:'Pagar conta PATCH /contas-pagar/:id/pagar → status=pago' },
    { codigo:'KB_K8',  texto:'Pagar conta alheia → 403' },
    { codigo:'KB_K9',  texto:'VALIDAR pós-Sprint 1.2: campo dataPagamento é populado ao pagar' },
    { codigo:'KB_K10', texto:'(gap) Editar / excluir conta — endpoints não existem ainda' },
  ]},
  { id:'L', titulo:'L. Financeiro — Medições', itens:[
    { codigo:'KB_L1', texto:'Criar medição com empreiteiro, servico, periodo, executado, valor, projectId' },
    { codigo:'KB_L2', texto:'Valor negativo → 400' },
    { codigo:'KB_L3', texto:'Calcula retencao = valor * 0.05 e liquido = valor - retencao automaticamente' },
    { codigo:'KB_L4', texto:'Medição com projectId alheio → 403' },
    { codigo:'KB_L5', texto:'Aprovar medição PATCH /medicoes/:id/aprovar → status=aprovado' },
    { codigo:'KB_L6', texto:'Aprovar medição alheia → 403' },
    { codigo:'KB_L7', texto:'(gap) Edit / Delete / cancelar não existem' },
  ]},
  { id:'M', titulo:'M. Financeiro — Fluxo de Caixa', itens:[
    { codigo:'KB_M1', texto:'GET /fluxo-caixa retorna array agrupado por mês' },
    { codigo:'KB_M2', texto:'VALIDAR pós-Sprint 1.2: valores são brutos (não divididos por 1000)' },
    { codigo:'KB_M3', texto:'VALIDAR pós-Sprint 1.2: ordenação é cronológica, não alfabética' },
    { codigo:'KB_M4', texto:'VALIDAR pós-Sprint 1.2: despesa agrupa por dataPagamento, não vencimento' },
    { codigo:'KB_M5', texto:'Filtro por projectId funciona' },
    { codigo:'KB_M6', texto:'Conta nova sem medições/contas → array vazio, sem crash' },
  ]},
  { id:'N', titulo:'N. Pessoas — Funcionários', itens:[
    { codigo:'KB_N1',  texto:'Criar funcionário com nome, função, obra, tipo (proprio|terceiro), projectId' },
    { codigo:'KB_N2',  texto:'Tipo inválido ("autonomo") → 400 (enum Zod)' },
    { codigo:'KB_N3',  texto:'Sem nome / função → 400' },
    { codigo:'KB_N4',  texto:'Funcionário com projectId alheio → 403' },
    { codigo:'KB_N5',  texto:'Listar funcionários → ordena por nome ascendente' },
    { codigo:'KB_N6',  texto:'Detalhe GET /funcionarios/:id → inclui últimos 30 registrosPonto' },
    { codigo:'KB_N7',  texto:'Detalhe de funcionário alheio → 404' },
    { codigo:'KB_N8',  texto:'Atualizar funcionário PUT /funcionarios/:id → persiste' },
    { codigo:'KB_N9',  texto:'Atualizar funcionário alheio → 403' },
    { codigo:'KB_N10', texto:'NR-35/NR-10 como string opcional — validar formato data (gap)' },
    { codigo:'KB_N11', texto:'(gap) Delete não existe' },
  ]},
  { id:'O', titulo:'O. Pessoas — Ponto', itens:[
    { codigo:'KB_O1', texto:'Criar registro de ponto POST /ponto com funcionarioId + horários' },
    { codigo:'KB_O2', texto:'Ponto de funcionário alheio → 403' },
    { codigo:'KB_O3', texto:'Sem data no body → usa new Date() automaticamente' },
    { codigo:'KB_O4', texto:'Listar pontos GET /ponto?data=YYYY-MM-DD&projectId=X' },
    { codigo:'KB_O5', texto:'Data inválida → comportamento (hoje quebra ou retorna lista vazia?)' },
    { codigo:'KB_O6', texto:'Filtro por projectId funciona' },
    { codigo:'KB_O7', texto:'(gap) Edit / Delete não existem' },
  ]},
  { id:'P', titulo:'P. Pessoas — EPIs', itens:[
    { codigo:'KB_P1', texto:'Criar EPI com item, qtdDisponivel, qtdMinima, projectId' },
    { codigo:'KB_P2', texto:'Quantidade negativa → comportamento esperado' },
    { codigo:'KB_P3', texto:'EPI com projectId alheio → 403' },
    { codigo:'KB_P4', texto:'Distribuir EPI POST /epis/distribuicao → decrementa qtdDisponivel' },
    { codigo:'KB_P5', texto:'Distribuir mais que disponível → comportamento (hoje vira negativo)' },
    { codigo:'KB_P6', texto:'Distribuir EPI alheio → 403' },
    { codigo:'KB_P7', texto:'GAP: quem recebeu o EPI não é registrado (Sprint 7.1)' },
  ]},
  { id:'Q', titulo:'Q. Comercial — Clientes & Chamados', itens:[
    { codigo:'KB_Q1', texto:'Criar cliente comercial vinculado a Project' },
    { codigo:'KB_Q2', texto:'Cliente sem nome / unidade → 400' },
    { codigo:'KB_Q3', texto:'Listar clientes → filtra por user' },
    { codigo:'KB_Q4', texto:'Status do cliente (em_construcao, entregue) — testar troca' },
    { codigo:'KB_Q5', texto:'Criar chamado vinculado a cliente' },
    { codigo:'KB_Q6', texto:'Chamado sem problema / prioridade → 400' },
    { codigo:'KB_Q7', texto:'Chamado de cliente alheio → 403' },
    { codigo:'KB_Q8', texto:'Atualizar status do chamado (aberto, agendado, concluido)' },
    { codigo:'KB_Q9', texto:'Flag garantia: true — comportamento de filtro/exibição' },
  ]},
  { id:'R', titulo:'R. Configurações / Perfil', itens:[
    { codigo:'KB_R1', texto:'Editar nome do perfil PUT /profile → reflete no header da app' },
    { codigo:'KB_R2', texto:'Editar nome para string vazia → 400' },
    { codigo:'KB_R3', texto:'Editar companyName, companyCnpj, companyAddress, companyLogoUrl' },
    { codigo:'KB_R4', texto:'CNPJ inválido (sem 14 dígitos) → comportamento (hoje sem validação de máscara)' },
    { codigo:'KB_R5', texto:'Upload de logo da empresa → URL persiste em companyLogoUrl' },
    { codigo:'KB_R6', texto:'Trocar senha (se endpoint existe) → login novo funciona' },
    { codigo:'KB_R7', texto:'Documento e tipo de documento (CPF/CNPJ) — validar troca' },
  ]},
  { id:'S', titulo:'S. Plano & Assinatura (Asaas)', itens:[
    { codigo:'KB_S1',  texto:'Trial 7 dias é criado automaticamente no cadastro' },
    { codigo:'KB_S2',  texto:'trialEnd é exatamente 7 dias após startDate' },
    { codigo:'KB_S3',  texto:'Endpoint /auth/create-checkout requer JWT → 401 sem token' },
    { codigo:'KB_S4',  texto:'Criar checkout com plano válido → retorna invoiceUrl do Asaas' },
    { codigo:'KB_S5',  texto:'Criar checkout com planSlug inexistente → 400 "Plano não encontrado"' },
    { codigo:'KB_S6',  texto:'Usuário sem documento → fallback 000.000.000-00 (validar segurança)' },
    { codigo:'KB_S7',  texto:'🔴 CRÍTICO: webhook Asaas SEM asaas-access-token → 401' },
    { codigo:'KB_S8',  texto:'🔴 CRÍTICO: webhook com token errado → 401' },
    { codigo:'KB_S9',  texto:'Webhook com token válido + PAYMENT_CONFIRMED → assinatura vira active' },
    { codigo:'KB_S10', texto:'Webhook com PAYMENT_RECEIVED → idem' },
    { codigo:'KB_S11', texto:'Webhook com PAYMENT_FAILED ou outros → assinatura NÃO altera' },
    { codigo:'KB_S12', texto:'Trocar de plano (futuro) — endpoint não existe ainda' },
    { codigo:'KB_S13', texto:'Feature gate: plano start tenta módulo comercial (Pro) → 403 backend + bloqueio UI' },
  ]},
  { id:'T', titulo:'T. Admin / Superadmin', itens:[
    { codigo:'KB_T1',  texto:'Login com conta admin → carrega SidebarAdmin em vez de SidebarKubic' },
    { codigo:'KB_T2',  texto:'Acessar /admin/dashboard → KPIs: totalContas, totalPlanos, assinaturas, MRR' },
    { codigo:'KB_T3',  texto:'MRR calcula corretamente considerando customPrice quando existe' },
    { codigo:'KB_T4',  texto:'Distribuição de planos bate com contagem real' },
    { codigo:'KB_T5',  texto:'/admin/users retorna lista com dados de subscription + plano' },
    { codigo:'KB_T6',  texto:'PATCH /admin/users/:id/subscription permite mudar plano, status, datas, customPrice' },
    { codigo:'KB_T7',  texto:'PATCH com id UUID inválido → 400 (Zod uuid)' },
    { codigo:'KB_T8',  texto:'PATCH com user sem assinatura → 404 "Assinatura não encontrada"' },
    { codigo:'KB_T9',  texto:'/admin/plans retorna todos os planos ordenados por price ASC' },
    { codigo:'KB_T10', texto:'PATCH /admin/plans/:id atualiza price, maxUsers, maxProjects, features' },
    { codigo:'KB_T11', texto:'Toggle de feature por módulo persiste corretamente' },
    { codigo:'KB_T12', texto:'Conta NÃO-admin tentando /admin/* → 403 "Acesso negado: Somente superadministradores"' },
    { codigo:'KB_T13', texto:'Conta sem JWT em /admin/* → 401' },
  ]},
  { id:'U', titulo:'⚠️ U. Multi-tenant & Segurança (crítico)', itens:[
    { codigo:'KB_U1',  texto:'User A cria obra "OBRA-ALFA" → anota o ID retornado' },
    { codigo:'KB_U2',  texto:'User B faz GET /projects/{ID-DA-ALFA}/schedule → 403' },
    { codigo:'KB_U3',  texto:'User B lista GET /projects → "OBRA-ALFA" NÃO aparece' },
    { codigo:'KB_U4',  texto:'User B tenta POST /contas-pagar com projectId={ID-DA-ALFA} → 403' },
    { codigo:'KB_U5',  texto:'Repetir cross-tenant em: medicao, requisicao, cotacao, OC, funcionario, ponto, epi, rdo, fvs, fvm, estoque, cliente' },
    { codigo:'KB_U6',  texto:'PATCH/PUT/DELETE em todos os recursos acima com ID alheio → 403' },
    { codigo:'KB_U7',  texto:'ID malformado (/contas-pagar/abc/pagar) → erro genérico, sem stack trace' },
    { codigo:'KB_U8',  texto:'JWT manipulado (mudar id no payload sem assinar de novo) → 401' },
    { codigo:'KB_U9',  texto:'/auth/asaas-webhook em produção SEM token → 401' },
    { codigo:'KB_U10', texto:'CORS: pedido de origem desconhecida → bloqueio (validar config)' },
    { codigo:'KB_U11', texto:'Header x-user-id no CORS — bug latente (Sprint 1.2 remove)' },
    { codigo:'KB_U12', texto:'Site sempre HTTPS em produção' },
    { codigo:'KB_U13', texto:'Nenhum JWT ou senha aparece em log/console do browser' },
    { codigo:'KB_U14', texto:'Rate limit (100/min) — disparar 110 requests/min → 429 amigável' },
    { codigo:'KB_U15', texto:'Helmet headers presentes (CSP, X-Frame-Options, etc.)' },
    { codigo:'KB_U16', texto:'Token JWT de User A não funciona em recursos com header trocado' },
  ]},
  { id:'V', titulo:'V. Feature gating por plano', itens:[
    { codigo:'KB_V1', texto:'User no plano Start: subscription.features com módulos limitados' },
    { codigo:'KB_V2', texto:'UI: sidebar mostra cadeado nos módulos bloqueados pelo plano' },
    { codigo:'KB_V3', texto:'Componente <FeatureGate> bloqueia visualização do conteúdo' },
    { codigo:'KB_V4', texto:'UI permite navegar para módulo bloqueado mas mostra paywall' },
    { codigo:'KB_V5', texto:'Upgrade de plano (via admin) → features atualizadas no próximo login' },
    { codigo:'KB_V6', texto:'Plano "custom" com customPrice → flui sem erros no checkout' },
  ]},
  { id:'W', titulo:'W. Padronização de resposta (pós-Sprint 1.1)', itens:[
    { codigo:'KB_W1', texto:'Login bem-sucedido → { success: true, token, user, subscription }' },
    { codigo:'KB_W2', texto:'Login falho → { success: false, message: "..." } (bug que Sprint 1.1 corrige)' },
    { codigo:'KB_W3', texto:'Erro de validação Zod → { success: false, message: "Erro de validação", errors: {...} }' },
    { codigo:'KB_W4', texto:'401 global → { success: false, message: "Não autorizado..." }' },
    { codigo:'KB_W5', texto:'429 → { success: false, message: "Muitas requisições..." }' },
    { codigo:'KB_W6', texto:'500 em prod → { success: false, message: "Ocorreu um erro interno" } (sem stack)' },
    { codigo:'KB_W7', texto:'500 em dev → mostra error.message para debug' },
    { codigo:'KB_W8', texto:'Endpoint /health retorna { success: true, ... }' },
  ]},
  { id:'X', titulo:'X. Audit Log (pós-Sprint 1.3)', itens:[
    { codigo:'KB_X1', texto:'POST/PUT/PATCH/DELETE em qualquer recurso gera linha em AuditLog' },
    { codigo:'KB_X2', texto:'AuditLog.userId é o user do JWT' },
    { codigo:'KB_X3', texto:'AuditLog.before e after capturam snapshot' },
    { codigo:'KB_X4', texto:'GET /admin/audit?userId=&resource=&from=&to= funciona (superadmin)' },
    { codigo:'KB_X5', texto:'Conta não-admin → 403 no /admin/audit' },
    { codigo:'KB_X6', texto:'Soft delete: deletar Project não some do banco (campo deletedAt)' },
    { codigo:'KB_X7', texto:'Query padrão NÃO retorna registros com deletedAt populado' },
    { codigo:'KB_X8', texto:'Cascade soft delete funciona em ContaPagar, Funcionario etc.' },
  ]},
  { id:'Y', titulo:'Y. Edge / Robustez (cross-módulo)', itens:[
    { codigo:'KB_Y1',  texto:'Recarregar (F5) no meio de formulário → não perde dados' },
    { codigo:'KB_Y2',  texto:'Voltar/avançar do navegador → estado coerente, selectedProject persiste' },
    { codigo:'KB_Y3',  texto:'Conexão lenta (Slow 3G) → loaders aparecem, sem travar' },
    { codigo:'KB_Y4',  texto:'Abrir em mobile (320px, 375px, 768px) → layout não quebra' },
    { codigo:'KB_Y5',  texto:'Duplo clique em "Salvar Obra" → não cria duplicado' },
    { codigo:'KB_Y6',  texto:'Sessão expirada → trata sem tela branca, redireciona p/ login' },
    { codigo:'KB_Y7',  texto:'Backend offline → frontend mostra erro amigável, não tela branca' },
    { codigo:'KB_Y8',  texto:'Excluir obra com 1000+ filhos → cascade não estoura timeout' },
    { codigo:'KB_Y9',  texto:'Emoji 🔥 em nome de obra/funcionário/material → persiste no Postgres' },
    { codigo:'KB_Y10', texto:'Texto com 10.000 chars em campo de descrição → comportamento esperado' },
    { codigo:'KB_Y11', texto:"SQL injection ('; DROP TABLE--) → Prisma escapa automaticamente" },
    { codigo:'KB_Y12', texto:'XSS em nome de obra (<script>alert(1)</script>) → React escapa' },
    { codigo:'KB_Y13', texto:'Upload de arquivo gigante (50MB+) em campo logo → comportamento esperado' },
    { codigo:'KB_Y14', texto:'npm run build no frontend roda sem erro/warning crítico' },
    { codigo:'KB_Y15', texto:'Console do browser sem erros vermelhos durante uso normal' },
    { codigo:'KB_Y16', texto:'Lighthouse desktop: Performance > 80, A11y > 90, Best Practices > 90, SEO > 90' },
  ]},
]

// ══════════════════════════════════════════════════════════════════════════
// CONFIG DOS PRODUTOS
// ══════════════════════════════════════════════════════════════════════════
const PRODUTOS = {
  crm: {
    label: 'CRM Nexio', icon: '🤝',
    accentBg: 'bg-violet-600', accentBorder: 'border-violet-600', accentText: 'text-violet-400',
    progressColor: 'bg-violet-500',
    callout: 'Prioridade: Seção U (isolamento multi-tenant) e validações 400 — bug = vazamento entre clientes ou dado corrompido.',
    calloutCls: 'bg-violet-950/20 border-violet-800/30 text-violet-400/80',
    secoes: SECOES_CRM,
  },
  nero: {
    label: 'Nero Barber', icon: '💈',
    accentBg: 'bg-amber-600', accentBorder: 'border-amber-600', accentText: 'text-amber-400',
    progressColor: 'bg-amber-500',
    callout: 'Prioridade: V (multi-tenant) + timezone BRT (C5, G7, L3, X1/X2) + regressões G15/W6 (toque mobile), H14–H17 (comanda reset), I5–I9 (pacotes).',
    calloutCls: 'bg-amber-950/20 border-amber-800/30 text-amber-400/80',
    secoes: SECOES_NB,
  },
  kubic: {
    label: 'KubicEng', icon: '🏗️',
    accentBg: 'bg-blue-600', accentBorder: 'border-blue-600', accentText: 'text-blue-400',
    progressColor: 'bg-blue-500',
    callout: 'Prioridade: U (multi-tenant), S7–S11 (webhook Asaas = receita fantasma), W (padronização de resposta), K2/F2/G2/L2 (validações 400).',
    calloutCls: 'bg-blue-950/20 border-blue-800/30 text-blue-400/80',
    secoes: SECOES_KB,
  },
} as const

// ── Result config ──────────────────────────────────────────────────────────
const RES_CONFIG: Record<Resultado, { label: string; icon: string; cls: string }> = {
  pendente: { label: 'Pendente', icon: '○',  cls: 'border-gray-700 text-gray-600 bg-transparent' },
  passou:   { label: 'Passou',   icon: '✅', cls: 'border-emerald-700 text-emerald-400 bg-emerald-900/20' },
  falhou:   { label: 'Falhou',   icon: '❌', cls: 'border-red-700 text-red-400 bg-red-900/20' },
  estranho: { label: 'Estranho', icon: '⚠️', cls: 'border-amber-700 text-amber-400 bg-amber-900/20' },
}
const CYCLE: Resultado[] = ['pendente', 'passou', 'falhou', 'estranho']

// ── Obs modal ──────────────────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────────────────
export default function TestesPage() {
  const supabase = createClient()
  const [produto, setProduto] = useState<Produto>('crm')
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

  // Ao trocar de produto colapsa todas as seções (fresh view)
  useEffect(() => { setCollapsed({}) }, [produto])

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
    const next = CYCLE[(CYCLE.indexOf(getRes(codigo)) + 1) % CYCLE.length]
    setResultados(prev => ({ ...prev, [codigo]: { codigo, resultado: next, observacao: prev[codigo]?.observacao } }))
    setSaving(codigo)
    await supabase.from('testes_resultados').upsert(
      { codigo, resultado: next, observacao: resultados[codigo]?.observacao ?? null, updated_at: new Date().toISOString(), updated_by: userEmail },
      { onConflict: 'codigo' }
    )
    setSaving(null)
  }

  async function saveObs(codigo: string, obs: string) {
    setResultados(prev => ({ ...prev, [codigo]: { ...prev[codigo], codigo, resultado: getRes(codigo), observacao: obs } }))
    setObsModal(null)
    await supabase.from('testes_resultados').upsert(
      { codigo, resultado: getRes(codigo), observacao: obs || null, updated_at: new Date().toISOString(), updated_by: userEmail },
      { onConflict: 'codigo' }
    )
  }

  const cfg = PRODUTOS[produto]
  const secoes = cfg.secoes
  const totalItens = secoes.reduce((s, sec) => s + sec.itens.length, 0)

  const counts = { passou: 0, falhou: 0, estranho: 0, pendente: 0 }
  secoes.forEach(s => s.itens.forEach(i => { counts[getRes(i.codigo)]++ }))
  const progresso = Math.round(((counts.passou + counts.falhou + counts.estranho) / totalItens) * 100)

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
          <h1 className="text-2xl font-bold text-white">Roteiro de Testes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Clique no botão do item para ciclar: ○ → ✅ → ❌ → ⚠️</p>
        </div>

        {/* Tabs do produto */}
        <div className="flex gap-2 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-1.5">
          {(Object.entries(PRODUTOS) as [Produto, typeof PRODUTOS['crm']][]).map(([key, p]) => {
            const active = produto === key
            const itens = p.secoes.reduce((s, sec) => s + sec.itens.length, 0)
            const passou = p.secoes.reduce((s, sec) => s + sec.itens.filter(i => getRes(i.codigo) === 'passou').length, 0)
            const pct = Math.round((passou / itens) * 100)
            return (
              <button
                key={key}
                onClick={() => setProduto(key)}
                className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active ? `${p.accentBg} text-white shadow-lg` : 'text-gray-400 hover:text-white hover:bg-[#1a1a24]'
                }`}
              >
                <span className="text-lg leading-none">{p.icon}</span>
                <span className="text-xs font-semibold">{p.label}</span>
                <span className={`text-[10px] ${active ? 'text-white/70' : 'text-gray-600'}`}>
                  {pct}% • {itens} itens
                </span>
              </button>
            )
          })}
        </div>

        {/* Callout */}
        <div className={`border rounded-xl p-3.5 ${cfg.calloutCls}`}>
          <p className="text-xs"><strong>Prioridade:</strong> {cfg.callout}</p>
        </div>

        {/* Progress */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Progresso — {cfg.label}</p>
            <span className="text-sm font-bold text-white">{progresso}% <span className="text-gray-600 font-normal">({counts.passou + counts.falhou + counts.estranho}/{totalItens})</span></span>
          </div>
          <div className="w-full h-2 bg-[#1e1e2e] rounded-full overflow-hidden mb-4">
            <div className={`h-full ${cfg.progressColor} rounded-full transition-all duration-500`} style={{ width: `${progresso}%` }} />
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
            {secoes.map(sec => {
              const sc = secaoStats(sec)
              const isOpen = !collapsed[sec.id]
              const allPassed = sc.passou === sec.itens.length
              const hasFailed = sc.falhou > 0

              return (
                <div key={sec.id} className={`bg-[#111118] border rounded-xl overflow-hidden transition-colors ${
                  hasFailed ? 'border-red-900/50' : allPassed ? 'border-emerald-900/40' : 'border-[#1e1e2e]'
                }`}>
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

                  {isOpen && (
                    <div className="border-t border-[#1e1e2e] divide-y divide-[#1a1a24]">
                      {sec.itens.map(item => {
                        const res = getRes(item.codigo)
                        const obs = getObs(item.codigo)
                        const rcfg = RES_CONFIG[res]
                        return (
                          <div key={item.codigo} className={`flex items-start gap-3 px-5 py-3 ${
                            res === 'falhou' ? 'bg-red-950/10' : res === 'passou' ? 'bg-emerald-950/5' : ''
                          }`}>
                            <button
                              onClick={() => cycleResult(item.codigo)}
                              disabled={saving === item.codigo}
                              className={`flex-shrink-0 w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-all ${rcfg.cls} ${saving === item.codigo ? 'opacity-50' : 'hover:opacity-80'}`}
                              title="Clique para mudar resultado"
                            >
                              {saving === item.codigo ? '…' : rcfg.icon}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">{item.codigo}</span>
                                <p className={`text-sm leading-snug ${res === 'passou' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                  {item.texto}
                                </p>
                              </div>
                              {obs && <p className="text-[11px] text-amber-400/70 mt-1 truncate">↳ {obs}</p>}
                            </div>
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

      </div>

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
