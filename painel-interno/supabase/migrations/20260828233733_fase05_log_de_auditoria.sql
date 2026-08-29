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
-- Nota: esta versão calcula o resumo depois de reduzir o registro ao diff, o
-- que fazia todo UPDATE sair sem rótulo. Corrigido logo em seguida, na
-- migration 20260828233811. Mantido aqui como foi aplicado.
declare
  v_membro  public.membros%rowtype;
  v_id      uuid;
  v_resumo  text;
  v_antes   jsonb;
  v_depois  jsonb;
begin
  select * into v_membro from public.membros
   where user_id = (select auth.uid()) and ativo;

  if tg_op = 'DELETE' then
    v_antes  := to_jsonb(old);
    v_id     := (v_antes->>'id')::uuid;
  else
    v_depois := to_jsonb(new);
    v_id     := (v_depois->>'id')::uuid;
    if tg_op = 'UPDATE' then
      v_antes := to_jsonb(old);
      -- Guarda só o que mudou. Linha inteira a cada update inflaria o log
      -- e esconderia a informação útil.
      select jsonb_object_agg(key, value) into v_depois
      from jsonb_each(to_jsonb(new))
      where to_jsonb(new)->key is distinct from to_jsonb(old)->key
        and key not in ('updated_at');
      if v_depois is null then return null; end if;  -- nada relevante mudou
      select jsonb_object_agg(key, v_antes->key) into v_antes
      from jsonb_object_keys(v_depois) key;
    end if;
  end if;

  v_resumo := coalesce(
    (coalesce(v_depois, v_antes)->>'nome'),
    (coalesce(v_depois, v_antes)->>'titulo'),
    (coalesce(v_depois, v_antes)->>'descricao'),
    (coalesce(v_depois, v_antes)->>'razao_social'),
    (coalesce(v_depois, v_antes)->>'cliente'),
    (coalesce(v_depois, v_antes)->>'numero')
  );

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
