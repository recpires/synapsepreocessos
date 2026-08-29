-- Passo 1 de 2 · Copia para `documentos` os registros que nunca foram contratos.
--
-- `contratos` virou gaveta dos papéis da própria Synapse: Cartão CNPJ, Contrato
-- Social, Consulta Optante, Código de Acesso, QSA, Termo de Deferimento e o
-- D-U-N-S. Nenhum é acordo com terceiro. O único contrato real da tabela é a
-- Parceria Eduardo Müller, que fica onde está.
--
-- O `arquivo_url` é mantido como está: os PDFs continuam no bucket
-- contratos-arquivos e os links seguem funcionando. Mover blob entre buckets
-- quebraria as URLs sem ganho nenhum.
--
-- A exclusão em contratos é o passo 2, só depois de conferir esta cópia.

insert into public.documentos
  (nome, descricao, categoria, arquivo_url, arquivo_nome, empresa_id, created_by)
select
  c.cliente,
  nullif(c.observacao, ''),
  case c.cliente
    when 'D-U-N-S' then 'Certificações'
    else 'Societário'
  end,
  c.arquivo_url,
  c.arquivo_nome,
  (select id from public.empresas where tipo = 'propria' limit 1),
  'migracao-fase02'
from public.contratos c
where c.cliente in (
  'Cartão CNPJ', 'Código de Acesso', 'Consulta Optante', 'Contrato Social',
  'D-U-N-S', 'QSA e Capital Social', 'Termo de Deferimento'
)
and not exists (
  select 1 from public.documentos d
  where d.nome = c.cliente and d.created_by = 'migracao-fase02'
);
