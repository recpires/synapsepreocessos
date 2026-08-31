'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { gerarParcelas } from '@/types/empresa-financeiro'
import { fatiaNoPeriodo, variouNoPeriodo, type Vigencia } from '@/lib/participacao'
import type {
  EmpresaPropria, PosicaoEmpresa, UsoDoTeto, Socio,
  NotaFiscal, Divida, DividaResumo, Parcela,
  RegimeTributario, TipoDivida,
} from '@/types/empresa-financeiro'

/**
 * Financeiro por empresa própria.
 *
 * A Synapse deixou de ser uma entidade só: cada CNPJ tem seu faturamento, seu
 * teto de regime, suas dívidas e seu resultado. Este módulo é a camada de
 * dados dessa dimensão. Como em `server/projetos.ts`, cada função começa com
 * `assertMembro()` — o middleware não protege Server Action chamada direto.
 */

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

function falha(contexto: string, e: unknown): { error: string } {
  return { error: `${contexto}: ${e instanceof Error ? e.message : String(e)}` }
}

const n = (v: unknown) => Number(v ?? 0)
const centavos = (v: number) => Math.round(v * 100) / 100

/** Primeiro dia do ano corrente. O recorte padrão de todas as somas da ficha. */
function inicioDoAno(): string {
  return `${new Date().getUTCFullYear()}-01-01`
}

/**
 * Fim da janela: hoje, não 31 de dezembro.
 *
 * `despesas` e `receitas` guardam também o que o cron já gerou para as
 * recorrências — no dia em que os 228 lançamentos foram atribuídos, R$ 59.702,92
 * dos R$ 92.687,51 eram parcelas futuras, algumas de 2027. Somar o ano inteiro
 * transforma a posição da empresa numa projeção disfarçada de fato, que foi o
 * mesmo erro já corrigido no DRE.
 */
function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Empresas ────────────────────────────────────────────────────────────────

export async function listarEmpresasProprias(): Promise<Resultado<EmpresaPropria[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('empresas')
      .select('id, razao_social, nome_fantasia, cnpj, regime_tributario, teto_faturamento, abertura, ativa')
      .eq('tipo', 'propria')
      .order('razao_social')
    if (error) return { error: `empresas próprias: ${error.message}` }
    return {
      data: (data ?? []).map(e => ({
        ...e,
        teto_faturamento: e.teto_faturamento === null ? null : n(e.teto_faturamento),
      })) as EmpresaPropria[],
    }
  } catch (e) {
    return falha('listarEmpresasProprias', e)
  }
}

/**
 * Posição de cada empresa própria no ano corrente.
 *
 * Faturado vem da NF, recebido da receita: são coisas diferentes, e é
 * justamente a distância entre as duas que mostra o que foi vendido e ainda
 * não caiu. Somar tudo numa linha só apagaria isso.
 */
export async function listarPosicoes(): Promise<Resultado<PosicaoEmpresa[]>> {
  try {
    // O membro da sessão é quem define de quem é a "sua parte" — a tela não
    // precisa mandar id, e ninguém consegue pedir a fatia de outro.
    const eu = await assertMembro()
    const sb = await createClient()
    const desde = inicioDoAno()
    const ate = hojeISO()

    const [
      { data: empresas, error: e1 }, { data: tetos },
      { data: notas }, { data: receitas }, { data: despesas }, { data: dividas },
      { data: socios }, { data: declarado },
    ] = await Promise.all([
      sb.from('empresas')
        .select('id, razao_social, nome_fantasia, cnpj, regime_tributario, teto_faturamento, abertura, ativa')
        .eq('tipo', 'propria').order('razao_social'),
      sb.from('teto_faturamento').select('*'),
      sb.from('notas_fiscais').select('empresa_id, valor_servicos, status')
        .gte('competencia', desde).lte('competencia', ate).eq('status', 'emitida'),
      sb.from('receitas').select('empresa_id, valor, status, data')
        .gte('data', desde).lte('data', ate).eq('confirmado', true),
      // Realizado exige confirmação: previsão vencida fica na fila, não no
      // resultado.
      sb.from('despesas').select('empresa_id, valor, data')
        .gte('data', desde).lte('data', ate).eq('confirmado', true),
      sb.from('dividas_resumo').select('empresa_id, saldo_devedor, parcelas_atrasadas, status'),
      // Inclusive quem já saiu: a fatia é calculada por data, e ignorar o
      // histórico faria o período anterior à saída sumir da conta.
      sb.from('socios')
        .select('empresa_id, membro_id, participacao_pct, entrada, saida')
        .eq('membro_id', eu.id),
      sb.from('participacao_declarada').select('empresa_id, declarado_pct'),
    ])
    if (e1) return { error: `empresas: ${e1.message}` }

    const somar = <T,>(linhas: T[] | null, chave: (t: T) => string | null, valor: (t: T) => number) => {
      const m = new Map<string, number>()
      for (const l of linhas ?? []) {
        const k = chave(l)
        if (k) m.set(k, (m.get(k) ?? 0) + valor(l))
      }
      return m
    }

    const porNF = somar(notas, r => r.empresa_id, r => n(r.valor_servicos))
    const porReceita = somar(
      (receitas ?? []).filter(r => r.status === 'recebido' || r.status === 'confirmado'),
      r => r.empresa_id, r => n(r.valor)
    )
    const porDespesa = somar(despesas, r => r.empresa_id, r => n(r.valor))
    const ativas = (dividas ?? []).filter(d => d.status === 'ativa')
    const porDivida = somar(ativas, r => r.empresa_id, r => n(r.saldo_devedor))
    const porAtraso = somar(ativas, r => r.empresa_id, r => n(r.parcelas_atrasadas))
    const contagemNF = somar(notas, r => r.empresa_id, () => 1)
    const tetoPorEmpresa = new Map((tetos ?? []).map(t => [t.empresa_id as string, t]))
    // Vigências minhas, por empresa. Podem ser várias na mesma: quem saiu e
    // voltou, ou teve a fatia alterada, tem uma linha por período.
    const minhasVigencias = new Map<string, Vigencia[]>()
    for (const x of socios ?? []) {
      const chave = x.empresa_id as string
      const atual = minhasVigencias.get(chave) ?? []
      atual.push({
        participacao_pct: n(x.participacao_pct),
        entrada: x.entrada as string | null,
        saida: x.saida as string | null,
      })
      minhasVigencias.set(chave, atual)
    }

    // Movimentos com sinal, para a fatia sair de uma soma só.
    const movimentosPorEmpresa = new Map<string, { data: string; valor: number }[]>()
    const empilhar = (id: string | null, data: string, valor: number) => {
      if (!id) return
      const atual = movimentosPorEmpresa.get(id) ?? []
      atual.push({ data, valor })
      movimentosPorEmpresa.set(id, atual)
    }
    for (const r of receitas ?? []) {
      if (r.status === 'recebido' || r.status === 'confirmado') {
        empilhar(r.empresa_id, r.data as string, n(r.valor))
      }
    }
    for (const d of despesas ?? []) empilhar(d.empresa_id, d.data as string, -n(d.valor))
    const declaradoPorEmpresa = new Map(
      (declarado ?? []).map(d => [d.empresa_id as string, n(d.declarado_pct)])
    )

    const data: PosicaoEmpresa[] = (empresas ?? []).map(e => {
      const recebido = centavos(porReceita.get(e.id) ?? 0)
      const gasto = centavos(porDespesa.get(e.id) ?? 0)
      const t = tetoPorEmpresa.get(e.id)
      const vigencias = minhasVigencias.get(e.id)
      const pctHoje = vigencias
        ? vigencias.find(v => v.saida === null)?.participacao_pct ?? 0
        : 0
      return {
        empresa: {
          ...e,
          teto_faturamento: e.teto_faturamento === null ? null : n(e.teto_faturamento),
        } as EmpresaPropria,
        teto: t
          ? {
              ...t,
              teto_faturamento: t.teto_faturamento === null ? null : n(t.teto_faturamento),
              faturado_12m: n(t.faturado_12m),
              uso_pct: t.uso_pct === null ? null : n(t.uso_pct),
            } as UsoDoTeto
          : null,
        faturadoAno: centavos(porNF.get(e.id) ?? 0),
        recebidoAno: recebido,
        despesaAno: gasto,
        resultadoAno: centavos(recebido - gasto),
        saldoDevedor: centavos(porDivida.get(e.id) ?? 0),
        parcelasAtrasadas: porAtraso.get(e.id) ?? 0,
        notas: contagemNF.get(e.id) ?? 0,
        // A porcentagem exibida é a de hoje; a fatia em reais é ponderada
        // pela vigência de cada lançamento. Quando as duas divergem porque a
        // sociedade mudou no período, `participacaoVariou` avisa — senão o
        // usuário confere na calculadora e conclui que a conta está errada.
        minhaParticipacaoPct: vigencias ? pctHoje : null,
        minhaParte: vigencias
          ? fatiaNoPeriodo(vigencias, movimentosPorEmpresa.get(e.id) ?? [])
          : null,
        participacaoVariou: vigencias ? variouNoPeriodo(vigencias, desde, ate) : false,
        declaradoPct: declaradoPorEmpresa.get(e.id) ?? 0,
      }
    })

    return { data }
  } catch (e) {
    return falha('listarPosicoes', e)
  }
}

export async function salvarDadosFiscais(dados: {
  id: string
  regime_tributario: RegimeTributario | null
  teto_faturamento: number | null
  cnpj: string | null
  abertura: string | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    if (dados.teto_faturamento !== null && dados.teto_faturamento < 0) {
      return { ok: false, error: 'Teto não pode ser negativo.' }
    }

    const { error } = await sb.from('empresas').update({
      regime_tributario: dados.regime_tributario,
      teto_faturamento: dados.teto_faturamento,
      cnpj: dados.cnpj?.trim() || null,
      abertura: dados.abertura || null,
      updated_at: new Date().toISOString(),
    }).eq('id', dados.id)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/financeiro/empresas')
    revalidatePath(`/financeiro/empresas/${dados.id}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Sócios ──────────────────────────────────────────────────────────────────

export async function listarSocios(empresaId: string): Promise<Resultado<{
  socios: Socio[]
  membros: { id: string; nome: string }[]
  /** Fatia de cada sócio no resultado do ano, ponderada por vigência. */
  fatias: Record<string, number>
}>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const desde = inicioDoAno()
    const ate = hojeISO()

    const [{ data: socios, error }, { data: membros },
           { data: receitas }, { data: despesas }] = await Promise.all([
      sb.from('socios').select('*').eq('empresa_id', empresaId)
        .order('participacao_pct', { ascending: false }),
      sb.from('membros').select('id, nome').eq('ativo', true).order('nome'),
      sb.from('receitas').select('valor, status, data')
        .eq('empresa_id', empresaId).gte('data', desde).lte('data', ate)
        .eq('confirmado', true),
      sb.from('despesas').select('valor, data')
        .eq('empresa_id', empresaId).gte('data', desde).lte('data', ate)
        .eq('confirmado', true),
    ])
    if (error) return { error: `sócios: ${error.message}` }

    const movimentos = [
      ...(receitas ?? [])
        .filter(r => r.status === 'recebido' || r.status === 'confirmado')
        .map(r => ({ data: r.data as string, valor: n(r.valor) })),
      ...(despesas ?? []).map(d => ({ data: d.data as string, valor: -n(d.valor) })),
    ]

    const lista = (socios ?? []).map(x => ({
      ...x, participacao_pct: n(x.participacao_pct),
    })) as Socio[]

    // Cada sócio é avaliado pela própria vigência: quem entrou em maio não
    // leva o resultado de março, e quem saiu em junho não leva o de agosto.
    const fatias: Record<string, number> = {}
    for (const socio of lista) {
      fatias[socio.id] = fatiaNoPeriodo(
        [{
          participacao_pct: socio.participacao_pct,
          entrada: socio.entrada,
          saida: socio.saida,
        }],
        movimentos
      )
    }

    return {
      data: {
        socios: lista,
        membros: (membros ?? []) as { id: string; nome: string }[],
        fatias,
      },
    }
  } catch (e) {
    return falha('listarSocios', e)
  }
}

export async function salvarSocio(dados: {
  id?: string
  empresa_id: string
  nome: string
  membro_id?: string | null
  participacao_pct: number
  papel?: string | null
  entrada?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    if (!dados.nome.trim()) return { ok: false, error: 'Informe o nome do sócio.' }
    if (!(dados.participacao_pct > 0 && dados.participacao_pct <= 100)) {
      return { ok: false, error: 'Participação precisa ficar entre 0 e 100%.' }
    }

    const linha = {
      empresa_id: dados.empresa_id,
      nome: dados.nome.trim(),
      membro_id: dados.membro_id || null,
      participacao_pct: dados.participacao_pct,
      papel: dados.papel?.trim() || null,
      entrada: dados.entrada || null,
    }

    const { error } = dados.id
      ? await sb.from('socios').update(linha).eq('id', dados.id)
      : await sb.from('socios').insert(linha)

    if (error) {
      // O gatilho do banco é quem garante os 100%; aqui só traduzimos.
      if (/100/.test(error.message)) {
        return { ok: false, error: error.message }
      }
      if (error.code === '23505') {
        return { ok: false, error: 'Este membro já está cadastrado como sócio desta empresa.' }
      }
      return { ok: false, error: error.message }
    }

    revalidatePath('/financeiro/empresas')
    revalidatePath(`/financeiro/empresas/${dados.empresa_id}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Registra a saída do sócio em vez de apagar a linha.
 *
 * Quem era sócio quando o resultado foi apurado importa depois. A conta para
 * de somar porque a view e o gatilho ignoram quem tem `saida`.
 */
export async function encerrarSocio(
  id: string, saida: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('socios').update({ saida }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/financeiro/empresas')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Notas fiscais ───────────────────────────────────────────────────────────

export async function listarNotas(empresaId?: string): Promise<Resultado<NotaFiscal[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    let q = sb.from('notas_fiscais').select('*').order('data_emissao', { ascending: false })
    if (empresaId) q = q.eq('empresa_id', empresaId)
    const { data, error } = await q
    if (error) return { error: `notas: ${error.message}` }
    return {
      data: (data ?? []).map(nf => ({
        ...nf,
        valor_servicos: n(nf.valor_servicos),
        iss: n(nf.iss), irrf: n(nf.irrf), pis: n(nf.pis),
        cofins: n(nf.cofins), csll: n(nf.csll), inss: n(nf.inss),
        valor_liquido: n(nf.valor_liquido),
      })) as NotaFiscal[],
    }
  } catch (e) {
    return falha('listarNotas', e)
  }
}

export async function salvarNota(dados: {
  id?: string
  empresa_id: string
  tomador_id?: string | null
  tomador_nome?: string | null
  numero: string
  serie?: string | null
  tipo: 'servico' | 'produto'
  data_emissao: string
  competencia: string
  valor_servicos: number
  iss?: number; irrf?: number; pis?: number
  cofins?: number; csll?: number; inss?: number
  projeto_id?: string | null
  observacao?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    if (!dados.numero.trim()) return { ok: false, error: 'Informe o número da nota.' }
    if (!(dados.valor_servicos > 0)) return { ok: false, error: 'Valor da nota precisa ser maior que zero.' }

    const ret = {
      iss: dados.iss ?? 0, irrf: dados.irrf ?? 0, pis: dados.pis ?? 0,
      cofins: dados.cofins ?? 0, csll: dados.csll ?? 0, inss: dados.inss ?? 0,
    }
    const totalRetido = Object.values(ret).reduce((a, v) => a + v, 0)
    // Retenção maior que a nota deixaria o líquido negativo, e o banco aceitaria:
    // a coluna é calculada, não validada. O erro precisa aparecer aqui.
    if (totalRetido > dados.valor_servicos) {
      return { ok: false, error: 'A soma das retenções passa do valor da nota.' }
    }

    const linha = {
      empresa_id: dados.empresa_id,
      tomador_id: dados.tomador_id || null,
      tomador_nome: dados.tomador_nome?.trim() || null,
      numero: dados.numero.trim(),
      serie: dados.serie?.trim() || null,
      tipo: dados.tipo,
      data_emissao: dados.data_emissao,
      competencia: dados.competencia,
      valor_servicos: dados.valor_servicos,
      ...ret,
      projeto_id: dados.projeto_id || null,
      observacao: dados.observacao?.trim() || null,
    }

    const { error } = dados.id
      ? await sb.from('notas_fiscais').update(linha).eq('id', dados.id)
      : await sb.from('notas_fiscais').insert({ ...linha, created_by: 'painel' })

    if (error) {
      // A unique é (empresa_id, numero, serie): número repetido no mesmo CNPJ
      // quase sempre é lançamento em duplicidade, não nota nova.
      if (error.code === '23505') {
        return { ok: false, error: `Já existe nota ${dados.numero} nesta empresa e série.` }
      }
      return { ok: false, error: error.message }
    }

    revalidatePath('/financeiro/empresas')
    revalidatePath(`/financeiro/empresas/${dados.empresa_id}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Cancela a nota em vez de apagá-la.
 *
 * Nota cancelada continua existindo para a Receita; some do faturamento — as
 * views filtram `status = 'emitida'` — mas a numeração fica registrada.
 */
export async function cancelarNota(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('notas_fiscais').update({ status: 'cancelada' }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/financeiro/empresas')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Dívidas ─────────────────────────────────────────────────────────────────

export async function listarDividas(empresaId?: string): Promise<Resultado<{
  dividas: DividaResumo[]
  parcelas: Parcela[]
}>> {
  try {
    await assertMembro()
    const sb = await createClient()

    let q = sb.from('dividas_resumo').select('*').order('data_contratacao', { ascending: false })
    if (empresaId) q = q.eq('empresa_id', empresaId)
    const { data: dividas, error } = await q
    if (error) return { error: `dívidas: ${error.message}` }

    const ids = (dividas ?? []).map(d => d.id as string)
    const { data: parcelas } = ids.length
      ? await sb.from('divida_parcelas').select('*').in('divida_id', ids).order('numero')
      : { data: [] }

    return {
      data: {
        dividas: (dividas ?? []).map(d => ({
          ...d,
          valor_principal: n(d.valor_principal),
          valor_total: n(d.valor_total),
          taxa_juros_mes: d.taxa_juros_mes === null ? null : n(d.taxa_juros_mes),
          saldo_devedor: n(d.saldo_devedor),
          total_pago: n(d.total_pago),
        })) as DividaResumo[],
        parcelas: (parcelas ?? []).map(p => ({
          ...p,
          valor: n(p.valor),
          valor_pago: p.valor_pago === null ? null : n(p.valor_pago),
        })) as Parcela[],
      },
    }
  } catch (e) {
    return falha('listarDividas', e)
  }
}

/**
 * Cria a dívida e o carnê inteiro de uma vez.
 *
 * Parcela criada na hora é o que faz a dívida aparecer no fluxo de caixa e na
 * central de vencimentos sem ninguém precisar lembrar de cadastrar mês a mês —
 * que é exatamente o tipo de lembrete que falha.
 */
export async function criarDivida(dados: {
  empresa_id: string
  tipo: TipoDivida
  credor: string
  descricao?: string
  documento?: string
  valor_principal: number
  valor_total: number
  taxa_juros_mes?: number | null
  parcelas_total: number
  data_contratacao: string
  primeiro_vencimento: string
  observacao?: string
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    if (!dados.credor.trim()) return { ok: false, error: 'Informe o credor.' }
    if (!(dados.valor_total > 0)) return { ok: false, error: 'Valor total precisa ser maior que zero.' }
    if (dados.parcelas_total < 1) return { ok: false, error: 'A dívida precisa de ao menos uma parcela.' }
    if (dados.valor_total < dados.valor_principal) {
      return { ok: false, error: 'O total com juros não pode ser menor que o principal.' }
    }

    const { data: divida, error } = await sb.from('dividas').insert({
      empresa_id: dados.empresa_id,
      tipo: dados.tipo,
      credor: dados.credor.trim(),
      descricao: dados.descricao?.trim() || null,
      documento: dados.documento?.trim() || null,
      valor_principal: dados.valor_principal,
      valor_total: dados.valor_total,
      taxa_juros_mes: dados.taxa_juros_mes ?? null,
      parcelas_total: dados.parcelas_total,
      data_contratacao: dados.data_contratacao,
      observacao: dados.observacao?.trim() || null,
      created_by: 'painel',
    }).select('id').single()
    if (error || !divida) return { ok: false, error: error?.message ?? 'Falha ao criar a dívida.' }

    const parcelas = gerarParcelas(
      dados.valor_total, dados.parcelas_total, dados.primeiro_vencimento
    ).map(p => ({ ...p, divida_id: divida.id }))

    const { error: e2 } = await sb.from('divida_parcelas').insert(parcelas)
    if (e2) {
      // Dívida sem carnê é pior que dívida nenhuma: não vence, não cobra, e
      // ainda soma zero de saldo. Desfaz para não deixar o meio-termo gravado.
      await sb.from('dividas').delete().eq('id', divida.id)
      return { ok: false, error: `parcelas: ${e2.message}` }
    }

    revalidatePath('/financeiro/dividas')
    revalidatePath('/vencimentos')
    return { ok: true, id: divida.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Marca a parcela como paga e, opcionalmente, lança a despesa correspondente.
 *
 * A dívida é saldo, a despesa é o dinheiro que saiu — coisas distintas, por
 * isso a dívida nunca entra no DRE. O vínculo `despesa_id` existe para o
 * pagamento não ser lançado duas vezes por engano.
 */
export async function pagarParcela(dados: {
  parcela_id: string
  pago_em: string
  valor_pago: number
  lancar_despesa: boolean
  categoria?: string
  forma_pagamento?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const { data: parcela, error: e1 } = await sb
      .from('divida_parcelas')
      .select('*, dividas(id, credor, tipo, empresa_id, parcelas_total)')
      .eq('id', dados.parcela_id)
      .single()
    if (e1 || !parcela) return { ok: false, error: e1?.message ?? 'Parcela não encontrada.' }
    if (parcela.pago_em) return { ok: false, error: 'Esta parcela já está marcada como paga.' }

    const divida = parcela.dividas as unknown as {
      id: string; credor: string; tipo: string; empresa_id: string; parcelas_total: number
    }

    let despesaId: string | null = null
    if (dados.lancar_despesa) {
      const { data: despesa, error: e2 } = await sb.from('despesas').insert({
        data: dados.pago_em,
        descricao: `${divida.credor} — parcela ${parcela.numero}/${divida.parcelas_total}`,
        categoria: dados.categoria ?? 'Financeiro',
        produto: 'Geral',
        forma_pagamento: dados.forma_pagamento ?? 'Transferência',
        valor: dados.valor_pago,
        tipo: 'pontual',
        recorrente: false,
        empresa_id: divida.empresa_id,
        observacao: `Parcela de dívida (${divida.tipo}).`,
        created_by: 'painel',
      }).select('id').single()
      if (e2) return { ok: false, error: `despesa: ${e2.message}` }
      despesaId = despesa?.id ?? null
    }

    const { error: e3 } = await sb.from('divida_parcelas').update({
      pago_em: dados.pago_em,
      valor_pago: dados.valor_pago,
      despesa_id: despesaId,
    }).eq('id', dados.parcela_id)
    if (e3) {
      // A despesa já entrou; deixá-la órfã inflaria o gasto sem quitar nada.
      if (despesaId) await sb.from('despesas').delete().eq('id', despesaId)
      return { ok: false, error: e3.message }
    }

    // Última parcela paga quita a dívida sozinha: status que depende de alguém
    // lembrar de mudar fica errado justamente quando importa.
    const { count } = await sb
      .from('divida_parcelas')
      .select('id', { count: 'exact', head: true })
      .eq('divida_id', divida.id)
      .is('pago_em', null)
    if (count === 0) {
      await sb.from('dividas').update({ status: 'quitada' }).eq('id', divida.id)
    }

    revalidatePath('/financeiro/dividas')
    revalidatePath('/financeiro')
    revalidatePath('/vencimentos')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function alterarStatusDivida(
  id: string,
  status: Divida['status']
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('dividas').update({ status }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/financeiro/dividas')
    revalidatePath('/vencimentos')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Atribuição de lançamentos existentes ────────────────────────────────────

/** Quanto ainda está sem dono, e desde quando. É o que a tela precisa mostrar. */
export async function contarSemEmpresa(): Promise<Resultado<{
  despesas: number; receitas: number
  valorDespesas: number; valorReceitas: number
  maisAntigo: string | null
}>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: desp, error: e1 }, { data: rec, error: e2 }] = await Promise.all([
      sb.from('despesas').select('data, valor').is('empresa_id', null),
      sb.from('receitas').select('data, valor').is('empresa_id', null),
    ])
    if (e1) return { error: `despesas: ${e1.message}` }
    if (e2) return { error: `receitas: ${e2.message}` }

    const datas = [...(desp ?? []), ...(rec ?? [])].map(l => l.data as string).sort()

    return {
      data: {
        despesas: (desp ?? []).length,
        receitas: (rec ?? []).length,
        valorDespesas: centavos((desp ?? []).reduce((a, d) => a + n(d.valor), 0)),
        valorReceitas: centavos((rec ?? []).reduce((a, r) => a + n(r.valor), 0)),
        maisAntigo: datas[0] ?? null,
      },
    }
  } catch (e) {
    return falha('contarSemEmpresa', e)
  }
}

/**
 * Aponta despesas ou receitas para uma empresa.
 *
 * Os 228 lançamentos anteriores a esta fase nasceram sem empresa, quando só
 * havia uma. Em vez de adivinhar num backfill de migration, a atribuição fica
 * explícita e reversível: você escolhe o que atribuir e vê quantas linhas
 * mudaram.
 */
export async function atribuirEmpresa(dados: {
  tabela: 'despesas' | 'receitas'
  empresa_id: string
  somente_sem_empresa: boolean
  ate?: string
}): Promise<{ ok: boolean; error?: string; linhas?: number }> {
  try {
    await assertMembro()
    const sb = await createClient()

    let q = sb.from(dados.tabela).update({ empresa_id: dados.empresa_id })
    if (dados.somente_sem_empresa) q = q.is('empresa_id', null)
    if (dados.ate) q = q.lte('data', dados.ate)

    const { data, error } = await q.select('id')
    if (error) return { ok: false, error: error.message }

    revalidatePath('/financeiro')
    revalidatePath('/receitas')
    revalidatePath('/financeiro/empresas')
    return { ok: true, linhas: (data ?? []).length }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
