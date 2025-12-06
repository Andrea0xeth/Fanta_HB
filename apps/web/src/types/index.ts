// User types
export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  passkey_id?: string;
  squadra_id: string | null;
  punti_personali: number;
  is_admin: boolean;
  created_at: string;
}

// Team types
export interface Squadra {
  id: string;
  nome: string;
  emoji: string;
  punti_squadra: number;
  colore: string;
  membri: User[];
}

// Quest types
export type QuestDifficulty = 'facile' | 'media' | 'difficile' | 'epica';
export type ProofType = 'foto' | 'video' | 'testo';
export type QuestStatus = 'pending' | 'in_verifica' | 'validata' | 'rifiutata';

export interface Quest {
  id: string;
  giorno: number;
  titolo: string;
  descrizione: string;
  punti: number;
  difficolta: QuestDifficulty;
  tipo_prova: ProofType[];
  emoji: string;
  scadenza: string;
}

export interface ProvaQuest {
  id: string;
  quest_id: string;
  user_id: string;
  user: User;
  tipo: ProofType;
  contenuto: string; // URL or text
  stato: QuestStatus;
  voti_positivi: number;
  voti_totali: number;
  created_at: string;
}

// Gara (Team competition) types
export type GaraStatus = 'programmata' | 'live' | 'completata';

export interface Gara {
  id: string;
  nome: string;
  descrizione: string;
  squadra_a_id: string;
  squadra_b_id: string;
  squadra_a?: Squadra;
  squadra_b?: Squadra;
  vincitore_id: string | null;
  punti_in_palio: number;
  orario: string;
  giorno: number;
  stato: GaraStatus;
}

// Leaderboard types
export interface LeaderboardEntry {
  posizione: number;
  id: string;
  nome: string;
  emoji?: string;
  punti_totali: number;
  delta_oggi: number;
  avatar?: string;
}

// Prize types
export interface Premio {
  id: string;
  titolo: string;
  descrizione: string;
  immagine: string;
  tipo: 'squadra' | 'singolo' | 'giornaliero' | 'speciale';
  punti_richiesti?: number;
}

// Vote types
export interface Voto {
  id: string;
  prova_id: string;
  user_id: string;
  valore: boolean; // true = valida, false = rifiuta
  created_at: string;
}

// Bonus types
export interface BonusPunti {
  id: string;
  user_id: string;
  admin_id: string;
  punti: number;
  motivo: string;
  created_at: string;
}

// App state types
export interface GameState {
  giorno_corrente: number;
  evento_iniziato: boolean;
  data_inizio: string;
  data_fine: string;
}

// Notification types
export interface Notifica {
  id: string;
  user_id: string;
  titolo: string;
  messaggio: string;
  tipo: 'quest' | 'gara' | 'bonus' | 'sistema';
  letta: boolean;
  created_at: string;
}
