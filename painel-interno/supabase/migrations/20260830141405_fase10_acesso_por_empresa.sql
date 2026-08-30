-- Acesso por empresa.
--
-- Até aqui `e_membro()` era binário: quem está na allowlist vê tudo. Com mais
-- de um CNPJ e sócios diferentes em cada um, isso deixou de servir — o Henrique
-- tem 50% de uma empresa e nada da outra.
--
-- Duas decisões que moldam o resto:
--
-- 1. Membro SEM nenhuma linha em `membro_empresas` é irrestrito. Sem isso, criar
--    a tabela trancaria todo mundo para fora no mesmo instante, inclusive quem
--    a criou. Os três membros atuais seguem com acesso total sem precisar de
--    cadastro nenhum.
-- 2. Linha sem empresa aparece para todos. Contrato, site, proposta e projeto
--    ainda não têm dono; escondê-los deixaria o usuário restrito com meia tela.
--    É um furo declarado, não acidental — some conforme o dado ganha dono.

-- Espelha `assertAdmin` do TypeScript, que só existia lá.
create or replace function public.e_admin() returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (
    select 1 from public.membros
    where user_id = (select auth.uid()) and ativo and papel in ('dono','admin')
  );
$$;

create table if not exists public.membro_empresas (
  membro_id  uuid not null references public.membros(id)  on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (membro_id, empresa_id)
);

create index if not exists idx_membro_empresas_membro on public.membro_empresas (membro_id);

-- `security definer` porque a própria política precisa ler estas tabelas, e a
-- RLS delas barraria a leitura no meio da checagem.
create or replace function public.membro_irrestrito() returns boolean
language sql stable security definer set search_path to '' as $$
  select not exists (
    select 1
    from public.membro_empresas me
    join public.membros m on m.id = me.membro_id
    where m.user_id = (select auth.uid())
  );
$$;

create or replace function public.pode_ver_empresa(alvo uuid) returns boolean
language sql stable security definer set search_path to '' as $$
  select
    alvo is null
    or public.membro_irrestrito()
    or exists (
      select 1
      from public.membro_empresas me
      join public.membros m on m.id = me.membro_id
      where m.user_id = (select auth.uid()) and me.empresa_id = alvo
    );
$$;

revoke execute on function public.e_admin()              from anon, public;
revoke execute on function public.membro_irrestrito()    from anon, public;
revoke execute on function public.pode_ver_empresa(uuid) from anon, public;

-- ── Tabelas cuja `empresa_id` é a NOSSA empresa ─────────────────────────────
-- `projetos`, `propostas` e `sites` ficam de fora de propósito: lá a coluna
-- guarda a contraparte — o cliente —, e restringir por ela esconderia o projeto
-- do cliente errado em vez de isolar CNPJ.
do $$
declare t text;
begin
  foreach t in array array[
    'despesas','receitas','impostos','contas_bancarias',
    'notas_fiscais','dividas','socios'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_membros', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.e_membro() and public.pode_ver_empresa(empresa_id))
         with check (public.e_membro() and public.pode_ver_empresa(empresa_id))',
      t || '_membros', t
    );
  end loop;
end $$;

-- Contrato usa `empresa_propria_id`: `empresa_id` ali é a contraparte.
drop policy if exists contratos_membros on public.contratos;
create policy contratos_membros on public.contratos for all to authenticated
  using (public.e_membro() and public.pode_ver_empresa(empresa_propria_id))
  with check (public.e_membro() and public.pode_ver_empresa(empresa_propria_id));

-- Parcela não tem empresa: herda a da dívida.
drop policy if exists divida_parcelas_membros on public.divida_parcelas;
create policy divida_parcelas_membros on public.divida_parcelas for all to authenticated
  using (
    public.e_membro() and exists (
      select 1 from public.dividas d
      where d.id = divida_id and public.pode_ver_empresa(d.empresa_id)
    )
  )
  with check (
    public.e_membro() and exists (
      select 1 from public.dividas d
      where d.id = divida_id and public.pode_ver_empresa(d.empresa_id)
    )
  );

-- Quem pode conceder acesso é quem já administra o painel.
alter table public.membro_empresas enable row level security;
drop policy if exists membro_empresas_leitura on public.membro_empresas;
create policy membro_empresas_leitura on public.membro_empresas for select to authenticated
  using (public.e_membro());

drop policy if exists membro_empresas_escrita on public.membro_empresas;
create policy membro_empresas_escrita on public.membro_empresas for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

drop trigger if exists auditoria_membro_empresas on public.membro_empresas;
create trigger auditoria_membro_empresas
  after insert or update or delete on public.membro_empresas
  for each row execute function public.registrar_atividade();
