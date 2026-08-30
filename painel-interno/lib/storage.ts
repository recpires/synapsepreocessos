/**
 * Onde um arquivo mora, a partir do que está gravado no banco.
 *
 * Fica em `lib/` e não em `server/arquivos.ts` porque um arquivo `'use server'`
 * só pode exportar função async — e esta precisa ser testável direto, já que é
 * ela que decide se um contrato social abre ou devolve erro.
 */

/** Buckets que o painel serve. Nome fora desta lista não é aceito. */
export const BUCKETS = [
  'contratos-arquivos', 'documentos-files', 'financeiro-anexos',
] as const

export type Bucket = (typeof BUCKETS)[number]

export type Local = { bucket: string; path: string }

/**
 * O bucket vem do próprio valor quando ele é uma URL, e não do que a tela
 * declarou: `documentos` mistura os dois buckets — sete arquivos societários,
 * incluindo o contrato social, foram enviados para `contratos-arquivos`. Uma
 * tela que fixasse o bucket erraria exatamente neles.
 *
 * Caminho puro usa o bucket declarado, que é o caso dos envios novos.
 */
export function localizar(bucketDeclarado: string, valor: string): Local | null {
  const bruto = (valor ?? '').trim()
  if (!bruto) return null

  if (bruto.startsWith('http')) {
    for (const b of BUCKETS) {
      const marcador = `/object/public/${b}/`
      const i = bruto.indexOf(marcador)
      if (i !== -1) {
        const path = decodeURIComponent(bruto.slice(i + marcador.length))
        return path ? { bucket: b, path } : null
      }
    }
    // URL que não aponta para bucket conhecido não vira link assinado: seria
    // assinar o que não é nosso.
    return null
  }

  if (!(BUCKETS as readonly string[]).includes(bucketDeclarado)) return null
  const path = bruto.replace(/^\/+/, '')
  return path ? { bucket: bucketDeclarado, path } : null
}
