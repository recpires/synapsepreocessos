'use server'

import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { localizar } from '@/lib/storage'

/**
 * Acesso a arquivo guardado no storage.
 *
 * Os buckets `contratos-arquivos` e `documentos-files` nasceram públicos: o
 * contrato social registrado na JUCESP, o cartão CNPJ e os contratos assinados
 * com clientes eram legíveis por qualquer um que tivesse a URL — e URL vaza
 * fácil, por histórico, link copiado, print. Baixei um deles com `curl`, sem
 * autenticação nenhuma, e foi assim que o problema apareceu.
 *
 * Agora todo arquivo é servido por URL assinada de vida curta, gerada só para
 * quem está na allowlist de membros. A resolução de bucket e caminho mora em
 * `lib/storage.ts`: arquivo `'use server'` só exporta função async, e aquela
 * lógica precisa ser testável direto.
 */

/**
 * Devolve uma URL temporária para o arquivo.
 *
 * Dois minutos bastam para abrir numa aba nova e não bastam para virar link
 * compartilhável — que é justamente o que se quer evitar aqui.
 */
export async function abrirArquivo(
  bucket: string,
  urlOuCaminho: string
): Promise<{ url: string; error?: undefined } | { url?: undefined; error: string }> {
  try {
    await assertMembro()

    const alvo = localizar(bucket, urlOuCaminho)
    if (!alvo) return { error: 'Arquivo em local desconhecido.' }

    const sb = await createClient()
    const { data, error } = await sb.storage
      .from(alvo.bucket)
      .createSignedUrl(alvo.path, 120)
    if (error || !data?.signedUrl) {
      return { error: error?.message ?? 'Não foi possível gerar o link.' }
    }
    return { url: data.signedUrl }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
