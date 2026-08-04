-- Cancelamento de assinatura em despesas recorrentes
-- ---------------------------------------------------
-- Adiciona a flag `assinatura_ativa`. Séries com assinatura_ativa = false foram
-- canceladas: o painel remove os lançamentos futuros e o cron de renovação mensal
-- DEVE parar de adicionar novos meses para elas.

alter table public.despesas
  add column if not exists assinatura_ativa boolean not null default true;

-- Consulta útil: séries contínuas ainda ativas (as que o cron deve renovar).
-- Uma série é considerada ativa se NENHUM de seus lançamentos foi cancelado.
--
--   select serie_id
--   from public.despesas
--   where serie_id is not null
--     and parcela_total is null          -- contínuas (parceladas têm fim definido)
--   group by serie_id
--   having bool_and(assinatura_ativa);    -- só renova as que continuam ativas
--
-- IMPORTANTE (cron de renovação, no Supabase):
-- Ao selecionar as séries que receberão um novo mês, filtre pelas ativas.
-- Basta adicionar ao WHERE existente:
--
--   and assinatura_ativa = true
--
-- Assim, ao cancelar uma assinatura no painel (marca todos os lançamentos da
-- série como assinatura_ativa = false), o cron deixa de gerar novos meses.
