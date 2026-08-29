-- Nota fiscal e dívida são poucas linhas e cada uma vale dinheiro: perfil
-- oposto ao de despesas/receitas, que ficaram fora do log por volume. Parcela
-- entra junto porque "quem marcou como paga" é a pergunta que se faz depois.
do $$
declare t text;
begin
  foreach t in array array['notas_fiscais','dividas','divida_parcelas'] loop
    execute format('drop trigger if exists %I on public.%I', 'auditoria_' || t, t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
       for each row execute function public.registrar_atividade()',
      'auditoria_' || t, t
    );
  end loop;
end $$;
