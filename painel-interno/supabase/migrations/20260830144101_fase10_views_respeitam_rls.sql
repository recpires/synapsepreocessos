-- As views furavam o isolamento que a Fase 10 acabou de criar.
--
-- No Postgres 15+ uma view roda com a permissão de quem a criou, não de quem
-- consulta. Enquanto o acesso era binário isso não fazia diferença: todo membro
-- via tudo mesmo. Com `membro_empresas` passou a fazer — o advisor do Supabase
-- apontou as dez, e o teste confirmou: um usuário restrito a uma empresa lia
-- 0 despesas na tabela e as DUAS empresas em `teto_faturamento` e
-- `participacao_declarada`.
--
-- `security_invoker = on` faz a view enxergar o que o usuário enxerga. É o
-- oposto do que se costuma querer numa view de relatório, e exatamente o que se
-- quer aqui: a view não pode ser porta dos fundos da política que protege a
-- tabela.
do $$
declare v text;
begin
  foreach v in array array[
    'vencimentos','dividas_resumo','faturamento_mensal','teto_faturamento',
    'participacao_declarada','custo_por_produto','orcado_vs_realizado',
    'metricas_saas_com_variacao','projeto_erros_com_duracao',
    'projeto_maturidade_atual'
  ] loop
    execute format('alter view public.%I set (security_invoker = on)', v);
  end loop;
end $$;

-- Os dois gatilhos ficaram sem `search_path` fixo, o que permite sequestro por
-- schema no caminho de busca. O resto das funções já tinha.
alter function public.nf_emitente_e_propria() set search_path to '';
alter function public.socios_soma_ate_100()   set search_path to '';

-- Nota para quem vier depois: NÃO revogue `execute` de `e_membro`,
-- `pode_ver_empresa` e afins do papel `authenticated`. O advisor sugere isso,
-- e parece certo — mas a política RLS chama essas funções no contexto de quem
-- consulta. Revogar derruba a leitura de todas as tabelas protegidas. Testado,
-- e o painel parou na hora.
