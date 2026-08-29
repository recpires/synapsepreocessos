-- Fase 05 · Snapshot mensal de métricas e resumo semanal.
--
-- Hoje o painel lê MRR e clientes ao vivo das APIs dos produtos, então só
-- mostra o número de agora. Sem histórico não dá para ver curva nem churn.

create table if not exists public.metricas_saas (
  id              uuid primary key default gen_random_uuid(),
  produto_id      uuid not null references public.produtos(id) on delete cascade,
  competencia     date not null,
  mrr             numeric(12,2) not null default 0,
  clientes_ativos int not null default 0,
  clientes_trial  int not null default 0,
  novos           int not null default 0,
  cancelados      int not null default 0,
  churn_pct       numeric(5,2),
  bruto           jsonb,
  coletado_em     timestamptz not null default now(),
  unique (produto_id, competencia)
);
create index if not exists idx_metricas_competencia on public.metricas_saas (competencia desc);

-- ARR e variação saem da própria série; gravar seria informação duplicada
-- que pode divergir.
create or replace view public.metricas_saas_com_variacao as
  select m.*,
         (m.mrr * 12) as arr,
         lag(m.mrr) over (partition by m.produto_id order by m.competencia) as mrr_anterior,
         case
           when lag(m.mrr) over (partition by m.produto_id order by m.competencia) > 0
           then round(((m.mrr - lag(m.mrr) over (partition by m.produto_id order by m.competencia))
                       / lag(m.mrr) over (partition by m.produto_id order by m.competencia)) * 100, 1)
         end as variacao_pct
  from public.metricas_saas m;

-- ── Resumo semanal ─────────────────────────────────────────────────────────
create table if not exists public.resumos (
  id          uuid primary key default gen_random_uuid(),
  competencia date not null unique,
  titulo      text not null,
  corpo_md    text not null,
  dados       jsonb not null default '{}'::jsonb,
  -- Preenchido quando houver canal de envio. Nulo = só no painel.
  enviado_em  timestamptz,
  canal       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_resumos_competencia on public.resumos (competencia desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['metricas_saas','resumos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_membros', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.e_membro()) with check (public.e_membro())',
      t || '_membros', t
    );
  end loop;
end $$;
