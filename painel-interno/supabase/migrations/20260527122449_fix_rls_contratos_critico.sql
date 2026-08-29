-- =====================================================
-- FIX CRÍTICO: Ativar RLS em tabelas expostas publicamente
-- contratos e contrato_templates estavam 100% acessíveis
-- sem autenticação (qualquer pessoa com a URL do projeto)
-- =====================================================

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_templates ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados podem acessar contratos
CREATE POLICY "contratos_apenas_autenticados"
  ON public.contratos
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas usuários autenticados podem acessar templates
CREATE POLICY "contrato_templates_apenas_autenticados"
  ON public.contrato_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
