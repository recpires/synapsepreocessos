-- Adiciona campos para integração com Asaas e idempotência
ALTER TABLE receitas
  ADD COLUMN IF NOT EXISTS cliente_id      TEXT,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'recebido',
  ADD COLUMN IF NOT EXISTS origem          TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS origem_id       TEXT,
  ADD COLUMN IF NOT EXISTS payload_raw     JSONB,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Constraints (criadas só se não existirem)
DO $$ BEGIN
  ALTER TABLE receitas ADD CONSTRAINT receitas_status_chk
    CHECK (status IN ('recebido','confirmado','estornado','cancelado'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE receitas ADD CONSTRAINT receitas_origem_id_unique UNIQUE (origem_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipo agora permite 'setup' também
DO $$ BEGIN
  ALTER TABLE receitas DROP CONSTRAINT IF EXISTS receitas_tipo_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE receitas ADD CONSTRAINT receitas_tipo_check
  CHECK (tipo IN ('recorrente','pontual','setup'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_receitas_produto_data ON receitas(produto, data DESC);
CREATE INDEX IF NOT EXISTS idx_receitas_data         ON receitas(data DESC);
CREATE INDEX IF NOT EXISTS idx_receitas_origem       ON receitas(origem);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION receitas_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receitas_updated_at ON receitas;
CREATE TRIGGER trg_receitas_updated_at
  BEFORE UPDATE ON receitas
  FOR EACH ROW EXECUTE FUNCTION receitas_set_updated_at();

-- RLS (idempotente)
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS receitas_auth_select ON receitas;
CREATE POLICY receitas_auth_select ON receitas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS receitas_auth_insert ON receitas;
CREATE POLICY receitas_auth_insert ON receitas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS receitas_auth_update ON receitas;
CREATE POLICY receitas_auth_update ON receitas FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS receitas_auth_delete ON receitas;
CREATE POLICY receitas_auth_delete ON receitas FOR DELETE TO authenticated USING (true);
