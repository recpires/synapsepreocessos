'use client'

import { useEffect, useState } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────
type Resultado = 'pendente' | 'passou' | 'falhou' | 'estranho'
type Item = { codigo: string; texto: string }
type Secao = { id: string; titulo: string; itens: Item[] }
type ResultadoRow = { codigo: string; resultado: Resultado; observacao?: string }

// ── Roteiro completo — KubicEng ───────────────────────────────────────────
const SECOES: Secao[] = [
  { id: 'A', titulo: 'A. Autenticação & Conta', itens: [
    { codigo: 'KB_A1',  texto: 'Cadastro via /cadastro com nome, e-mail, senha forte + plano "pro" → cria conta + assinatura trial 7 dias' },
    { codigo: 'KB_A2',  texto: 'Registro com senha fraca "123" → bloqueia com mensagem clara' },
    { codigo: 'KB_A3',  texto: 'Registro com nome < 2 chars → 400 com mensagem Zod' },
    { codigo: 'KB_A4',  texto: 'Registro com e-mail inválido "abc@" → 400' },
    { codigo: 'KB_A5',  texto: 'Registro com e-mail já existente → 400 "Este e-mail já está em uso"' },
    { codigo: 'KB_A6',  texto: 'Registro com planSlug inexistente → 404 "Plano selecionado não encontrado"' },
    { codigo: 'KB_A7',  texto: 'Login /login com credenciais corretas → entra + JWT no localStorage' },
    { codigo: 'KB_A8',  texto: 'Login com senha errada → 401 "E-mail ou senha incorretos"' },
    { codigo: 'KB_A9',  texto: 'Login com e-mail inexistente → 401 (mesma mensagem, sem vazar que o e-mail não existe)' },
    { codigo: 'KB_A10', texto: 'Login com e-mail malformado → 400 Zod' },
    { codigo: 'KB_A11', texto: '/auth/me sem JWT → 401' },
    { codigo: 'KB_A12', texto: '/auth/me com JWT válido → devolve user + subscription + features do plano' },
    { codigo: 'KB_A13', texto: '/auth/me com JWT expirado/inválido → 401 "Sessão expirada"' },
    { codigo: 'KB_A14', texto: 'Logout → token removido, redireciona para landing' },
    { codigo: 'KB_A15', texto: 'Acessar /app direto sem login → redireciona para landing' },
    { codigo: 'KB_A16', texto: 'Trial de 7 dias é configurado corretamente em subscription.trialEnd' },
    { codigo: 'KB_A17', texto: '(futuro) Esqueci a senha — validar que botão não está visível ou retorna placeholder' },
  ]},
  { id: 'B', titulo: 'B. Dashboard', itens: [
    { codigo: 'KB_B1',  texto: 'Abre /app logado → renderiza header "Olá, {nome}!"' },
    { codigo: 'KB_B2',  texto: 'KPI "Obras Ativas" mostra count correto de prisma.project.count' },
    { codigo: 'KB_B3',  texto: 'KPI "Receita Aprovada" soma medicao.liquido onde status=aprovado' },
    { codigo: 'KB_B4',  texto: 'KPI "Alertas Críticos" = contas vencidas + estoque crítico (qtdAtual < qtdMinima)' },
    { codigo: 'KB_B5',  texto: 'KPI "Compras Pendentes" = count de requisicao com status pendente_aprovacao' },
    { codigo: 'KB_B6',  texto: 'Conta nova sem dados → KPIs aparecem zerados, sem crash' },
    { codigo: 'KB_B7',  texto: 'Endpoint /dashboard/kpis retorna { success: true, data: {...} }' },
    { codigo: 'KB_B8',  texto: 'Filtro por projectId na query → KPIs refletem só aquela obra' },
    { codigo: 'KB_B9',  texto: 'Endpoint /alertas retorna lista populada conforme estados' },
    { codigo: 'KB_B10', texto: 'Selecionar obra na sidebar atualiza os KPIs automaticamente' },
    { codigo: 'KB_B11', texto: 'Curva-S renderiza (mesmo com dados sintéticos)' },
    { codigo: 'KB_B12', texto: 'Mapa de obras renderiza sem crash mesmo sem obras' },
    { codigo: 'KB_B13', texto: 'Componente Alertas exibe lista com cores por severidade' },
  ]},
  { id: 'C', titulo: 'C. Engenharia — Obras (Projects)', itens: [
    { codigo: 'KB_C1',  texto: 'Criar obra com nome + versão → POST /projects retorna 201' },
    { codigo: 'KB_C2',  texto: 'Criar obra sem nome → 400 "Nome é obrigatório"' },
    { codigo: 'KB_C3',  texto: 'Criar obra com nome 500+ chars → comportamento esperado (validar limite)' },
    { codigo: 'KB_C4',  texto: 'Criar obra com data futura / data passada / data no formato errado' },
    { codigo: 'KB_C5',  texto: 'Plano "start" (maxProjects=1) já com 1 obra → 2ª criação retorna 403 "Limite de obras atingido"' },
    { codigo: 'KB_C6',  texto: 'Listar obras GET /projects → só vê as próprias (filtro userId)' },
    { codigo: 'KB_C7',  texto: 'Editar obra PUT /projects/:id → persiste' },
    { codigo: 'KB_C8',  texto: 'Editar obra de outro user → 403 "Você não tem permissão"' },
    { codigo: 'KB_C9',  texto: 'Excluir obra DELETE /projects/:id → 204 + cascade (cronograma, RDO, contas, etc. somem)' },
    { codigo: 'KB_C10', texto: 'Excluir obra de outro user → 403' },
    { codigo: 'KB_C11', texto: 'Status da obra (aprovado, revisao, em_analise) — testar todos' },
    { codigo: 'KB_C12', texto: 'UI: selecionar obra na sidebar persiste entre módulos' },
    { codigo: 'KB_C13', texto: 'UI: criar obra via modal da sidebar funciona' },
  ]},
  { id: 'D', titulo: 'D. Cronograma (ScheduleItem)', itens: [
    { codigo: 'KB_D1', texto: 'Criar item de cronograma POST /projects/:id/schedule com etapa, datas, progress, status' },
    { codigo: 'KB_D2', texto: 'Item sem etapa / startDate > endDate → 400' },
    { codigo: 'KB_D3', texto: 'Progress < 0 ou > 100 → 400 (validação Zod min 0 max 100)' },
    { codigo: 'KB_D4', texto: 'Listar cronograma de obra própria → OK' },
    { codigo: 'KB_D5', texto: 'Acessar cronograma de obra alheia → 403' },
    { codigo: 'KB_D6', texto: '(gap) Atualizar progresso de item — endpoint não existe ainda ⚠️' },
    { codigo: 'KB_D7', texto: '(gap) Excluir item — endpoint não existe ainda' },
    { codigo: 'KB_D8', texto: 'UI: gantt/timeline renderiza itens em ordem por startDate' },
  ]},
  { id: 'E', titulo: 'E. Orçamento (BudgetItem)', itens: [
    { codigo: 'KB_E1', texto: 'Listar orçamento GET /projects/:id/budget → retorna lista' },
    { codigo: 'KB_E2', texto: '(gap) Criar item de orçamento — endpoint POST não existe ainda ⚠️' },
    { codigo: 'KB_E3', texto: '(gap) Editar / excluir — endpoints não existem' },
    { codigo: 'KB_E4', texto: 'Comparativo orçado vs realizado é só leitura por enquanto' },
  ]},
  { id: 'F', titulo: 'F. Suprimentos — Requisições', itens: [
    { codigo: 'KB_F1',  texto: 'Criar requisição POST /requisicoes com item, obra, solicitante, valor, projectId → 201' },
    { codigo: 'KB_F2',  texto: 'Criar com valor negativo → 400 (Zod .positive())' },
    { codigo: 'KB_F3',  texto: 'Criar sem item / obra / solicitante → 400' },
    { codigo: 'KB_F4',  texto: 'Criar com projectId de outra empresa → 403 "Projeto não encontrado ou acesso negado"' },
    { codigo: 'KB_F5',  texto: 'Listar requisições da própria empresa → vem cotacoes: [] incluído' },
    { codigo: 'KB_F6',  texto: 'Aprovar requisição PATCH /requisicoes/:id/aprovar → status=aprovado' },
    { codigo: 'KB_F7',  texto: 'Aprovar requisição alheia → 403' },
    { codigo: 'KB_F8',  texto: 'Mover para cotação PATCH /requisicoes/:id/cotar → status=cotacao' },
    { codigo: 'KB_F9',  texto: 'Filtro por projectId funciona' },
    { codigo: 'KB_F10', texto: 'UI: fluxo pendente → cotação → aprovado → OC' },
  ]},
  { id: 'G', titulo: 'G. Suprimentos — Cotações & Ordens de Compra', itens: [
    { codigo: 'KB_G1',  texto: 'Criar cotação POST /cotacoes vinculada a requisição própria → 201' },
    { codigo: 'KB_G2',  texto: 'Cotação com preço negativo → 400' },
    { codigo: 'KB_G3',  texto: 'Cotação vinculada a requisição alheia → 403' },
    { codigo: 'KB_G4',  texto: 'Listar cotações → join com requisicao OK' },
    { codigo: 'KB_G5',  texto: 'Selecionar cotação PATCH /cotacoes/:id/selecionar → cria OC automaticamente + desmarca outras da mesma requisição' },
    { codigo: 'KB_G6',  texto: 'Selecionar cotação alheia → 403' },
    { codigo: 'KB_G7',  texto: 'BUG conhecido: cotação com requisicao.projectId null cria OC órfã (validar correção Sprint 1.2)' },
    { codigo: 'KB_G8',  texto: 'Criar OC direta POST /ordens-compra → 201' },
    { codigo: 'KB_G9',  texto: 'OC sem fornecedor / valor → 400' },
    { codigo: 'KB_G10', texto: 'Atualizar status da OC PATCH /ordens-compra/:id/status → aguardando, transito, entregue, cancelado' },
    { codigo: 'KB_G11', texto: 'Status inválido ("xyz") → 400 (enum Zod)' },
    { codigo: 'KB_G12', texto: 'Status de OC alheia → 403' },
  ]},
  { id: 'H', titulo: 'H. Execução — RDO (Relatório Diário de Obra)', itens: [
    { codigo: 'KB_H1', texto: 'Criar RDO POST /rdos com obra, clima, efetivo, atividades' },
    { codigo: 'KB_H2', texto: 'RDO sem obra / sem clima → 400' },
    { codigo: 'KB_H3', texto: 'efetivoProprio ou efetivoTerceiro negativo → comportamento esperado (bug latente — Zod sem .nonnegative())' },
    { codigo: 'KB_H4', texto: 'Atividades como array vazio → OK (vira JSON.stringify([]))' },
    { codigo: 'KB_H5', texto: 'RDO com data passada → OK' },
    { codigo: 'KB_H6', texto: 'Listar RDOs próprios GET /rdos' },
    { codigo: 'KB_H7', texto: 'Detalhe GET /rdos/:id → 200 se próprio, 404 se alheio' },
    { codigo: 'KB_H8', texto: 'GAP: Campo fotos: Int é só contagem — validar correção Sprint 7.1' },
    { codigo: 'KB_H9', texto: 'UI: fluxo de criação de RDO no mobile — validar responsivo' },
  ]},
  { id: 'I', titulo: 'I. Execução — FVS & FVM', itens: [
    { codigo: 'KB_I1', texto: 'Criar Ficha de Verificação de Serviço POST /fvs → 201, status=pendente' },
    { codigo: 'KB_I2', texto: 'FVS sem título / responsável → 400' },
    { codigo: 'KB_I3', texto: 'Listar FVS → OK' },
    { codigo: 'KB_I4', texto: 'Assinar FVS PATCH /fvs/:id/assinar com status aprovado ou recusado' },
    { codigo: 'KB_I5', texto: 'Assinar FVS alheia → 403' },
    { codigo: 'KB_I6', texto: 'Criar Ficha de Verificação de Material POST /fvm' },
    { codigo: 'KB_I7', texto: 'FVM com status inválido → 400 (enum pendente/aprovado/recusado)' },
    { codigo: 'KB_I8', texto: 'Listar FVM por obra → OK' },
  ]},
  { id: 'J', titulo: 'J. Execução — Estoque', itens: [
    { codigo: 'KB_J1',  texto: 'Criar item de estoque POST /estoque com material, qtdAtual, qtdMinima, unidade' },
    { codigo: 'KB_J2',  texto: 'Item sem material → 400' },
    { codigo: 'KB_J3',  texto: 'qtdAtual negativa → comportamento (Zod hoje não barra — bug latente)' },
    { codigo: 'KB_J4',  texto: 'Listar estoque por obra própria → OK' },
    { codigo: 'KB_J5',  texto: 'Entrada POST /estoque/entrada { itemEstoqueId, quantidade } → incrementa qtdAtual + cria MovimentacaoEstoque + atualiza ultimaEntrada' },
    { codigo: 'KB_J6',  texto: 'Entrada com quantidade = 0 ou negativa → 400 (Zod .positive())' },
    { codigo: 'KB_J7',  texto: 'Entrada em item alheio → 403' },
    { codigo: 'KB_J8',  texto: 'Saída POST /estoque/saida → decrementa qtdAtual' },
    { codigo: 'KB_J9',  texto: 'Saída maior que qtdAtual → comportamento (hoje fica negativo — bug)' },
    { codigo: 'KB_J10', texto: 'Alerta de estoque crítico aparece no dashboard quando qtdAtual < qtdMinima' },
  ]},
  { id: 'K', titulo: 'K. Financeiro — Contas a Pagar', itens: [
    { codigo: 'KB_K1',  texto: 'Criar conta POST /contas-pagar com fornecedor, valor positivo, vencimento, projectId' },
    { codigo: 'KB_K2',  texto: 'Valor 0 ou negativo → 400 (Zod .positive())' },
    { codigo: 'KB_K3',  texto: 'Vencimento em formato inválido → 400' },
    { codigo: 'KB_K4',  texto: 'Sem projectId → 400' },
    { codigo: 'KB_K5',  texto: 'ProjectId de outra empresa → 403' },
    { codigo: 'KB_K6',  texto: 'Listar contas → ordena por vencimento ascendente' },
    { codigo: 'KB_K7',  texto: 'Pagar conta PATCH /contas-pagar/:id/pagar → status=pago' },
    { codigo: 'KB_K8',  texto: 'Pagar conta alheia → 403' },
    { codigo: 'KB_K9',  texto: 'VALIDAR pós-Sprint 1.2: campo dataPagamento é populado ao pagar' },
    { codigo: 'KB_K10', texto: '(gap) Editar / excluir conta — endpoints não existem ainda' },
  ]},
  { id: 'L', titulo: 'L. Financeiro — Medições', itens: [
    { codigo: 'KB_L1', texto: 'Criar medição POST /medicoes com empreiteiro, servico, periodo, executado, valor, projectId' },
    { codigo: 'KB_L2', texto: 'Valor negativo → 400' },
    { codigo: 'KB_L3', texto: 'Calcula retencao = valor * 0.05 e liquido = valor - retencao automaticamente' },
    { codigo: 'KB_L4', texto: 'Medição com projectId alheio → 403' },
    { codigo: 'KB_L5', texto: 'Aprovar medição PATCH /medicoes/:id/aprovar → status=aprovado' },
    { codigo: 'KB_L6', texto: 'Aprovar medição alheia → 403' },
    { codigo: 'KB_L7', texto: '(gap) Edit / Delete / cancelar não existem' },
  ]},
  { id: 'M', titulo: 'M. Financeiro — Fluxo de Caixa', itens: [
    { codigo: 'KB_M1', texto: 'GET /fluxo-caixa retorna array agrupado por mês' },
    { codigo: 'KB_M2', texto: 'VALIDAR pós-Sprint 1.2: valores são brutos (não divididos por 1000)' },
    { codigo: 'KB_M3', texto: 'VALIDAR pós-Sprint 1.2: ordenação é cronológica, não alfabética' },
    { codigo: 'KB_M4', texto: 'VALIDAR pós-Sprint 1.2: despesa agrupa por dataPagamento, não vencimento' },
    { codigo: 'KB_M5', texto: 'Filtro por projectId funciona' },
    { codigo: 'KB_M6', texto: 'Conta nova sem medições/contas → array vazio, sem crash' },
  ]},
  { id: 'N', titulo: 'N. Pessoas — Funcionários', itens: [
    { codigo: 'KB_N1',  texto: 'Criar funcionário POST /funcionarios com nome, função, obra, tipo (proprio|terceiro), projectId' },
    { codigo: 'KB_N2',  texto: 'Tipo inválido (ex: "autonomo") → 400 (enum Zod)' },
    { codigo: 'KB_N3',  texto: 'Sem nome / função → 400' },
    { codigo: 'KB_N4',  texto: 'Funcionário com projectId alheio → 403' },
    { codigo: 'KB_N5',  texto: 'Listar funcionários → ordena por nome ascendente' },
    { codigo: 'KB_N6',  texto: 'Detalhe GET /funcionarios/:id → inclui últimos 30 registrosPonto' },
    { codigo: 'KB_N7',  texto: 'Detalhe de funcionário alheio → 404' },
    { codigo: 'KB_N8',  texto: 'Atualizar funcionário PUT /funcionarios/:id → persiste' },
    { codigo: 'KB_N9',  texto: 'Atualizar funcionário alheio → 403' },
    { codigo: 'KB_N10', texto: 'NR-35/NR-10 como string opcional aceita qualquer texto (gap — validar formato data)' },
    { codigo: 'KB_N11', texto: '(gap) Delete não existe' },
  ]},
  { id: 'O', titulo: 'O. Pessoas — Ponto', itens: [
    { codigo: 'KB_O1', texto: 'Criar registro de ponto POST /ponto com funcionarioId + horários' },
    { codigo: 'KB_O2', texto: 'Ponto de funcionário alheio → 403' },
    { codigo: 'KB_O3', texto: 'Sem data no body → usa new Date() automaticamente' },
    { codigo: 'KB_O4', texto: 'Listar pontos GET /ponto?data=YYYY-MM-DD&projectId=X' },
    { codigo: 'KB_O5', texto: 'Data inválida → comportamento (hoje quebra ou retorna lista vazia?)' },
    { codigo: 'KB_O6', texto: 'Filtro por projectId funciona' },
    { codigo: 'KB_O7', texto: '(gap) Edit / Delete não existem' },
  ]},
  { id: 'P', titulo: 'P. Pessoas — EPIs', itens: [
    { codigo: 'KB_P1', texto: 'Criar item de EPI POST /epis com item, qtdDisponivel, qtdMinima, projectId' },
    { codigo: 'KB_P2', texto: 'Quantidade negativa → comportamento esperado' },
    { codigo: 'KB_P3', texto: 'EPI com projectId alheio → 403' },
    { codigo: 'KB_P4', texto: 'Distribuir EPI POST /epis/distribuicao { epiId, quantidade } → decrementa qtdDisponivel + atualiza ultimaDistribuicao' },
    { codigo: 'KB_P5', texto: 'Distribuir mais que disponível → comportamento (hoje vira negativo)' },
    { codigo: 'KB_P6', texto: 'Distribuir EPI alheio → 403' },
    { codigo: 'KB_P7', texto: 'GAP: quem recebeu o EPI não é registrado — validar correção Sprint 7.1' },
  ]},
  { id: 'Q', titulo: 'Q. Comercial — Clientes & Chamados', itens: [
    { codigo: 'KB_Q1', texto: 'Criar cliente comercial Cliente vinculado a Project' },
    { codigo: 'KB_Q2', texto: 'Cliente sem nome / unidade → 400' },
    { codigo: 'KB_Q3', texto: 'Listar clientes → filtra por user' },
    { codigo: 'KB_Q4', texto: 'Status do cliente (em_construcao, entregue) — testar troca' },
    { codigo: 'KB_Q5', texto: 'Criar chamado Chamado vinculado a cliente' },
    { codigo: 'KB_Q6', texto: 'Chamado sem problema / prioridade → 400' },
    { codigo: 'KB_Q7', texto: 'Chamado de cliente alheio → 403' },
    { codigo: 'KB_Q8', texto: 'Atualizar status do chamado (aberto, agendado, concluido)' },
    { codigo: 'KB_Q9', texto: 'Flag garantia: true — comportamento de filtro/exibição' },
  ]},
  { id: 'R', titulo: 'R. Configurações / Perfil', itens: [
    { codigo: 'KB_R1', texto: 'Editar nome do perfil PUT /profile → reflete no header da app' },
    { codigo: 'KB_R2', texto: 'Editar nome para string vazia → 400' },
    { codigo: 'KB_R3', texto: 'Editar companyName, companyCnpj, companyAddress, companyLogoUrl' },
    { codigo: 'KB_R4', texto: 'CNPJ inválido (sem 14 dígitos) → comportamento esperado (hoje sem validação de máscara)' },
    { codigo: 'KB_R5', texto: 'Upload de logo da empresa → URL persiste em companyLogoUrl' },
    { codigo: 'KB_R6', texto: 'Trocar senha (se endpoint existe) → login novo funciona' },
    { codigo: 'KB_R7', texto: 'Documento e tipo de documento (CPF/CNPJ) — validar troca' },
  ]},
  { id: 'S', titulo: 'S. Plano & Assinatura (Asaas)', itens: [
    { codigo: 'KB_S1',  texto: 'Trial 7 dias é criado automaticamente no cadastro' },
    { codigo: 'KB_S2',  texto: 'trialEnd é exatamente 7 dias após startDate' },
    { codigo: 'KB_S3',  texto: 'Endpoint /auth/create-checkout requer JWT → 401 sem token' },
    { codigo: 'KB_S4',  texto: 'Criar checkout com plano válido → retorna invoiceUrl do Asaas' },
    { codigo: 'KB_S5',  texto: 'Criar checkout com planSlug inexistente → 400 "Plano não encontrado"' },
    { codigo: 'KB_S6',  texto: 'Usuário sem documento → fallback 000.000.000-00 (validar se é seguro)' },
    { codigo: 'KB_S7',  texto: '🔴 CRÍTICO: webhook Asaas SEM asaas-access-token no header → 401' },
    { codigo: 'KB_S8',  texto: '🔴 CRÍTICO: webhook com token errado → 401' },
    { codigo: 'KB_S9',  texto: 'Webhook com token válido + PAYMENT_CONFIRMED → assinatura vira active' },
    { codigo: 'KB_S10', texto: 'Webhook com PAYMENT_RECEIVED → idem' },
    { codigo: 'KB_S11', texto: 'Webhook com PAYMENT_FAILED ou outros → assinatura NÃO altera' },
    { codigo: 'KB_S12', texto: 'Trocar de plano (futuro) — endpoint não existe ainda' },
    { codigo: 'KB_S13', texto: 'Feature gate: plano start tenta módulo comercial (requer Pro) → 403 backend + bloqueio UI' },
  ]},
  { id: 'T', titulo: 'T. Admin / Superadmin', itens: [
    { codigo: 'KB_T1',  texto: 'Login com conta admin → carrega SidebarAdmin em vez de SidebarKubic' },
    { codigo: 'KB_T2',  texto: 'Acessar /admin/dashboard → KPIs: totalContas, totalPlanos, assinaturas ativas/trial, MRR' },
    { codigo: 'KB_T3',  texto: 'MRR calcula corretamente considerando customPrice quando existe' },
    { codigo: 'KB_T4',  texto: 'Distribuição de planos bate com contagem real' },
    { codigo: 'KB_T5',  texto: '/admin/users retorna lista com dados de subscription + plano' },
    { codigo: 'KB_T6',  texto: 'PATCH /admin/users/:id/subscription permite mudar plano, status, datas, customPrice' },
    { codigo: 'KB_T7',  texto: 'PATCH com id UUID inválido → 400 (Zod uuid)' },
    { codigo: 'KB_T8',  texto: 'PATCH com user sem assinatura → 404 "Assinatura não encontrada"' },
    { codigo: 'KB_T9',  texto: '/admin/plans retorna todos os planos ordenados por price ASC' },
    { codigo: 'KB_T10', texto: 'PATCH /admin/plans/:id atualiza price, maxUsers, maxProjects, features' },
    { codigo: 'KB_T11', texto: 'Toggle de feature por módulo persiste corretamente' },
    { codigo: 'KB_T12', texto: 'Conta NÃO-admin tentando /admin/* → 403 "Acesso negado: Somente superadministradores"' },
    { codigo: 'KB_T13', texto: 'Conta sem JWT em /admin/* → 401' },
  ]},
  { id: 'U', titulo: '⚠️ U. Multi-tenant & Segurança (crítico)', itens: [
    { codigo: 'KB_U1',  texto: 'User A cria obra "OBRA-ALFA" → anota o ID retornado' },
    { codigo: 'KB_U2',  texto: 'User B faz GET /projects/{ID-DA-ALFA}/schedule → 403' },
    { codigo: 'KB_U3',  texto: 'User B lista GET /projects → "OBRA-ALFA" NÃO aparece' },
    { codigo: 'KB_U4',  texto: 'User B tenta POST /contas-pagar com projectId={ID-DA-ALFA} → 403' },
    { codigo: 'KB_U5',  texto: 'Repetir cross-tenant em: medicao, requisicao, cotacao, OC, funcionario, ponto, epi, rdo, fvs, fvm, estoque, cliente' },
    { codigo: 'KB_U6',  texto: 'PATCH/PUT/DELETE em todos os recursos acima com ID alheio → 403' },
    { codigo: 'KB_U7',  texto: 'ID malformado (/contas-pagar/abc/pagar) → erro genérico, sem stack trace exposto' },
    { codigo: 'KB_U8',  texto: 'Token JWT de User A não funciona em recursos com header trocado' },
    { codigo: 'KB_U9',  texto: 'JWT manipulado (mudar id no payload sem assinar de novo) → 401 (assinatura inválida)' },
    { codigo: 'KB_U10', texto: '/auth/asaas-webhook em produção SEM token → 401 (validar pós-Sprint 1.2)' },
    { codigo: 'KB_U11', texto: 'CORS: pedido de origem desconhecida → bloqueio ou ecoa (validar config atual)' },
    { codigo: 'KB_U12', texto: 'Header x-user-id no CORS — bug latente (Sprint 1.2 remove)' },
    { codigo: 'KB_U13', texto: 'Site sempre HTTPS em produção (validar redirect HTTP → HTTPS na Vercel)' },
    { codigo: 'KB_U14', texto: 'Nenhum JWT ou senha aparece em log/console do browser' },
    { codigo: 'KB_U15', texto: 'Rate limit (100/min) — disparar 110 requests/min → 429 com mensagem amigável' },
    { codigo: 'KB_U16', texto: 'Helmet headers presentes nas respostas (CSP, X-Frame-Options, etc.)' },
  ]},
  { id: 'V', titulo: 'V. Feature gating por plano', itens: [
    { codigo: 'KB_V1', texto: 'User no plano Start: ao logar, recebe subscription.features com módulos limitados' },
    { codigo: 'KB_V2', texto: 'UI: sidebar mostra cadeado nos módulos bloqueados pelo plano' },
    { codigo: 'KB_V3', texto: 'Componente <FeatureGate module="comercial"> bloqueia visualização do conteúdo' },
    { codigo: 'KB_V4', texto: 'UI permite navegar para módulo bloqueado mas mostra paywall (não tela em branco)' },
    { codigo: 'KB_V5', texto: 'Upgrade de plano (via admin) → features atualizadas no próximo login' },
    { codigo: 'KB_V6', texto: 'Plano "custom" com customPrice → flui sem erros no checkout' },
  ]},
  { id: 'W', titulo: 'W. Padronização de resposta (pós-Sprint 1.1)', itens: [
    { codigo: 'KB_W1', texto: 'Login bem-sucedido → { success: true, token, user, subscription }' },
    { codigo: 'KB_W2', texto: 'Login falho → { success: false, message: "..." } (bug que Sprint 1.1 corrige)' },
    { codigo: 'KB_W3', texto: 'Erro de validação Zod → { success: false, message: "Erro de validação", errors: {...} }' },
    { codigo: 'KB_W4', texto: '401 global → { success: false, message: "Não autorizado..." }' },
    { codigo: 'KB_W5', texto: '429 → { success: false, message: "Muitas requisições..." }' },
    { codigo: 'KB_W6', texto: '500 em prod → { success: false, message: "Ocorreu um erro interno" } (sem stack)' },
    { codigo: 'KB_W7', texto: '500 em dev → mostra error.message para debug' },
    { codigo: 'KB_W8', texto: 'Endpoint /health retorna { success: true, ... }' },
  ]},
  { id: 'X', titulo: 'X. Audit Log (pós-Sprint 1.3)', itens: [
    { codigo: 'KB_X1', texto: 'POST/PUT/PATCH/DELETE em qualquer recurso gera linha em AuditLog' },
    { codigo: 'KB_X2', texto: 'AuditLog.userId é o user do JWT' },
    { codigo: 'KB_X3', texto: 'AuditLog.before e after capturam snapshot (em PATCH/PUT)' },
    { codigo: 'KB_X4', texto: 'GET /admin/audit?userId=&resource=&from=&to= funciona (superadmin)' },
    { codigo: 'KB_X5', texto: 'Conta não-admin → 403 no /admin/audit' },
    { codigo: 'KB_X6', texto: 'Soft delete: deletar Project não some do banco (campo deletedAt)' },
    { codigo: 'KB_X7', texto: 'Query padrão NÃO retorna registros com deletedAt populado' },
    { codigo: 'KB_X8', texto: 'Cascade soft delete funciona em ContaPagar, Funcionario etc.' },
  ]},
  { id: 'Y', titulo: 'Y. Edge / Robustez (cross-módulo)', itens: [
    { codigo: 'KB_Y1',  texto: 'Recarregar (F5) no meio de formulário (ex: criar obra) → não perde dados (unsaved changes toast)' },
    { codigo: 'KB_Y2',  texto: 'Voltar/avançar do navegador entre módulos → estado coerente, selectedProject persiste' },
    { codigo: 'KB_Y3',  texto: 'Conexão lenta (Slow 3G) → loaders aparecem, sem travar' },
    { codigo: 'KB_Y4',  texto: 'Abrir em mobile (320px, 375px, 768px) → layout não quebra' },
    { codigo: 'KB_Y5',  texto: 'Duplo clique em "Salvar Obra" → não cria duplicado' },
    { codigo: 'KB_Y6',  texto: 'Sessão expirada no meio de uma ação → trata sem tela branca, redireciona p/ login' },
    { codigo: 'KB_Y7',  texto: 'Backend offline (npm run dev parado) → frontend mostra erro amigável (toast?), não tela branca' },
    { codigo: 'KB_Y8',  texto: 'Excluir uma obra com 1000+ filhos (RDOs, contas, funcionários) → cascade não estoura timeout' },
    { codigo: 'KB_Y9',  texto: 'Emoji 🔥 em nome de obra/funcionário/material → persiste corretamente no Postgres' },
    { codigo: 'KB_Y10', texto: 'Texto com 10.000 chars em campo de descrição → comportamento esperado' },
    { codigo: 'KB_Y11', texto: "SQL injection ('; DROP TABLE--) no campo nome → Prisma escapa automaticamente, valida" },
    { codigo: 'KB_Y12', texto: 'XSS em nome de obra (<script>alert(1)</script>) → React escapa, valida que não dispara alert' },
    { codigo: 'KB_Y13', texto: 'Upload de arquivo gigante (50MB+) em campo logo → comportamento esperado' },
    { codigo: 'KB_Y14', texto: 'npm run build no frontend roda sem erro/warning crítico' },
    { codigo: 'KB_Y15', texto: 'Console do browser sem erros vermelhos durante uso normal' },
    { codigo: 'KB_Y16', texto: 'Lighthouse desktop: Performance > 80, A11y > 90, Best Practices > 90, SEO > 90' },
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
          className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-[#1a1a24] text-gray-300 text-sm py-2 rounded-lg hover:bg-[#222232] transition-colors">Cancelar</button>
          <button onClick={() => onSave(val)} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function TestesKubicPage() {
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
      .like('codigo', 'KB_%')
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
              <span className="text-2xl">🏗️</span>
              <h1 className="text-2xl font-bold text-white">Roteiro de Testes — KubicEng</h1>
            </div>
            <p className="text-gray-500 text-sm">Clique no botão do item para ciclar: ○ → ✅ → ❌ → ⚠️</p>
          </div>
          <div className="flex gap-2">
            <a href="/testes" className="text-xs text-gray-500 hover:text-white transition-colors border border-[#1e1e2e] rounded-lg px-3 py-2">← CRM</a>
            <a href="/testes/nero" className="text-xs text-gray-500 hover:text-white transition-colors border border-[#1e1e2e] rounded-lg px-3 py-2">← Nero</a>
          </div>
        </div>

        {/* Prioridades callout */}
        <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-blue-400 mb-2">🔵 Prioridade ao revisar</p>
          <p className="text-xs text-blue-300/70">1. <strong>U (isolamento multi-tenant)</strong> — bug = vazamento de dados entre empresas</p>
          <p className="text-xs text-blue-300/70">2. <strong>S7-S11 (webhook Asaas)</strong> — bug = receita fantasma / cobrança não atualiza</p>
          <p className="text-xs text-blue-300/70">3. <strong>W (padronização de resposta)</strong> — bug = frontend quebra silenciosamente</p>
          <p className="text-xs text-blue-300/70">4. <strong>K2, F2, G2, L2 (validações 400)</strong> — bug = dado corrompido no banco</p>
          <p className="text-xs text-blue-300/70">5. Itens marcados com "VALIDAR pós-Sprint 1.X" só testar após a sprint ser mergeada</p>
        </div>

        {/* Progress */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Progresso geral</p>
            <span className="text-sm font-bold text-white">{progresso}% <span className="text-gray-600 font-normal">({counts.passou + counts.falhou + counts.estranho}/{TOTAL_ITENS})</span></span>
          </div>
          <div className="w-full h-2 bg-[#1e1e2e] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progresso}%` }} />
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
                            <button
                              onClick={() => cycleResult(item.codigo)}
                              disabled={saving === item.codigo}
                              className={`flex-shrink-0 w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-all ${cfg.cls} ${saving === item.codigo ? 'opacity-50' : 'hover:opacity-80'}`}
                              title="Clique para mudar resultado"
                            >
                              {saving === item.codigo ? '…' : cfg.icon}
                            </button>

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
        <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-4">
          <p className="text-xs text-blue-400/80">
            <strong>Itens com (gap):</strong> não são bugs — são features previstas para Sprints futuras (1.4, 4–7). Itens marcados com "BUG conhecido" ou "CRÍTICO" entram como P0 se marcados ❌. Seção U ou S com ❌ = bloqueante de produção.
          </p>
        </div>
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
