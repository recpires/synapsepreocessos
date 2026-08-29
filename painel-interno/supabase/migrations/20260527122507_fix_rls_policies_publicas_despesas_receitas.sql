-- =====================================================
-- FIX ALTO: Corrigir políticas com role público ("-")
-- despesas e receitas tinham USING(true) para TODOS os roles
-- incluindo anônimos — qualquer pessoa podia ler/editar
-- =====================================================

-- DESPESAS: remover política pública e substituir por autenticados
DROP POLICY IF EXISTS "Acesso total autenticado — despesas" ON public.despesas;

CREATE POLICY "despesas_apenas_autenticados"
  ON public.despesas
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- RECEITAS: remover políticas públicas e consolidar para autenticados
DROP POLICY IF EXISTS "Acesso total autenticado — receitas" ON public.receitas;
DROP POLICY IF EXISTS "receitas_auth_delete" ON public.receitas;
DROP POLICY IF EXISTS "receitas_auth_insert" ON public.receitas;
DROP POLICY IF EXISTS "receitas_auth_update" ON public.receitas;

CREATE POLICY "receitas_apenas_autenticados"
  ON public.receitas
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
