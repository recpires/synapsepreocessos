/**
 * Filtro de empresa aplicado a uma query do PostgREST.
 *
 * Todo módulo financeiro passou a aceitar `empresaId` opcional. Sem ele a
 * consulta segue consolidada, que é o comportamento de antes desta fase e o
 * padrão de quem tem um CNPJ só. Com ele, corta.
 *
 * Existe como helper e não repetido em cada `if` porque são mais de vinte
 * pontos de consulta: um lugar esquecido vira número que mistura empresas sem
 * dizer, e é o tipo de erro que ninguém percebe olhando a tela.
 *
 * `Q` fica sem restrição de propósito: amarrá-la a `{ eq(...): Q }` faz o
 * compilador tentar expandir os tipos recursivos do PostgREST e estourar em
 * "type instantiation is excessively deep". A forma é conferida na asserção
 * de dentro, que é o único ponto onde ela importa.
 */
export function porEmpresa<Q>(query: Q, empresaId?: string): Q {
  if (!empresaId) return query
  return (query as { eq(coluna: string, valor: string): Q }).eq('empresa_id', empresaId)
}
