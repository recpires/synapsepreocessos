#!/usr/bin/env node
/**
 * Gera uma migration com os Markdown de conhecimento da raiz do repositório.
 *
 *   npm run importar-conhecimento
 *
 * Lê comercial/, dev/, marketing/, time-rh/ e financeiro/ e escreve um arquivo
 * em supabase/migrations/. Aplique com `npx supabase db push`.
 *
 * Passa por migration em vez de escrever direto no banco de propósito: assim o
 * conteúdo entra versionado no git, do mesmo jeito que todo o resto do schema,
 * e não depende da service role.
 *
 * Rodar de novo é seguro: o insert usa ON CONFLICT (slug) DO NOTHING, então
 * nada que você já editou pela tela é sobrescrito.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const PAINEL = join(AQUI, '..')
const RAIZ = join(PAINEL, '..')

const AREAS = {
  comercial:  'Comercial',
  dev:        'Desenvolvimento',
  marketing:  'Marketing',
  'time-rh':  'Time e RH',
  financeiro: 'Financeiro',
}

function slugificar(texto) {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Primeiro heading do arquivo, ou o nome do arquivo. */
function tituloDe(md, arquivo) {
  const h1 = md.match(/^#\s+(.+)$/m)
  return h1 ? h1[1].trim() : basename(arquivo, '.md').replace(/-/g, ' ')
}

/** Escapa para dollar-quoting: se o conteúdo tiver o delimitador, troca. */
function delimitadorSeguro(conteudos) {
  for (const tag of ['$md$', '$mdx$', '$doc$', '$k$']) {
    if (!conteudos.some(c => c.includes(tag))) return tag
  }
  throw new Error('Não achei um delimitador livre para o dollar-quoting.')
}

const registros = []

for (const [pasta, area] of Object.entries(AREAS)) {
  const dir = join(RAIZ, pasta)
  if (!existsSync(dir)) continue

  for (const arquivo of readdirSync(dir)) {
    if (!arquivo.endsWith('.md')) continue
    const caminho = join(dir, arquivo)
    const md = readFileSync(caminho, 'utf8').trim()
    if (!md) continue

    registros.push({
      area,
      titulo: tituloDe(md, arquivo),
      slug: slugificar(`${pasta}-${basename(arquivo, '.md')}`),
      conteudo: md,
      origem: `${pasta}/${arquivo}`,
    })
  }
}

if (registros.length === 0) {
  console.error('Nenhum .md encontrado nas pastas de conhecimento.')
  process.exit(1)
}

const d = delimitadorSeguro(registros.map(r => r.conteudo))
const aspas = s => "'" + s.replace(/'/g, "''") + "'"

const linhas = registros.map(r =>
  `  (${aspas(r.area)}, ${aspas(r.titulo)}, ${aspas(r.slug)}, ${d}${r.conteudo}${d}, ${aspas(r.origem)})`
)

const sql = `-- Conhecimento importado dos Markdown da raiz do repositório.
-- Gerado por scripts/importar-conhecimento.mjs — não edite à mão.
--
-- ON CONFLICT DO NOTHING: rodar de novo não sobrescreve o que já foi editado
-- pela tela.

insert into public.conhecimento (area, titulo, slug, conteudo_md, origem) values
${linhas.join(',\n')}
on conflict (slug) do nothing;
`

const carimbo = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const destino = join(PAINEL, 'supabase', 'migrations', `${carimbo}_conhecimento_importado.sql`)
mkdirSync(dirname(destino), { recursive: true })
writeFileSync(destino, sql)

console.log(`${registros.length} documento(s):`)
for (const r of registros) {
  console.log(`  ${r.area.padEnd(16)} ${r.origem.padEnd(46)} ${r.conteudo.length} chars`)
}
console.log(`\nMigration gerada: supabase/migrations/${basename(destino)}`)
console.log('Aplique com: npx supabase db push')
