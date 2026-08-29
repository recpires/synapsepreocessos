-- Tabela de templates customizados
CREATE TABLE IF NOT EXISTS contrato_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  descricao    TEXT,
  tipo         TEXT NOT NULL DEFAULT 'Outro',
  conteudo_html TEXT NOT NULL DEFAULT '',
  campos       JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT DEFAULT 'painel'
);

-- Colunas DocuSign na tabela contratos
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS docusign_envelope_id TEXT,
  ADD COLUMN IF NOT EXISTS docusign_status       TEXT,
  ADD COLUMN IF NOT EXISTS docusign_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cliente_email         TEXT;
