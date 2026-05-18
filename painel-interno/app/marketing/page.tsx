'use client'

import PainelShell from '@/components/PainelShell'

const CALENDARIO = [
  { dia: 'Seg', tipo: 'Reels',    tipoCor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40', titulo: '"Seu cliente ainda agenda pelo WhatsApp?"', desc: 'Gancho + solução em 30s' },
  { dia: 'Ter', tipo: 'Carrossel',tipoCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',   titulo: '5 problemas que toda barbearia tem',       desc: 'Educativo · gera salvamento' },
  { dia: 'Qui', tipo: 'Reels',    tipoCor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40', titulo: 'Demo ao vivo: agendamento em 3 cliques',  desc: 'Demo do produto' },
  { dia: 'Sex', tipo: 'Stories',  tipoCor: 'bg-orange-900/30 text-orange-400 border border-orange-800/40', titulo: 'Enquete sobre horários perdidos',         desc: 'Engajamento + lead quente' },
]

const PILARES = [
  { icon: '📚', bg: 'bg-violet-900/15', titulo: 'Educação (40%)',       desc: 'Como resolver problemas do nicho com tecnologia' },
  { icon: '⭐', bg: 'bg-emerald-900/15', titulo: 'Prova social (30%)',  desc: 'Resultados, antes/depois, números reais de clientes' },
  { icon: '🛠️', bg: 'bg-blue-900/15',   titulo: 'Produto (20%)',        desc: 'Demos, features, atualizações dos SaaS' },
  { icon: '🎬', bg: 'bg-amber-900/15',  titulo: 'Bastidores (10%)',     desc: 'Como a Synapse Code trabalha e pensa' },
]

const TAREFAS = [
  { texto: 'Otimizar bio e perfil do Instagram da Synapse Code',          prio: 'Urgente', cor: 'bg-red-900/30 text-red-400 border border-red-800/40' },
  { texto: 'Gravar primeiros 4 Reels do Nero Barber (semana 1)',          prio: 'Urgente', cor: 'bg-red-900/30 text-red-400 border border-red-800/40' },
  { texto: 'Ativar LinkedIn pessoal do Rodrigo com 3 posts/semana',       prio: 'Alta',    cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40' },
  { texto: 'Criar LP dedicada para Nero Barber com CTA de trial',         prio: 'Alta',    cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40' },
  { texto: 'Replicar calendário de conteúdo para Psi Aura (mês 2)',       prio: 'Média',   cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
  { texto: 'Criar LPs para Psi Aura, CRM Nexio e Kubic Eng',             prio: 'Média',   cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' },
]

export default function MarketingPage() {
  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing</h1>
          <p className="text-gray-500 text-sm mt-0.5">Foco inicial: Nero Barber · Instagram + LinkedIn · Calendário 30 dias ativo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendário */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
              Calendário Nero Barber — semana 1
            </p>
            <div className="space-y-3">
              {CALENDARIO.map((item, i) => (
                <div key={i} className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg p-3 hover:border-[#2d2d3d] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium w-7 flex-shrink-0">{item.dia}</span>
                      <p className="text-sm text-white font-medium leading-snug">{item.titulo}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border flex-shrink-0 ${item.tipoCor}`}>{item.tipo}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-9">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pilares */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Pilares de conteúdo
            </p>
            <div className="space-y-3">
              {PILARES.map((p, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-[#1e1e2e] last:border-0">
                  <div className={`w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                    {p.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
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
            Tarefas de marketing pendentes
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
