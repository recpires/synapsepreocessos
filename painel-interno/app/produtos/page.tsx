'use client'

import { useState, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import {
  fetchNeroBarberAdmin, updateNeroShopPlan,
  fetchKubicEngAdmin, updateKubicUserPlan,
  fetchPsiAuraAdmin, fetchNexioAdmin,
  type NeroAdminData, type KubicAdminData, type NeroPlan, type KubicPlan,
  type PsiAuraAdminData, type NexioAdminData,
} from '@/lib/supabase/server'

/* ─── Tipos ───────────────────────────────────────────────────── */
interface Cor    { nome: string; hex: string; uso: string }
interface Fonte  { papel: string; familia: string; peso: string }
interface Feature{ titulo: string; desc: string }
interface Tech   { label: string; categoria: 'frontend' | 'backend' | 'infra' | 'integração' }
interface Plano  { nome: string; preco: string; periodicidade?: string; usuarios: string; destaque?: boolean; features: string[] }
interface Doc    { tipo: 'readme' | 'licença' | 'segurança' | 'identidade' | 'contrato' | 'qa' | 'deploy'; titulo: string; desc: string; arquivo?: string }
interface ICP    { perfil: string; dor: string; gatilho: string; canal: string }

interface MaturidadeCamada { camada: string; pct: number }

interface Produto {
  id: string; icon: string; nome: string; tagline: string
  status: string; statusCor: string; pct: number
  maturidadeBreakdown?: MaturidadeCamada[]
  descCurta: string; descLonga: string
  personalidade: string
  cores: Cor[]; fontes: Fonte[]
  features: Feature[]; stack: Tech[]
  planos: Plano[]; docs: Doc[]; icp: ICP
  url?: string; lancamento?: string
}

/* ─── Dados dos produtos ─────────────────────────────────────── */
const PRODUTOS: Produto[] = [
  /* ══════════════════════════════ NERO BARBER ══════════════════════════════ */
  {
    id: 'nero-barber',
    icon: '💈', nome: 'Nero Barber',
    tagline: 'Plataforma premium para barbearias modernas',
    status: 'Maduro', statusCor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40',
    pct: 98,
    maturidadeBreakdown: [
      { camada: 'App / Agendamento', pct: 99 },
      { camada: 'Financeiro / Asaas', pct: 98 },
      { camada: 'CRM & Fidelização', pct: 98 },
      { camada: 'PWA / Mobile',      pct: 97 },
      { camada: 'White-Label',       pct: 96 },
    ],
    descCurta: 'SaaS PWA para barbearias — agendamento inteligente, caixa digital, CRM e fidelização.',
    descLonga: 'Mais do que um agendador — um ecossistema completo de gestão que transforma barbearias em negócios de alta performance. Do agendamento online ao controle financeiro, do estoque ao clube de fidelidade, o Nero oferece tudo em uma plataforma com identidade premium e suporte a white-label para franquias e redes.',
    personalidade: 'Premium · Dark · Sofisticado · Direto. A experiência visual remete ao ambiente da barbearia clássica com toques modernos — preto e ouro.',

    cores: [
      { nome: 'Nero Black',  hex: '#000000', uso: 'Background principal' },
      { nome: 'Barber Gold', hex: '#ECA704', uso: 'Primary — CTAs e destaques' },
      { nome: 'Gold Dark',   hex: '#D4960A', uso: 'Hover / botões no light mode' },
      { nome: 'Surface',     hex: '#111111', uso: 'Cards e superfícies' },
    ],
    fontes: [
      { papel: 'Títulos',  familia: 'Playfair Display', peso: '700' },
      { papel: 'UI / Corpo', familia: 'Inter',          peso: '400–600' },
    ],

    features: [
      { titulo: 'Agendamento Inteligente', desc: 'Reservas em tempo real, recorrência, bloqueios, gestão multi-barbeiro e link próprio de agendamento.' },
      { titulo: 'Caixa & Financeiro',      desc: 'Comanda digital, fluxo de caixa diário, divisão de pagamentos, integração Asaas (PIX + cartão).' },
      { titulo: 'Estoque & E-commerce',    desc: 'Controle de produtos com múltiplas imagens, vitrine virtual e pacotes de serviços.' },
      { titulo: 'CRM & Fidelização',       desc: 'Nero Club (assinaturas recorrentes), pontos automáticos, gestão de clientes e histórico completo.' },
      { titulo: 'Comissões & Equipe',      desc: 'Metas por barbeiro, comissões automáticas e suporte a múltiplas unidades.' },
      { titulo: 'White-Label',             desc: 'Identidade visual customizável para redes e franquias — logo, cores e domínio próprio.' },
    ],

    stack: [
      { label: 'Next.js 15',      categoria: 'frontend' },
      { label: 'TypeScript',      categoria: 'frontend' },
      { label: 'TailwindCSS v4',  categoria: 'frontend' },
      { label: 'Shadcn/ui',       categoria: 'frontend' },
      { label: 'Framer Motion',   categoria: 'frontend' },
      { label: 'Supabase',        categoria: 'backend' },
      { label: 'PostgreSQL',      categoria: 'backend' },
      { label: 'Supabase Auth',   categoria: 'backend' },
      { label: 'Supabase Storage',categoria: 'backend' },
      { label: 'Asaas (PIX)',     categoria: 'integração' },
      { label: 'PWA',             categoria: 'infra' },
      { label: 'Vercel',          categoria: 'infra' },
    ],

    planos: [
      {
        nome: 'Básico', preco: 'R$79', periodicidade: '/mês',
        usuarios: '1 barbeiro',
        features: ['Agendamento online', 'Caixa digital', 'Relatórios básicos', 'App PWA'],
      },
      {
        nome: 'Pro', preco: 'R$149', periodicidade: '/mês',
        usuarios: 'Até 3 barbeiros', destaque: true,
        features: ['Tudo do Básico', 'CRM + Fidelização', 'Estoque + E-commerce', 'Comissões automáticas', 'Integração Asaas'],
      },
      {
        nome: 'Premium', preco: 'R$249', periodicidade: '/mês',
        usuarios: 'Barbeiros ilimitados',
        features: ['Tudo do Pro', 'White-label', 'Multi-unidades', 'Nero Club (assinaturas)', 'Suporte prioritário'],
      },
    ],

    docs: [
      { tipo: 'readme',     titulo: 'README',                  desc: 'Visão geral, arquitetura e instruções de setup.',           arquivo: 'README.md' },
      { tipo: 'identidade', titulo: 'Identidade Visual',       desc: 'Cores, tipografia, componentes e design system completo.',  arquivo: 'docs/IDENTIDADE-VISUAL.md' },
      { tipo: 'segurança',  titulo: 'Política de Segurança',   desc: 'SGSI alinhado ISO 27001:2022 + LGPD.',                     arquivo: 'docs/sgsi/politica-seguranca-informacao.md' },
      { tipo: 'segurança',  titulo: 'Gestão de Riscos',        desc: 'Matriz de riscos com 10 ameaças identificadas e mitigações.',arquivo: 'docs/sgsi/gestao-de-riscos.md' },
      { tipo: 'segurança',  titulo: 'Resposta a Incidentes',   desc: 'Plano IRP com classificação P0–P3 e runbooks.',             arquivo: 'docs/sgsi/resposta-a-incidentes.md' },
      { tipo: 'qa',         titulo: 'Roteiro de Testes',       desc: 'Plano de testes funcional completo — Nero Barber.',         arquivo: 'docs/ROTEIRO_TESTES_NERO.md' },
      { tipo: 'deploy',     titulo: 'White-Label Guide',       desc: 'Guia de customização para redes e franquias.',              arquivo: 'docs/WHITELABEL.md' },
    ],

    icp: {
      perfil:   'Dono de barbearia com 1–3 cadeiras, 20–80 atendimentos/semana.',
      dor:      'Perde clientes por falta de controle, agenda pelo WhatsApp e não tem controle financeiro.',
      gatilho:  '"Perdi cliente por horário esquecido" ou "Quero abrir 2ª unidade".',
      canal:    'Instagram (busca barbearia), grupos WhatsApp, Google Maps.',
    },
    url: 'https://nerobarber.com.br',
  },

  /* ══════════════════════════════ FINANÇA A DOIS ══════════════════════════════ */
  {
    id: 'financa-a-dois',
    icon: '💳', nome: 'Finança a Dois',
    tagline: 'Finanças compartilhadas para casais — sem brigas no fim do mês',
    status: 'Beta', statusCor: 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/40',
    pct: 92,
    maturidadeBreakdown: [
      { camada: 'App / Dashboard',            pct: 95 },
      { camada: 'Transações & Recorrentes',   pct: 94 },
      { camada: 'Patrimônio & Investimentos', pct: 90 },
      { camada: 'IA de Economia',             pct: 88 },
      { camada: 'Billing / Asaas',            pct: 88 },
      { camada: 'Assessoria (B2B2C)',         pct: 82 },
    ],
    descCurta: 'SaaS de finanças para casais — conta conjunta, metas compartilhadas, patrimônio e uma IA que sugere onde economizar.',
    descLonga: 'Workspace financeiro compartilhado onde cada casal é um tenant: conta conjunta, receitas e despesas, gastos fixos e parcelados, lista de mercado, contas, cartões, dívidas e metas. Vai além do dia a dia com gestor de patrimônio (net worth, alocação alvo × atual, simulador FIRE, bola de neve × avalanche, benchmark CDI/IPCA), termômetro financeiro 0–100, projeção de orçamento de 12 meses e uma IA que analisa os gastos e sugere cortes. Modelo B2B2C com assessoria: um assessor parceiro acompanha o casal mediante consentimento. Trial de 14 dias, assinaturas via Asaas e PWA instalável.',
    personalidade: 'Confiável · Acessível · Colaborativo. Dois perfis que se entrelaçam formando um coração com cifrão — azul rico transmite segurança financeira, turquesa vibrante traz inovação e energia. Dark mode com glassmorphism, tom próximo e sem juridiquês.',

    cores: [
      { nome: 'Azul Rico',          hex: '#111A31', uso: 'Títulos, botões primários, ícones principais' },
      { nome: 'Turquesa Vibrante',  hex: '#2DC2A1', uso: 'Destaques, ações secundárias, gráficos' },
      { nome: 'Branco Puro',        hex: '#FFFFFF', uso: 'Fundos e texto sobre superfícies escuras' },
      { nome: 'Cinza Médio',        hex: '#757575', uso: 'Texto secundário e ícones de interface' },
      { nome: 'Cinza Claro',        hex: '#F5F5F5', uso: 'Fundos de seção e divisores' },
    ],
    fontes: [
      { papel: 'Títulos / Marca', familia: 'Poppins', peso: '500–700' },
      { papel: 'UI / Corpo',      familia: 'Poppins', peso: '400' },
    ],

    features: [
      { titulo: 'Dashboard do Casal',        desc: 'Saldo consolidado, receitas × despesas (6 meses), gastos por categoria, cotações (dólar/euro/BTC/Ibovespa) e regime competência/caixa.' },
      { titulo: 'Transações & Recorrentes',  desc: 'CRUD com filtros e busca, anexo de comprovante, import OFX/CSV, gastos fixos e parcelados materializados por cron.' },
      { titulo: 'Contas, Cartões & Dívidas', desc: 'Cartão de crédito (disponível = limite − fatura), vale-alimentação/refeição, saldo devedor, parcelas e % quitado.' },
      { titulo: 'Gestor de Patrimônio',      desc: 'Net worth, alocação alvo × atual, reserva, simulador FIRE, plano de quitação (bola de neve × avalanche) e Carta do Gestor (IA).' },
      { titulo: 'IA de Economia',            desc: 'Analisa os gastos do casal e sugere cortes; termômetro financeiro 0–100 e projeção de orçamento de 12 meses à frente.' },
      { titulo: 'Assessoria (B2B2C)',        desc: 'Assessor parceiro acompanha o casal com consentimento; painel admin com MRR/ARR/churn e aprovação de assessores.' },
    ],

    stack: [
      { label: 'Next.js 15 (App Router)', categoria: 'frontend' },
      { label: 'TypeScript',              categoria: 'frontend' },
      { label: 'TailwindCSS',             categoria: 'frontend' },
      { label: 'Recharts',                categoria: 'frontend' },
      { label: 'Supabase (Postgres+RLS)', categoria: 'backend' },
      { label: 'Supabase Auth',           categoria: 'backend' },
      { label: 'Server Actions',          categoria: 'backend' },
      { label: 'Anthropic / OpenAI',      categoria: 'integração' },
      { label: 'Asaas (pagamentos)',      categoria: 'integração' },
      { label: 'Resend (e-mail)',         categoria: 'integração' },
      { label: 'AwesomeAPI / BCB',        categoria: 'integração' },
      { label: 'PWA + Capacitor',         categoria: 'infra' },
      { label: 'Vercel',                  categoria: 'infra' },
    ],

    planos: [
      {
        nome: 'Grátis', preco: 'R$0', periodicidade: ' sempre',
        usuarios: '1 conta conjunta',
        features: ['Receitas e despesas ilimitadas', 'Dashboard básico', '1 meta ativa'],
      },
      {
        nome: 'Casal', preco: 'R$19,90', periodicidade: '/mês', destaque: true,
        usuarios: 'O casal completo',
        features: ['Contas e cartões ilimitados', 'Vale-alimentação e carteiras', 'Metas ilimitadas + prioridades', 'Dashboard interativo completo', 'Sugestões da IA (10/mês)'],
      },
      {
        nome: 'Premium', preco: 'R$29,90', periodicidade: '/mês',
        usuarios: 'Casais que querem ir além',
        features: ['Tudo do plano Casal', 'IA ilimitada de economia', 'Relatórios e exportação', 'Prioridades avançado', 'Suporte prioritário', '+ add-on de Assessoria'],
      },
    ],

    docs: [
      { tipo: 'readme',     titulo: 'README',              desc: 'Visão geral, funcionalidades, stack e estrutura do projeto.',          arquivo: 'README.md' },
      { tipo: 'identidade', titulo: 'Identidade Visual',   desc: 'Logo, paleta (Azul Rico / Turquesa), tipografia Poppins e tom.',       arquivo: 'docs/IDENTY.md' },
      { tipo: 'segurança',  titulo: 'Security Policy',     desc: 'RLS multi-tenant, isolamento da assessoria, webhooks e cron por token.', arquivo: 'SECURITY.md' },
      { tipo: 'deploy',     titulo: 'Guia de Setup',       desc: 'Passo a passo de instalação, variáveis de ambiente e migrações.',      arquivo: 'SETUP.md' },
      { tipo: 'qa',         titulo: 'Base de Conhecimento', desc: 'FAQ, objeções e recursos para vendas e suporte.',                     arquivo: 'docs/base-conhecimento/' },
    ],

    icp: {
      perfil:   'Casais (namoro, noivado ou casados) que dividem contas — 25–45 anos, renda combinada R$4k–20k/mês.',
      dor:      'Brigam no fim do mês por falta de visão compartilhada, controlam em planilhas separadas e não sabem para onde vai o dinheiro do casal.',
      gatilho:  '"Vamos casar / morar juntos e precisamos organizar as contas" ou "brigamos por dinheiro todo mês".',
      canal:    'Instagram / TikTok (finanças de casais), indicação e assessores financeiros parceiros (B2B2C).',
    },
  },

  /* ══════════════════════════════ PSI AURA ══════════════════════════════ */
  {
    id: 'psi-aura',
    icon: '🧠', nome: 'Psi Aura',
    tagline: 'Gestão clínica de alta performance para psicólogos',
    status: 'Em pausa', statusCor: 'bg-slate-800/40 text-slate-400 border border-slate-700/50',
    pct: 65,
    maturidadeBreakdown: [
      { camada: 'Backend .NET',     pct: 85 },
      { camada: 'Módulo ABA',       pct: 60 },
      { camada: 'Segurança / LGPD', pct: 40 },
      { camada: 'Frontend React',   pct: 30 },
      { camada: 'Mobile',           pct: 15 },
    ],
    descCurta: 'SaaS para psicólogos — agenda, prontuários eletrônicos e módulo ABA integrado.',
    descLonga: 'Plataforma clínica focada em Análise do Comportamento Aplicado (ABA) e produtividade do psicólogo. Prontuário eletrônico com assinatura digital, agenda com controle de salas, financeiro por profissional e suporte a clínicas multidisciplinares. v2.1.0 com protocolos ABA completos em produção.',
    personalidade: 'Acolhedor · Científico · Claro. A experiência é serena — azul-marinho e teal transmitem confiança e cuidado sem frieza corporativa.',

    cores: [
      { nome: 'Navy Trust',    hex: '#1E3A5F', uso: 'Primária — cabeçalhos e sidebar' },
      { nome: 'Serene Blue',   hex: '#3498DB', uso: 'Secundária — links e botões' },
      { nome: 'Teal Care',     hex: '#4ECDC4', uso: 'Accent — destaques e badges' },
      { nome: 'Mint Welcome',  hex: '#95E1D3', uso: 'Highlights e efeito aura' },
      { nome: 'Warm White',    hex: '#FBFCFD', uso: 'Background base' },
    ],
    fontes: [
      { papel: 'UI / Corpo',  familia: 'Inter',            peso: '400–600' },
      { papel: 'Marketing',   familia: 'DM Serif Display', peso: '400' },
      { papel: 'Dados clínicos', familia: 'JetBrains Mono', peso: '400–500' },
    ],

    features: [
      { titulo: 'Agenda Inteligente',     desc: 'Controle de salas, prevenção de conflito de horário, recorrência e notificações automáticas.' },
      { titulo: 'Prontuário Eletrônico',  desc: 'Evoluções clínicas com assinatura digital e histórico imutável — conformidade CFP.' },
      { titulo: 'Módulo ABA',             desc: 'Registro ABC (Antecedente-Comportamento-Consequência) em tempo real — Quick Section.' },
      { titulo: 'Avaliações Científicas', desc: 'VB-MAPP com pontuação decimal (escores 0.5), protocolos padronizados.' },
      { titulo: 'Financeiro',             desc: 'Fluxo de caixa por psicólogo e clínica, controle de inadimplência e relatórios.' },
      { titulo: 'Multi-Clínica',          desc: 'Suporte a múltiplos CNPJ / espaços sob o mesmo tenant com isolamento total de dados.' },
    ],

    stack: [
      { label: 'React',          categoria: 'frontend' },
      { label: 'TypeScript',     categoria: 'frontend' },
      { label: 'Vite',           categoria: 'frontend' },
      { label: 'TailwindCSS',    categoria: 'frontend' },
      { label: '.NET 9 (C#)',    categoria: 'backend' },
      { label: 'Entity Framework', categoria: 'backend' },
      { label: 'PostgreSQL',     categoria: 'backend' },
      { label: 'SignalR',        categoria: 'backend' },
      { label: 'QuestPDF',       categoria: 'backend' },
      { label: 'GCP Cloud Run',  categoria: 'infra' },
      { label: 'Supabase',       categoria: 'infra' },
    ],

    planos: [
      {
        nome: 'Básico', preco: 'R$69', periodicidade: '/mês',
        usuarios: '1 psicólogo',
        features: ['Agenda + Prontuário', 'Financeiro básico', 'App web responsivo'],
      },
      {
        nome: 'Pro', preco: 'R$129', periodicidade: '/mês',
        usuarios: 'Até 3 psicólogos', destaque: true,
        features: ['Tudo do Básico', 'Módulo ABA', 'Avaliações VB-MAPP', 'Relatórios PDF/Excel', 'Chat interno'],
      },
      {
        nome: 'Clínica', preco: 'R$199', periodicidade: '/mês',
        usuarios: 'Psicólogos ilimitados',
        features: ['Tudo do Pro', 'Multi-clínica', 'LGPD + CFP compliance', 'Suporte prioritário', 'Onboarding dedicado'],
      },
    ],

    docs: [
      { tipo: 'readme',     titulo: 'README',               desc: 'Visão geral do sistema, versão atual e instruções.',          arquivo: 'README.md' },
      { tipo: 'segurança',  titulo: 'Security Policy',      desc: 'LGPD + CFP compliance, criptografia e controles de acesso.',  arquivo: 'docs/SECURITY_POLICY.md' },
      { tipo: 'identidade', titulo: 'Identidade Visual',    desc: 'Brand book completo: cores, tipografia e componentes.',       arquivo: 'docs/IDENTIDADE_VISUAL.md' },
      { tipo: 'deploy',     titulo: 'Guia de Deploy',       desc: 'Migração Render → GCP e instruções de produção.',             arquivo: 'docs/DEPLOY_INSTRUCTIONS.md' },
      { tipo: 'deploy',     titulo: 'Guia de Navegação',    desc: 'Fluxo completo do psicólogo no sistema — v2.1.0.',            arquivo: 'docs/guias/GUIA_NAVEGACAO_PSICOLOGO.md' },
      { tipo: 'qa',         titulo: 'Sistema Completo',     desc: 'Documentação de todas as funcionalidades implementadas.',     arquivo: 'docs/SISTEMA_COMPLETO.md' },
    ],

    icp: {
      perfil:   'Psicólogo autônomo ou iniciando consultório, 10–30 pacientes/semana.',
      dor:      'Controla pagamentos em planilha, histórico clínico no papel e perde sessões sem registro adequado.',
      gatilho:  '"Preciso de prontuário digital" ou "Estou montando meu consultório".',
      canal:    'Instagram (CRP psicólogos), grupos Facebook/Telegram, LinkedIn.',
    },
    url: 'https://psiaura.com.br',
  },

  /* ══════════════════════════════ CRM NEXIO ══════════════════════════════ */
  {
    id: 'crm-nexio',
    icon: '📊', nome: 'CRM Nexio',
    tagline: 'CRM B2B para agências brasileiras — simples de entender, poderoso para crescer',
    status: 'Em pausa', statusCor: 'bg-slate-800/40 text-slate-400 border border-slate-700/50',
    pct: 40,
    maturidadeBreakdown: [
      { camada: 'Core CRM / Pipeline', pct: 60 },
      { camada: 'Backend .NET / API',  pct: 50 },
      { camada: 'WhatsApp / Integrações', pct: 30 },
      { camada: 'Segurança / Auditoria',  pct: 15 },
      { camada: 'Testes / QA',            pct: 10 },
    ],
    descCurta: 'CRM próprio da Synapse Code — gestão de leads, pipeline kanban, WhatsApp e propostas digitais.',
    descLonga: 'CRM B2B focado em agências de marketing brasileiras. Preenche o gap entre o RD Station fraco e o HubSpot caro — com preço acessível para o mercado brasileiro. Pipeline kanban drag-and-drop, integração WhatsApp (Evolution API), propostas com assinatura digital, financeiro com Asaas, automações e white-label. Lançamento: 31 de julho de 2026.',
    personalidade: 'Profissional · Conectado · Crescimento. Indigo e emerald transmitem confiança e conversão — uma ferramenta séria com UX moderna.',

    cores: [
      { nome: 'Nexio Indigo',   hex: '#4F46E5', uso: 'Primária — brand, CTAs' },
      { nome: 'Nexio Emerald',  hex: '#10B981', uso: 'Success, accent, conversão' },
      { nome: 'Nexio Violet',   hex: '#6366F1', uso: 'Secundária, hover states' },
      { nome: 'Nexio Amber',    hex: '#F59E0B', uso: 'Warning, destaque, lançamento' },
      { nome: 'Nexio Midnight', hex: '#0F0E1A', uso: 'Dark mode background' },
    ],
    fontes: [
      { papel: 'Headlines',  familia: 'Inter', peso: '500' },
      { papel: 'UI / Corpo', familia: 'Inter', peso: '400' },
      { papel: 'Código',     familia: 'JetBrains Mono', peso: '400' },
    ],

    features: [
      { titulo: 'Pipeline Kanban',        desc: 'Drag-and-drop, múltiplos pipelines, filtros avançados e histórico de movimentações.' },
      { titulo: 'WhatsApp Integrado',     desc: 'Evolution API — envio de mensagens, templates e rastreamento de conversas por lead.' },
      { titulo: 'Propostas Digitais',     desc: 'Builder visual, link público, assinatura digital e notificação de visualização.' },
      { titulo: 'Financeiro + Asaas',     desc: 'Faturas, cobranças PIX/cartão, régua de cobrança automática e controle de adimplência.' },
      { titulo: 'Metas & Comissões',      desc: 'Metas por vendedor, comissões automáticas e dashboard de performance de equipe.' },
      { titulo: 'Automações',             desc: 'Triggers + actions configuráveis — move deal, envia e-mail, notifica WhatsApp.' },
      { titulo: 'White-Label',            desc: 'Customização de logo, cores, domínio e e-mail por tenant — para revenda.' },
      { titulo: 'Relatórios + API',       desc: 'Relatórios customizados, exportação CSV e API REST documentada para integrações.' },
    ],

    stack: [
      { label: 'React 18',           categoria: 'frontend' },
      { label: 'TypeScript',         categoria: 'frontend' },
      { label: 'Vite',               categoria: 'frontend' },
      { label: 'TailwindCSS',        categoria: 'frontend' },
      { label: 'Shadcn/ui',          categoria: 'frontend' },
      { label: 'ASP.NET Core 8',     categoria: 'backend' },
      { label: 'C# / Clean Arch',    categoria: 'backend' },
      { label: 'PostgreSQL',         categoria: 'backend' },
      { label: 'Redis',              categoria: 'backend' },
      { label: 'SendGrid',           categoria: 'integração' },
      { label: 'Asaas (PIX)',        categoria: 'integração' },
      { label: 'Evolution API (WA)', categoria: 'integração' },
      { label: 'GCP Cloud Run',      categoria: 'infra' },
      { label: 'GitHub Actions',     categoria: 'infra' },
    ],

    planos: [
      {
        nome: 'Free', preco: 'R$0', periodicidade: ' sempre',
        usuarios: '1 usuário',
        features: ['50 contatos', '10 deals', '1 pipeline', 'Dashboard básico'],
      },
      {
        nome: 'Starter', preco: 'R$49', periodicidade: '/usuário/mês',
        usuarios: 'Até 5 usuários',
        features: ['1.000 contatos', '200 deals', '3 pipelines', 'Import CSV', 'E-mail support'],
      },
      {
        nome: 'Pro ⭐', preco: 'R$89', periodicidade: '/usuário/mês',
        usuarios: 'Até 20 usuários', destaque: true,
        features: ['10.000 contatos', 'WhatsApp integrado', 'Automações', 'Propostas digitais', 'Relatórios avançados'],
      },
      {
        nome: 'Agency', preco: 'R$149', periodicidade: '/usuário/mês',
        usuarios: 'Usuários ilimitados',
        features: ['Tudo ilimitado', 'White-label', 'API REST', 'SLA 4h', 'Onboarding dedicado'],
      },
    ],

    docs: [
      { tipo: 'readme',     titulo: 'README',              desc: '241 linhas — visão completa, sprints (12 concluídos), stack e roadmap.',  arquivo: 'README.md' },
      { tipo: 'licença',    titulo: 'Licença Proprietária',desc: 'Copyright © 2026 Synapse Code — Lei 9.610/1998, LGPD.',                  arquivo: 'LICENCE.md' },
      { tipo: 'segurança',  titulo: 'Security Policy',     desc: 'Divulgação responsável, SLA de resposta e diretrizes de segurança.',      arquivo: 'SECURITY.md' },
      { tipo: 'identidade', titulo: 'Identidade Visual',   desc: 'Brand book: logo (4 nós), cores Indigo/Emerald, tipografia Inter.',       arquivo: 'docs/01-IDENTIDADE_VISUAL.md' },
      { tipo: 'segurança',  titulo: 'Segurança Técnica',   desc: 'JWT, RLS, OWASP Top 10, LGPD, Secret Manager, HTTPS TLS 1.3.',           arquivo: 'docs/08-SECURITY.md' },
      { tipo: 'deploy',     titulo: 'Estratégia de Preços', desc: 'Racional e justificativa dos planos Free/Starter/Pro/Agency.',          arquivo: 'docs/09-PRICING_STRATEGY.md' },
      { tipo: 'qa',         titulo: 'Roteiro de Testes',   desc: 'Plano de testes QA completo — 10 módulos.',                              arquivo: 'docs/10-ROTEIRO_TESTES.md' },
    ],

    icp: {
      perfil:   'Pequena empresa com 1–5 vendedores, faturamento R$10k–100k/mês, setores: agências, tech, serviços.',
      dor:      'Perde leads por falta de follow-up, não sabe em que etapa está o deal, não mede taxa de conversão.',
      gatilho:  '"Crescemos e a planilha não escala mais".',
      canal:    'LinkedIn (diretores de vendas, donos de PME), abordagem direta.',
    },
    lancamento: '31 de julho de 2026',
  },

  /* ══════════════════════════════ KUBIC ENG ══════════════════════════════ */
  {
    id: 'kubic-eng',
    icon: '🏗️', nome: 'Kubic Eng',
    tagline: 'Gestão de obras para engenheiros e construtoras — do canteiro ao financeiro',
    status: 'Em pausa', statusCor: 'bg-slate-800/40 text-slate-400 border border-slate-700/50',
    pct: 45,
    maturidadeBreakdown: [
      { camada: 'Frontend',            pct: 70 },
      { camada: 'Backend Fastify',     pct: 65 },
      { camada: 'Módulo Financeiro',   pct: 50 },
      { camada: 'SST / Pessoal',       pct: 35 },
      { camada: 'Compliance BR',       pct: 20 },
    ],
    descCurta: 'SaaS para engenharia civil — gestão de obras, custos, equipes e suprimentos.',
    descLonga: 'Plataforma de gestão para empreiteiros e construtoras de pequeno e médio porte. Única plataforma brasileira que une engenharia, financeiro, pessoal e suprimentos em um sistema só. Do RDO digital ao fluxo de caixa, do cronograma à Curva S — sem planilhas, sem papel, sem perder obra por falta de controle.',
    personalidade: 'Industrial brutalist · Direto · Técnico · Sem frescura corporativa. Amarelo de capacete e preto concreto — o contraste máximo para ambientes de obra.',

    cores: [
      { nome: 'Hard Hat Yellow',  hex: '#FFB800', uso: 'Primária — brand, CTAs, alertas' },
      { nome: 'Concrete Black',   hex: '#0A0A0A', uso: 'Fundo e texto principal' },
      { nome: 'Lime White',       hex: '#FAFAFA', uso: 'Superfície base' },
      { nome: 'Blueprint Blue',   hex: '#1B4D8C', uso: 'Projetos, plantas técnicas' },
      { nome: 'Signal Green',     hex: '#18A957', uso: 'Aprovações, concluído' },
      { nome: 'Safety Orange',    hex: '#F26A1F', uso: 'Alertas médios' },
      { nome: 'Zebra Red',        hex: '#DC2626', uso: 'Alertas críticos, atraso' },
    ],
    fontes: [
      { papel: 'Display / Marca',  familia: 'Archivo Black', peso: '900' },
      { papel: 'Subtítulos',       familia: 'Space Grotesk', peso: '500–700' },
      { papel: 'Corpo',            familia: 'Inter',         peso: '400–600' },
      { papel: 'Dados / Código',   familia: 'JetBrains Mono',peso: '400–500' },
    ],

    features: [
      { titulo: 'Engenharia',   desc: 'GED, cronograma, orçamento com Curva ABC, Curva S física e financeira.' },
      { titulo: 'Execução',     desc: 'RDO digital, check lists FVS, almoxarifado de obra com baixa automática.' },
      { titulo: 'Financeiro',   desc: 'Fluxo de caixa, contas a pagar, medições e conciliação OFX.' },
      { titulo: 'Pessoal',      desc: 'Controle de ponto, EPIs, validade de NR-35 / NR-10, registro de ocorrências.' },
      { titulo: 'Suprimentos',  desc: 'Requisições, mapa de cotações e pedidos de compra integrados ao estoque.' },
      { titulo: 'Comercial',    desc: 'Portal do cliente, chamados de suporte e manual do usuário digital.' },
    ],

    stack: [
      { label: 'React 18',        categoria: 'frontend' },
      { label: 'Vite 6',          categoria: 'frontend' },
      { label: 'TailwindCSS v4',  categoria: 'frontend' },
      { label: 'Radix UI',        categoria: 'frontend' },
      { label: 'Shadcn/ui',       categoria: 'frontend' },
      { label: 'React Query',     categoria: 'frontend' },
      { label: 'Fastify 5',       categoria: 'backend' },
      { label: 'Prisma 5',        categoria: 'backend' },
      { label: 'PostgreSQL',      categoria: 'backend' },
      { label: 'JWT + RBAC',      categoria: 'backend' },
      { label: 'Zod',             categoria: 'backend' },
      { label: 'Turborepo',       categoria: 'infra' },
      { label: 'Vercel',          categoria: 'infra' },
      { label: 'GitHub Actions',  categoria: 'infra' },
    ],

    planos: [
      {
        nome: 'Básico', preco: 'R$149', periodicidade: '/mês',
        usuarios: '1 usuário / 3 obras',
        features: ['GED + Cronograma', 'Financeiro básico', 'RDO digital', 'Almoxarifado'],
      },
      {
        nome: 'Pro', preco: 'R$299', periodicidade: '/mês',
        usuarios: 'Até 5 usuários / 10 obras', destaque: true,
        features: ['Tudo do Básico', 'Curva ABC + S', 'Pessoal + EPIs', 'Suprimentos', 'Medições', 'Relatórios avançados'],
      },
      {
        nome: 'Enterprise', preco: 'R$499', periodicidade: '/mês',
        usuarios: 'Usuários e obras ilimitados',
        features: ['Tudo do Pro', 'Portal do cliente', 'Conciliação OFX', 'API REST', 'Onboarding dedicado', 'SLA garantido'],
      },
    ],

    docs: [
      { tipo: 'readme',     titulo: 'README',              desc: '151 linhas — arquitetura monorepo Turborepo, módulos e stack.',   arquivo: 'README.md' },
      { tipo: 'identidade', titulo: 'Identidade Visual',   desc: '312 linhas — brand brutalist industrial completo.',              arquivo: 'docs/IDENTIDADE_VISUAL.md' },
      { tipo: 'qa',         titulo: 'Roteiro de Testes',   desc: 'Plano de testes funcional — KubicEng módulo a módulo.',          arquivo: 'docs/01-ROTEIRO_TESTES_KUBICENG.md' },
      { tipo: 'deploy',     titulo: 'Roadmap 2026',        desc: 'Épicos, sprints e milestones até Q4 2026.',                      arquivo: 'docs/_avaliacao/ROADMAP_2026.md' },
      { tipo: 'deploy',     titulo: 'Decisões UI/UX',      desc: 'Registro de decisões de design e arquitetura visual.',           arquivo: 'docs/_avaliacao/UI_UX_DECISIONS.md' },
    ],

    icp: {
      perfil:   'Engenheiro civil autônomo ou empreiteira pequena (até 20 funcionários, 2–10 obras simultâneas).',
      dor:      'Controla custo no papel, comunicação pelo WhatsApp e não tem visibilidade real do cronograma.',
      gatilho:  '"Perdi dinheiro nessa obra por falta de controle" ou "Quero crescer mas não consigo gerenciar".',
      canal:    'LinkedIn (engenheiros/arquitetos), grupos de construção civil, associações de engenharia.',
    },
  },

  /* ══════════════════════════════ ARQUETIPOS ══════════════════════════════ */
  {
    id: 'arquetipos',
    icon: '🌀', nome: 'Arquetipos App',
    tagline: 'Novo SaaS em concepção — setor e escopo a definir',
    status: 'Em pausa', statusCor: 'bg-slate-800/40 text-slate-400 border border-slate-700/50',
    pct: 15,
    maturidadeBreakdown: [
      { camada: 'Pagamentos',      pct: 65 },
      { camada: 'Quiz / Onboarding', pct: 60 },
      { camada: 'Jornada 30 dias', pct: 10 },
      { camada: 'Comunidade',      pct: 5  },
      { camada: 'Mobile / App',    pct: 5  },
    ],
    descCurta: 'Produto em fase inicial de descoberta e definição de mercado.',
    descLonga: 'Produto em fase de descoberta. Setor, ICP e funcionalidades ainda em definição. Stack e identidade visual serão definidas após validação do problema de mercado.',
    personalidade: 'A definir após validação do mercado-alvo.',

    cores: [
      { nome: 'Violet (placeholder)', hex: '#7C3AED', uso: 'Placeholder — identidade a definir' },
    ],
    fontes: [
      { papel: 'A definir', familia: 'A definir', peso: '—' },
    ],

    features: [
      { titulo: 'Em descoberta', desc: 'Funcionalidades serão definidas após validação do problema de mercado e ICP.' },
    ],

    stack: [
      { label: 'A definir', categoria: 'frontend' },
    ],

    planos: [
      {
        nome: 'A definir', preco: '—', periodicidade: '',
        usuarios: '—',
        features: ['Precificação a definir após validação'],
      },
    ],

    docs: [],

    icp: {
      perfil:   'A definir.',
      dor:      'A definir.',
      gatilho:  'A definir.',
      canal:    'A definir.',
    },
  },

  /* ══════════════════════════════ LUMIA ══════════════════════════════ */
  {
    id: 'lumia',
    icon: '✨', nome: 'lumIA',
    tagline: 'a IA que atende com você',
    status: 'Beta', statusCor: 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/40',
    pct: 90,
    maturidadeBreakdown: [
      { camada: 'Motor RAG',    pct: 95 },
      { camada: 'App / Dashboard', pct: 95 },
      { camada: 'Widget',       pct: 90 },
      { camada: 'WhatsApp',     pct: 85 },
      { camada: 'Billing',      pct: 75 },
    ],
    descCurta: 'SaaS multi-tenant de atendimento com IA — agentes RAG incorporáveis em qualquer site e no WhatsApp, com gate anti-alucinação.',
    descLonga: 'Plataforma de IA conversacional estilo MagicForm.AI, de uso interno da Synapse Code. Agentes treinados no conteúdo do cliente via RAG (pgvector + Voyage AI + Claude), widget incorporável em qualquer site com Shadow DOM e canal WhatsApp via Evolution API. Gate anti-alucinação como valor central: se não sabe, diz que não sabe e oferece um humano. Multi-tenancy com RLS fail-closed, dashboard data-dense, landing page e cobrança via Stripe. Todos os 10 milestones concluídos — pendente: migração Stripe → Asaas e keys de produção.',
    personalidade: 'Claro · Caloroso · Anti-alucinação. lum de luz + IA — a IA que ilumina o atendimento. Verde `#9fff00` como acento, azul `#2563EB` como primária no app. Tom informal-profissional, pt-BR.',

    cores: [
      { nome: 'Verde de Marca', hex: '#9fff00', uso: 'Acento decorativo — ponto do ícone, seleção de texto (nunca para texto sobre claro)' },
      { nome: 'Azul Primário',  hex: '#2563EB', uso: 'Ações, "IA" no wordmark (app), links' },
      { nome: 'CTA Orange',     hex: '#f97316', uso: 'Destaque pontual — call-to-action secundário' },
      { nome: 'Base Marketing', hex: '#EDEEF5', uso: 'Fundo da landing page' },
      { nome: 'Tinta',          hex: '#1a1a1a', uso: 'Texto principal, símbolo no claro' },
    ],
    fontes: [
      { papel: 'Display / Títulos (marketing)', familia: 'Outfit',    peso: '600–700' },
      { papel: 'Texto (marketing)',              familia: 'Inter',     peso: '400–500' },
      { papel: 'UI / Dashboard',                familia: 'Fira Sans', peso: '400–600' },
      { papel: 'Código / números tabulares',    familia: 'Fira Code', peso: '400' },
    ],

    features: [
      { titulo: 'Motor RAG com Anti-alucinação', desc: 'Embedding → kNN cosseno pgvector (HNSW) → gate anti-alucinação → Claude streaming com citações. Se abaixo do limiar, fallback sem LLM.' },
      { titulo: 'Widget Incorporável',            desc: 'JS puro com Shadow DOM + iframe isolado. Setup de ~10 min em qualquer site (Shopify, WordPress, Webflow). Assina "Desenvolvido com lumIA" (ocultável no plano white-label).' },
      { titulo: 'Canal WhatsApp',                desc: 'Evolution API — pareamento por QR em Canais → WhatsApp. Mesmo motor RAG compartilhado com o widget.' },
      { titulo: 'Ingestão de Conhecimento',      desc: 'Crawler de site (sitemap + BFS mesma-origem + cheerio) ou upload de texto. Chunking, embedding Voyage AI e indexação pgvector em background.' },
      { titulo: 'Multi-tenancy + RLS',           desc: 'Toda linha escopada por org_id. withOrg() define GUC de RLS por transação + RLS PostgreSQL fail-closed. App conecta como app_role (não-superusuário).' },
      { titulo: 'Dashboard & Métricas',          desc: 'Dashboard data-dense com contadores de uso mensais, histórico de conversas, gestão de agentes e fontes de conhecimento.' },
    ],

    stack: [
      { label: 'Next.js 15 (App Router)', categoria: 'frontend' },
      { label: 'TypeScript',              categoria: 'frontend' },
      { label: 'Tailwind v4',             categoria: 'frontend' },
      { label: 'shadcn/ui',               categoria: 'frontend' },
      { label: 'PostgreSQL 16 + pgvector',categoria: 'backend' },
      { label: 'Drizzle ORM',             categoria: 'backend' },
      { label: 'Auth.js v5',              categoria: 'backend' },
      { label: 'Anthropic Claude',        categoria: 'integração' },
      { label: 'Voyage AI (embeddings)',  categoria: 'integração' },
      { label: 'Stripe (→ Asaas)',        categoria: 'integração' },
      { label: 'Evolution API (WA)',      categoria: 'integração' },
      { label: 'Vercel',                  categoria: 'infra' },
      { label: 'Docker (local)',          categoria: 'infra' },
    ],

    planos: [
      {
        nome: 'Starter', preco: 'R$147', periodicidade: '/mês',
        usuarios: '1 agente',
        features: ['Widget incorporável', 'Canal WhatsApp', 'Ingestão de site + texto', 'Dashboard de métricas'],
      },
      {
        nome: 'Pro ⭐', preco: 'R$297', periodicidade: '/mês',
        usuarios: 'Até 3 agentes', destaque: true,
        features: ['Tudo do Starter', 'Múltiplos agentes', 'Histórico completo', 'Metering de mensagens'],
      },
      {
        nome: 'Business', preco: 'R$1.197', periodicidade: '/mês',
        usuarios: 'Agentes ilimitados',
        features: ['Tudo do Pro', 'White-label (oculta "Desenvolvido com lumIA")', 'Suporte prioritário', 'SLA dedicado'],
      },
    ],

    docs: [
      { tipo: 'readme',     titulo: 'README',           desc: 'Stack, milestones, scripts de setup e instruções de deploy.',      arquivo: 'README.md' },
      { tipo: 'identidade', titulo: 'Identidade Visual',desc: 'Brand book: wordmark lumIA, spark icon, cores, tipografia e tom.', arquivo: 'IDENTITY.md' },
      { tipo: 'segurança',  titulo: 'Security Policy',  desc: 'Divulgação responsável e diretrizes de segurança.',               arquivo: 'SECURITY.md' },
      { tipo: 'deploy',     titulo: 'Deploy Guide',     desc: 'Deploy Vercel + Neon/Supabase, variáveis de ambiente e Evolution API.', arquivo: 'DEPLOY.md' },
    ],

    icp: {
      perfil:   'Empresa com site próprio que recebe dúvidas repetitivas de clientes e quer automatizar o atendimento sem perder a qualidade.',
      dor:      'Equipe sobrecarregada respondendo as mesmas perguntas. Sem resposta fora do horário comercial. Leads perdidos por demora no retorno.',
      gatilho:  '"Preciso atender no WhatsApp fora do horário" ou "meu time gasta horas respondendo FAQ".',
      canal:    'LinkedIn (donos de e-commerce, agências, gestores de atendimento), indicação, Instagram.',
    },
    url: 'https://lumia-theta-nine.vercel.app',
  },
]

/* Ordem de exibição: produtos ativos primeiro, depois os em pausa. */
const ORDEM_PRODUTOS = ['nero-barber', 'lumia', 'financa-a-dois', 'psi-aura', 'kubic-eng', 'crm-nexio', 'arquetipos']
PRODUTOS.sort((a, b) => ORDEM_PRODUTOS.indexOf(a.id) - ORDEM_PRODUTOS.indexOf(b.id))

/* ─── Helpers de estilo ──────────────────────────────────────── */
const CATEGORIA_COR: Record<Tech['categoria'], string> = {
  frontend:    'bg-blue-900/30 text-blue-400 border-blue-800/40',
  backend:     'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
  infra:       'bg-orange-900/30 text-orange-400 border-orange-800/40',
  integração:  'bg-violet-900/30 text-violet-400 border-violet-800/40',
}

const DOC_COR: Record<Doc['tipo'], { bg: string; text: string; label: string }> = {
  readme:     { bg: 'bg-gray-800/60',   text: 'text-gray-300',   label: 'README' },
  licença:    { bg: 'bg-blue-900/30',   text: 'text-blue-300',   label: 'Licença' },
  segurança:  { bg: 'bg-red-900/30',    text: 'text-red-300',    label: 'Segurança' },
  identidade: { bg: 'bg-violet-900/30', text: 'text-violet-300', label: 'Identidade' },
  contrato:   { bg: 'bg-amber-900/30',  text: 'text-amber-300',  label: 'Contrato' },
  qa:         { bg: 'bg-emerald-900/30',text: 'text-emerald-300',label: 'QA / Testes' },
  deploy:     { bg: 'bg-cyan-900/30',   text: 'text-cyan-300',   label: 'Deploy / Docs' },
}

/* ─── AdminSaaS ──────────────────────────────────────────────── */
const STATUS_CLS: Record<string, string> = {
  active:    'bg-emerald-900/30 text-emerald-400',
  trial:     'bg-amber-900/30  text-amber-400',
  cancelled: 'bg-red-900/30    text-red-400',
  canceled:  'bg-red-900/30    text-red-400',
  canceling: 'bg-orange-900/30 text-orange-400',
  past_due:  'bg-red-900/30    text-red-400',
  expired:   'bg-red-900/30    text-red-400',
}
const ROLE_CLS: Record<string, string> = {
  superadmin: 'bg-red-900/30    text-red-400',
  admin:      'bg-violet-900/30 text-violet-400',
  user:       'bg-gray-800/60   text-gray-400',
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function AdminSaaS({ productId }: { productId: string }) {
  const [expanded,  setExpanded]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [loaded,    setLoaded]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [neroData,  setNeroData]  = useState<NeroAdminData | null>(null)
  const [kubicData, setKubicData] = useState<KubicAdminData | null>(null)
  const [psiData,   setPsiData]   = useState<PsiAuraAdminData | null>(null)
  const [nexioData, setNexioData] = useState<NexioAdminData | null>(null)
  const [pending,   setPending]   = useState<Record<string, string>>({})
  const [saving,    setSaving]    = useState<Record<string, boolean>>({})
  const [savedOk,   setSavedOk]   = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    if (loaded) return
    setLoading(true); setError(null)
    try {
      if (productId === 'nero-barber') {
        const r = await fetchNeroBarberAdmin()
        if (r.error) setError(r.error); else if (r.data) setNeroData(r.data)
      } else if (productId === 'kubic-eng') {
        const r = await fetchKubicEngAdmin()
        if (r.error) setError(r.error); else if (r.data) setKubicData(r.data)
      } else if (productId === 'psi-aura') {
        const r = await fetchPsiAuraAdmin()
        if (r.error) setError(r.error); else if (r.data) setPsiData(r.data)
      } else if (productId === 'crm-nexio') {
        const r = await fetchNexioAdmin()
        if (r.error) setError(r.error); else if (r.data) setNexioData(r.data)
      }
      setLoaded(true)
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [productId, loaded])

  const toggle = () => {
    const next = !expanded; setExpanded(next)
    if (next && !loaded) loadData()
  }

  const savePlan = async (entityId: string, planId: string) => {
    setSaving(p => ({ ...p, [entityId]: true }))
    try {
      let r: { ok: boolean; error?: string }
      if (productId === 'nero-barber') {
        r = await updateNeroShopPlan(entityId, planId)
        if (r.ok) setNeroData(prev => prev ? { ...prev, shops: prev.shops.map(s => s.id !== entityId ? s : { ...s, current_plan_id: planId, plan_name: (prev.plans as NeroPlan[]).find(p => p.id === planId)?.name ?? planId, plan_price: (prev.plans as NeroPlan[]).find(p => p.id === planId)?.price ?? 0 }) } : null)
      } else {
        r = await updateKubicUserPlan(entityId, planId)
        if (r.ok) setKubicData(prev => prev ? { ...prev, users: prev.users.map(u => u.id !== entityId ? u : { ...u, plan_id: planId, plan_name: (prev.plans as KubicPlan[]).find(p => p.id === planId)?.name ?? planId, plan_price: (prev.plans as KubicPlan[]).find(p => p.id === planId)?.price ?? 0 }) } : null)
      }
      if (r.ok) {
        setSavedOk(p => ({ ...p, [entityId]: true }))
        setPending(p => { const n = { ...p }; delete n[entityId]; return n })
        setTimeout(() => setSavedOk(p => { const n = { ...p }; delete n[entityId]; return n }), 2500)
      } else { setError(r.error ?? 'Erro ao salvar plano') }
    } finally { setSaving(p => { const n = { ...p }; delete n[entityId]; return n }) }
  }

  if (!['nero-barber', 'kubic-eng', 'psi-aura', 'crm-nexio'].includes(productId)) return null

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
      {/* Header */}
      <button onClick={toggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#0d0d14] transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Painel Admin</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800/30 font-semibold">Restrito</span>
          {loaded && !loading && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/30">✓ carregado</span>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-[#1e1e2e] p-5 space-y-5">
          {loading && (
            <div className="flex items-center gap-3 text-sm text-gray-500 py-4">
              <div className="w-5 h-5 rounded-full border-2 border-gray-700 border-t-violet-500 animate-spin flex-shrink-0" />
              Consultando banco de dados...
            </div>
          )}
          {error && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-red-400 mb-0.5">⚠️ Erro ao carregar</p>
              <p className="text-xs text-red-400/70 font-mono">{error}</p>
            </div>
          )}

          {/* NERO BARBER DATA */}
          {neroData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Barbearias',  val: neroData.shops.length },
                  { label: 'Ativas',       val: neroData.shops.filter(s => s.subscription_status === 'active').length, cls: 'text-emerald-400' },
                  { label: 'Trial',        val: neroData.shops.filter(s => s.subscription_status === 'trial').length,  cls: 'text-amber-400'  },
                  { label: 'Usuários',     val: neroData.total_profiles },
                  { label: 'MRR estimado', val: `R$${neroData.mrr.toLocaleString('pt-BR')}`, cls: 'text-violet-400' },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${k.cls ?? 'text-white'}`}>{k.val}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-2.5">Barbearias</p>
                <div className="overflow-x-auto rounded-lg border border-[#1e1e2e]">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-[#0d0d14]">
                      <tr>{['Nome', 'Localização', 'Plano', 'Status', 'Trial/Venc.', 'Cadastro', 'Mudar plano'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[10px] text-gray-600 uppercase tracking-wider font-medium text-left first:pl-4 last:pr-4">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {neroData.shops.map((shop, i) => (
                        <tr key={shop.id} className={`border-t border-[#1e1e2e] hover:bg-[#0d0d14] transition-colors ${i % 2 ? 'bg-[#0a0a10]' : ''}`}>
                          <td className="px-4 py-2.5 font-medium text-gray-200 max-w-[150px]"><span className="block truncate" title={shop.name}>{shop.name}</span></td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{shop.city && shop.uf ? `${shop.city}/${shop.uf}` : '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="text-xs font-medium text-gray-300">{shop.plan_name}</span>
                            <span className="text-[11px] text-gray-600 ml-1.5">R${shop.plan_price}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[shop.subscription_status] ?? 'text-gray-400'}`}>{shop.subscription_status}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(shop.trial_ends_at)}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(shop.created_at)}</td>
                          <td className="px-3 pr-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <select value={pending[shop.id] ?? shop.current_plan_id} onChange={e => setPending(p => ({ ...p, [shop.id]: e.target.value }))} className="text-xs bg-[#1e1e2e] border border-[#2a2a3e] rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-violet-500 cursor-pointer">
                                {neroData.plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name} — R${pl.price}</option>)}
                              </select>
                              {pending[shop.id] && pending[shop.id] !== shop.current_plan_id && (
                                <button onClick={() => savePlan(shop.id, pending[shop.id])} disabled={saving[shop.id]} className="text-[11px] px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-medium disabled:opacity-40 whitespace-nowrap">
                                  {saving[shop.id] ? '...' : 'Salvar'}
                                </button>
                              )}
                              {savedOk[shop.id] && <span className="text-[11px] text-emerald-400 whitespace-nowrap">✓ salvo</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-2">Planos cadastrados</p>
                <div className="flex flex-wrap gap-2">
                  {neroData.plans.map(pl => (
                    <div key={pl.id} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs">
                      <span className="font-semibold text-gray-200">{pl.name}</span>
                      <span className="text-gray-500 ml-2">R${pl.price}/mês · R${pl.annual_price}/ano</span>
                      <span className="text-gray-600 ml-2">até {pl.max_barbers} barbeiros · {pl.max_units} un.</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-gray-600 pt-2 border-t border-[#1e1e2e]">
                <span>🗓️ {neroData.total_appointments.toLocaleString('pt-BR')} agendamentos</span>
                <span>👥 {neroData.total_customers.toLocaleString('pt-BR')} clientes</span>
              </div>
            </>
          )}

          {/* KUBIC ENG DATA */}
          {kubicData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Usuários', val: kubicData.users.length },
                  { label: 'Ativos',   val: kubicData.users.filter(u => u.sub_status === 'active').length, cls: 'text-emerald-400' },
                  { label: 'Trial',    val: kubicData.users.filter(u => u.sub_status === 'trial').length,  cls: 'text-amber-400'  },
                  { label: 'MRR',      val: `R$${kubicData.mrr.toLocaleString('pt-BR')}`,                  cls: 'text-violet-400' },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${k.cls ?? 'text-white'}`}>{k.val}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-2.5">Usuários</p>
                <div className="overflow-x-auto rounded-lg border border-[#1e1e2e]">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-[#0d0d14]">
                      <tr>{['Nome', 'Email', 'Role', 'Plano', 'Status', 'Trial até', 'Cadastro', 'Mudar plano'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[10px] text-gray-600 uppercase tracking-wider font-medium text-left first:pl-4 last:pr-4">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {kubicData.users.map((user, i) => (
                        <tr key={user.id} className={`border-t border-[#1e1e2e] hover:bg-[#0d0d14] transition-colors ${i % 2 ? 'bg-[#0a0a10]' : ''}`}>
                          <td className="px-4 py-2.5 font-medium text-gray-200 max-w-[130px]"><span className="block truncate" title={user.name}>{user.name}</span></td>
                          <td className="px-3 py-2.5 text-xs text-gray-400 max-w-[170px]"><span className="block truncate" title={user.email}>{user.email}</span></td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_CLS[user.role] ?? 'bg-gray-800/60 text-gray-400'}`}>{user.role}</span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {user.plan_name ? <><span className="text-xs font-medium text-gray-300">{user.plan_name}</span>{user.plan_price != null && <span className="text-[11px] text-gray-600 ml-1.5">R${user.plan_price}</span>}</> : <span className="text-gray-600 text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {user.sub_status ? <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[user.sub_status] ?? 'text-gray-400'}`}>{user.sub_status}</span> : <span className="text-gray-600 text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(user.trial_end)}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(user.created_at)}</td>
                          <td className="px-3 pr-4 py-2.5">
                            {user.plan_id ? (
                              <div className="flex items-center gap-2">
                                <select value={pending[user.id] ?? user.plan_id} onChange={e => setPending(p => ({ ...p, [user.id]: e.target.value }))} className="text-xs bg-[#1e1e2e] border border-[#2a2a3e] rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-violet-500 cursor-pointer">
                                  {kubicData.plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name} — {pl.price > 0 ? `R$${pl.price}` : 'Custom'}</option>)}
                                </select>
                                {pending[user.id] && pending[user.id] !== user.plan_id && (
                                  <button onClick={() => savePlan(user.id, pending[user.id])} disabled={saving[user.id]} className="text-[11px] px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-medium disabled:opacity-40 whitespace-nowrap">
                                    {saving[user.id] ? '...' : 'Salvar'}
                                  </button>
                                )}
                                {savedOk[user.id] && <span className="text-[11px] text-emerald-400 whitespace-nowrap">✓ salvo</span>}
                              </div>
                            ) : <span className="text-[11px] text-gray-600">sem assinatura</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-2">Planos disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {kubicData.plans.map(pl => (
                    <div key={pl.id} className={`border rounded-lg px-3 py-2 text-xs ${pl.is_active ? 'bg-[#0d0d14] border-[#1e1e2e]' : 'bg-[#0d0d14] border-[#1e1e2e] opacity-40'}`}>
                      <span className="font-semibold text-gray-200">{pl.name}</span>
                      {pl.price > 0 ? <span className="text-gray-500 ml-2">R${pl.price}/mês · R${pl.price_annual}/ano</span> : <span className="text-gray-500 ml-2">Personalizado</span>}
                      {pl.max_users > 0 && <span className="text-gray-600 ml-2">até {pl.max_users} users</span>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* NEXIO CRM DATA */}
          {nexioData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Tenants',   val: nexioData.totalTenants },
                  { label: 'Trial',     val: nexioData.tenantsTrial,     cls: 'text-amber-400'  },
                  { label: 'Pagos',     val: nexioData.tenantsFreelancer + nexioData.tenantsAgencyPro + nexioData.tenantsScale, cls: 'text-emerald-400' },
                  { label: 'Pipeline',  val: `R$${nexioData.valorTotalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, cls: 'text-violet-400' },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${k.cls ?? 'text-white'}`}>{k.val}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Usuários',    val: nexioData.totalUsuarios   },
                  { label: 'Clientes',    val: nexioData.totalClientes   },
                  { label: 'Negócios',    val: nexioData.totalNegocios   },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{k.val}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              {nexioData.recentesTenants.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-2.5">Tenants recentes</p>
                  <div className="overflow-x-auto rounded-lg border border-[#1e1e2e]">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead className="bg-[#0d0d14]">
                        <tr>{['Nome', 'Slug', 'Plano', 'Usuários', 'Negócios', 'Clientes', 'Cadastro'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-[10px] text-gray-600 uppercase tracking-wider font-medium text-left first:pl-4 last:pr-4">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {nexioData.recentesTenants.map((t, i) => (
                          <tr key={t.id} className={`border-t border-[#1e1e2e] hover:bg-[#0d0d14] transition-colors ${i % 2 ? 'bg-[#0a0a10]' : ''}`}>
                            <td className="px-4 py-2.5 font-medium text-gray-200 max-w-[150px]"><span className="block truncate" title={t.nome}>{t.nome}</span></td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{t.slug}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                t.plano === 'trial' ? 'bg-amber-900/30 text-amber-400' :
                                t.plano === 'scale' ? 'bg-violet-900/30 text-violet-400' :
                                'bg-emerald-900/30 text-emerald-400'
                              }`}>{t.plano}</span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-400 text-center">{t.totalUsuarios}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-400 text-center">{t.totalNegocios}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-400 text-center">{t.totalClientes}</td>
                            <td className="px-3 pr-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(t.criadoEm)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: 'Freelancer', val: nexioData.tenantsFreelancer },
                  { label: 'Agency Pro', val: nexioData.tenantsAgencyPro  },
                  { label: 'Scale',      val: nexioData.tenantsScale      },
                ].map(p => (
                  <div key={p.label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs">
                    <span className="font-semibold text-gray-200">{p.label}</span>
                    <span className="text-gray-500 ml-2">{p.val} tenant{p.val !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PSI AURA DATA */}
          {psiData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Clínicas',  val: psiData.totalClinics },
                  { label: 'Ativas',    val: psiData.activeCount,  cls: 'text-emerald-400' },
                  { label: 'Atraso',    val: psiData.pastDueCount, cls: 'text-red-400' },
                  { label: 'MRR',       val: `R$${psiData.mrr.toLocaleString('pt-BR')}`, cls: 'text-violet-400' },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${k.cls ?? 'text-white'}`}>{k.val}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-2.5">Clínicas</p>
                <div className="overflow-x-auto rounded-lg border border-[#1e1e2e]">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-[#0d0d14]">
                      <tr>{['Clínica', 'Email', 'Plano', 'Status', 'Vencimento', 'Cadastro', 'Users'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[10px] text-gray-600 uppercase tracking-wider font-medium text-left first:pl-4 last:pr-4">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {psiData.clinics.map((clinic, i) => (
                        <tr key={clinic.id} className={`border-t border-[#1e1e2e] hover:bg-[#0d0d14] transition-colors ${i % 2 ? 'bg-[#0a0a10]' : ''}`}>
                          <td className="px-4 py-2.5 font-medium text-gray-200 max-w-[160px]"><span className="block truncate" title={clinic.clinicName}>{clinic.clinicName}</span></td>
                          <td className="px-3 py-2.5 text-xs text-gray-400 max-w-[180px]"><span className="block truncate" title={clinic.email}>{clinic.email}</span></td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="text-xs font-medium text-gray-300">{clinic.planName}</span>
                            <span className="text-[11px] text-gray-600 ml-1.5">R${clinic.planPrice}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[clinic.subscriptionStatus] ?? 'text-gray-400'}`}>{clinic.subscriptionStatus}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(clinic.subscriptionEndDate)}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(clinic.joinedAt)}</td>
                          <td className="px-3 pr-4 py-2.5 text-xs text-gray-400 text-center">{clinic.userCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium mb-2">Planos</p>
                <div className="flex flex-wrap gap-2">
                  {psiData.plans.map(pl => (
                    <div key={pl.id} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs">
                      <span className="font-semibold text-gray-200">{pl.name}</span>
                      <span className="text-gray-500 ml-2">R${pl.price}/mês · R${Math.round(pl.yearlyPrice)}/ano</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Componente principal ───────────────────────────────────── */
export default function ProdutosPage() {
  const [ativo, setAtivo] = useState('nero-barber')
  const produto = PRODUTOS.find(p => p.id === ativo)!

  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Produtos</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {PRODUTOS.length} SaaS no portfolio — Synapse Code
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            3 ativos: Nero (98%) · lumIA (90%) · Finança a Dois (92%) — 4 em pausa
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-[#1e1e2e]">
          {PRODUTOS.map(p => (
            <button
              key={p.id}
              onClick={() => setAtivo(p.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                ativo === p.id
                  ? 'bg-[#111118] border-violet-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#111118]/50'
              }`}
            >
              <span className="text-base">{p.icon}</span>
              <span>{p.nome}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ml-1 ${p.statusCor}`}>
                {p.pct}%
              </span>
            </button>
          ))}
        </div>

        {/* ── Conteúdo do produto selecionado ── */}
        <div key={produto.id} className="space-y-5">

          {/* Hero do produto */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{produto.icon}</span>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-white">{produto.nome}</h2>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${produto.statusCor}`}>
                      {produto.status}
                    </span>
                    {produto.lancamento && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/40 font-medium">
                        🚀 Lançamento: {produto.lancamento}
                      </span>
                    )}
                    {produto.url && (
                      <a href={produto.url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-violet-400 hover:text-violet-300 underline transition-colors">
                        {produto.url}
                      </a>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{produto.tagline}</p>
                </div>
              </div>
              {/* Barra de maturidade */}
              <div className="min-w-[160px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Maturidade</span>
                  <span className="text-white font-semibold">{produto.pct}%</span>
                </div>
                <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all"
                    style={{ width: `${produto.pct}%` }}
                  />
                </div>
                {produto.maturidadeBreakdown && (
                  <div className="mt-3 space-y-1.5">
                    {produto.maturidadeBreakdown.map(({ camada, pct: cpct }) => (
                      <div key={camada}>
                        <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                          <span>{camada}</span>
                          <span>{cpct}%</span>
                        </div>
                        <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-700/50 to-violet-500/50 transition-all"
                            style={{ width: `${cpct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-3xl">{produto.descLonga}</p>
          </div>

          {/* Grid: Funcionalidades + Identidade + ICP */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Funcionalidades */}
            <div className="lg:col-span-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                Funcionalidades principais
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {produto.features.map(f => (
                  <div key={f.titulo} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-3.5">
                    <p className="text-sm font-semibold text-white mb-1">{f.titulo}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ICP */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Perfil do cliente ideal
              </p>
              <div className="space-y-3.5">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-wider mb-1">Perfil</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{produto.icp.perfil}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-wider mb-1">Dor principal</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{produto.icp.dor}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-wider mb-1">Gatilho de compra</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{produto.icp.gatilho}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-wider mb-1">Canal de aquisição</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{produto.icp.canal}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Identidade Visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Cores */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Identidade visual — cores
              </p>
              {produto.id === 'arquetipos' ? (
                <p className="text-xs text-gray-500 italic">Identidade visual a definir após validação do mercado.</p>
              ) : (
                <div className="space-y-2.5">
                  {produto.cores.map(c => (
                    <div key={c.hex} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-300">{c.nome}</span>
                          <span className="text-[10px] text-gray-600 font-mono">{c.hex}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{c.uso}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tipografia + Personalidade */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                  Tipografia
                </p>
                {produto.id === 'arquetipos' ? (
                  <p className="text-xs text-gray-500 italic">Tipografia a definir.</p>
                ) : (
                  <div className="space-y-2">
                    {produto.fontes.map(f => (
                      <div key={f.papel} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider whitespace-nowrap">{f.papel}</span>
                        <span className="text-sm font-medium text-gray-200 truncate">{f.familia}</span>
                        <span className="text-[10px] text-gray-600 whitespace-nowrap">{f.peso}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-wider mb-1.5">Personalidade da marca</p>
                <p className="text-xs text-gray-400 leading-relaxed">{produto.personalidade}</p>
              </div>
            </div>
          </div>

          {/* Stack técnica */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Stack técnica
            </p>
            <div className="space-y-3">
              {(['frontend', 'backend', 'infra', 'integração'] as Tech['categoria'][]).map(cat => {
                const techs = produto.stack.filter(t => t.categoria === cat)
                if (!techs.length) return null
                return (
                  <div key={cat} className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium w-20 flex-shrink-0 capitalize">{cat}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {techs.map(t => (
                        <span key={t.label} className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${CATEGORIA_COR[cat]}`}>
                          {t.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Precificação */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Precificação
            </p>
            <div className={`grid gap-3 ${produto.planos.length === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
              {produto.planos.map(plano => (
                <div
                  key={plano.nome}
                  className={`rounded-xl border p-4 transition-all ${
                    plano.destaque
                      ? 'border-violet-500/50 bg-violet-950/20 ring-1 ring-violet-500/20'
                      : 'border-[#1e1e2e] bg-[#0d0d14]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">{plano.nome}</span>
                    {plano.destaque && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mb-1">
                    <span className={`text-2xl font-bold ${plano.destaque ? 'text-violet-300' : 'text-white'}`}>{plano.preco}</span>
                    {plano.periodicidade && (
                      <span className="text-xs text-gray-500 ml-1">{plano.periodicidade}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">{plano.usuarios}</p>
                  <ul className="space-y-1.5">
                    {plano.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-gray-400">
                        <span className={`mt-0.5 flex-shrink-0 ${plano.destaque ? 'text-violet-400' : 'text-emerald-500'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-600 mt-3">* Valores de referência — validar com clientes antes do lançamento.</p>
          </div>

          {/* Documentação */}
          {produto.docs.length > 0 ? (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                Documentação
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {produto.docs.map(doc => {
                  const estilo = DOC_COR[doc.tipo]
                  return (
                    <div key={doc.titulo} className={`rounded-lg border border-[#1e1e2e] p-3.5 ${estilo.bg}/40 group`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border border-white/10 ${estilo.text} ${estilo.bg}`}>
                          {DOC_COR[doc.tipo].label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-200 mb-1">{doc.titulo}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{doc.desc}</p>
                      {doc.arquivo && (
                        <p className="text-[10px] text-gray-700 font-mono mt-2 truncate">{doc.arquivo}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                Documentação
              </p>
              <p className="text-sm text-gray-500 italic">Documentação a criar após definição do produto.</p>
            </div>
          )}

          {/* Admin — só para produtos com integração direta ao Supabase */}
          <AdminSaaS productId={produto.id} />

        </div>
      </div>
    </PainelShell>
  )
}
