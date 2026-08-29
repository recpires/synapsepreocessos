-- Fase 05 · Quem mudou o quê, e quando.
--
-- Feito por trigger no banco, não por chamada na aplicação: log que depende do
-- código lembrar de registrar tem lacuna no dia em que alguém esquece — e é
-- justamente nesse dia que ele faria falta.

create table if not exists public.atividades (
  id          uuid primary key default gen_random_uuid(),
  membro_id   uuid references public.membros(id) on delete set null,
  autor       text,
  acao        text not null check (acao in ('insert','update','delete')),
  entidade    text not null,
  entidade_id uuid,
  resumo      text,
  antes       jsonb,
  depois      jsonb,
  em          timestamptz not null default now()
);
create index if not exists idx_atividades_em on public.atividades (em desc);
create index if not exists idx_atividades_entidade on public.atividades (entidade, entidade_id);

alter table public.atividades enable row level security;
drop policy if exists atividades_leitura on public.atividades;
-- Só leitura pelo painel: o log é escrito por trigger, nunca pela aplicação.
create policy atividades_leitura on public.atividades
  for select to authenticated using (public.e_membro());

create or replace function public.registrar_atividade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membro  public.membros%rowtype;
  v_id      uuid;
  v_resumo  text;
  v_cheio   jsonb;
  v_antes   jsonb;
  v_depois  jsonb;
begin
  select * into v_membro from public.membros
   where user_id = (select auth.uid()) and ativo;

  -- Linha completa, para tirar o rótulo antes de qualquer redução. Calcular o
  -- resumo depois do diff fazia todo UPDATE sair sem rótulo, porque o campo
  -- que dá nome à linha raramente é o que mudou.
  v_cheio := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_id    := (v_cheio->>'id')::uuid;

  v_resumo := coalesce(
    v_cheio->>'nome', v_cheio->>'titulo', v_cheio->>'descricao',
    v_cheio->>'razao_social', v_cheio->>'cliente', v_cheio->>'numero'
  );

  if tg_op = 'DELETE' then
    v_antes := v_cheio;
  elsif tg_op = 'INSERT' then
    v_depois := v_cheio;
  else
    -- Guarda só o que mudou. Linha inteira a cada update inflaria o log
    -- e esconderia a informação útil.
    select jsonb_object_agg(key, value) into v_depois
    from jsonb_each(to_jsonb(new))
    where to_jsonb(new)->key is distinct from to_jsonb(old)->key
      and key not in ('updated_at');
    if v_depois is null then return null; end if;  -- nada relevante mudou
    select jsonb_object_agg(key, to_jsonb(old)->key) into v_antes
    from jsonb_object_keys(v_depois) key;
  end if;

  insert into public.atividades (membro_id, autor, acao, entidade, entidade_id, resumo, antes, depois)
  values (v_membro.id, coalesce(v_membro.nome, 'sistema'), lower(tg_op),
          tg_table_name, v_id, v_resumo, v_antes, v_depois);

  return null;
end;
$$;

revoke execute on function public.registrar_atividade() from anon, authenticated, public;

-- Aplica nas tabelas onde a mudança importa. Fora: despesas e receitas, que
-- têm centenas de linhas geradas por cron e afogariam o log.
do $$
declare t text;
begin
  foreach t in array array[
    'empresas','projetos','contratos','propostas','proposta_itens',
    'sites','impostos','contas_bancarias','membros','contrato_templates',
    'rateio_regras','projeto_erros'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'auditoria_' || t, t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
       for each row execute function public.registrar_atividade()',
      'auditoria_' || t, t
    );
  end loop;
end $$;
