-- E-04 · Estas funções eram executáveis via /rest/v1/rpc/ por qualquer pessoa
-- com a anon key (que está no bundle do navegador). Só o cron, que roda como
-- postgres, precisa chamá-las.
revoke execute on function public.estender_despesas_continuas() from anon, authenticated, public;
revoke execute on function public.estender_receitas_continuas() from anon, authenticated, public;
