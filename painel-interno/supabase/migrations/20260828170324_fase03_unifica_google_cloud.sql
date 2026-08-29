-- Unifica os lançamentos do Google Cloud.
--
-- Eram seis linhas com quatro grafias — "GOOGLE CLOUD Rr3ZPW", a mesma com
-- espaço no fim, "(cópia)" e "GOOGLE CLOUD" — em duas categorias diferentes
-- (Marketing e Ferramentas). Isso quebrava o rateio (a regra casaria só parte
-- delas) e o comparativo por categoria do relatório.
--
-- NÃO são duplicatas: as linhas "(cópia)" têm valores próprios (R$ 501,76 e
-- R$ 301,76). Nenhuma linha é removida e nenhum valor muda — só descrição e
-- categoria. O total de R$ 92.687,51 permanece.
--
-- Categoria escolhida: Infraestrutura. GCP é nuvem, igual a Supabase e Vercel,
-- que já estão lá. Marketing ficou reservado a Google Ads e ManyChat.
--
-- Para reverter:
--   update public.despesas d
--   set descricao = b.descricao, categoria = b.categoria
--   from backups.despesas_google_cloud_20260828 b
--   where b.id = d.id;

-- Snapshot só destas linhas, para reverter em um comando se preciso.
create table if not exists backups.despesas_google_cloud_20260828 as
  select * from public.despesas where descricao ilike '%google cloud%';

update public.despesas
set descricao = 'Google Cloud',
    categoria = 'Infraestrutura'
where descricao ilike '%google cloud%';
