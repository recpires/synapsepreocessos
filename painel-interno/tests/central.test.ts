import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  separarPorHorario, porFaixaDeHora, resumoDoDia, rotuloDoDia, somarDias,
  HORA_INICIO, HORA_FIM, type Tarefa,
} from '../types/central.ts'
import { ehDonoDaCentral, DONO_DA_CENTRAL } from '../lib/central-acesso.ts'

/**
 * Central pessoal.
 *
 * Duas coisas podem falhar em silêncio aqui: um compromisso não aparecer na
 * linha do tempo (some do dia sem avisar) e a área pessoal abrir para outra
 * pessoa. As duas são testadas.
 */

const t = (over: Partial<Tarefa> = {}): Tarefa => ({
  id: over.id ?? 'x',
  titulo: 'Reunião com Wilian',
  frente: 'synapse',
  tipo: 'tarefa',
  data: '2026-09-03',
  hora: null,
  feito: false,
  nota: '',
  ...over,
})

describe('separação por horário', () => {
  test('quem não tem hora fica fora da linha do tempo', () => {
    const { comHora, semHora } = separarPorHorario([
      t({ id: 'a', hora: '09:00' }), t({ id: 'b', hora: null }),
    ])
    assert.deepEqual(comHora.map(x => x.id), ['a'])
    assert.deepEqual(semHora.map(x => x.id), ['b'])
  })

  test('as com hora saem ordenadas', () => {
    const { comHora } = separarPorHorario([
      t({ id: 'tarde', hora: '18:30' }), t({ id: 'cedo', hora: '07:15' }),
    ])
    assert.deepEqual(comHora.map(x => x.id), ['cedo', 'tarde'])
  })
})

describe('faixas da linha do tempo', () => {
  test('cai na faixa da própria hora', () => {
    const f = porFaixaDeHora([t({ id: 'a', hora: '14:45' })])
    assert.deepEqual(f.get(14)?.map(x => x.id), ['a'])
  })

  test('duas no mesmo horário convivem na faixa', () => {
    const f = porFaixaDeHora([t({ id: 'a', hora: '09:00' }), t({ id: 'b', hora: '09:50' })])
    assert.equal(f.get(9)?.length, 2)
  })

  test('compromisso antes do expediente encosta na borda, não some', () => {
    // Sumir da tela é o pior desfecho: o dia parece livre e não está.
    const f = porFaixaDeHora([t({ id: 'madrugada', hora: '04:30' })])
    assert.deepEqual(f.get(HORA_INICIO)?.map(x => x.id), ['madrugada'])
  })

  test('compromisso depois do expediente também encosta', () => {
    const f = porFaixaDeHora([t({ id: 'noite', hora: '23:59' })])
    assert.deepEqual(f.get(HORA_FIM)?.map(x => x.id), ['noite'])
  })

  test('tarefa sem hora não entra em faixa nenhuma', () => {
    assert.equal(porFaixaDeHora([t({ hora: null })]).size, 0)
  })
})

describe('resumo do dia', () => {
  test('conta total, reuniões e feitas', () => {
    const r = resumoDoDia([
      t({ tipo: 'reuniao', feito: true }), t({ tipo: 'reuniao' }), t({ feito: true }), t(),
    ])
    assert.deepEqual(r, { total: 4, reunioes: 2, feitas: 2 })
  })

  test('dia vazio não divide por zero nem inventa número', () => {
    assert.deepEqual(resumoDoDia([]), { total: 0, reunioes: 0, feitas: 0 })
  })
})

describe('rótulo do dia', () => {
  const hoje = '2026-09-03'
  test('hoje, amanhã e ontem ganham nome', () => {
    assert.ok(rotuloDoDia('2026-09-03', hoje).startsWith('Hoje ·'))
    assert.ok(rotuloDoDia('2026-09-04', hoje).startsWith('Amanhã ·'))
    assert.ok(rotuloDoDia('2026-09-02', hoje).startsWith('Ontem ·'))
  })
  test('data distante fica só com a data', () => {
    const r = rotuloDoDia('2026-12-25', hoje)
    assert.ok(!r.includes('·'), r)
  })
})

describe('somar dias', () => {
  test('atravessa a virada do mês', () => {
    assert.equal(somarDias('2026-08-31', 1), '2026-09-01')
  })
  test('atravessa a virada do ano para trás', () => {
    assert.equal(somarDias('2027-01-01', -1), '2026-12-31')
  })
  test('não escorrega um dia por fuso', () => {
    // `new Date('2026-09-03')` sem hora é UTC e volta 02/09 no Brasil.
    assert.equal(somarDias('2026-09-03', 0), '2026-09-03')
  })
})

describe('quem entra na Central', () => {
  test('o dono entra', () => {
    assert.ok(ehDonoDaCentral(DONO_DA_CENTRAL))
  })
  test('maiúscula e espaço não trancam o dono para fora', () => {
    assert.ok(ehDonoDaCentral('  Rec.Pires7@Gmail.com  '))
  })
  test('outro membro não entra', () => {
    assert.ok(!ehDonoDaCentral('contato.synapsecode@gmail.com'))
    assert.ok(!ehDonoDaCentral('wilian@synapsecode.com.br'))
  })
  test('sem sessão não entra', () => {
    assert.ok(!ehDonoDaCentral(null))
    assert.ok(!ehDonoDaCentral(undefined))
    assert.ok(!ehDonoDaCentral(''))
  })
  test('e-mail parecido não passa', () => {
    assert.ok(!ehDonoDaCentral('rec.pires7@gmail.com.br'))
    assert.ok(!ehDonoDaCentral('xrec.pires7@gmail.com'))
  })
})
