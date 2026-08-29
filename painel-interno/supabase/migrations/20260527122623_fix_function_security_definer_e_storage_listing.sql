-- =====================================================
-- FIX: receitas_set_updated_at é trigger function —
-- não precisa de SECURITY DEFINER. Trocar para INVOKER
-- e manter search_path fixo.
-- =====================================================
CREATE OR REPLACE FUNCTION public.receitas_set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Revogar EXECUTE público (anon não precisa chamar trigger functions via RPC)
REVOKE EXECUTE ON FUNCTION public.receitas_set_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.receitas_set_updated_at() FROM authenticated;

-- =====================================================
-- FIX: Storage buckets — remover políticas de listagem ampla
-- Buckets públicos não precisam de SELECT policy para
-- acesso por URL. A listagem expõe nomes de todos os arquivos.
-- =====================================================
DROP POLICY IF EXISTS "contratos_arquivos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "documentos_read" ON storage.objects;

-- Permitir leitura individual apenas para autenticados (sem listagem)
CREATE POLICY "contratos_arquivos_auth_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contratos-arquivos');

CREATE POLICY "documentos_auth_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documentos-files');
