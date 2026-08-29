-- Fase 05 · Busca global e base de conhecimento.

-- ── Conhecimento ───────────────────────────────────────────────────────────
-- Destino dos 1.809 linhas de Markdown em comercial/, dev/, marketing/ e
-- time-rh/, que hoje só existem para quem abre a pasta.
-- O conteúdo entra por uma migration gerada por scripts/importar-conhecimento.mjs.
create table if not exists public.conhecimento (
  id           uuid primary key default gen_random_uuid(),
  area         text not null,
  titulo       text not null,
  slug         text not null unique,
  conteudo_md  text not null default '',
  tags         text[] not null default '{}',
  origem       text,
  atualizado_por text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_conhecimento_area on public.conhecimento (area, titulo);

alter table public.conhecimento enable row level security;
drop policy if exists conhecimento_membros on public.conhecimento;
create policy conhecimento_membros on public.conhecimento
  for all to authenticated using (public.e_membro()) with check (public.e_membro());

-- ── Busca global ───────────────────────────────────────────────────────────
-- unaccent para "orcamento" achar "orçamento"; sem isso a busca falha em
-- metade das palavras em português.
create extension if not exists unaccent;

create or replace function public.buscar(termo text)
returns table (
  tipo    text,
  id      uuid,
  titulo  text,
  detalhe text,
  link    text,
  peso    int
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.unaccent(lower(trim(termo))) as t)
  select * from (
    select 'Empresa', e.id, e.razao_social,
           coalesce(e.nome_fantasia || ' · ', '') || coalesce(e.segmento, e.tipo::text),
           '/empresas/' || e.id, 1
    from public.empresas e, q
    where public.unaccent(lower(
      coalesce(e.razao_social,'') || ' ' || coalesce(e.nome_fantasia,'') ||
      ' ' || coalesce(e.cnpj,'') || ' ' || coalesce(e.segmento,'')
    )) like '%' || q.t || '%'

    union all
    select 'Projeto', p.id, p.nome,
           p.fase_atual::text || ' · ' || p.maturidade_pct::text || '%',
           '/projetos/' || p.id, 2
    from public.projetos p, q
    where not p.arquivado
      and public.unaccent(lower(coalesce(p.nome,'') || ' ' || coalesce(p.observacao,'')))
          like '%' || q.t || '%'

    union all
    select 'Proposta', pr.id, pr.titulo, pr.numero || ' · ' || pr.status::text,
           '/comercial/propostas/' || pr.id, 3
    from public.propostas pr, q
    where public.unaccent(lower(
      coalesce(pr.titulo,'') || ' ' || coalesce(pr.numero,'') || ' ' || coalesce(pr.contexto,'')
    )) like '%' || q.t || '%'

    union all
    select 'Contrato', c.id, c.cliente, c.tipo || ' · ' || c.status,
           '/contratos', 4
    from public.contratos c, q
    where public.unaccent(lower(coalesce(c.cliente,'') || ' ' || coalesce(c.tipo,'')))
          like '%' || q.t || '%'

    union all
    select 'Documento', d.id, d.nome, d.categoria, '/documentos', 5
    from public.documentos d, q
    where public.unaccent(lower(coalesce(d.nome,'') || ' ' || coalesce(d.descricao,'')))
          like '%' || q.t || '%'

    union all
    select 'Site', s.id, s.nome, coalesce(s.dominio, s.status), '/sites', 6
    from public.sites s, q
    where public.unaccent(lower(coalesce(s.nome,'') || ' ' || coalesce(s.dominio,'')))
          like '%' || q.t || '%'

    union all
    select 'Erro', er.id, er.codigo || ' — ' || er.titulo,
           er.severidade::text || ' · ' || er.status::text,
           '/projetos/' || er.projeto_id, 7
    from public.projeto_erros er, q
    where public.unaccent(lower(coalesce(er.titulo,'') || ' ' || coalesce(er.codigo,'')))
          like '%' || q.t || '%'

    union all
    select 'Conhecimento', k.id, k.titulo, k.area, '/conhecimento/' || k.slug, 8
    from public.conhecimento k, q
    where public.unaccent(lower(
      coalesce(k.titulo,'') || ' ' || coalesce(k.conteudo_md,'')
    )) like '%' || q.t || '%'
  ) r(tipo, id, titulo, detalhe, link, peso)
  order by peso, titulo
  limit 40;
$$;

-- SECURITY INVOKER de propósito: a busca roda com as permissões de quem
-- chama, então a RLS de cada tabela continua valendo. Um não-membro não
-- enxerga nada por aqui.
revoke execute on function public.buscar(text) from anon, public;
grant execute on function public.buscar(text) to authenticated;
