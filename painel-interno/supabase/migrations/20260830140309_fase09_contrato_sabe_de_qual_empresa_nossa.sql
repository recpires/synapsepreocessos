-- `contratos.empresa_id` sempre foi a contraparte — o cliente ou o fornecedor.
-- Faltava dizer qual CNPJ *nosso* responde pelo contrato, e por isso a central
-- de vencimentos precisou anular a coluna para a fonte 'contrato': sem saber de
-- quem é, um contrato filtrado por empresa própria sumiria de todos os recortes.
--
-- Com `empresa_propria_id`, contrato passa a poder ser recortado como despesa e
-- receita já são. Fica nulo enquanto ninguém atribuir, e nesse caso continua
-- aparecendo em todo recorte — vencimento que some é pior que vencimento sem
-- dono.
alter table public.contratos
  add column if not exists empresa_propria_id uuid references public.empresas(id) on delete set null;

create index if not exists idx_contratos_empresa_propria
  on public.contratos (empresa_propria_id);

-- A view volta a atribuir contrato, agora pela coluna certa.
create or replace view public.vencimentos as
with tudo as (
  select 'contrato'::text as origem, c.id as entidade_id,
         coalesce(e.razao_social, c.cliente) as titulo,
         c.tipo as detalhe, c.data_vencimento as vence_em,
         c.valor, '/contratos'::text as link,
         c.empresa_propria_id as empresa_id
  from public.contratos c
  left join public.empresas e on e.id = c.empresa_id
  where c.data_vencimento is not null and c.status <> 'encerrado'

  union all
  select 'dominio', s.id, s.nome, coalesce(s.registrar, 'Registrador não informado'),
         s.dominio_expira, null, '/sites', null::uuid
  from public.sites s
  where s.dominio_expira is not null and s.status <> 'encerrado'

  union all
  select 'ssl', s.id, s.nome, coalesce(s.hospedagem, 'Hospedagem não informada'),
         s.ssl_expira, null, '/sites', null::uuid
  from public.sites s
  where s.ssl_expira is not null and s.status <> 'encerrado'

  union all
  select 'imposto', i.id, i.tipo,
         'competência ' || to_char(i.competencia, 'MM/YYYY'),
         i.vencimento, i.valor, '/financeiro/caixa', i.empresa_id
  from public.impostos i
  where i.pago_em is null

  union all
  select 'proposta', p.id, p.titulo, 'proposta ' || p.numero,
         p.validade, p.valor_total, '/comercial/propostas', null::uuid
  from public.propostas p
  where p.validade is not null
    and p.status in ('rascunho','enviada','em_negociacao')

  union all
  select 'projeto', pr.id, pr.nome, 'prazo do projeto',
         pr.prazo, pr.valor_contratado, '/projetos', null::uuid
  from public.projetos pr
  where pr.prazo is not null and not pr.arquivado
    and pr.fase_atual not in ('operacao','encerrado')

  union all
  select 'divida', p.id,
         d.credor || ' — parcela ' || p.numero || '/' || d.parcelas_total,
         coalesce(d.descricao, d.tipo),
         p.vencimento, p.valor, '/financeiro/dividas', d.empresa_id
  from public.divida_parcelas p
  join public.dividas d on d.id = p.divida_id
  where p.pago_em is null and d.status = 'ativa'
)
select t.origem, t.entidade_id, t.titulo, t.detalhe, t.vence_em, t.valor, t.link,
       (t.vence_em - current_date) as dias,
       case
         when t.vence_em < current_date then 'vencido'
         when t.vence_em <= current_date + 7  then 'critico'
         when t.vence_em <= current_date + 30 then 'atencao'
         else 'ok'
       end as severidade,
       (s.id is not null
        and (s.silenciado_ate is null or s.silenciado_ate >= current_date)) as silenciado,
       t.empresa_id
from tudo t
left join public.alertas_silenciados s
  on s.origem = t.origem and s.entidade_id = t.entidade_id;
