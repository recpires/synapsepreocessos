-- `arquivo_url` guardava a URL pública inteira, o que só fazia sentido
-- enquanto os buckets eram públicos — e eram: o contrato social registrado na
-- JUCESP e o cartão CNPJ podiam ser baixados por qualquer um com o link, sem
-- autenticação. Agora o acesso é por URL assinada de dois minutos, gerada só
-- para quem está na allowlist.
--
-- A coluna passa a guardar o caminho dentro do bucket. O leitor aceita as duas
-- formas, então esta conversão é para o dado parar de anunciar um acesso
-- público que não existe mais.
--
-- Só converte o que aponta para o bucket correspondente à tabela. As linhas de
-- `documentos` que vivem em `contratos-arquivos` — sete arquivos societários —
-- ficam como URL de propósito: sem uma coluna de bucket, o caminho puro
-- perderia a informação de onde o arquivo está.

update public.contratos
   set arquivo_url = split_part(arquivo_url, '/object/public/contratos-arquivos/', 2)
 where arquivo_url like '%/object/public/contratos-arquivos/%';

update public.documentos
   set arquivo_url = split_part(arquivo_url, '/object/public/documentos-files/', 2)
 where arquivo_url like '%/object/public/documentos-files/%';
