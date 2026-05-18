-- ============================================
-- CONTROLE FINANCEIRO — Synapse Code
-- Cole este SQL no Supabase SQL Editor e execute
-- ============================================

-- Tabela principal de despesas
create table if not exists despesas (
  id uuid default gen_random_uuid() primary key,
  data date not null,
  descricao text not null,
  categoria text not null,
  produto text default 'Geral',
  forma_pagamento text not null,
  condicao text default 'MENSAL',
  valor numeric(10,2) not null,
  tipo text default 'fixo', -- fixo | variavel | pontual
  recorrente boolean default false,
  observacao text,
  created_at timestamptz default now(),
  created_by text default 'sistema'
);

-- Tabela de receitas (para futuro MRR)
create table if not exists receitas (
  id uuid default gen_random_uuid() primary key,
  data date not null,
  descricao text not null,
  produto text not null,
  cliente text,
  valor numeric(10,2) not null,
  tipo text default 'recorrente', -- recorrente | pontual
  observacao text,
  created_at timestamptz default now(),
  created_by text default 'sistema'
);

-- Índices para performance
create index if not exists idx_despesas_data on despesas(data desc);
create index if not exists idx_despesas_categoria on despesas(categoria);
create index if not exists idx_despesas_produto on despesas(produto);
create index if not exists idx_receitas_data on receitas(data desc);
create index if not exists idx_receitas_produto on receitas(produto);

-- RLS: qualquer usuário autenticado lê e escreve
alter table despesas enable row level security;
alter table receitas enable row level security;

create policy "Acesso total autenticado — despesas"
  on despesas for all
  using (true)
  with check (true);

create policy "Acesso total autenticado — receitas"
  on receitas for all
  using (true)
  with check (true);

-- ============================================
-- DADOS REAIS da planilha (jan-mai 2026)
-- ============================================
insert into despesas (data, descricao, categoria, produto, forma_pagamento, condicao, valor, tipo, recorrente) values
  ('2026-01-28', 'Supabase',             'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',   138.83, 'variavel', true),
  ('2026-01-28', 'Supabase IOF',         'Impostos',         'Geral',     'Cartão Santander', 'IOF',        4.86, 'variavel', false),
  ('2026-01-30', 'Figma',                'Ferramentas',      'Design',    'Cartão Santander', 'Anual',   1057.34, 'fixo',     true),
  ('2026-01-30', 'Figma IOF',            'Impostos',         'Design',    'Cartão Santander', 'IOF',       37.01, 'fixo',     false),
  ('2026-02-02', 'Supabase',             'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',   105.94, 'variavel', true),
  ('2026-02-02', 'Supabase IOF',         'Impostos',         'Geral',     'Cartão Santander', 'IOF',        2.64, 'variavel', false),
  ('2026-02-02', 'Vercel',               'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',   110.87, 'fixo',     true),
  ('2026-02-02', 'Vercel IOF',           'Impostos',         'Geral',     'Cartão Santander', 'IOF',        3.88, 'fixo',     false),
  ('2026-03-01', 'Supabase',             'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',    57.89, 'variavel', true),
  ('2026-03-01', 'Supabase IOF',         'Impostos',         'Geral',     'Cartão Santander', 'IOF',        2.03, 'variavel', false),
  ('2026-03-02', 'Vercel / Gemini',      'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',   109.16, 'fixo',     true),
  ('2026-03-02', 'Vercel / Gemini IOF',  'Impostos',         'Geral',     'Cartão Santander', 'IOF',        3.82, 'fixo',     false),
  ('2026-03-06', 'Placa de Vídeo 1/6',  'Hardware',         'Geral',     'Itaú',             'Parcelado',2562.00, 'pontual',  false),
  ('2026-03-28', 'Supabase',             'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',   206.69, 'variavel', true),
  ('2026-03-28', 'Supabase IOF',         'Impostos',         'Geral',     'Cartão Santander', 'IOF',        7.23, 'variavel', false),
  ('2026-03-28', 'Eduzz',                'Educação',         'Geral',     'Cartão Santander', 'Única',    297.00, 'pontual',  false),
  ('2026-04-02', 'Gemini',               'IA / APIs',        'Geral',     'Cartão Santander', 'Mensal',   109.40, 'fixo',     true),
  ('2026-04-02', 'Gemini IOF',           'Impostos',         'Geral',     'Cartão Santander', 'IOF',        3.83, 'fixo',     false),
  ('2026-04-08', 'Z-API (Bot Comercial)','Ferramentas',      'Agentes IA','Cartão Santander', 'Mensal',    99.99, 'fixo',     true),
  ('2026-04-08', 'AP Cloud',             'Infraestrutura',   'Agentes IA','Cartão Santander', 'Única',     27.36, 'pontual',  false),
  ('2026-04-08', 'AP Cloud IOF',         'Impostos',         'Agentes IA','Cartão Santander', 'IOF',        0.96, 'pontual',  false),
  ('2026-04-12', 'Google One',           'Ferramentas',      'Geral',     'Cartão Santander', 'Mensal',    96.99, 'fixo',     true),
  ('2026-04-23', 'Claude AI',            'IA / APIs',        'Geral',     'Cartão Santander', 'Mensal',   583.81, 'fixo',     true),
  ('2026-04-23', 'Claude AI IOF',        'Impostos',         'Geral',     'Cartão Santander', 'IOF',       20.43, 'fixo',     false),
  ('2026-04-27', 'Monitor',              'Hardware',         'Geral',     'PIX',              'Única',   1000.00, 'pontual',  false),
  ('2026-04-28', 'Supabase',             'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',   237.05, 'variavel', true),
  ('2026-04-28', 'Supabase IOF',         'Impostos',         'Geral',     'Cartão Santander', 'IOF',        4.86, 'variavel', false),
  ('2026-05-01', 'Google Ads',           'Marketing',        'Geral',     'Cartão Santander', 'Mensal',    49.27, 'variavel', true),
  ('2026-05-02', 'Vercel',               'Infraestrutura',   'Geral',     'Cartão Santander', 'Mensal',   105.96, 'fixo',     true),
  ('2026-05-08', 'Z-API (Bot Comercial)','Ferramentas',      'Agentes IA','Cartão Santander', 'Mensal',    99.99, 'fixo',     true),
  ('2026-05-12', 'SEFAZ/DARE',           'Impostos',         'Geral',     'PIX',              'Única',    218.99, 'pontual',  false),
  ('2026-05-12', 'Google One',           'Ferramentas',      'Geral',     'Cartão Santander', 'Mensal',    96.99, 'fixo',     true);
