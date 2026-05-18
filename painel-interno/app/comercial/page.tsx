'use client'

import PainelShell from '@/components/PainelShell'

const FUNIL = [
  { n: 1, label: 'Lead gerado',             desc: 'Responder em até 2h · Registrar no CRM' },
  { n: 2, label: 'Qualificação (5–10 min)', desc: 'Negócio · Problema · Prazo · Sistema atual' },
  { n: 3, label: 'Apresentação (30–45 min)',desc: 'Demo ao vivo · Levantar objeções · Definir próximo passo' },
  { n: 4, label: 'Proposta (em 24h)',        desc: 'Problema · Solução · Investimento · Próximos passos' },
  { n: 5, label: 'Follow-up (+1, +3, +7d)', desc: 'WhatsApp ativo · Nunca deixar esfriar' },
  { n: 6, label: 'Fechamento + Onboarding', desc: 'Ativação · Contrato · Boas-vindas' },
]

const ICP = [
  {
    icon: '💈', nome: 'Nero Barber',
    items: [
      { k: 'Quem',  v: 'Dono de barbearia 1–3 cadeiras' },
      { k: 'Dor',   v: 'Agenda pelo WhatsApp, perde horário' },
      { k: 'Canal', v: 'Instagram · Google Maps' },
    ],
  },
  {
    icon: '🧠', nome: 'Psi Aura',
    items: [
      { k: 'Quem',  v: 'Psicólogo autônomo, 10–30 pacientes/semana' },
      { k: 'Dor',   v: 'Sem prontuário digital, inadimplência' },
      { k: 'Canal', v: 'Instagram · Grupos Facebook' },
    ],
  },
  {
    icon: '📊', nome: 'CRM Nexio · 🏗️ Kubic · 🤖 Agentes IA',
    items: [
      { k: 'Canal',  v: 'LinkedIn · Prospecção fria direta' },
      { k: 'Perfil', v: 'Pequenas empresas B2B' },
    ],
  },
]

const TAREFAS = [
  { texto: 'Configurar pipeline no CRM Nexio com os estágios definidos',        prio: 'Urgente',    cor: 'bg-red-900/30 text-red-400 border border-red-800/40' },
  { texto: 'Definir precificação oficial dos SaaS (planos + valores)',           prio: 'Alta',       cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40' },
  { texto: 'Iniciar prospecção ativa: 10 contatos/semana no Nero Barber',        prio: 'Alta',       cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40' },
  { texto: 'Criar template de proposta (SaaS e projeto)',                         prio: 'Média',      cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
  { texto: 'Criar processo de onboarding de novos clientes',                     prio: 'Média',      cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
]

export default function ComercialPage() {
  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Comercial</h1>
          <p className="text-gray-500 text-sm mt-0.5">Processo de vendas · ICP por produto · Scripts de prospecção</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Funil */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Funil de vendas
            </p>
            <div className="space-y-2">
              {FUNIL.map(f => (
                <div key={f.n} className="flex items-center gap-3 bg-[#1a1a24] border border-[#1e1e2e] rounded-lg px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {f.n}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{f.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ICP */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              ICP por produto
            </p>
            <div className="space-y-3">
              {ICP.map(icp => (
                <div key={icp.nome} className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">{icp.icon} {icp.nome}</h3>
                  <div className="space-y-2">
                    {icp.items.map(item => (
                      <div key={item.k} className="flex gap-2 text-xs border-b border-[#1e1e2e] pb-1.5 last:border-0 last:pb-0">
                        <span className="text-gray-500 w-14 flex-shrink-0 font-medium">{item.k}:</span>
                        <span className="text-gray-300">{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tarefas */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Tarefas comerciais pendentes
          </p>
          <div className="space-y-3">
            {TAREFAS.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1e1e2e] last:border-0">
                <div className="w-4 h-4 rounded border border-gray-600 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-300">{t.texto}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 ${t.cor}`}>{t.prio}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PainelShell>
  )
}
