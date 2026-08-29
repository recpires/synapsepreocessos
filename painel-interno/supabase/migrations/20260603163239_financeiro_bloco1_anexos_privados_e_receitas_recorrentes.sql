-- ── Item 2: anexos privados ──────────────────────────────────────────────
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS anexo_path text;

-- migra os 4 anexos legados: extrai o path da URL pública
UPDATE public.despesas
SET anexo_path = split_part(anexo_url, '/financeiro-anexos/', 2)
WHERE anexo_url IS NOT NULL AND anexo_path IS NULL;

-- torna o bucket privado
UPDATE storage.buckets SET public = false WHERE id = 'financeiro-anexos';

-- policies: apenas usuários autenticados acessam os anexos
DROP POLICY IF EXISTS "financeiro_anexos_select" ON storage.objects;
DROP POLICY IF EXISTS "financeiro_anexos_insert" ON storage.objects;
DROP POLICY IF EXISTS "financeiro_anexos_delete" ON storage.objects;

CREATE POLICY "financeiro_anexos_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'financeiro-anexos');
CREATE POLICY "financeiro_anexos_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'financeiro-anexos');
CREATE POLICY "financeiro_anexos_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'financeiro-anexos');

-- ── Item 3: recorrência em receitas ──────────────────────────────────────
ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS periodicidade text,
  ADD COLUMN IF NOT EXISTS serie_id uuid,
  ADD COLUMN IF NOT EXISTS parcela_num int,
  ADD COLUMN IF NOT EXISTS parcela_total int;

CREATE INDEX IF NOT EXISTS idx_receitas_serie_id ON public.receitas(serie_id);
