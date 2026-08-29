-- Passo 2 de 2 · Remove de `contratos` só o que já foi copiado.
-- A cláusula EXISTS é a trava: se a cópia não existir, a linha não sai.
-- Snapshot de segurança em backups.contratos_20260828.

delete from public.contratos c
where c.cliente in (
  'Cartão CNPJ', 'Código de Acesso', 'Consulta Optante', 'Contrato Social',
  'D-U-N-S', 'QSA e Capital Social', 'Termo de Deferimento'
)
and exists (
  select 1 from public.documentos d
  where d.nome = c.cliente
    and d.created_by = 'migracao-fase02'
    and d.arquivo_url is not distinct from c.arquivo_url
);

-- ── Eduardo Müller: o único contrato de verdade ganha empresa e projeto ────
insert into public.empresas (tipo, razao_social, nome_fantasia, segmento, responsavel)
select 'parceiro', 'Eduardo Müller', 'Eduardo Müller', 'Marketing / Parceria', 'Rodrigo'
where not exists (select 1 from public.empresas where razao_social = 'Eduardo Müller');

update public.contratos
set empresa_id = (select id from public.empresas where razao_social = 'Eduardo Müller'),
    projeto_id = (select id from public.projetos where nome = 'Nero Barber'),
    lado = 'cliente'
where cliente = 'Parceria Eduardo Müller';
