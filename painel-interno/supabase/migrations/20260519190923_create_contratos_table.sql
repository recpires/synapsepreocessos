CREATE TABLE IF NOT EXISTS contratos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente         TEXT NOT NULL,
  tipo            TEXT NOT NULL,        -- 'Desenvolvimento', 'SaaS', 'NDA', 'Manutenção', 'Outro'
  status          TEXT NOT NULL DEFAULT 'vigente', -- 'vigente', 'em_renovacao', 'pendente_assinatura', 'encerrado'
  valor           NUMERIC(12,2),
  data_inicio     DATE NOT NULL,
  data_vencimento DATE,
  responsavel     TEXT NOT NULL DEFAULT 'Rodrigo',
  observacao      TEXT,
  arquivo_url     TEXT,
  arquivo_nome    TEXT,
  gerado_por_template BOOLEAN DEFAULT FALSE,
  template_tipo   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      TEXT DEFAULT 'painel'
);

-- Bucket para arquivos de contratos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-arquivos', 'contratos-arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: leitura pública
CREATE POLICY "contratos_arquivos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contratos-arquivos');

-- Policy: insert autenticado
CREATE POLICY "contratos_arquivos_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contratos-arquivos');
