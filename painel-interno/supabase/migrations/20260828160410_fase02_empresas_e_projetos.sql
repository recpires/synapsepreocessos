-- Fase 02 · O eixo que faltava: empresa e projeto.
-- Puramente aditivo. Nenhuma tabela existente perde coluna ou linha.

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$ begin create type public.tipo_empresa as enum ('cliente','fornecedor','parceiro','propria');
exception when duplicate_object then null; end $$;

do $$ begin create type public.tipo_projeto as enum ('saas','sob_medida','site','manutencao','interno');
exception when duplicate_object then null; end $$;

do $$ begin create type public.fase_projeto as enum
  ('descoberta','especificacao','desenvolvimento','qa','homologacao','operacao','pausado','encerrado');
exception when duplicate_object then null; end $$;

do $$ begin create type public.saude as enum ('verde','amarelo','vermelho');
exception when duplicate_object then null; end $$;

do $$ begin create type public.status_fase as enum ('nao_iniciada','em_andamento','concluida','bloqueada');
exception when duplicate_object then null; end $$;

do $$ begin create type public.severidade as enum ('critica','alta','media','baixa');
exception when duplicate_object then null; end $$;

do $$ begin create type public.status_erro as enum
  ('aberto','investigando','corrigido','nao_reproduz','nao_sera_corrigido');
exception when duplicate_object then null; end $$;

do $$ begin create type public.ambiente as enum ('producao','homologacao','desenvolvimento');
exception when duplicate_object then null; end $$;

-- ── Empresas e contatos ────────────────────────────────────────────────────
create table if not exists public.empresas (
  id            uuid primary key default gen_random_uuid(),
  tipo          public.tipo_empresa not null default 'cliente',
  razao_social  text not null,
  nome_fantasia text,
  cnpj          text,
  inscricao_estadual text,
  endereco      jsonb not null default '{}'::jsonb,
  segmento      text,
  site          text,
  observacao    text,
  responsavel   text,
  ativa         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists idx_empresas_cnpj on public.empresas (cnpj) where cnpj is not null;
create index if not exists idx_empresas_tipo on public.empresas (tipo) where ativa;

create table if not exists public.contatos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  cargo      text,
  email      text,
  whatsapp   text,
  principal  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_contatos_empresa on public.contatos (empresa_id);

-- ── Produtos próprios ──────────────────────────────────────────────────────
-- Substitui as 1.414 linhas de ficha hardcoded em app/produtos/page.tsx.
create table if not exists public.produtos (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  nome       text not null,
  tagline    text,
  descricao  text,
  status     text not null default 'ativo',
  url        text,
  repo       text,
  identidade jsonb not null default '{}'::jsonb,
  stack      text[] not null default '{}',
  ordem      int not null default 100,
  created_at timestamptz not null default now()
);

-- ── Projetos ───────────────────────────────────────────────────────────────
create table if not exists public.projetos (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  empresa_id       uuid references public.empresas(id) on delete set null,
  produto_id       uuid references public.produtos(id) on delete set null,
  tipo             public.tipo_projeto not null default 'sob_medida',
  fase_atual       public.fase_projeto not null default 'descoberta',
  saude            public.saude not null default 'verde',
  maturidade_pct   int not null default 0 check (maturidade_pct between 0 and 100),
  data_inicio      date,
  prazo            date,
  valor_contratado numeric(12,2),
  responsavel      text,
  repo             text,
  ambientes        jsonb not null default '{}'::jsonb,
  observacao       text,
  arquivado        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_projetos_fase on public.projetos (fase_atual) where not arquivado;
create index if not exists idx_projetos_empresa on public.projetos (empresa_id);

create table if not exists public.projeto_fases (
  id          uuid primary key default gen_random_uuid(),
  projeto_id  uuid not null references public.projetos(id) on delete cascade,
  ordem       int not null,
  nome        text not null,
  status      public.status_fase not null default 'nao_iniciada',
  inicio_prev date,
  fim_prev    date,
  inicio_real date,
  fim_real    date,
  pct         int not null default 0 check (pct between 0 and 100),
  entregaveis text,
  created_at  timestamptz not null default now(),
  unique (projeto_id, ordem)
);

create table if not exists public.projeto_tarefas (
  id          uuid primary key default gen_random_uuid(),
  projeto_id  uuid not null references public.projetos(id) on delete cascade,
  fase_id     uuid references public.projeto_fases(id) on delete set null,
  titulo      text not null,
  descricao   text,
  status      text not null default 'pendente',
  prioridade  int not null default 2,
  responsavel text,
  estimativa_h numeric(6,2),
  gasto_h      numeric(6,2) not null default 0,
  vencimento  date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tarefas_projeto on public.projeto_tarefas (projeto_id, status);

-- ── Erros ──────────────────────────────────────────────────────────────────
-- O registro que não existia: cada erro com causa raiz e tempo até resolver.
create table if not exists public.projeto_erros (
  id            uuid primary key default gen_random_uuid(),
  projeto_id    uuid not null references public.projetos(id) on delete cascade,
  codigo        text not null,
  titulo        text not null,
  descricao     text,
  severidade    public.severidade not null default 'media',
  status        public.status_erro not null default 'aberto',
  ambiente      public.ambiente not null default 'producao',
  origem        text,
  reproducao    text,
  stacktrace    text,
  causa_raiz    text,
  correcao      text,
  commit_fix    text,
  responsavel   text,
  detectado_em  timestamptz not null default now(),
  resolvido_em  timestamptz,
  created_at    timestamptz not null default now(),
  unique (projeto_id, codigo)
);
create index if not exists idx_erros_abertos on public.projeto_erros (projeto_id, severidade)
  where status in ('aberto','investigando');

-- Horas até resolver, calculado — não dá para gravar errado.
create or replace view public.projeto_erros_com_duracao as
  select e.*,
         case when e.resolvido_em is not null
              then round(extract(epoch from (e.resolvido_em - e.detectado_em)) / 3600.0, 1)
         end as horas_ate_resolver
  from public.projeto_erros e;

-- ── Maturidade por camada ──────────────────────────────────────────────────
create table if not exists public.projeto_maturidade (
  id          uuid primary key default gen_random_uuid(),
  projeto_id  uuid not null references public.projetos(id) on delete cascade,
  camada      text not null,
  peso        numeric(4,2) not null default 1,
  nota        int not null default 0 check (nota between 0 and 100),
  evidencia   text,
  avaliado_em date not null default current_date,
  unique (projeto_id, camada, avaliado_em)
);

-- Média ponderada da avaliação mais recente de cada camada.
create or replace view public.projeto_maturidade_atual as
  with ultima as (
    select distinct on (projeto_id, camada) projeto_id, camada, peso, nota
    from public.projeto_maturidade
    order by projeto_id, camada, avaliado_em desc
  )
  select projeto_id,
         round(sum(nota * peso) / nullif(sum(peso), 0))::int as maturidade_pct,
         count(*) as camadas_avaliadas
  from ultima group by projeto_id;

-- ── Decisões (ADR leve) ────────────────────────────────────────────────────
create table if not exists public.projeto_decisoes (
  id           uuid primary key default gen_random_uuid(),
  projeto_id   uuid not null references public.projetos(id) on delete cascade,
  titulo       text not null,
  contexto     text,
  decisao      text not null,
  alternativas text,
  data         date not null default current_date,
  created_at   timestamptz not null default now()
);

-- ── Sites ──────────────────────────────────────────────────────────────────
create table if not exists public.sites (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid references public.empresas(id) on delete set null,
  projeto_id        uuid references public.projetos(id) on delete set null,
  nome              text not null,
  dominio           text,
  url               text,
  stack             text[] not null default '{}',
  hospedagem        text,
  registrar         text,
  repo              text,
  status            text not null default 'no_ar',
  publicado_em      date,
  ssl_expira        date,
  dominio_expira    date,
  manutencao_mensal numeric(10,2),
  screenshot_url    text,
  lighthouse        jsonb,
  observacao        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_sites_vencimentos on public.sites (dominio_expira, ssl_expira);

-- ── Ligações nas tabelas existentes ────────────────────────────────────────
-- Todas nullable: nada existente quebra, e a migração de dados fica para depois.
alter table public.contratos     add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.contratos     add column if not exists projeto_id uuid references public.projetos(id) on delete set null;
alter table public.documentos    add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.documentos    add column if not exists projeto_id uuid references public.projetos(id) on delete set null;
alter table public.despesas      add column if not exists projeto_id uuid references public.projetos(id) on delete set null;
alter table public.receitas      add column if not exists empresa_id uuid references public.empresas(id) on delete set null;
alter table public.receitas      add column if not exists projeto_id uuid references public.projetos(id) on delete set null;
alter table public.pipeline_leads add column if not exists empresa_id uuid references public.empresas(id) on delete set null;

-- ── RLS — mesma allowlist da Fase 01 ───────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'empresas','contatos','produtos','projetos','projeto_fases','projeto_tarefas',
    'projeto_erros','projeto_maturidade','projeto_decisoes','sites'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_membros', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.e_membro()) with check (public.e_membro())',
      t || '_membros', t
    );
  end loop;
end $$;
