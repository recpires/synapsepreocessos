-- Fase 01 · Allowlist de acesso ao painel.
--
-- Até aqui toda policy era `auth.uid() IS NOT NULL`: qualquer conta que
-- existisse no projeto lia e escrevia tudo. Agora só entra quem está em
-- `membros` com ativo = true.
--
-- Os três membros atuais entram com acesso total — ninguém perde nada hoje.
-- Restringir depois é um UPDATE de uma linha.

do $$ begin
  create type public.papel_membro as enum ('dono','admin','financeiro','comercial','leitura');
exception when duplicate_object then null; end $$;

create table if not exists public.membros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  nome       text not null,
  email      text not null,
  papel      public.papel_membro not null default 'leitura',
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_membros_user_ativo on public.membros (user_id) where ativo;

-- Seed dos membros existentes, todos com acesso total.
insert into public.membros (user_id, nome, email, papel) values
  ('c708c536-5f37-4a63-a813-f1ecfe1feb29', 'Rodrigo Eufrasio', 'rec.pires7@gmail.com',            'dono'),
  ('3364118f-6581-40ab-a2cb-c6d6ca5ce758', 'Wilian Andre',     'wilian.andre@wassolution.com.br',  'dono'),
  ('239324f3-dd51-4160-bc86-3cec7e53b769', 'Contas a Pagar',   'contasapagar@wassolution.com.br',  'dono')
on conflict (user_id) do nothing;

-- ── Helpers ────────────────────────────────────────────────────────────────
-- SECURITY DEFINER de propósito: as policies de `membros` chamam e_membro(),
-- e sem o DEFINER a consulta reentraria na própria RLS e recursionaria.
--
-- O linter do Supabase marca as duas com o aviso 0029 (SECURITY DEFINER
-- executável por signed-in users). É esperado e inofensivo aqui: as funções
-- não recebem argumento e só respondem sobre o próprio chamador. O grant a
-- `authenticated` é obrigatório — as policies as invocam como o papel de quem
-- chama, então revogar derruba o acesso de todo mundo.

create or replace function public.e_membro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.membros
    where user_id = (select auth.uid()) and ativo
  );
$$;

create or replace function public.papel_atual()
returns public.papel_membro
language sql
stable
security definer
set search_path = ''
as $$
  select papel from public.membros
  where user_id = (select auth.uid()) and ativo;
$$;

revoke execute on function public.e_membro()    from anon, public;
revoke execute on function public.papel_atual() from anon, public;
grant  execute on function public.e_membro()    to authenticated;
grant  execute on function public.papel_atual() to authenticated;

-- ── RLS da própria tabela ──────────────────────────────────────────────────
alter table public.membros enable row level security;

drop policy if exists membros_leitura on public.membros;
create policy membros_leitura on public.membros
  for select to authenticated
  using (public.e_membro());

-- Só o dono mexe na lista de quem tem acesso.
drop policy if exists membros_escrita on public.membros;
create policy membros_escrita on public.membros
  for all to authenticated
  using (public.papel_atual() = 'dono')
  with check (public.papel_atual() = 'dono');
