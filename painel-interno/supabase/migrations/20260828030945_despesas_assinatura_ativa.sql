-- E-03 · Coluna que o painel já usa em app/financeiro/page.tsx mas que nunca
-- foi criada. Séries com assinatura_ativa = false foram canceladas.
alter table public.despesas
  add column if not exists assinatura_ativa boolean not null default true;

create index if not exists idx_despesas_serie_assinatura
  on public.despesas (serie_id)
  where assinatura_ativa = false;
