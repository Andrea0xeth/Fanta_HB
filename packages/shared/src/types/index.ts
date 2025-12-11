// ============================================
// USER TYPES
// ============================================
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

// ============================================
// TEAM TYPES
// ============================================
export interface Squadra {
  id: string;
  nome: string;
  emoji: string;
  punti_squadra: number;
  colore: string;
  membri: User[];
}

// ============================================
// QUEST TYPES
// ============================================
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
  attiva?: boolean;
}

export interface ProvaQuest {
  id: string;
  quest_id: string;
  user_id: string;
  user: User;
  tipo: ProofType;
  contenuto: string;
  stato: QuestStatus;
  voti_positivi: number;
  voti_totali: number;
  created_at: string;
}

// ============================================
// GARA (TEAM COMPETITION) TYPES
// ============================================
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

// ============================================
// LEADERBOARD TYPES
// ============================================
export interface LeaderboardEntry {
  posizione: number;
  id: string;
  nome: string;
  emoji?: string;
  punti_totali: number;
  delta_oggi: number;
  avatar?: string;
}

// ============================================
// PRIZE TYPES
// ============================================
export type PremioType = 'squadra' | 'singolo' | 'giornaliero' | 'speciale';

export interface Premio {
  id: string;
  titolo: string;
  descrizione: string;
  immagine: string;
  tipo: PremioType;
  punti_richiesti?: number;
}

// ============================================
// VOTE TYPES
// ============================================
export interface Voto {
  id: string;
  prova_id: string;
  user_id: string;
  valore: boolean;
  created_at: string;
}

// ============================================
// BONUS TYPES
// ============================================
export interface BonusPunti {
  id: string;
  user_id: string;
  admin_id: string;
  punti: number;
  motivo: string;
  created_at: string;
}

// ============================================
// GAME STATE TYPES
// ============================================
export interface GameState {
  giorno_corrente: number;
  evento_iniziato: boolean;
  data_inizio: string;
  data_fine: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export type NotificaTipo = 'quest' | 'gara' | 'bonus' | 'sistema';

export interface Notifica {
  id: string;
  user_id: string;
  titolo: string;
  messaggio: string;
  tipo: NotificaTipo;
  letta: boolean;
  created_at: string;
}

// ============================================
// UTILITY TYPES
// ============================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Punteggio formula: personali * 0.7 + squadra * 0.3
export const calculateTotalScore = (puntiPersonali: number, puntiSquadra: number): number => {
  return Math.round(puntiPersonali * 0.7 + puntiSquadra * 0.3);
};

// Percentuale validazione: >= 66%
export const VALIDATION_THRESHOLD = 0.66;
export const MIN_VOTES_FOR_VALIDATION = 3;

export const isProofValidated = (votiPositivi: number, votiTotali: number): boolean => {
  if (votiTotali < MIN_VOTES_FOR_VALIDATION) return false;
  return (votiPositivi / votiTotali) >= VALIDATION_THRESHOLD;
};


