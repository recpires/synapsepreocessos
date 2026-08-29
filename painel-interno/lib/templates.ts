/**
 * Renderizador de templates de contrato.
 *
 * Os templates saíram do código e foram para a tabela `contrato_templates`.
 * O HTML usa placeholders `{{chave}}`, com filtros opcionais:
 *
 *   {{cliente_nome}}          texto simples
 *   {{valor_total|moeda}}     1234.5  →  1.234,50
 *   {{data_inicio|data}}      2026-08-28  →  28/08/2026
 *   {{_hoje}}                 data de emissão
 *
 * Todo valor é escapado antes de entrar no HTML: nome de cliente com "<"
 * não pode virar tag.
 */

export type TipoCampo = 'text' | 'number' | 'date' | 'textarea' | 'select'

export type CampoTemplate = {
  key: string
  label: string
  tipo: TipoCampo
  opcoes?: string[]
  placeholder?: string
}

export type TemplateContrato = {
  id: string
  nome: string
  descricao: string | null
  tipo: string
  conteudo_html: string
  campos: CampoTemplate[]
}

function escapar(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function moeda(v: string): string {
  const texto = String(v).trim()
  // Se tem vírgula, é formato brasileiro ("1.234,56"): o ponto é separador de
  // milhar. Sem vírgula, é decimal simples ("1234.5") e o ponto é decimal —
  // remover esse ponto multiplicaria o valor por dez.
  const normalizado = texto.includes(',')
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto
  const n = Number(normalizado)
  if (!Number.isFinite(n)) return v
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function data(v: string): string {
  // Aceita YYYY-MM-DD; qualquer outra coisa passa direto.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v
}

const FILTROS: Record<string, (v: string) => string> = { moeda, data }

/** Lista as chaves usadas no HTML — serve para avisar sobre campo órfão. */
export function chavesDoTemplate(html: string): string[] {
  const encontradas = new Set<string>()
  for (const m of html.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*(?:\|\s*[a-zA-Z]+\s*)?\}\}/g)) {
    encontradas.add(m[1])
  }
  return [...encontradas]
}

export function renderizar(html: string, dados: Record<string, string>): string {
  const hoje = new Date().toLocaleDateString('pt-BR')

  return html.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*(?:\|\s*([a-zA-Z]+)\s*)?\}\}/g,
    (_todo, chave: string, filtro?: string) => {
      const bruto = chave === '_hoje' ? hoje : (dados[chave] ?? '')
      if (!bruto) return ''
      const transformado = filtro && FILTROS[filtro] ? FILTROS[filtro](bruto) : bruto
      return escapar(transformado)
    }
  )
}

/** Campos exigidos pelo template que o formulário não preencheu. */
export function camposFaltando(
  template: TemplateContrato,
  dados: Record<string, string>
): string[] {
  return template.campos
    .filter(c => !dados[c.key]?.trim())
    .map(c => c.label)
}
