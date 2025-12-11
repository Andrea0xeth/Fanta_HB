// ============================================
// SUPABASE DATABASE TYPES
// ============================================
// Generato/aggiornato con: pnpm db:types
// Oppure manualmente dal dashboard Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string
          avatar: string | null
          passkey_id: string | null
          squadra_id: string | null
          punti_personali: number
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nickname: string
          avatar?: string | null
          passkey_id?: string | null
          squadra_id?: string | null
          punti_personali?: number
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          avatar?: string | null
          passkey_id?: string | null
          squadra_id?: string | null
          punti_personali?: number
          is_admin?: boolean
          created_at?: string
        }
      }
      squadre: {
        Row: {
          id: string
          nome: string
          emoji: string
          punti_squadra: number
          colore: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          emoji: string
          punti_squadra?: number
          colore: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          emoji?: string
          punti_squadra?: number
          colore?: string
          created_at?: string
        }
      }
      quest: {
        Row: {
          id: string
          giorno: number
          titolo: string
          descrizione: string | null
          punti: number
          difficolta: 'facile' | 'media' | 'difficile' | 'epica'
          tipo_prova: string[]
          emoji: string
          scadenza: string | null
          attiva: boolean
          created_at: string
        }
        Insert: {
          id?: string
          giorno: number
          titolo: string
          descrizione?: string | null
          punti: number
          difficolta: 'facile' | 'media' | 'difficile' | 'epica'
          tipo_prova?: string[]
          emoji?: string
          scadenza?: string | null
          attiva?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          giorno?: number
          titolo?: string
          descrizione?: string | null
          punti?: number
          difficolta?: 'facile' | 'media' | 'difficile' | 'epica'
          tipo_prova?: string[]
          emoji?: string
          scadenza?: string | null
          attiva?: boolean
          created_at?: string
        }
      }
      prove_quest: {
        Row: {
          id: string
          quest_id: string
          user_id: string
          tipo: 'foto' | 'video' | 'testo'
          contenuto: string
          stato: 'pending' | 'in_verifica' | 'validata' | 'rifiutata'
          voti_positivi: number
          voti_totali: number
          created_at: string
        }
        Insert: {
          id?: string
          quest_id: string
          user_id: string
          tipo: 'foto' | 'video' | 'testo'
          contenuto: string
          stato?: 'pending' | 'in_verifica' | 'validata' | 'rifiutata'
          voti_positivi?: number
          voti_totali?: number
          created_at?: string
        }
        Update: {
          id?: string
          quest_id?: string
          user_id?: string
          tipo?: 'foto' | 'video' | 'testo'
          contenuto?: string
          stato?: 'pending' | 'in_verifica' | 'validata' | 'rifiutata'
          voti_positivi?: number
          voti_totali?: number
          created_at?: string
        }
      }
      gare: {
        Row: {
          id: string
          nome: string
          descrizione: string | null
          squadra_a_id: string
          squadra_b_id: string
          vincitore_id: string | null
          punti_in_palio: number
          orario: string
          giorno: number
          stato: 'programmata' | 'live' | 'completata'
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descrizione?: string | null
          squadra_a_id: string
          squadra_b_id: string
          vincitore_id?: string | null
          punti_in_palio?: number
          orario: string
          giorno: number
          stato?: 'programmata' | 'live' | 'completata'
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descrizione?: string | null
          squadra_a_id?: string
          squadra_b_id?: string
          vincitore_id?: string | null
          punti_in_palio?: number
          orario?: string
          giorno?: number
          stato?: 'programmata' | 'live' | 'completata'
          created_at?: string
        }
      }
      voti: {
        Row: {
          id: string
          prova_id: string
          user_id: string
          valore: boolean
          created_at: string
        }
        Insert: {
          id?: string
          prova_id: string
          user_id: string
          valore: boolean
          created_at?: string
        }
        Update: {
          id?: string
          prova_id?: string
          user_id?: string
          valore?: boolean
          created_at?: string
        }
      }
      bonus_punti: {
        Row: {
          id: string
          user_id: string
          admin_id: string
          punti: number
          motivo: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_id: string
          punti: number
          motivo: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string
          punti?: number
          motivo?: string
          created_at?: string
        }
      }
      game_state: {
        Row: {
          id: number
          giorno_corrente: number
          evento_iniziato: boolean
          data_inizio: string | null
          data_fine: string | null
        }
        Insert: {
          id?: number
          giorno_corrente?: number
          evento_iniziato?: boolean
          data_inizio?: string | null
          data_fine?: string | null
        }
        Update: {
          id?: number
          giorno_corrente?: number
          evento_iniziato?: boolean
          data_inizio?: string | null
          data_fine?: string | null
        }
      }
      notifiche: {
        Row: {
          id: string
          user_id: string
          titolo: string
          messaggio: string
          tipo: 'quest' | 'gara' | 'bonus' | 'sistema'
          letta: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          titolo: string
          messaggio: string
          tipo?: 'quest' | 'gara' | 'bonus' | 'sistema'
          letta?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          titolo?: string
          messaggio?: string
          tipo?: 'quest' | 'gara' | 'bonus' | 'sistema'
          letta?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_random_team: {
        Args: { p_user_id: string }
        Returns: string
      }
      check_proof_validation: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      assign_gara_winner: {
        Args: { p_gara_id: string; p_vincitore_id: string }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}


