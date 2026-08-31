-- Despesa e receita entram no log de auditoria.
--
-- Eram as duas únicas tabelas de dinheiro sem trigger: dívidas, parcelas, notas
-- fiscais, impostos e contas bancárias já registravam, justo as que movem o
-- caixa não. Bati nisso tentando reconciliar uma diferença no realizado — o log
-- simplesmente não tinha resposta, porque nunca viu uma despesa.
--
-- Anexar o trigger sozinho, porém, abriria um furo: `atividades` é legível por
-- qualquer membro (`e_membro()`, sem recorte de empresa) e guarda a linha
-- inteira em insert e delete. Toda despesa da segunda empresa passaria a ser
-- legível por todo mundo através do log — o mesmo tipo de vazamento pela porta
-- dos fundos que as views `security definer` causaram na fase 10.
--
-- Por isso o log passa a carregar `empresa_id` e a respeitar `pode_ver_empresa`.

alter table public.atividades
  add column if not exists empresa_id uuid references public.empresas(id) on delete set null;

create index if not exists idx_atividades_empresa on public.atividades (empresa_id);

/*
 * Tabelas cuja coluna `empresa_id` é a NOSSA empresa.
 *
 * A lista é explícita de propósito. Em `projetos`, `propostas` e `sites` a
 * mesma coluna guarda a contraparte — o cliente —, e copiá-la para o log faria
 * `pode_ver_empresa` responder "não" para qualquer usuário restrito, escondendo
 * a atividade do projeto de todos. Essa confusão entre "nossa empresa" e
 * "empresa do outro lado" já custou caro três vezes neste banco; aqui ela fica
 * barrada por enumeração, não por intenção.
 */
create or replace function public.atividade_empresa_nossa(tabela text, linha jsonb)
returns uuid language sql immutable set search_path to '' as $$
  select case
    when tabela in ('despesas','receitas','impostos','contas_bancarias',
                    'notas_fiscais','dividas','socios','membro_empresas')
      then nullif(linha->>'empresa_id', '')::uuid
    when tabela = 'empresas' then nullif(linha->>'id', '')::uuid
    else null
  end;
$$;

create or replace function public.registrar_atividade()
returns trigger language plpgsql security definer set search_path to '' as $function$
declare
  v_membro  public.membros%rowtype;
  v_id      uuid;
  v_resumo  text;
  v_cheio   jsonb;
  v_antes   jsonb;
  v_depois  jsonb;
  v_empresa uuid;
begin
  select * into v_membro from public.membros
   where user_id = (select auth.uid()) and ativo;

  -- Linha completa, para tirar o rótulo antes de qualquer redução.
  v_cheio := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_id    := (v_cheio->>'id')::uuid;
  v_empresa := public.atividade_empresa_nossa(tg_table_name, v_cheio);

  -- Resposta crua de gateway não tem por que morar no log: é volumosa e pode
  -- trazer dado pessoal do pagador que o painel não precisa guardar duas vezes.
  v_cheio := v_cheio - 'payload_raw';

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
      and key not in ('updated_at','payload_raw');
    if v_depois is null then return null; end if;  -- nada relevante mudou
    select jsonb_object_agg(key, to_jsonb(old)->key) into v_antes
    from jsonb_object_keys(v_depois) key;
  end if;

  insert into public.atividades
    (membro_id, autor, acao, entidade, entidade_id, resumo, antes, depois, empresa_id)
  values (v_membro.id, coalesce(v_membro.nome, 'sistema'), lower(tg_op),
          tg_table_name, v_id, v_resumo, v_antes, v_depois, v_empresa);

  return null;
end;
$function$;

-- Retroativo: o log já vazava dívida e nota fiscal da segunda empresa desde a
-- fase 10. Preencher agora fecha o que já estava aberto, em vez de proteger só
-- daqui para frente.
--
-- Vem da tabela viva, não do jsonb guardado: em update o log só registra as
-- chaves que mudaram, então `empresa_id` quase nunca está lá.
do $$
declare t text;
begin
  foreach t in array array[
    'despesas','receitas','impostos','contas_bancarias',
    'notas_fiscais','dividas','socios'
  ] loop
    execute format(
      'update public.atividades a set empresa_id = x.empresa_id
         from public.%I x
        where a.entidade = %L and a.entidade_id = x.id and a.empresa_id is null',
      t, t);
  end loop;

  update public.atividades a set empresa_id = a.entidade_id
   where a.entidade = 'empresas' and a.empresa_id is null
     and exists (select 1 from public.empresas e where e.id = a.entidade_id);
end $$;

-- Sobra o que já foi apagado: a linha não existe mais para consultar, e o
-- snapshot do delete é a única fonte.
update public.atividades a
   set empresa_id = public.atividade_empresa_nossa(
         a.entidade, coalesce(a.antes, '{}'::jsonb) || coalesce(a.depois, '{}'::jsonb))
 where a.empresa_id is null;

-- Linha sem empresa continua visível para todos: `pode_ver_empresa(null)` é
-- true por decisão explícita, e a maioria do log histórico não tem dono.
drop policy if exists atividades_leitura on public.atividades;
create policy atividades_leitura on public.atividades
  for select to authenticated
  using (public.e_membro() and public.pode_ver_empresa(empresa_id));

drop trigger if exists auditoria_despesas on public.despesas;
create trigger auditoria_despesas
  after insert or update or delete on public.despesas
  for each row execute function public.registrar_atividade();

drop trigger if exists auditoria_receitas on public.receitas;
create trigger auditoria_receitas
  after insert or update or delete on public.receitas
  for each row execute function public.registrar_atividade();
