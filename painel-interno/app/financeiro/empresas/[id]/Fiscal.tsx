'use client'

import { useState, useTransition } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { salvarDadosFiscais } from '@/server/empresa-financeiro'
import {
  REGIMES, REGIME_LABEL, TETO_SUGERIDO,
  type EmpresaPropria, type RegimeTributario,
} from '@/types/empresa-financeiro'

export function Fiscal({ empresa }: { empresa: EmpresaPropria }) {
  const [regime, setRegime] = useState<RegimeTributario | ''>(empresa.regime_tributario ?? '')
  const [teto, setTeto] = useState(empresa.teto_faturamento?.toString() ?? '')
  const [cnpj, setCnpj] = useState(empresa.cnpj ?? '')
  const [abertura, setAbertura] = useState(empresa.abertura ?? '')
  const [salvando, iniciar] = useTransition()

  /**
   * Trocar o regime sugere o teto, mas não sobrescreve o que você digitou.
   * O número da lei é ponto de partida; o que vale é o que está gravado.
   */
  function trocarRegime(novo: string) {
    const r = (novo || '') as RegimeTributario | ''
    setRegime(r)
    const sugerido = r ? TETO_SUGERIDO[r] : undefined
    if (sugerido && !teto) setTeto(String(sugerido))
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarDadosFiscais({
        id: empresa.id,
        regime_tributario: regime || null,
        teto_faturamento: teto ? Number(teto) : null,
        cnpj: cnpj || null,
        abertura: abertura || null,
      })
      if (r.ok) toast.success('Dados fiscais salvos.')
      else toast.error(r.error ?? 'Não foi possível salvar.')
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          rotulo="CNPJ"
          value={cnpj}
          onChange={e => setCnpj(e.target.value)}
          placeholder="00.000.000/0001-00"
        />
        <Input
          rotulo="Abertura"
          type="date"
          value={abertura}
          onChange={e => setAbertura(e.target.value)}
        />
        <Select rotulo="Regime tributário" value={regime} onChange={e => trocarRegime(e.target.value)}>
          <option value="">Não definido</option>
          {REGIMES.map(r => (
            <option key={r} value={r}>{REGIME_LABEL[r]}</option>
          ))}
        </Select>
        <Input
          rotulo="Teto de faturamento"
          type="number"
          step="0.01"
          min="0"
          value={teto}
          onChange={e => setTeto(e.target.value)}
          dica="Em reais, para 12 meses corridos. Deixe vazio se o regime não tem teto."
        />
      </div>

      <Button onClick={salvar} carregando={salvando}>Salvar dados fiscais</Button>
    </div>
  )
}
