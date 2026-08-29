-- Fase 03 · Custo por produto, orçamento e impostos.
--
-- O problema que isso resolve: 191 dos 228 lançamentos estão em produto
-- 'Geral' — R$ 21.484,95 realizados sem dono. Supabase, Vercel, Claude e
-- Figma servem vários produtos ao mesmo tempo; forçar um único produto por
-- lançamento seria mentira. O rateio distribui por percentual.

-- ── Regras de rateio ───────────────────────────────────────────────────────
create table if not exists public.rateio_regras (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  -- 'descricao' casa por trecho do texto; 'categoria' casa exato.
  aplica_a   text not null default 'descricao' check (aplica_a in ('descricao','categoria')),
  padrao     text not null,
  ativa      boolean not null default true,
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.rateio_itens (
  id         uuid primary key default gen_random_uuid(),
  regra_id   uuid not null references public.rateio_regras(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  percentual numeric(5,2) not null check (percentual > 0 and percentual <= 100),
  unique (regra_id, produto_id)
);

-- Uma regra só vale se somar 100%. Sem isso o custo total muda ao ratear.
create or replace function public.rateio_regras_validas()
returns table (regra_id uuid, nome text, soma numeric, valida boolean)
language sql stable
set search_path = ''
as $$
  select r.id, r.nome, coalesce(sum(i.percentual), 0),
         coalesce(sum(i.percentual), 0) = 100
  from public.rateio_regras r
  left join public.rateio_itens i on i.regra_id = r.id
  where r.ativa
  group by r.id, r.nome;
$$;

-- ── Custo efetivo por produto ──────────────────────────────────────────────
-- Direto: a despesa já tem produto definido.
-- Rateado: a despesa é 'Geral' e casa com alguma regra válida.
-- Sem dono: 'Geral' que nenhuma regra alcança — o que ainda falta classificar.
--
-- O arredondamento é por grupo (produto, data, origem), então a soma das
-- fatias pode divergir do total em alguns centavos. Aceitável para relatório
-- de custo; não usar esta view para conciliação contábil.
create or replace view public.custo_por_produto as
with validas as (
  select regra_id from public.rateio_regras_validas() where valida
),
rateaveis as (
  select d.id as despesa_id, d.data, d.valor, i.produto_id, i.percentual
  from public.despesas d
  join public.rateio_regras r
    on r.ativa
   and r.id in (select regra_id from validas)
   and (
     (r.aplica_a = 'descricao' and d.descricao ilike '%' || r.padrao || '%')
     or (r.aplica_a = 'categoria' and d.categoria = r.padrao)
   )
  join public.rateio_itens i on i.regra_id = r.id
  where coalesce(d.produto, 'Geral') = 'Geral'
),
direto as (
  select p.id as produto_id, d.data, d.valor
  from public.despesas d
  join public.produtos p on p.nome = d.produto
)
select produto_id, data, round(sum(valor), 2) as valor, origem
from (
  select produto_id, data, valor, 'direto' as origem from direto
  union all
  select produto_id, data, valor * percentual / 100, 'rateado' from rateaveis
) t
group by produto_id, data, origem;

-- ── Orçamento: previsto contra realizado ───────────────────────────────────
create table if not exists public.orcamentos (
  id             uuid primary key default gen_random_uuid(),
  ano            int not null,
  mes            int not null check (mes between 1 and 12),
  categoria      text not null,
  valor_previsto numeric(12,2) not null,
  observacao     text,
  created_at     timestamptz not null default now(),
  unique (ano, mes, categoria)
);

create or replace view public.orcado_vs_realizado as
  select o.ano, o.mes, o.categoria, o.valor_previsto,
         coalesce(r.realizado, 0) as realizado,
         coalesce(r.realizado, 0) - o.valor_previsto as desvio
  from public.orcamentos o
  left join (
    select extract(year from data)::int as ano,
           extract(month from data)::int as mes,
           categoria,
           round(sum(valor), 2) as realizado
    from public.despesas
    group by 1, 2, 3
  ) r on r.ano = o.ano and r.mes = o.mes and r.categoria = o.categoria;

-- ── Impostos ───────────────────────────────────────────────────────────────
create table if not exists public.impostos (
  id          uuid primary key default gen_random_uuid(),
  competencia date not null,
  tipo        text not null,
  valor       numeric(12,2) not null,
  vencimento  date not null,
  pago_em     date,
  guia_url    text,
  observacao  text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_impostos_vencimento on public.impostos (vencimento) where pago_em is null;

-- ── Contas bancárias (base do runway) ──────────────────────────────────────
create table if not exists public.contas_bancarias (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  banco         text,
  tipo          text not null default 'corrente',
  saldo_atual   numeric(14,2) not null default 0,
  atualizado_em date not null default current_date,
  ativa         boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'rateio_regras','rateio_itens','orcamentos','impostos','contas_bancarias'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_membros', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.e_membro()) with check (public.e_membro())',
      t || '_membros', t
    );
  end loop;
end $$;

revoke execute on function public.rateio_regras_validas() from anon, public;
grant execute on function public.rateio_regras_validas() to authenticated;
