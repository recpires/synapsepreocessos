import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { localizar, BUCKETS } from '../lib/storage.ts'

/**
 * Resolução de bucket e caminho.
 *
 * É esta função que decide se um contrato social abre. Errar para o lado
 * permissivo assinaria URL de origem desconhecida; errar para o restritivo
 * deixa o documento inacessível sem dizer por quê.
 */

const URL_BASE = 'https://bdfgmgxajzyjtunetnuw.supabase.co/storage/v1/object/public'

describe('localizar', () => {
  test('caminho puro usa o bucket declarado', () => {
    assert.deepEqual(localizar('documentos-files', 'empresa/abc.pdf'), {
      bucket: 'documentos-files',
      path: 'empresa/abc.pdf',
    })
  })

  test('URL manda no bucket, não o que a tela declarou', () => {
    // Os sete arquivos societários vivem em contratos-arquivos apesar de
    // estarem cadastrados como documento.
    const r = localizar('documentos-files', `${URL_BASE}/contratos-arquivos/empresa/x.pdf`)
    assert.deepEqual(r, { bucket: 'contratos-arquivos', path: 'empresa/x.pdf' })
  })

  test('decodifica caminho com espaço ou acento', () => {
    const r = localizar('x', `${URL_BASE}/documentos-files/pasta/Contrato%20Social.pdf`)
    assert.deepEqual(r, { bucket: 'documentos-files', path: 'pasta/Contrato Social.pdf' })
  })

  test('URL de host desconhecido não vira link assinado', () => {
    assert.equal(localizar('documentos-files', 'https://exemplo.com/qualquer.pdf'), null)
  })

  test('URL de bucket fora da lista é recusada', () => {
    assert.equal(localizar('documentos-files', `${URL_BASE}/outro-bucket/x.pdf`), null)
  })

  test('bucket declarado inválido é recusado', () => {
    assert.equal(localizar('inventado', 'empresa/x.pdf'), null)
  })

  test('valor vazio é recusado', () => {
    assert.equal(localizar('documentos-files', ''), null)
    assert.equal(localizar('documentos-files', '   '), null)
  })

  test('barra sobrando no começo não vira caminho vazio nem duplicado', () => {
    assert.deepEqual(localizar('documentos-files', '/empresa/x.pdf'), {
      bucket: 'documentos-files',
      path: 'empresa/x.pdf',
    })
    assert.equal(localizar('documentos-files', '///'), null)
  })

  test('URL sem caminho depois do bucket é recusada', () => {
    assert.equal(localizar('x', `${URL_BASE}/documentos-files/`), null)
  })
})

describe('BUCKETS', () => {
  test('cobre os três buckets do projeto', () => {
    assert.deepEqual([...BUCKETS].sort(), [
      'contratos-arquivos', 'documentos-files', 'financeiro-anexos',
    ])
  })
})
