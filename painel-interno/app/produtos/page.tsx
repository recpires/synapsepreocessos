'use client'

import { useState } from 'react'
import PainelShell from '@/components/PainelShell'

/* ─── Tipos ───────────────────────────────────────────────────── */
interface Cor    { nome: string; hex: string; uso: string }
interface Fonte  { papel: string; familia: string; peso: string }
interface Feature{ titulo: string; desc: string }
interface Tech   { label: string; categoria: 'frontend' | 'backend' | 'infra' | 'integração' }
interface Plano  { nome: string; preco: string; periodicidade?: string; usuarios: string; destaque?: boolean; features: string[] }
interface Doc    { tipo: 'readme' | 'licença' | 'segurança' | 'identidade' | 'contrato' | 'qa' | 'deploy'; titulo: string; desc: string; arquivo?: string }
interface ICP    { perfil: string; dor: string; gatilho: string; canal: string }

interface Produto {
  id: string; icon: string; nome: string; tagline: string
  status: string; statusCor: string; pct: number
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

  /* ══════════════════════════════ PSI AURA ══════════════════════════════ */
  {
    id: 'psi-aura',
    icon: '🧠', nome: 'Psi Aura',
    tagline: 'Gestão clínica de alta performance para psicólogos',
    status: 'Atenção', statusCor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40',
    pct: 55,
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
    status: 'Em dev', statusCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',
    pct: 40,
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
    status: 'Atenção', statusCor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40',
    pct: 45,
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
    status: 'Novo', statusCor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40',
    pct: 15,
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
]

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
            1 maduro (98%) · 2 em atenção · 1 em dev · 1 novo
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

        </div>
      </div>
    </PainelShell>
  )
}
