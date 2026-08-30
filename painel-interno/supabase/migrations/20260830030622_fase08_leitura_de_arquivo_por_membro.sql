-- Sem isto, fechar os buckets tornaria os arquivos ilegíveis também para o
-- painel: `contratos-arquivos` e `documentos-files` nunca tiveram política de
-- SELECT porque, sendo públicos, nunca precisaram. A leitura passava por fora
-- da RLS — que é justamente o problema que estamos consertando.
--
-- A permissão é a mesma do resto do painel: allowlist de membros, não
-- "qualquer autenticado". Um usuário do Supabase que não seja membro não lê
-- contrato social.

do $$
declare b text;
begin
  foreach b in array array['contratos-arquivos','documentos-files'] loop
    execute format('drop policy if exists %I on storage.objects', b || '_membro_select');
    execute format(
      'create policy %I on storage.objects for select to authenticated
         using (bucket_id = %L and public.e_membro())',
      b || '_membro_select', b
    );

    -- Apagar arquivo também precisa de dono: a tela de documentos remove o
    -- objeto junto com a linha, e hoje só `documentos-files` tinha regra.
    execute format('drop policy if exists %I on storage.objects', b || '_membro_delete');
    execute format(
      'create policy %I on storage.objects for delete to authenticated
         using (bucket_id = %L and public.e_membro())',
      b || '_membro_delete', b
    );
  end loop;
end $$;

-- A política de DELETE que existia em `documentos-files` não checava nada além
-- do bucket: qualquer autenticado podia apagar. Sai, agora que há uma com dono.
drop policy if exists documentos_delete_storage on storage.objects;

-- Os buckets deixam de ser públicos. Feito por último de propósito: com a
-- política já no lugar, não existe janela em que o arquivo fique inacessível.
update storage.buckets set public = false
 where id in ('contratos-arquivos','documentos-files');
