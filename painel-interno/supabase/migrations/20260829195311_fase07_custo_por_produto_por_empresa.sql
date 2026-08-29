-- `custo_por_produto` era o último ponto cego do recorte por empresa.
--
-- A view agrega despesa por produto somando o lançamento direto (o que já vem
-- com o produto preenchido) e o rateado (o que é "Geral" e cai numa regra).
-- Nenhum dos dois caminhos carregava a empresa, então o bloco de custo por
-- produto do relatório continuava consolidado mesmo com o filtro aplicado —
-- um número somando dois CNPJs no meio de um documento que diz ser de um só.
--
-- `empresa_id` entra no fim da lista de colunas porque `create or replace view`
-- não deixa inserir no meio, e recriar custaria as permissões.
create or replace view public.custo_por_produto as
with validas as (
  select regra_id from rateio_regras_validas() where valida
),
rateaveis as (
  select d.id as despesa_id, d.data, d.valor, d.empresa_id, i.produto_id, i.percentual
  from public.despesas d
  join public.rateio_regras r
    on r.ativa
   and r.id in (select regra_id from validas)
   and (
     (r.aplica_a = 'descricao' and d.descricao ilike '%' || r.padrao || '%')
     or (r.aplica_a = 'categoria' and d.categoria = r.padrao)
   )
  join public.rateio_itens i on i.regra_id = r.id
  where coalesce(d.produto, 'Geral') = 'Geral'
),
direto as (
  select p.id as produto_id, d.data, d.valor, d.empresa_id
  from public.despesas d
  join public.produtos p on p.nome = d.produto
)
select produto_id,
       data,
       round(sum(valor), 2) as valor,
       origem,
       empresa_id
from (
  select produto_id, data, valor, 'direto'::text as origem, empresa_id from direto
  union all
  select produto_id, data, valor * percentual / 100, 'rateado'::text, empresa_id from rateaveis
) t
group by produto_id, data, origem, empresa_id;
