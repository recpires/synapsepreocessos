-- O resumo era calculado depois de reduzir o registro ao diff, então em
-- UPDATE quase sempre saía nulo: o campo que dá nome à linha raramente é o
-- que mudou. Agora o rótulo vem da linha completa, e só o diff é gravado.

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

  -- Linha completa, para tirar o rótulo antes de qualquer redução.
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
