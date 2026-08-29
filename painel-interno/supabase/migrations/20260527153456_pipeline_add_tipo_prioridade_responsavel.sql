-- Adiciona tipo (comercial | projeto), prioridade e responsavel ao pipeline
ALTER TABLE public.pipeline_leads
  ADD COLUMN IF NOT EXISTS tipo        text NOT NULL DEFAULT 'comercial',
  ADD COLUMN IF NOT EXISTS prioridade  text,
  ADD COLUMN IF NOT EXISTS responsavel text;

-- Garante que todos os registros existentes são do tipo comercial
UPDATE public.pipeline_leads SET tipo = 'comercial' WHERE tipo IS NULL;

-- Index para filtrar por tipo eficientemente
CREATE INDEX IF NOT EXISTS pipeline_leads_tipo_idx ON public.pipeline_leads (tipo);
