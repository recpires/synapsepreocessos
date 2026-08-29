#!/usr/bin/env node
/**
 * Backup offline do painel — exporta cada tabela para CSV e JSON.
 *
 *   npm run backup                    → grava em ./backups/<AAAA-MM-DD>/
 *   npm run backup -- --out D:/Drive  → grava em outro lugar
 *
 * Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
 * A service role ignora RLS, então o dump sai completo.
 *
 * O script só lê. Nunca escreve no banco.
 */

import { createClient } from '@supabase/supabase-js'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

const TABELAS = [
  'despesas',
  'receitas',
  'contratos',
  'contrato_templates',
  'documentos',
  'pipeline_leads',
  'tarefas',
  'testes_resultados',
  'cron_log',
]

// Lê .env.local sem depender de pacote externo.
function carregarEnv() {
  const caminho = join(process.cwd(), '.env.local')
  if (!existsSync(caminho)) return
  for (const linha of readFileSync(caminho, 'utf8').split('\n')) {
    const limpa = linha.trim()
    if (!limpa || limpa.startsWith('#')) continue
    const igual = limpa.indexOf('=')
    if (igual === -1) continue
    const chave = limpa.slice(0, igual).trim()
    if (process.env[chave]) continue
    process.env[chave] = limpa.slice(igual + 1).trim()
  }
}

function paraCsv(linhas) {
  if (linhas.length === 0) return ''
  const colunas = Object.keys(linhas[0])
  const celula = (v) => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    colunas.join(','),
    ...linhas.map((l) => colunas.map((c) => celula(l[c])).join(',')),
  ].join('\n')
}

// Pagina para não esbarrar no limite de linhas do PostgREST.
async function baixarTudo(sb, tabela) {
  const PAGINA = 1000
  const acc = []
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await sb
      .from(tabela)
      .select('*')
      .range(inicio, inicio + PAGINA - 1)
    if (error) throw new Error(`${tabela}: ${error.message}`)
    acc.push(...data)
    if (data.length < PAGINA) return acc
  }
}

async function main() {
  carregarEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || key.startsWith('PREENCHER')) {
    console.error(
      'Falta SUPABASE_SERVICE_ROLE_KEY no .env.local.\n' +
        'Pegue em: Supabase → Processo Synapse Code → Settings → API → service_role'
    )
    process.exit(1)
  }

  const argOut = process.argv.indexOf('--out')
  const raiz = argOut !== -1 ? process.argv[argOut + 1] : join(process.cwd(), 'backups')
  const dia = new Date().toISOString().slice(0, 10)
  const destino = join(raiz, dia)
  await mkdir(destino, { recursive: true })

  const sb = createClient(url, key, { auth: { persistSession: false } })
  const resumo = []

  for (const tabela of TABELAS) {
    try {
      const linhas = await baixarTudo(sb, tabela)
      await writeFile(join(destino, `${tabela}.json`), JSON.stringify(linhas, null, 2))
      await writeFile(join(destino, `${tabela}.csv`), paraCsv(linhas))
      resumo.push({ tabela, linhas: linhas.length })
      console.log(`  ${tabela.padEnd(20)} ${String(linhas.length).padStart(5)} linhas`)
    } catch (e) {
      console.error(`  ${tabela.padEnd(20)} ERRO: ${e.message}`)
      process.exitCode = 1
    }
  }

  await writeFile(
    join(destino, '_resumo.json'),
    JSON.stringify({ gerado_em: new Date().toISOString(), tabelas: resumo }, null, 2)
  )
  console.log(`\nBackup em ${destino}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
