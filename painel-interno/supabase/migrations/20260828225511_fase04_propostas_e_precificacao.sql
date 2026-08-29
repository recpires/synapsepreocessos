-- Fase 04 · Comercial: lead → precificação → proposta → contrato → projeto.
--
-- Hoje a precificação vive em 134 linhas de Markdown e o template de proposta
-- em outras 148. Nada disso é consultável, versionável nem vira número.

-- ── Simulações de preço ────────────────────────────────────────────────────
create table if not exists public.precificacoes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  produto_id uuid references public.produtos(id) on delete set null,
  -- entradas e resultado ficam em jsonb: a fórmula evolui, o histórico não
  -- pode quebrar junto.
  entradas   jsonb not null default '{}'::jsonb,
  resultado  jsonb not null default '{}'::jsonb,
  observacao text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Propostas ──────────────────────────────────────────────────────────────
do $$ begin
  create type public.status_proposta as enum
    ('rascunho','enviada','em_negociacao','aceita','recusada','expirada');
exception when duplicate_object then null; end $$;

create table if not exists public.propostas (
  id            uuid primary key default gen_random_uuid(),
  numero        text not null unique,
  empresa_id    uuid references public.empresas(id) on delete set null,
  lead_id       uuid references public.pipeline_leads(id) on delete set null,
  projeto_id    uuid references public.projetos(id) on delete set null,
  titulo        text not null,
  contexto      text,
  escopo        text,
  status        public.status_proposta not null default 'rascunho',
  validade      date,
  condicoes     text,
  observacao    text,
  -- Congelados no aceite: o preço combinado não pode mudar se um item for
  -- editado depois.
  valor_total   numeric(12,2) not null default 0,
  valor_mensal  numeric(12,2) not null default 0,
  enviada_em    timestamptz,
  aceita_em     timestamptz,
  motivo_recusa text,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_propostas_status on public.propostas (status, validade);

create table if not exists public.proposta_itens (
  id          uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas(id) on delete cascade,
  ordem       int not null default 1,
  descricao   text not null,
  detalhe     text,
  quantidade  numeric(10,2) not null default 1,
  valor_unit  numeric(12,2) not null default 0,
  -- 'unico' entra no valor total; 'mensal' entra no recorrente.
  cobranca    text not null default 'unico' check (cobranca in ('unico','mensal')),
  horas_est   numeric(8,2),
  opcional    boolean not null default false
);
create index if not exists idx_proposta_itens on public.proposta_itens (proposta_id, ordem);

-- Recalcula os totais a partir dos itens não opcionais.
create or replace function public.recalcular_proposta(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.propostas p
  set valor_total = coalesce((
        select sum(i.quantidade * i.valor_unit) from public.proposta_itens i
        where i.proposta_id = p_id and not i.opcional and i.cobranca = 'unico'
      ), 0),
      valor_mensal = coalesce((
        select sum(i.quantidade * i.valor_unit) from public.proposta_itens i
        where i.proposta_id = p_id and not i.opcional and i.cobranca = 'mensal'
      ), 0),
      updated_at = now()
  where p.id = p_id
    -- Proposta aceita tem valor congelado: item editado depois não muda o
    -- que foi combinado.
    and p.status <> 'aceita';
end;
$$;

create or replace function public.trg_recalcular_proposta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recalcular_proposta(coalesce(new.proposta_id, old.proposta_id));
  return null;
end;
$$;

drop trigger if exists proposta_itens_recalcula on public.proposta_itens;
create trigger proposta_itens_recalcula
  after insert or update or delete on public.proposta_itens
  for each row execute function public.trg_recalcular_proposta();

-- Numeração sequencial por ano: 2026-0001, 2026-0002…
create or replace function public.proximo_numero_proposta()
returns text
language sql stable
set search_path = ''
as $$
  select to_char(current_date, 'YYYY') || '-' || lpad((
    coalesce(max(split_part(numero, '-', 2)::int), 0) + 1
  )::text, 4, '0')
  from public.propostas
  where numero like to_char(current_date, 'YYYY') || '-%';
$$;

-- ── RLS ────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['precificacoes','propostas','proposta_itens'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_membros', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.e_membro()) with check (public.e_membro())',
      t || '_membros', t
    );
  end loop;
end $$;

revoke execute on function public.recalcular_proposta(uuid) from anon, public;
revoke execute on function public.trg_recalcular_proposta() from anon, authenticated, public;
revoke execute on function public.proximo_numero_proposta() from anon, public;
grant execute on function public.proximo_numero_proposta() to authenticated;
