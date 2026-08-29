export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alertas_silenciados: {
        Row: {
          created_at: string
          criado_por: string | null
          entidade_id: string
          id: string
          motivo: string | null
          origem: string
          silenciado_ate: string | null
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          entidade_id: string
          id?: string
          motivo?: string | null
          origem: string
          silenciado_ate?: string | null
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          entidade_id?: string
          id?: string
          motivo?: string | null
          origem?: string
          silenciado_ate?: string | null
        }
        Relationships: []
      }
      atividades: {
        Row: {
          acao: string
          antes: Json | null
          autor: string | null
          depois: Json | null
          em: string
          entidade: string
          entidade_id: string | null
          id: string
          membro_id: string | null
          resumo: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          autor?: string | null
          depois?: Json | null
          em?: string
          entidade: string
          entidade_id?: string | null
          id?: string
          membro_id?: string | null
          resumo?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          autor?: string | null
          depois?: Json | null
          em?: string
          entidade?: string
          entidade_id?: string | null
          id?: string
          membro_id?: string | null
          resumo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      conhecimento: {
        Row: {
          area: string
          atualizado_por: string | null
          conteudo_md: string
          created_at: string
          id: string
          origem: string | null
          slug: string
          tags: string[]
          titulo: string
          updated_at: string
        }
        Insert: {
          area: string
          atualizado_por?: string | null
          conteudo_md?: string
          created_at?: string
          id?: string
          origem?: string | null
          slug: string
          tags?: string[]
          titulo: string
          updated_at?: string
        }
        Update: {
          area?: string
          atualizado_por?: string | null
          conteudo_md?: string
          created_at?: string
          id?: string
          origem?: string | null
          slug?: string
          tags?: string[]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          ativa: boolean
          atualizado_em: string
          banco: string | null
          created_at: string
          id: string
          nome: string
          saldo_atual: number
          tipo: string
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          banco?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo_atual?: number
          tipo?: string
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          banco?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo_atual?: number
          tipo?: string
        }
        Relationships: []
      }
      contatos: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          nome: string
          principal: boolean
          whatsapp: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          id?: string
          nome: string
          principal?: boolean
          whatsapp?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          principal?: boolean
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_templates: {
        Row: {
          ativo: boolean
          campos: Json
          conteudo_html: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          slug: string | null
          tipo: string
        }
        Insert: {
          ativo?: boolean
          campos?: Json
          conteudo_html?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          slug?: string | null
          tipo?: string
        }
        Update: {
          ativo?: boolean
          campos?: Json
          conteudo_html?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string | null
          tipo?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          cliente: string
          cliente_email: string | null
          created_at: string | null
          created_by: string | null
          data_inicio: string
          data_vencimento: string | null
          docusign_envelope_id: string | null
          docusign_sent_at: string | null
          docusign_status: string | null
          empresa_id: string | null
          gerado_por_template: boolean | null
          id: string
          lado: string
          observacao: string | null
          projeto_id: string | null
          responsavel: string
          status: string
          template_tipo: string | null
          tipo: string
          valor: number | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          cliente: string
          cliente_email?: string | null
          created_at?: string | null
          created_by?: string | null
          data_inicio: string
          data_vencimento?: string | null
          docusign_envelope_id?: string | null
          docusign_sent_at?: string | null
          docusign_status?: string | null
          empresa_id?: string | null
          gerado_por_template?: boolean | null
          id?: string
          lado?: string
          observacao?: string | null
          projeto_id?: string | null
          responsavel?: string
          status?: string
          template_tipo?: string | null
          tipo: string
          valor?: number | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          cliente?: string
          cliente_email?: string | null
          created_at?: string | null
          created_by?: string | null
          data_inicio?: string
          data_vencimento?: string | null
          docusign_envelope_id?: string | null
          docusign_sent_at?: string | null
          docusign_status?: string | null
          empresa_id?: string | null
          gerado_por_template?: boolean | null
          id?: string
          lado?: string
          observacao?: string | null
          projeto_id?: string | null
          responsavel?: string
          status?: string
          template_tipo?: string | null
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_log: {
        Row: {
          criados: number
          executado_em: string
          id: string
          job: string
        }
        Insert: {
          criados?: number
          executado_em?: string
          id?: string
          job: string
        }
        Update: {
          criados?: number
          executado_em?: string
          id?: string
          job?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          anexo_nome: string | null
          anexo_path: string | null
          anexo_url: string | null
          assinatura_ativa: boolean
          categoria: string
          condicao: string | null
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          forma_pagamento: string
          id: string
          internacional: boolean | null
          observacao: string | null
          parcela_num: number | null
          parcela_total: number | null
          periodicidade: string | null
          produto: string | null
          projeto_id: string | null
          proxima_data: string | null
          recorrente: boolean | null
          serie_id: string | null
          taxa_pct: number | null
          tipo: string | null
          valor: number
          valor_base: number | null
        }
        Insert: {
          anexo_nome?: string | null
          anexo_path?: string | null
          anexo_url?: string | null
          assinatura_ativa?: boolean
          categoria: string
          condicao?: string | null
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          forma_pagamento: string
          id?: string
          internacional?: boolean | null
          observacao?: string | null
          parcela_num?: number | null
          parcela_total?: number | null
          periodicidade?: string | null
          produto?: string | null
          projeto_id?: string | null
          proxima_data?: string | null
          recorrente?: boolean | null
          serie_id?: string | null
          taxa_pct?: number | null
          tipo?: string | null
          valor: number
          valor_base?: number | null
        }
        Update: {
          anexo_nome?: string | null
          anexo_path?: string | null
          anexo_url?: string | null
          assinatura_ativa?: boolean
          categoria?: string
          condicao?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          forma_pagamento?: string
          id?: string
          internacional?: boolean | null
          observacao?: string | null
          parcela_num?: number | null
          parcela_total?: number | null
          periodicidade?: string | null
          produto?: string | null
          projeto_id?: string | null
          proxima_data?: string | null
          recorrente?: boolean | null
          serie_id?: string | null
          taxa_pct?: number | null
          tipo?: string | null
          valor?: number
          valor_base?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arquivo_nome: string | null
          arquivo_tipo: string | null
          arquivo_url: string | null
          categoria: string
          created_at: string | null
          created_by: string
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          projeto_id: string | null
          tamanho_bytes: number | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          categoria?: string
          created_at?: string | null
          created_by: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          projeto_id?: string | null
          tamanho_bytes?: number | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          categoria?: string
          created_at?: string | null
          created_by?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          projeto_id?: string | null
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativa: boolean
          cnpj: string | null
          created_at: string
          endereco: Json
          id: string
          inscricao_estadual: string | null
          nome_fantasia: string | null
          observacao: string | null
          razao_social: string
          responsavel: string | null
          segmento: string | null
          site: string | null
          tipo: Database["public"]["Enums"]["tipo_empresa"]
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cnpj?: string | null
          created_at?: string
          endereco?: Json
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          razao_social: string
          responsavel?: string | null
          segmento?: string | null
          site?: string | null
          tipo?: Database["public"]["Enums"]["tipo_empresa"]
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cnpj?: string | null
          created_at?: string
          endereco?: Json
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          razao_social?: string
          responsavel?: string | null
          segmento?: string | null
          site?: string | null
          tipo?: Database["public"]["Enums"]["tipo_empresa"]
          updated_at?: string
        }
        Relationships: []
      }
      impostos: {
        Row: {
          competencia: string
          created_at: string
          guia_url: string | null
          id: string
          observacao: string | null
          pago_em: string | null
          tipo: string
          valor: number
          vencimento: string
        }
        Insert: {
          competencia: string
          created_at?: string
          guia_url?: string | null
          id?: string
          observacao?: string | null
          pago_em?: string | null
          tipo: string
          valor: number
          vencimento: string
        }
        Update: {
          competencia?: string
          created_at?: string
          guia_url?: string | null
          id?: string
          observacao?: string | null
          pago_em?: string | null
          tipo?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      maturidade_camadas: {
        Row: {
          ajuda: string | null
          camada: string
          ordem: number
          peso: number
        }
        Insert: {
          ajuda?: string | null
          camada: string
          ordem: number
          peso: number
        }
        Update: {
          ajuda?: string | null
          camada?: string
          ordem?: number
          peso?: number
        }
        Relationships: []
      }
      membros: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_membro"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          ano: number
          categoria: string
          created_at: string
          id: string
          mes: number
          observacao: string | null
          valor_previsto: number
        }
        Insert: {
          ano: number
          categoria: string
          created_at?: string
          id?: string
          mes: number
          observacao?: string | null
          valor_previsto: number
        }
        Update: {
          ano?: number
          categoria?: string
          created_at?: string
          id?: string
          mes?: number
          observacao?: string | null
          valor_previsto?: number
        }
        Relationships: []
      }
      pipeline_leads: {
        Row: {
          contato_email: string | null
          contato_whatsapp: string | null
          created_at: string | null
          created_by: string
          empresa: string | null
          empresa_id: string | null
          etapa: string
          id: string
          nome: string
          observacao: string | null
          prioridade: string | null
          produto: string
          proximo_passo: string | null
          responsavel: string | null
          tipo: string
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          contato_email?: string | null
          contato_whatsapp?: string | null
          created_at?: string | null
          created_by: string
          empresa?: string | null
          empresa_id?: string | null
          etapa?: string
          id?: string
          nome: string
          observacao?: string | null
          prioridade?: string | null
          produto?: string
          proximo_passo?: string | null
          responsavel?: string | null
          tipo?: string
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          contato_email?: string | null
          contato_whatsapp?: string | null
          created_at?: string | null
          created_by?: string
          empresa?: string | null
          empresa_id?: string | null
          etapa?: string
          id?: string
          nome?: string
          observacao?: string | null
          prioridade?: string | null
          produto?: string
          proximo_passo?: string | null
          responsavel?: string | null
          tipo?: string
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      precificacoes: {
        Row: {
          created_at: string
          created_by: string | null
          entradas: Json
          id: string
          nome: string
          observacao: string | null
          produto_id: string | null
          resultado: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entradas?: Json
          id?: string
          nome: string
          observacao?: string | null
          produto_id?: string | null
          resultado?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entradas?: Json
          id?: string
          nome?: string
          observacao?: string | null
          produto_id?: string | null
          resultado?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "precificacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          identidade: Json
          nome: string
          ordem: number
          repo: string | null
          slug: string
          stack: string[]
          status: string
          tagline: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          identidade?: Json
          nome: string
          ordem?: number
          repo?: string | null
          slug: string
          stack?: string[]
          status?: string
          tagline?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          identidade?: Json
          nome?: string
          ordem?: number
          repo?: string | null
          slug?: string
          stack?: string[]
          status?: string
          tagline?: string | null
          url?: string | null
        }
        Relationships: []
      }
      projeto_decisoes: {
        Row: {
          alternativas: string | null
          contexto: string | null
          created_at: string
          data: string
          decisao: string
          id: string
          projeto_id: string
          titulo: string
        }
        Insert: {
          alternativas?: string | null
          contexto?: string | null
          created_at?: string
          data?: string
          decisao: string
          id?: string
          projeto_id: string
          titulo: string
        }
        Update: {
          alternativas?: string | null
          contexto?: string | null
          created_at?: string
          data?: string
          decisao?: string
          id?: string
          projeto_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_decisoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_erros: {
        Row: {
          ambiente: Database["public"]["Enums"]["ambiente"]
          causa_raiz: string | null
          codigo: string
          commit_fix: string | null
          correcao: string | null
          created_at: string
          descricao: string | null
          detectado_em: string
          id: string
          origem: string | null
          projeto_id: string
          reproducao: string | null
          resolvido_em: string | null
          responsavel: string | null
          severidade: Database["public"]["Enums"]["severidade"]
          stacktrace: string | null
          status: Database["public"]["Enums"]["status_erro"]
          titulo: string
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["ambiente"]
          causa_raiz?: string | null
          codigo: string
          commit_fix?: string | null
          correcao?: string | null
          created_at?: string
          descricao?: string | null
          detectado_em?: string
          id?: string
          origem?: string | null
          projeto_id: string
          reproducao?: string | null
          resolvido_em?: string | null
          responsavel?: string | null
          severidade?: Database["public"]["Enums"]["severidade"]
          stacktrace?: string | null
          status?: Database["public"]["Enums"]["status_erro"]
          titulo: string
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["ambiente"]
          causa_raiz?: string | null
          codigo?: string
          commit_fix?: string | null
          correcao?: string | null
          created_at?: string
          descricao?: string | null
          detectado_em?: string
          id?: string
          origem?: string | null
          projeto_id?: string
          reproducao?: string | null
          resolvido_em?: string | null
          responsavel?: string | null
          severidade?: Database["public"]["Enums"]["severidade"]
          stacktrace?: string | null
          status?: Database["public"]["Enums"]["status_erro"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_erros_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_fases: {
        Row: {
          created_at: string
          entregaveis: string | null
          fim_prev: string | null
          fim_real: string | null
          id: string
          inicio_prev: string | null
          inicio_real: string | null
          nome: string
          ordem: number
          pct: number
          projeto_id: string
          status: Database["public"]["Enums"]["status_fase"]
        }
        Insert: {
          created_at?: string
          entregaveis?: string | null
          fim_prev?: string | null
          fim_real?: string | null
          id?: string
          inicio_prev?: string | null
          inicio_real?: string | null
          nome: string
          ordem: number
          pct?: number
          projeto_id: string
          status?: Database["public"]["Enums"]["status_fase"]
        }
        Update: {
          created_at?: string
          entregaveis?: string | null
          fim_prev?: string | null
          fim_real?: string | null
          id?: string
          inicio_prev?: string | null
          inicio_real?: string | null
          nome?: string
          ordem?: number
          pct?: number
          projeto_id?: string
          status?: Database["public"]["Enums"]["status_fase"]
        }
        Relationships: [
          {
            foreignKeyName: "projeto_fases_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_maturidade: {
        Row: {
          avaliado_em: string
          camada: string
          evidencia: string | null
          id: string
          nota: number
          peso: number
          projeto_id: string
        }
        Insert: {
          avaliado_em?: string
          camada: string
          evidencia?: string | null
          id?: string
          nota?: number
          peso?: number
          projeto_id: string
        }
        Update: {
          avaliado_em?: string
          camada?: string
          evidencia?: string | null
          id?: string
          nota?: number
          peso?: number
          projeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_maturidade_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_tarefas: {
        Row: {
          created_at: string
          descricao: string | null
          estimativa_h: number | null
          fase_id: string | null
          gasto_h: number
          id: string
          prioridade: number
          projeto_id: string
          responsavel: string | null
          status: string
          titulo: string
          updated_at: string
          vencimento: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          estimativa_h?: number | null
          fase_id?: string | null
          gasto_h?: number
          id?: string
          prioridade?: number
          projeto_id: string
          responsavel?: string | null
          status?: string
          titulo: string
          updated_at?: string
          vencimento?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          estimativa_h?: number | null
          fase_id?: string | null
          gasto_h?: number
          id?: string
          prioridade?: number
          projeto_id?: string
          responsavel?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_tarefas_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "projeto_fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_tarefas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          ambientes: Json
          arquivado: boolean
          created_at: string
          data_inicio: string | null
          empresa_id: string | null
          fase_atual: Database["public"]["Enums"]["fase_projeto"]
          id: string
          maturidade_pct: number
          nome: string
          observacao: string | null
          prazo: string | null
          produto_id: string | null
          repo: string | null
          responsavel: string | null
          saude: Database["public"]["Enums"]["saude"]
          tipo: Database["public"]["Enums"]["tipo_projeto"]
          updated_at: string
          valor_contratado: number | null
        }
        Insert: {
          ambientes?: Json
          arquivado?: boolean
          created_at?: string
          data_inicio?: string | null
          empresa_id?: string | null
          fase_atual?: Database["public"]["Enums"]["fase_projeto"]
          id?: string
          maturidade_pct?: number
          nome: string
          observacao?: string | null
          prazo?: string | null
          produto_id?: string | null
          repo?: string | null
          responsavel?: string | null
          saude?: Database["public"]["Enums"]["saude"]
          tipo?: Database["public"]["Enums"]["tipo_projeto"]
          updated_at?: string
          valor_contratado?: number | null
        }
        Update: {
          ambientes?: Json
          arquivado?: boolean
          created_at?: string
          data_inicio?: string | null
          empresa_id?: string | null
          fase_atual?: Database["public"]["Enums"]["fase_projeto"]
          id?: string
          maturidade_pct?: number
          nome?: string
          observacao?: string | null
          prazo?: string | null
          produto_id?: string | null
          repo?: string | null
          responsavel?: string | null
          saude?: Database["public"]["Enums"]["saude"]
          tipo?: Database["public"]["Enums"]["tipo_projeto"]
          updated_at?: string
          valor_contratado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_itens: {
        Row: {
          cobranca: string
          descricao: string
          detalhe: string | null
          horas_est: number | null
          id: string
          opcional: boolean
          ordem: number
          proposta_id: string
          quantidade: number
          valor_unit: number
        }
        Insert: {
          cobranca?: string
          descricao: string
          detalhe?: string | null
          horas_est?: number | null
          id?: string
          opcional?: boolean
          ordem?: number
          proposta_id: string
          quantidade?: number
          valor_unit?: number
        }
        Update: {
          cobranca?: string
          descricao?: string
          detalhe?: string | null
          horas_est?: number | null
          id?: string
          opcional?: boolean
          ordem?: number
          proposta_id?: string
          quantidade?: number
          valor_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposta_itens_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          aceita_em: string | null
          condicoes: string | null
          contexto: string | null
          created_at: string
          created_by: string | null
          empresa_id: string | null
          enviada_em: string | null
          escopo: string | null
          id: string
          lead_id: string | null
          motivo_recusa: string | null
          numero: string
          observacao: string | null
          projeto_id: string | null
          status: Database["public"]["Enums"]["status_proposta"]
          titulo: string
          updated_at: string
          validade: string | null
          valor_mensal: number
          valor_total: number
        }
        Insert: {
          aceita_em?: string | null
          condicoes?: string | null
          contexto?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          enviada_em?: string | null
          escopo?: string | null
          id?: string
          lead_id?: string | null
          motivo_recusa?: string | null
          numero: string
          observacao?: string | null
          projeto_id?: string | null
          status?: Database["public"]["Enums"]["status_proposta"]
          titulo: string
          updated_at?: string
          validade?: string | null
          valor_mensal?: number
          valor_total?: number
        }
        Update: {
          aceita_em?: string | null
          condicoes?: string | null
          contexto?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          enviada_em?: string | null
          escopo?: string | null
          id?: string
          lead_id?: string | null
          motivo_recusa?: string | null
          numero?: string
          observacao?: string | null
          projeto_id?: string | null
          status?: Database["public"]["Enums"]["status_proposta"]
          titulo?: string
          updated_at?: string
          validade?: string | null
          valor_mensal?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "propostas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      rateio_itens: {
        Row: {
          id: string
          percentual: number
          produto_id: string
          regra_id: string
        }
        Insert: {
          id?: string
          percentual: number
          produto_id: string
          regra_id: string
        }
        Update: {
          id?: string
          percentual?: number
          produto_id?: string
          regra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rateio_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rateio_itens_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "rateio_regras"
            referencedColumns: ["id"]
          },
        ]
      }
      rateio_regras: {
        Row: {
          aplica_a: string
          ativa: boolean
          created_at: string
          id: string
          nome: string
          observacao: string | null
          padrao: string
        }
        Insert: {
          aplica_a?: string
          ativa?: boolean
          created_at?: string
          id?: string
          nome: string
          observacao?: string | null
          padrao: string
        }
        Update: {
          aplica_a?: string
          ativa?: boolean
          created_at?: string
          id?: string
          nome?: string
          observacao?: string | null
          padrao?: string
        }
        Relationships: []
      }
      receitas: {
        Row: {
          categoria: string | null
          cliente: string | null
          cliente_id: string | null
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          empresa_id: string | null
          forma_pagamento: string | null
          id: string
          observacao: string | null
          origem: string
          origem_id: string | null
          parcela_num: number | null
          parcela_total: number | null
          payload_raw: Json | null
          periodicidade: string | null
          produto: string
          projeto_id: string | null
          recorrente: boolean | null
          serie_id: string | null
          status: string
          tipo: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente?: string | null
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          origem?: string
          origem_id?: string | null
          parcela_num?: number | null
          parcela_total?: number | null
          payload_raw?: Json | null
          periodicidade?: string | null
          produto: string
          projeto_id?: string | null
          recorrente?: boolean | null
          serie_id?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente?: string | null
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          origem?: string
          origem_id?: string | null
          parcela_num?: number | null
          parcela_total?: number | null
          payload_raw?: Json | null
          periodicidade?: string | null
          produto?: string
          projeto_id?: string | null
          recorrente?: boolean | null
          serie_id?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          dominio: string | null
          dominio_expira: string | null
          empresa_id: string | null
          hospedagem: string | null
          id: string
          lighthouse: Json | null
          manutencao_mensal: number | null
          nome: string
          observacao: string | null
          projeto_id: string | null
          publicado_em: string | null
          registrar: string | null
          repo: string | null
          screenshot_url: string | null
          ssl_expira: string | null
          stack: string[]
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          dominio?: string | null
          dominio_expira?: string | null
          empresa_id?: string | null
          hospedagem?: string | null
          id?: string
          lighthouse?: Json | null
          manutencao_mensal?: number | null
          nome: string
          observacao?: string | null
          projeto_id?: string | null
          publicado_em?: string | null
          registrar?: string | null
          repo?: string | null
          screenshot_url?: string | null
          ssl_expira?: string | null
          stack?: string[]
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          dominio?: string | null
          dominio_expira?: string | null
          empresa_id?: string | null
          hospedagem?: string | null
          id?: string
          lighthouse?: Json | null
          manutencao_mensal?: number | null
          nome?: string
          observacao?: string | null
          projeto_id?: string | null
          publicado_em?: string | null
          registrar?: string | null
          repo?: string | null
          screenshot_url?: string | null
          ssl_expira?: string | null
          stack?: string[]
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          area: string
          created_at: string | null
          created_by: string
          fonte: string
          id: string
          prioridade: number
          ref_id: string | null
          status: string
          texto: string
          updated_at: string | null
        }
        Insert: {
          area?: string
          created_at?: string | null
          created_by: string
          fonte?: string
          id?: string
          prioridade?: number
          ref_id?: string | null
          status?: string
          texto: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          created_at?: string | null
          created_by?: string
          fonte?: string
          id?: string
          prioridade?: number
          ref_id?: string | null
          status?: string
          texto?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      testes_resultados: {
        Row: {
          codigo: string
          id: string
          observacao: string | null
          resultado: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          codigo: string
          id?: string
          observacao?: string | null
          resultado?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          codigo?: string
          id?: string
          observacao?: string | null
          resultado?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      custo_por_produto: {
        Row: {
          data: string | null
          origem: string | null
          produto_id: string | null
          valor: number | null
        }
        Relationships: []
      }
      orcado_vs_realizado: {
        Row: {
          ano: number | null
          categoria: string | null
          desvio: number | null
          mes: number | null
          realizado: number | null
          valor_previsto: number | null
        }
        Relationships: []
      }
      projeto_erros_com_duracao: {
        Row: {
          ambiente: Database["public"]["Enums"]["ambiente"] | null
          causa_raiz: string | null
          codigo: string | null
          commit_fix: string | null
          correcao: string | null
          created_at: string | null
          descricao: string | null
          detectado_em: string | null
          horas_ate_resolver: number | null
          id: string | null
          origem: string | null
          projeto_id: string | null
          reproducao: string | null
          resolvido_em: string | null
          responsavel: string | null
          severidade: Database["public"]["Enums"]["severidade"] | null
          stacktrace: string | null
          status: Database["public"]["Enums"]["status_erro"] | null
          titulo: string | null
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["ambiente"] | null
          causa_raiz?: string | null
          codigo?: string | null
          commit_fix?: string | null
          correcao?: string | null
          created_at?: string | null
          descricao?: string | null
          detectado_em?: string | null
          horas_ate_resolver?: never
          id?: string | null
          origem?: string | null
          projeto_id?: string | null
          reproducao?: string | null
          resolvido_em?: string | null
          responsavel?: string | null
          severidade?: Database["public"]["Enums"]["severidade"] | null
          stacktrace?: string | null
          status?: Database["public"]["Enums"]["status_erro"] | null
          titulo?: string | null
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["ambiente"] | null
          causa_raiz?: string | null
          codigo?: string | null
          commit_fix?: string | null
          correcao?: string | null
          created_at?: string | null
          descricao?: string | null
          detectado_em?: string | null
          horas_ate_resolver?: never
          id?: string | null
          origem?: string | null
          projeto_id?: string | null
          reproducao?: string | null
          resolvido_em?: string | null
          responsavel?: string | null
          severidade?: Database["public"]["Enums"]["severidade"] | null
          stacktrace?: string | null
          status?: Database["public"]["Enums"]["status_erro"] | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_erros_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_maturidade_atual: {
        Row: {
          camadas_avaliadas: number | null
          maturidade_pct: number | null
          projeto_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_maturidade_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      vencimentos: {
        Row: {
          detalhe: string | null
          dias: number | null
          entidade_id: string | null
          link: string | null
          origem: string | null
          severidade: string | null
          silenciado: boolean | null
          titulo: string | null
          valor: number | null
          vence_em: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      buscar: {
        Args: { termo: string }
        Returns: {
          detalhe: string
          id: string
          link: string
          peso: number
          tipo: string
          titulo: string
        }[]
      }
      e_membro: { Args: never; Returns: boolean }
      estender_despesas_continuas: { Args: never; Returns: number }
      estender_receitas_continuas: { Args: never; Returns: number }
      papel_atual: {
        Args: never
        Returns: Database["public"]["Enums"]["papel_membro"]
      }
      proximo_numero_proposta: { Args: never; Returns: string }
      rateio_regras_validas: {
        Args: never
        Returns: {
          nome: string
          regra_id: string
          soma: number
          valida: boolean
        }[]
      }
      recalcular_proposta: { Args: { p_id: string }; Returns: undefined }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      ambiente: "producao" | "homologacao" | "desenvolvimento"
      fase_projeto:
        | "descoberta"
        | "especificacao"
        | "desenvolvimento"
        | "qa"
        | "homologacao"
        | "operacao"
        | "pausado"
        | "encerrado"
      papel_membro: "dono" | "admin" | "financeiro" | "comercial" | "leitura"
      saude: "verde" | "amarelo" | "vermelho"
      severidade: "critica" | "alta" | "media" | "baixa"
      status_erro:
        | "aberto"
        | "investigando"
        | "corrigido"
        | "nao_reproduz"
        | "nao_sera_corrigido"
      status_fase: "nao_iniciada" | "em_andamento" | "concluida" | "bloqueada"
      status_proposta:
        | "rascunho"
        | "enviada"
        | "em_negociacao"
        | "aceita"
        | "recusada"
        | "expirada"
      tipo_empresa: "cliente" | "fornecedor" | "parceiro" | "propria"
      tipo_projeto: "saas" | "sob_medida" | "site" | "manutencao" | "interno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ambiente: ["producao", "homologacao", "desenvolvimento"],
      fase_projeto: [
        "descoberta",
        "especificacao",
        "desenvolvimento",
        "qa",
        "homologacao",
        "operacao",
        "pausado",
        "encerrado",
      ],
      papel_membro: ["dono", "admin", "financeiro", "comercial", "leitura"],
      saude: ["verde", "amarelo", "vermelho"],
      severidade: ["critica", "alta", "media", "baixa"],
      status_erro: [
        "aberto",
        "investigando",
        "corrigido",
        "nao_reproduz",
        "nao_sera_corrigido",
      ],
      status_fase: ["nao_iniciada", "em_andamento", "concluida", "bloqueada"],
      status_proposta: [
        "rascunho",
        "enviada",
        "em_negociacao",
        "aceita",
        "recusada",
        "expirada",
      ],
      tipo_empresa: ["cliente", "fornecedor", "parceiro", "propria"],
      tipo_projeto: ["saas", "sob_medida", "site", "manutencao", "interno"],
    },
  },
} as const
