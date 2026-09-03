import type { Frente, StatusItem } from '@/types/central'

/**
 * Semente do roadmap, tirada do modelo que o Rodrigo montou à mão.
 *
 * Só entra quando a tabela está vazia — daí em diante o que vale é o banco.
 * Manter aqui serve para a primeira abertura não ser uma tela em branco, e
 * para haver um registro de onde cada frente estava em 01/09/2026.
 */
export const ROADMAP_INICIAL: {
  frente: Frente
  nome: string
  status: StatusItem
  proximo: string
}[] = [
  { frente: 'synapse', nome: 'Nero Barber (SaaS)', status: 'andamento',
    proximo: 'Sistema de conquistas/gamificação (boletim + badges) e roadmap do totem de check-in' },
  { frente: 'synapse', nome: 'lumIA', status: 'andamento',
    proximo: 'Integrar com Nero Barber via API própria (agendamento real do agente Nero.IA)' },
  { frente: 'synapse', nome: 'Agendamento APSE', status: 'andamento',
    proximo: 'Aguardando aceite da Rede Adventista (proposta com validade de 15 dias)' },
  { frente: 'synapse', nome: 'PsiAura', status: 'andamento',
    proximo: 'Consolidar sistema já migrado para .NET' },
  { frente: 'synapse', nome: 'OmniGest ERP', status: 'andamento', proximo: '' },
  { frente: 'synapse', nome: 'IA para Ensino de Inglês', status: 'planejado',
    proximo: 'Fechar arquitetura final do MVP (menos de 50 usuários)' },
  { frente: 'synapse', nome: 'PrintSentinel', status: 'pausado', proximo: '' },
  { frente: 'barbearia', nome: "Studio Nero Barber's (Diadema)", status: 'andamento',
    proximo: 'Finalizar rebranding (posts/stories) e fechar contratação de barbeiro' },
  { frente: 'fiap', nome: 'Graduação ADS', status: 'andamento', proximo: 'Concluir o curso' },
  { frente: 'pessoal', nome: 'Certificação GCP Professional Cloud Architect', status: 'planejado',
    proximo: 'Definir cronograma de estudo' },
  { frente: 'pessoal', nome: 'Transição CLT → Empreendedor', status: 'andamento',
    proximo: 'Estruturar rotina fixa de agenda e revisão semanal a partir de 01/09' },
]
