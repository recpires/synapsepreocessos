'use client'

import PainelShell from '@/components/PainelShell'

const CONTRATACOES = [
  { icon: '👨‍💻', cargo: 'Dev Frontend',  quando: 'quando Rodrigo estiver 80%+ no backend',         prazo: 'Próximo', cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40' },
  { icon: '🎧', cargo: 'CS / Suporte',    quando: 'quando tiver +30 clientes ativos',                prazo: 'Futuro',  cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
  { icon: '🎨', cargo: 'Designer UI/UX',  quando: 'quando visual virar gargalo de conversão',         prazo: 'Futuro',  cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
  { icon: '📞', cargo: 'SDR (vendas)',    quando: 'quando o processo comercial estiver validado',     prazo: 'Futuro',  cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
]

const RITUAIS = [
  { icon: '📅', dia: 'Segunda-feira',  desc: 'Reunião de 15 min — Rodrigo + Wilian. O que foi feito, o que vai ser feito, bloqueios.' },
  { icon: '🔍', dia: 'Sexta-feira',    desc: 'Review rápida: o que foi entregue, o que travou, ajuste de prioridade se necessário.' },
  { icon: '📊', dia: 'Dia 1 do mês',  desc: 'Review financeiro: MRR, custos, churn, meta do próximo mês.' },
]

export default function TimePage() {
  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Time</h1>
          <p className="text-gray-500 text-sm mt-0.5">2 pessoas · Reunião semanal · Crescimento planejado</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Team cards */}
          <div className="space-y-3">
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                R
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Rodrigo Eufrasio</h3>
                <p className="text-sm text-gray-500 mt-0.5">Dev / CTO · Arquitetura · Produto · Desenvolvimento</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-semibold bg-violet-900/30 text-violet-400 border border-violet-800/40">CTO</span>
            </div>

            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                W
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Wilian Andre</h3>
                <p className="text-sm text-gray-500 mt-0.5">CEO · Negócio · Comercial · Gestão</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-800/40">CEO</span>
            </div>
          </div>

          {/* Próximas contratações */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              Próximas contratações
            </p>
            <div className="space-y-3">
              {CONTRATACOES.map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#1e1e2e] last:border-0">
                  <span className="text-lg flex-shrink-0">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{c.cargo}</p>
                    <p className="text-xs text-gray-500 truncate">{c.quando}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border flex-shrink-0 ${c.cor}`}>{c.prazo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ritual semanal */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            Ritual semanal mínimo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {RITUAIS.map(r => (
              <div key={r.dia} className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg p-4">
                <div className="text-2xl mb-2">{r.icon}</div>
                <div className="text-sm font-semibold text-white mb-1.5">{r.dia}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PainelShell>
  )
}
