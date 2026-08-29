-- Participação societária.
--
-- Enquanto cada empresa era inteira do Rodrigo, o resultado da empresa era o
-- resultado dele. Com sócios deixa de ser: 100% do lucro de uma empresa em que
-- ele tem 10% não é dinheiro dele, e um painel que mostra o número cheio
-- induz a decisão errada.

create table if not exists public.socios (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  -- Nome livre: sócio não precisa ser usuário do painel. O Henrique não é.
  nome             text not null,
  -- Preenchido quando o sócio também usa o painel. É o que permite a cada um
  -- ver a própria fatia sem a tela precisar perguntar quem está olhando.
  membro_id        uuid references public.membros(id) on delete set null,
  participacao_pct numeric(6,3) not null
                     check (participacao_pct > 0 and participacao_pct <= 100),
  papel            text,
  entrada          date,
  -- Preenchida quando o sócio sai. Histórico fica; a conta para de somar.
  saida            date,
  observacao       text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_socios_empresa on public.socios (empresa_id);

-- Uma pessoa entra uma vez por empresa. Duas linhas do mesmo sócio seriam
-- somadas em silêncio e o total passaria de 100 sem ninguém notar.
create unique index if not exists idx_socios_membro_unico
  on public.socios (empresa_id, membro_id) where membro_id is not null and saida is null;

-- Ninguém é dono de mais de 100% de nada. A regra fica no banco porque é
-- invariante de dado, não de tela: um import ou um script a violaria igual.
create or replace function public.socios_soma_ate_100() returns trigger
language plpgsql as $$
declare soma numeric;
begin
  select coalesce(sum(participacao_pct), 0) into soma
  from public.socios
  where empresa_id = new.empresa_id
    and saida is null
    and id <> new.id;

  if soma + new.participacao_pct > 100.0001 then
    raise exception
      'A soma das participações passaria de 100%% (já há %%% declarado nesta empresa).',
      soma;
  end if;
  return new;
end $$;

drop trigger if exists trg_socios_soma on public.socios;
create trigger trg_socios_soma before insert or update on public.socios
  for each row execute function public.socios_soma_ate_100();

-- Quanto de cada empresa já está declarado. Menos de 100 não é erro — pode
-- ser cadastro pela metade — mas a tela precisa poder dizer isso.
create or replace view public.participacao_declarada as
  select e.id as empresa_id,
         coalesce(sum(s.participacao_pct) filter (where s.saida is null), 0) as declarado_pct,
         count(s.id) filter (where s.saida is null) as socios
  from public.empresas e
  left join public.socios s on s.empresa_id = e.id
  where e.tipo = 'propria'
  group by e.id;

-- ── RLS e auditoria ─────────────────────────────────────────────────────────
alter table public.socios enable row level security;
drop policy if exists socios_membros on public.socios;
create policy socios_membros on public.socios for all to authenticated
  using (public.e_membro()) with check (public.e_membro());

-- Quem mexeu em quanto cada um tem é exatamente o que se pergunta depois.
drop trigger if exists auditoria_socios on public.socios;
create trigger auditoria_socios after insert or update or delete on public.socios
  for each row execute function public.registrar_atividade();
