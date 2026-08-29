-- Buckets públicos acessam arquivos via URL direta — sem precisar de SELECT policy.
-- Remover a policy elimina o listing pela API sem bloquear acesso aos arquivos.
DROP POLICY IF EXISTS "contratos_arquivos_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "documentos_auth_read" ON storage.objects;
