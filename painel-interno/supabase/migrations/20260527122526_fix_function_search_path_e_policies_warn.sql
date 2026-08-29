-- =====================================================
-- FIX MÉDIO: Corrigir search_path mutável na função trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.receitas_set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FIX MÉDIO: Corrigir políticas USING(true) restantes
-- (documentos, pipeline_leads, tarefas, testes_resultados)
-- Já eram TO authenticated, mas USING(true) é desnecessário
-- =====================================================

-- DOCUMENTOS
DROP POLICY IF EXISTS "documentos_delete" ON public.documentos;
DROP POLICY IF EXISTS "documentos_insert" ON public.documentos;

CREATE POLICY "documentos_delete" ON public.documentos
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "documentos_insert" ON public.documentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- PIPELINE_LEADS
DROP POLICY IF EXISTS "pipeline_delete" ON public.pipeline_leads;
DROP POLICY IF EXISTS "pipeline_insert" ON public.pipeline_leads;
DROP POLICY IF EXISTS "pipeline_update" ON public.pipeline_leads;

CREATE POLICY "pipeline_delete" ON public.pipeline_leads
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "pipeline_insert" ON public.pipeline_leads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pipeline_update" ON public.pipeline_leads
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- TAREFAS
DROP POLICY IF EXISTS "tarefas_delete" ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_insert" ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_update" ON public.tarefas;

CREATE POLICY "tarefas_delete" ON public.tarefas
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "tarefas_insert" ON public.tarefas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tarefas_update" ON public.tarefas
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- TESTES_RESULTADOS
DROP POLICY IF EXISTS "testes_update" ON public.testes_resultados;
DROP POLICY IF EXISTS "testes_upsert" ON public.testes_resultados;

CREATE POLICY "testes_upsert" ON public.testes_resultados
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "testes_update" ON public.testes_resultados
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
