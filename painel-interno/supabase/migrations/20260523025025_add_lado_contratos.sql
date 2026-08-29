ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS lado TEXT NOT NULL DEFAULT 'cliente'
  CHECK (lado IN ('cliente', 'empresa'));

UPDATE contratos SET lado = 'cliente' WHERE lado IS NULL;

CREATE INDEX IF NOT EXISTS idx_contratos_lado ON contratos(lado);
