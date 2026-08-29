'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { buscar, type ResultadoBusca } from '@/server/busca'

const TOM_TIPO: Record<string, string> = {
  Empresa: 'text-info',
  Projeto: 'text-accent-text',
  Proposta: 'text-ok',
  Contrato: 'text-warn',
  Documento: 'text-muted',
  Site: 'text-info',
  Erro: 'text-crit',
  Conhecimento: 'text-muted',
}

export function BuscaGlobal() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [termo, setTermo] = useState('')
  const [itens, setItens] = useState<ResultadoBusca[]>([])
  const [ativo, setAtivo] = useState(0)
  const [buscando, iniciar] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl/Cmd + K abre de qualquer tela.
  useEffect(() => {
    function atalho(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAberto(a => !a)
      }
      if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  // Fechar limpa o estado aqui, não num efeito: efeito que chama setState
  // dispara render em cascata sem necessidade.
  function fechar() {
    setAberto(false)
    setTermo('')
    setItens([])
    setAtivo(0)
  }

  useEffect(() => {
    if (aberto) inputRef.current?.focus()
  }, [aberto])

  // Espera a digitação parar: uma consulta por tecla castigaria o banco.
  useEffect(() => {
    if (termo.trim().length < 2) return
    const t = setTimeout(() => {
      iniciar(async () => {
        const r = await buscar(termo)
        setItens(r.data ?? [])
        setAtivo(0)
      })
    }, 250)
    return () => clearTimeout(t)
  }, [termo])

  // Enquanto o termo for curto demais, não mostra resultado velho.
  const visiveis = termo.trim().length < 2 ? [] : itens

  function irPara(item: ResultadoBusca) {
    fechar()
    router.push(item.link)
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo(i => Math.min(i + 1, visiveis.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setAtivo(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && visiveis[ativo]) { e.preventDefault(); irPara(visiveis[ativo]) }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-2 rounded-token border border-line bg-surface-2 px-3 py-1.5 text-left text-sm text-subtle transition-colors hover:border-line-strong hover:text-muted"
      >
        <span aria-hidden="true">⌕</span>
        <span className="flex-1">Buscar…</span>
        <kbd className="hidden rounded border border-line px-1 font-mono text-[10px] sm:block">Ctrl K</kbd>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
          onClick={fechar}
        >
          <div
            role="dialog"
            aria-label="Busca global"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-token border border-line bg-surface shadow-xl"
          >
            <input
              ref={inputRef}
              value={termo}
              onChange={e => setTermo(e.target.value)}
              onKeyDown={teclas}
              placeholder="Empresa, projeto, proposta, contrato, documento, site, erro…"
              aria-label="Termo de busca"
              className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-fg placeholder:text-subtle focus:outline-none"
            />

            <div className="max-h-[50vh] overflow-y-auto">
              {termo.trim().length < 2 ? (
                <p className="px-4 py-6 text-center text-sm text-subtle">
                  Digite ao menos duas letras.
                </p>
              ) : buscando && visiveis.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-subtle">Buscando…</p>
              ) : visiveis.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-subtle">
                  Nada encontrado para &ldquo;{termo}&rdquo;.
                </p>
              ) : (
                <ul>
                  {visiveis.map((r, i) => (
                    <li key={`${r.tipo}-${r.id}`}>
                      <button
                        type="button"
                        onClick={() => irPara(r)}
                        onMouseEnter={() => setAtivo(i)}
                        className={cn(
                          'flex w-full items-baseline gap-3 px-4 py-2.5 text-left transition-colors',
                          i === ativo ? 'bg-surface-2' : 'hover:bg-surface-2'
                        )}
                      >
                        <span className={cn('w-24 flex-shrink-0 text-[11px] font-medium uppercase tracking-wide',
                          TOM_TIPO[r.tipo] ?? 'text-subtle')}>
                          {r.tipo}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-fg">{r.titulo}</span>
                          {r.detalhe && (
                            <span className="block truncate text-xs text-subtle">{r.detalhe}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[11px] text-subtle">
              <span>↑↓ navegar</span>
              <span>↵ abrir</span>
              <span>esc fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
