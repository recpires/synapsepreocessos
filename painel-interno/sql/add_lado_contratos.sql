-- Adiciona o campo `lado` na tabela contratos
-- 'cliente' = contratos com clientes da Synapse (NDA, Desenvolvimento, SaaS…)
-- 'empresa' = contratos onde a Synapse é a contratante (aluguel, contador, fornecedor…)

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS lado TEXT NOT NULL DEFAULT 'cliente'
  CHECK (lado IN ('cliente', 'empresa'));

-- Os contratos existentes ficam como 'cliente' por padrão
UPDATE contratos SET lado = 'cliente' WHERE lado IS NULL;

CREATE INDEX IF NOT EXISTS idx_contratos_lado ON contratos(lado);
