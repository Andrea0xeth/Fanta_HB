import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  User,
  Squadra,
  Quest,
  ProvaQuest,
  Gara,
  GameState,
  Notifica,
  Premio,
  RegistrationData,
  EmailPasswordCredentials,
  EmailPasswordRegistrationData,
  QuestDifficulty,
} from '../types';
import type { Database } from '../lib/database.types';
import { registerPasskey, authenticateWithPasskey } from '../lib/webauthn';
import { supabase, isSupabaseConfigured, uploadProofFile, uploadAvatar } from '../lib/supabase';

interface GameContextType {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Game data
  squadre: Squadra[];
  quests: Quest[];
  gare: Gara[];
  proveInVerifica: ProvaQuest[];
  gameState: GameState;
  notifiche: Notifica[];
  premi: Premio[];
  
  // Actions
  login: (registrationData: RegistrationData) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  loginWithEmailPassword: (credentials: EmailPasswordCredentials) => Promise<void>;
  register: (registrationData: RegistrationData) => Promise<void>;
  registerWithEmailPassword: (registrationData: EmailPasswordRegistrationData) => Promise<void>;
  logout: () => void;
  submitProva: (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string | File) => Promise<void>;
  votaProva: (provaId: string, valore: boolean) => Promise<void>;
  assegnaVincitore: (garaId: string, vincitoreId: string) => Promise<void>;
  assegnaClassifica: (garaId: string, classifiche: Array<{squadra_id: string, posizione: number}>) => Promise<void>;
  creaGara: (gara: {
    nome: string;
    descrizione: string;
    squadra_a_id: string;
    squadra_b_id: string;
    squadre_ids: string[]; // Tutte le squadre partecipanti
    punti_in_palio: number;
    orario: string;
    giorno: number;
  }) => Promise<void>;
  aggiungiBonus: (userId: string, punti: number, motivo: string) => Promise<void>;
  refreshData: () => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  assegnaPuntiQuestSpeciale: (provaId: string) => Promise<void>; // Admin only
  
  // Squadre management (admin only)
  creaSquadra: (squadra: { nome: string; emoji: string; colore: string; userIds?: string[] }) => Promise<void>;
  modificaSquadra: (squadraId: string, updates: { nome?: string; emoji?: string; colore?: string }) => Promise<void>;
  eliminaSquadra: (squadraId: string) => Promise<void>;
  cambiaSquadraUtente: (userId: string, nuovaSquadraId: string | null) => Promise<void>;
  
  // Premi management (admin only)
  creaPremio: (premio: { titolo: string; descrizione?: string; immagine: string; tipo: 'squadra' | 'singolo' | 'giornaliero' | 'speciale'; punti_richiesti: number | null; posizione_classifica?: number }) => Promise<void>;
  eliminaPremio: (premioId: string) => Promise<void>;
  
  // Computed
  mySquadra: Squadra | null;
  leaderboardSquadre: Squadra[];
  leaderboardSingoli: User[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [squadre, setSquadre] = useState<Squadra[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Tutti gli utenti, inclusi quelli senza squadra
  const [quests, setQuests] = useState<Quest[]>([]);
  const [gare, setGare] = useState<Gara[]>([]);
  const [proveInVerifica, setProveInVerifica] = useState<ProvaQuest[]>([]);
  const [notifiche, setNotifiche] = useState<Notifica[]>([]);
  const [premi, setPremi] = useState<Premio[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    giorno_corrente: 0,
    evento_iniziato: false,
    data_inizio: '',
    data_fine: '',
  });

  // Helper per convertire DB row a User
  const dbRowToUser = (row: Database['public']['Tables']['users']['Row']): User => ({
    id: row.id,
    nickname: row.nickname,
    nome: row.nome || undefined,
    cognome: row.cognome || undefined,
    email: row.email || undefined,
    telefono: row.telefono || undefined,
    data_nascita: row.data_nascita || undefined,
    avatar: row.avatar || undefined,
    passkey_id: row.passkey_id || undefined,
    squadra_id: row.squadra_id,
    punti_personali: row.punti_personali,
    is_admin: row.is_admin,
    created_at: row.created_at,
  });

  const setLoggedInUser = (u: User, passkeyId?: string | null) => {
    setUser(u);
    localStorage.setItem('30diciaccio_user', JSON.stringify(u));
    if (passkeyId) {
      localStorage.setItem('30diciaccio_passkey_id', passkeyId);
    } else {
      localStorage.removeItem('30diciaccio_passkey_id');
    }
  };

  const fetchUserById = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return dbRowToUser(data as Database['public']['Tables']['users']['Row']);
  };

  // Helper per convertire DB row a Squadra
  const dbRowToSquadra = (row: Database['public']['Tables']['squadre']['Row'], membri: User[] = []): Squadra => ({
    id: row.id,
    nome: row.nome,
    emoji: row.emoji,
    punti_squadra: row.punti_squadra,
    colore: row.colore,
    membri,
  });

  // Carica dati dal database
  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      // Carica game state
      const { data: gameStateData } = await supabase
        .from('game_state')
        .select('*')
        .single();

      if (gameStateData) {
        const state = gameStateData as Database['public']['Tables']['game_state']['Row'];
        setGameState({
          giorno_corrente: state.giorno_corrente,
          evento_iniziato: state.evento_iniziato,
          data_inizio: state.data_inizio || '',
          data_fine: state.data_fine || '',
        });
      }

      // Carica squadre
      const { data: squadreData, error: squadreError } = await supabase
        .from('squadre')
        .select('*')
        .order('punti_squadra', { ascending: false });

      if (squadreError) throw squadreError;

      // Carica utenti per popolare membri delle squadre
      const { data: usersData } = await supabase
        .from('users')
        .select('*');

      const users = usersData?.map(dbRowToUser) || [];
      const squadreWithMembers = (squadreData || []).map((s: Database['public']['Tables']['squadre']['Row']) => {
        const membri = users.filter(u => u.squadra_id === s.id);
        return dbRowToSquadra(s, membri);
      });

      setSquadre(squadreWithMembers);
      setAllUsers(users); // Salva tutti gli utenti per la leaderboard singoli

      // Carica quest del giorno corrente
      // Assicurati che il giorno sia sempre tra 1 e 3 (il constraint del database lo richiede)
      const giornoRaw = gameStateData ? (gameStateData as Database['public']['Tables']['game_state']['Row']).giorno_corrente : 1;
      const giornoCorrente = (giornoRaw >= 1 && giornoRaw <= 3) ? giornoRaw : 1;
      
      // Se c'è un utente, carica le sue quest assegnate, altrimenti carica tutte le quest (per admin/preview)
      if (user) {
        const attachUserProofsToQuests = async (questsList: Quest[]) => {
          try {
            const questIds = questsList.map((q) => q.id);
            if (questIds.length === 0) return questsList;

            // Carica l'ultima prova dell'utente per ciascuna quest (qualsiasi stato)
            const { data: myProofs, error: myProofsError } = await supabase
              .from('prove_quest')
              .select('id, quest_id, stato, voti_positivi, voti_totali, created_at')
              .eq('user_id', user.id)
              .in('quest_id', questIds)
              .order('created_at', { ascending: false });

            if (myProofsError) throw myProofsError;

            const map = new Map<string, any>();
            (myProofs || []).forEach((p: any) => {
              // keep the latest per quest_id (data already ordered desc)
              if (!map.has(p.quest_id)) map.set(p.quest_id, p);
            });

            return questsList.map((q) => {
              const p = map.get(q.id);
              if (!p) return q;
              return {
                ...q,
                prova: {
                  id: p.id,
                  stato: p.stato,
                  voti_positivi: p.voti_positivi ?? 0,
                  voti_totali: p.voti_totali ?? 0,
                },
              };
            });
          } catch (e) {
            console.warn('[Quests] Impossibile caricare prove utente per UI:', e);
            return questsList;
          }
        };

        // Assegna le quest giornaliere se non già assegnate
        const { error: assignError } = await supabase.rpc('assign_daily_quests', {
          p_user_id: user.id,
          p_giorno: giornoCorrente,
        } as any);

        if (assignError) {
          console.error('Errore assegnazione quest:', assignError);
        }

        // Carica le quest assegnate all'utente
        const { data: userQuestsData, error: userQuestsError } = await supabase.rpc('get_user_quests', {
          p_user_id: user.id,
          p_giorno: giornoCorrente,
        } as any);

        if (userQuestsError) {
          console.error('Errore caricamento quest utente:', userQuestsError);
          // Fallback: carica tutte le quest
          const { data: questsData, error: questsError } = await supabase
            .from('quest')
            .select('*')
            .eq('giorno', giornoCorrente)
            .eq('attiva', true)
            .order('punti', { ascending: false });

          if (questsError) throw questsError;

          const questsList = (questsData || []).map((q: Database['public']['Tables']['quest']['Row']) => ({
            id: q.id,
            giorno: q.giorno,
            titolo: q.titolo,
            descrizione: q.descrizione || '',
            punti: q.punti,
            difficolta: q.difficolta,
            tipo_prova: q.tipo_prova as ('foto' | 'video' | 'testo')[],
            emoji: q.emoji,
            scadenza: q.scadenza || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }));

          setQuests(await attachUserProofsToQuests(questsList));
        } else {
          // Mappa le quest assegnate al formato Quest
          const questsList = ((userQuestsData as any[]) || []).map((q: any) => ({
            id: q.quest_id,
            giorno: giornoCorrente,
            titolo: q.titolo,
            descrizione: q.descrizione || '',
            punti: q.punti,
            difficolta: q.difficolta,
            tipo_prova: q.tipo_prova as ('foto' | 'video' | 'testo')[],
            emoji: q.emoji,
            scadenza: q.scadenza || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            is_special: q.is_special || false,
            completed: q.completed || false, // Indica se la quest è stata inviata
          }));

          // Carica anche le quest speciali (sempre disponibili)
          const { data: specialQuestsData } = await supabase
            .from('quest')
            .select('*')
            .eq('is_special', true)
            .eq('attiva', true)
            .order('punti', { ascending: false });

          const specialQuests: Quest[] = (specialQuestsData || []).map((q: Database['public']['Tables']['quest']['Row'] & { is_special?: boolean }) => ({
            id: q.id,
            giorno: 0, // Quest speciali hanno giorno 0
            titolo: q.titolo,
            descrizione: q.descrizione || '',
            punti: q.punti,
            difficolta: q.difficolta as QuestDifficulty,
            tipo_prova: (q.tipo_prova || []) as ('foto' | 'video' | 'testo')[],
            emoji: q.emoji || '🎯',
            scadenza: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Scadenza lontana per quest speciali
            is_special: true,
          }));

          // Combina quest giornaliere e quest speciali
          const allQuests = [...questsList, ...specialQuests];
          setQuests(await attachUserProofsToQuests(allQuests));
        }
      } else {
        // Se non c'è utente, carica tutte le quest (per preview/admin)
        const { data: questsData, error: questsError } = await supabase
          .from('quest')
          .select('*')
          .eq('giorno', giornoCorrente)
          .eq('attiva', true)
          .order('punti', { ascending: false });

        if (questsError) throw questsError;

        const questsList = (questsData || []).map((q: Database['public']['Tables']['quest']['Row']) => ({
          id: q.id,
          giorno: q.giorno,
          titolo: q.titolo,
          descrizione: q.descrizione || '',
          punti: q.punti,
          difficolta: q.difficolta,
          tipo_prova: q.tipo_prova as ('foto' | 'video' | 'testo')[],
          emoji: q.emoji,
          scadenza: q.scadenza || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }));

        setQuests(questsList);
      }

      // Carica gare
      const { data: gareData, error: gareError } = await supabase
        .from('gare')
        .select('*')
        .order('orario', { ascending: true });

      if (gareError) throw gareError;

      // Carica classifiche per tutte le gare completate
      const gareIds = ((gareData as any[]) || []).map((g: any) => g.id);
      const classificheMap = new Map<string, any[]>();
      
      if (gareIds.length > 0) {
        const { data: classificheData } = await supabase
          .from('classifiche_gare')
          .select('*')
          .in('gara_id', gareIds)
          .order('posizione', { ascending: true });

        if (classificheData) {
          classificheData.forEach((c: any) => {
            if (!classificheMap.has(c.gara_id)) {
              classificheMap.set(c.gara_id, []);
            }
            const squadra = squadreWithMembers.find(s => s.id === c.squadra_id);
            classificheMap.get(c.gara_id)!.push({
              squadra_id: c.squadra_id,
              squadra_nome: squadra?.nome || '',
              squadra_emoji: squadra?.emoji || '',
              posizione: c.posizione,
              punti_assegnati: c.punti_assegnati,
            });
          });
        }
      }

      // Carica tutte le squadre partecipanti per ogni gara dalla tabella gare_squadre
      const squadrePartecipantiMap = new Map<string, Squadra[]>();
      
      if (gareIds.length > 0) {
        const { data: gareSquadreData } = await supabase
          .from('gare_squadre')
          .select('gara_id, squadra_id')
          .in('gara_id', gareIds);

        if (gareSquadreData) {
          gareSquadreData.forEach((gs: any) => {
            if (!squadrePartecipantiMap.has(gs.gara_id)) {
              squadrePartecipantiMap.set(gs.gara_id, []);
            }
            const squadra = squadreWithMembers.find(s => s.id === gs.squadra_id);
            if (squadra) {
              squadrePartecipantiMap.get(gs.gara_id)!.push(squadra);
            }
          });
        }
      }

      const gareList = (gareData || []).map((g: Database['public']['Tables']['gare']['Row']) => {
        const squadraA = squadreWithMembers.find(s => s.id === g.squadra_a_id);
        const squadraB = squadreWithMembers.find(s => s.id === g.squadra_b_id);
        const classifica = classificheMap.get(g.id) || undefined;
        
        // Determina tutte le squadre partecipanti
        // Priorità: 1) gare_squadre, 2) classifica, 3) squadra A e B
        let squadrePartecipanti: Squadra[] = [];
        const squadreDaGareSquadre = squadrePartecipantiMap.get(g.id);
        
        if (squadreDaGareSquadre && squadreDaGareSquadre.length > 0) {
          // Usa le squadre dalla tabella gare_squadre (più affidabile)
          squadrePartecipanti = squadreDaGareSquadre;
        } else if (classifica && classifica.length > 0) {
          // Usa le squadre dalla classifica
          squadrePartecipanti = classifica
            .map(c => squadreWithMembers.find(s => s.id === c.squadra_id))
            .filter(Boolean) as Squadra[];
        } else {
          // Fallback a squadra A e B
          squadrePartecipanti = [squadraA, squadraB].filter(Boolean) as Squadra[];
        }
        
        return {
          id: g.id,
          nome: g.nome,
          descrizione: g.descrizione || '',
          squadra_a_id: g.squadra_a_id,
          squadra_b_id: g.squadra_b_id,
          squadra_a: squadraA,
          squadra_b: squadraB,
          vincitore_id: g.vincitore_id,
          punti_in_palio: g.punti_in_palio,
          orario: g.orario,
          giorno: g.giorno,
          stato: g.stato as 'programmata' | 'live' | 'completata',
          classifica,
          squadre_partecipanti: squadrePartecipanti,
        };
      });

      setGare(gareList);

      // Carica prove in verifica
      const { data: proveData, error: proveError } = await supabase
        .from('prove_quest')
        .select(`
          *,
          user:users(*),
          quest:quest(*)
        `)
        .eq('stato', 'in_verifica')
        .order('created_at', { ascending: false });

      if (proveError) throw proveError;

      const proveList = (proveData || []).map((p: any) => ({
        id: p.id,
        quest_id: p.quest_id,
        user_id: p.user_id,
        user: dbRowToUser(p.user),
        quest: p.quest
          ? {
              id: p.quest.id,
              giorno: p.quest.giorno,
              titolo: p.quest.titolo,
              descrizione: p.quest.descrizione || '',
              punti: p.quest.punti,
              difficolta: p.quest.difficolta,
              tipo_prova: (p.quest.tipo_prova || []) as ('foto' | 'video' | 'testo')[],
              emoji: p.quest.emoji,
              scadenza: p.quest.scadenza || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }
          : undefined,
        tipo: p.tipo as 'foto' | 'video' | 'testo',
        contenuto: p.contenuto,
        stato: p.stato as 'pending' | 'in_verifica' | 'validata' | 'rifiutata',
        voti_positivi: p.voti_positivi,
        voti_totali: p.voti_totali,
        created_at: p.created_at,
      }));

      setProveInVerifica(proveList);

      // Carica notifiche per l'utente corrente
      if (user) {
        const { data: notificheData } = await supabase
          .from('notifiche')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const notificheList = (notificheData || []).map((n: Database['public']['Tables']['notifiche']['Row']) => ({
          id: n.id,
          user_id: n.user_id,
          titolo: n.titolo,
          messaggio: n.messaggio,
          tipo: n.tipo as 'quest' | 'gara' | 'bonus' | 'sistema',
          letta: n.letta,
          created_at: n.created_at,
        }));

        setNotifiche(notificheList);
      }

      // Carica premi
      const { data: premiData, error: premiError } = await supabase
        .from('premi')
        .select('*')
        .order('tipo', { ascending: true })
        .order('posizione_classifica', { ascending: true, nullsFirst: false })
        .order('punti_richiesti', { ascending: true, nullsFirst: false });

      if (premiError) {
        console.error('Errore caricamento premi:', premiError);
        setPremi([]);
      } else {
        console.log('[LoadData] Premi caricati:', premiData?.length || 0);
        const premiList = (premiData || []).map((p: any) => ({
          id: p.id,
          titolo: p.titolo,
          descrizione: p.descrizione || '',
          immagine: p.immagine,
          tipo: p.tipo as 'squadra' | 'singolo' | 'giornaliero' | 'speciale',
          punti_richiesti: p.punti_richiesti ?? undefined,
          posizione_classifica: p.posizione_classifica ?? undefined,
        }));
        console.log('[LoadData] Premi mappati:', premiList.length);
        setPremi(premiList);
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    }
  }, [user]);

  // Check for existing session on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        // 1) Se esiste una sessione Supabase Auth (email+password), usala come fonte di verità
        const { data: sessionData } = await supabase.auth.getSession();
        const authUserId = sessionData.session?.user?.id;
        if (authUserId) {
          const dbUser = await fetchUserById(authUserId);
          if (dbUser) {
            setLoggedInUser(dbUser, null);
            setIsLoading(false);
            return;
          }
          // Se c'è sessione ma manca la riga profilo, lasciamo l'utente disconnesso
          // (verrà creata in fase di login/registrazione email+password)
          console.warn('[Auth] Sessione trovata ma profilo users mancante');
        }

        // 2) Fallback: passkey (localStorage) — flusso legacy
        const savedUser = localStorage.getItem('30diciaccio_user');
        const savedPasskeyId = localStorage.getItem('30diciaccio_passkey_id');

        if (savedUser && savedPasskeyId) {
          const saved = JSON.parse(savedUser);
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', saved.id)
            .single();

          if (error || !data) {
            localStorage.removeItem('30diciaccio_user');
            localStorage.removeItem('30diciaccio_passkey_id');
            setIsLoading(false);
            return;
          }

          const userRow = data as Database['public']['Tables']['users']['Row'];
          if (userRow.passkey_id !== savedPasskeyId) {
            localStorage.removeItem('30diciaccio_user');
            localStorage.removeItem('30diciaccio_passkey_id');
            setIsLoading(false);
            return;
          }

          const userData = dbRowToUser(userRow);
          setLoggedInUser(userData, savedPasskeyId);
        }
      } catch (error) {
        console.error('Errore caricamento utente:', error);
        localStorage.removeItem('30diciaccio_user');
        localStorage.removeItem('30diciaccio_passkey_id');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Carica dati quando l'utente è caricato o quando Supabase è configurato
  useEffect(() => {
    if (!isLoading && isSupabaseConfigured()) {
      loadData();
    }
  }, [isLoading, loadData]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Subscribe a cambiamenti nelle squadre
    const squadreChannel = supabase
      .channel('squadre-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'squadre' },
        () => loadData()
      )
      .subscribe();

    // Subscribe a cambiamenti nelle prove
    const proveChannel = supabase
      .channel('prove-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'prove_quest' },
        () => loadData()
      )
      .subscribe();

    // Subscribe a cambiamenti nei voti
    const votiChannel = supabase
      .channel('voti-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'voti' },
        () => loadData()
      )
      .subscribe();

    // Subscribe a cambiamenti nelle gare
    const gareChannel = supabase
      .channel('gare-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'gare' },
        () => loadData()
      )
      .subscribe();

    // Subscribe a cambiamenti negli utenti
    const usersChannel = supabase
      .channel('users-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(squadreChannel);
      supabase.removeChannel(proveChannel);
      supabase.removeChannel(votiChannel);
      supabase.removeChannel(gareChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [loadData]);

  // Login con passkey esistente
  const loginWithPasskey = async (): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    setIsLoading(true);
    
    try {
      // Verifica solo supporto base (non bloccare su isSecureContext)
      if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined') {
        throw new Error('Il tuo browser non supporta le passkey. Usa Safari su iPhone/iPad o Chrome su Android.');
      }
      
      if (typeof navigator === 'undefined' || typeof navigator.credentials === 'undefined') {
        throw new Error('Il tuo browser non supporta le passkey. Usa Safari su iPhone/iPad o Chrome su Android.');
      }

      // Se abbiamo un passkey_id salvato, usalo per limitare la selezione solo a quella passkey
      // Questo evita che il browser selezioni una passkey diversa da quella appena creata
      const savedPasskeyId = localStorage.getItem('30diciaccio_passkey_id');
      console.log('[Login] 🔑 Passkey ID salvato in localStorage:', savedPasskeyId);
      
      // Autentica con passkey
      // Se abbiamo un passkey_id salvato, limitiamo la selezione solo a quello
      // Altrimenti il browser mostrerà tutte le passkey disponibili
      const { credentialId } = await authenticateWithPasskey(savedPasskeyId || undefined);
      
      console.log('[Login] 🔑 Credential ID ricevuto:', credentialId);
      console.log('[Login] 🔑 Credential ID length:', credentialId.length);

      // Cerca l'utente nel database tramite passkey_id usando funzione RPC (bypassa cache)
      const { data: userData, error: userError } = await supabase.rpc('login_with_passkey', {
        p_passkey_id: credentialId,
      } as any);

      console.log('[Login] 📝 Risultato query:', { userError, userData, userDataLength: userData ? (userData as any[]).length : 0 });

      if (userError) {
        console.error('[Login] Errore query login:', userError);
        throw new Error('Errore durante il login. Riprova.');
      }

      // La funzione RPC restituisce un array
      const userDataArray = userData as any;
      if (!userDataArray || !Array.isArray(userDataArray) || userDataArray.length === 0) {
        console.warn('[Login] Nessun account trovato per questa passkey');
        console.warn('[Login] 🔍 Debug: verifico se esiste nel database...');
        
        // Debug: verifica se esiste nel database
        const { data: allUsers } = await supabase
          .from('users')
          .select('id, nickname, passkey_id')
          .limit(10);
        console.log('[Login] 🔍 Utenti nel database:', allUsers);
        
        // Confronta i passkey_id
        if (allUsers && allUsers.length > 0) {
          allUsers.forEach((u: any) => {
            console.log('[Login] 🔍 Confronto:', {
              db_passkey_id: u.passkey_id,
              login_passkey_id: credentialId,
              match: u.passkey_id === credentialId,
              db_length: u.passkey_id?.length,
              login_length: credentialId.length
            });
          });
        }
        
        // Prova anche con query diretta per vedere se il problema è nella funzione RPC
        const { data: directQuery } = await supabase
          .from('users')
          .select('*')
          .eq('passkey_id', credentialId)
          .limit(1);
        console.log('[Login] 🔍 Query diretta risultato:', directQuery);
        
        throw new Error('Nessun account trovato per questa passkey. Registrati prima.');
      }

      const userDataRow = userDataArray[0];
      console.log('[Login] ✅ Account trovato:', userDataRow.nickname);
      const loggedInUser = dbRowToUser(userDataRow);
      
      // Nota: Non creiamo una sessione Supabase Auth perché usiamo WebAuthn
      // Le policy di storage permettono anon ma validano che l'userId esista in users
      // Quindi l'upload funzionerà anche senza sessione Supabase Auth
      
      setLoggedInUser(loggedInUser, credentialId);
      
      // Ricarica i dati
      await loadData();
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithEmailPassword = async (
    credentials: EmailPasswordCredentials
  ): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message || 'Errore durante il login con email e password');
      }

      const authUserId = data.user?.id;
      if (!authUserId) {
        throw new Error('Login riuscito ma userId mancante');
      }

      let dbUser = await fetchUserById(authUserId);
      if (!dbUser) {
        // Se l'utente Auth esiste ma non ha profilo, crealo minimal
        const nicknameFallback = credentials.email.split('@')[0] || 'utente';
        const { data: userDataArrayRaw, error: userError } = await supabase.rpc('insert_user_with_passkey', {
          p_id: authUserId,
          p_nickname: nicknameFallback,
          p_passkey_id: null,
          p_email: credentials.email,
          p_is_admin: credentials.email.toLowerCase() === 'admin@30diciaccio.it',
        } as any);

        const userDataArray = userDataArrayRaw as any[] | null;
        if (userError || !userDataArray || userDataArray.length === 0) {
          throw new Error('Login riuscito ma impossibile creare/recuperare il profilo utente');
        }

        dbUser = dbRowToUser(userDataArray[0] as any);
      }

      setLoggedInUser(dbUser, null);
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  // Registrazione con passkey (crea nuovo account e nuova passkey)
  // Crea una nuova passkey per l'utente e salva l'account nel database
  const register = async (registrationData: RegistrationData) => {
    setIsLoading(true);
    
    try {
      console.log('[Register] Inizio registrazione nuovo account...');
      
      // Verifica solo supporto base (non bloccare su isSecureContext)
      // Proveremo comunque a creare la passkey e il browser ci dirà se non può
      if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined') {
        throw new Error('Il tuo browser non supporta le passkey. Usa Safari su iPhone/iPad o Chrome su Android.');
      }
      
      if (typeof navigator === 'undefined' || typeof navigator.credentials === 'undefined') {
        throw new Error('Il tuo browser non supporta le passkey. Usa Safari su iPhone/iPad o Chrome su Android.');
      }

      if (!isSupabaseConfigured()) {
        throw new Error('Supabase non configurato');
      }

      // Verifica se l'email esiste già
      if (registrationData.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', registrationData.email)
          .single();

        if (existingUser) {
          throw new Error('Un account con questa email esiste già. Usa il login con passkey.');
        }
      }

      const userId = crypto.randomUUID();
      const displayName = `${registrationData.nome} ${registrationData.cognome}`.trim() || registrationData.nickname;

      // Crea un nome riconoscibile per la passkey
      // Il formato sarà: "30diCiaccio - Nome Cognome" o "30diCiaccio - Nickname"
      const passkeyName = `30diCiaccio - ${displayName}`;
      // Per il campo 'name' (username), usiamo anche il nome completo con prefisso
      // Alcuni browser/gestori password usano 'name' invece di 'displayName' per mostrare la passkey
      // IMPORTANTE: Alcuni browser limitano la lunghezza del campo 'name', quindi usiamo il nome completo
      const passkeyUsername = passkeyName;

      console.log('[Register] Creazione nuova passkey per:', displayName);
      console.log('[Register] Nome passkey completo:', passkeyName);
      // Registra la nuova passkey
      // Il browser chiederà all'utente di creare una nuova passkey (Face ID/Touch ID/iCloud Keychain)
      // Il nome sarà visibile nel gestore password del dispositivo (iCloud Keychain, Google Password Manager, ecc.)
      const passkeyCredential = await registerPasskey(
        userId,
        passkeyUsername, // Usa il nome completo anche come username (alcuni browser usano questo campo)
        passkeyName      // displayName con lo stesso nome
      );

      console.log('[Register] ✅ Nuova passkey creata con successo');
      console.log('[Register] 🔑 Passkey ID salvato:', passkeyCredential.id);
      console.log('[Register] 🔑 Passkey ID length:', passkeyCredential.id.length);

          // Assegna squadra casuale (bilanciata)
          const { data: squadreData } = await supabase
            .from('squadre')
        .select('id, punti_squadra')
            .order('punti_squadra', { ascending: true });
          
      const squadreIds = squadreData?.map((s: any) => s.id) || [];
          const randomSquadraId = squadreIds[Math.floor(Math.random() * squadreIds.length)] || null;

          // Carica avatar se presente
          let avatarUrl: string | null = null;
          if (registrationData.foto_profilo) {
            console.log('[Register] 📸 Caricamento avatar...');
            try {
              avatarUrl = await uploadAvatar(registrationData.foto_profilo, userId);
              if (!avatarUrl) {
                throw new Error('Errore durante il caricamento della foto profilo: URL non restituito');
              }
              console.log('[Register] ✅ Avatar caricato:', avatarUrl);
            } catch (error) {
              console.error('[Register] ❌ Errore caricamento avatar:', error);
              const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto durante il caricamento';
              throw new Error(`Errore durante il caricamento della foto profilo: ${errorMessage}`);
            }
          }

          // Crea l'utente nel database usando la funzione RPC (bypassa cache PostgREST)
          const { data: userDataArray, error: userError } = await supabase.rpc('insert_user_with_passkey', {
            p_id: userId,
            p_nickname: registrationData.nickname || `${registrationData.nome} ${registrationData.cognome}`.trim(),
            p_passkey_id: passkeyCredential.id,
            p_nome: registrationData.nome || null,
            p_cognome: registrationData.cognome || null,
            p_email: registrationData.email || null,
            p_telefono: registrationData.telefono || null,
            p_data_nascita: registrationData.data_nascita || null,
            p_squadra_id: randomSquadraId,
            p_is_admin: registrationData.email?.toLowerCase() === 'admin@30diciaccio.it',
            p_avatar: avatarUrl,
          } as any);
          
          console.log('[Register] 📝 Risultato inserimento:', { userError, userDataArray });

          if (userError || !userDataArray) {
            console.error('Errore creazione utente:', userError);
            throw new Error('Errore durante la registrazione nel database');
          }

          // La funzione RPC restituisce un array
          const userDataArrayTyped = userDataArray as any[];
          if (!Array.isArray(userDataArrayTyped) || userDataArrayTyped.length === 0) {
            console.error('Errore: funzione RPC non ha restituito dati validi');
            throw new Error('Errore durante la registrazione nel database');
          }

          const newUserData = userDataArrayTyped[0];
          
          // Verifica che il passkey_id sia stato salvato correttamente
          console.log('[Register] ✅ Utente creato:', {
            id: newUserData.id,
            nickname: newUserData.nickname,
            passkey_id_salvato: newUserData.passkey_id,
            passkey_id_originale: passkeyCredential.id,
            match: newUserData.passkey_id === passkeyCredential.id
          });

      const newUser = dbRowToUser(newUserData);
      setLoggedInUser(newUser, passkeyCredential.id);
      
      // Ricarica i dati per aggiornare le squadre con il nuovo membro
      await loadData();
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
  };

  const registerWithEmailPassword = async (
    registrationData: EmailPasswordRegistrationData
  ): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    setIsLoading(true);
    try {
      // Normalizza email (rimuovi spazi, caratteri non validi e converti in lowercase)
      // Rimuove apostrofi, virgolette e altri caratteri non validi che potrebbero essere aggiunti per errore
      let normalizedEmail = registrationData.email?.trim().toLowerCase() || '';
      
      // Rimuovi caratteri non validi che potrebbero essere stati aggiunti per errore
      // (apostrofi, virgolette, spazi extra, ecc.)
      normalizedEmail = normalizedEmail
        .replace(/['"]/g, '') // Rimuovi apostrofi e virgolette
        .replace(/\s+/g, '') // Rimuovi tutti gli spazi
        .trim();
      
      if (!normalizedEmail) {
        throw new Error('Email non valida');
      }
      
      console.log('[Register] Email normalizzata:', {
        originale: registrationData.email,
        normalizzata: normalizedEmail,
        lunghezza: normalizedEmail.length,
      });

      // Verifica email già presente usando funzione RPC (bypassa problemi RLS)
      // Nota: Se la funzione non esiste, saltiamo questo controllo (non critico)
      if (normalizedEmail) {
        try {
          const { data: emailCheck, error: checkError } = await supabase.rpc('check_email_exists', {
            p_email: normalizedEmail
          } as any);
          
          // Se la funzione esiste e trova un'email, errore
          if (emailCheck) {
            const checkArray = Array.isArray(emailCheck) ? emailCheck : [emailCheck];
            if (checkArray.length > 0) {
              const result = checkArray[0] as { email_exists: boolean; user_id: string | null };
              if (result && result.email_exists) {
                throw new Error('Un account con questa email esiste già. Prova il login.');
              }
            }
          }
          
          // Se la funzione non esiste, loggiamo ma non blocchiamo (non critico)
          if (checkError) {
            if (checkError.code === '42883' || checkError.message?.includes('function')) {
              console.warn('[Register] Funzione check_email_exists non trovata - esegui CREATE_CHECK_EMAIL_FUNCTION.sql');
            } else {
              console.warn('[Register] Errore verifica email (ignorato):', checkError);
            }
            // Non blocchiamo la registrazione - Supabase Auth controllerà comunque i duplicati
          }
        } catch (checkErr: any) {
          // Se è un errore "utente già esistente", rilanciamolo
          if (checkErr.message?.includes('esiste già')) {
            throw checkErr;
          }
          // Altrimenti ignora e continua - Supabase Auth gestirà i duplicati
          console.warn('[Register] Errore verifica email (ignorato):', checkErr);
        }
      }

      // Validazione email base (formato)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error('Formato email non valido');
      }

      console.log('[Register] Tentativo registrazione con:', {
        email: normalizedEmail,
        emailLength: normalizedEmail.length,
        passwordLength: registrationData.password.length,
      });

      // Usa Edge Function per creare utente con Admin API (bypassa validazione email)
      // La funzione usa la service role key per creare l'utente direttamente
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-user-admin`;
      
      console.log('[Register] Chiamata Edge Function:', edgeFunctionUrl);
      
      const createUserResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: registrationData.password,
          user_metadata: {
            nome: registrationData.nome || null,
            cognome: registrationData.cognome || null,
            data_nascita: registrationData.data_nascita || null,
            telefono: registrationData.telefono || null,
          },
        }),
      });

      if (!createUserResponse.ok) {
        let errorData;
        try {
          errorData = await createUserResponse.json();
        } catch (e) {
          const text = await createUserResponse.text();
          console.error('[Register] Errore Edge Function (non JSON):', {
            status: createUserResponse.status,
            text: text.substring(0, 500),
          });
          throw new Error(`Errore durante la creazione dell'utente (${createUserResponse.status})`);
        }
        
        console.error('[Register] Errore Edge Function completo:', {
          status: createUserResponse.status,
          statusText: createUserResponse.statusText,
          error: errorData,
        });
        
        const errorMessage = errorData.error || errorData.details || `Errore durante la creazione dell'utente (${createUserResponse.status})`;
        if (errorData.hint) {
          console.error('[Register] Hint:', errorData.hint);
        }
        throw new Error(errorMessage);
      }

      const createUserData = await createUserResponse.json();
      
      if (!createUserData.success || !createUserData.user) {
        console.error('[Register] Risposta Edge Function non valida:', createUserData);
        throw new Error('Registrazione fallita: risposta non valida dalla funzione');
      }

      const authUserId = createUserData.user.id;
      console.log('[Register] Utente creato con successo:', authUserId);

      // Dopo la creazione con Admin API, facciamo login per ottenere la sessione
      console.log('[Register] Eseguo login automatico per ottenere la sessione...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: registrationData.password,
      });
      
      if (loginError) {
        console.warn('[Register] Login automatico fallito:', loginError);
        // Continuiamo comunque - l'utente può fare login manualmente
      } else if (loginData.session) {
        console.log('[Register] Login automatico riuscito, sessione ottenuta');
      }

      // Assegna squadra casuale (bilanciata)
      const { data: squadreData } = await supabase
        .from('squadre')
        .select('id, punti_squadra')
        .order('punti_squadra', { ascending: true });

      const squadreIds = squadreData?.map((s: any) => s.id) || [];
      const randomSquadraId = squadreIds[Math.floor(Math.random() * squadreIds.length)] || null;

      // Avatar opzionale (ma supportato)
      let avatarUrl: string | null = null;
      if (registrationData.foto_profilo) {
        avatarUrl = await uploadAvatar(registrationData.foto_profilo, authUserId);
      }

      const nickname =
        registrationData.nickname ||
        `${registrationData.nome} ${registrationData.cognome}`.trim() ||
        registrationData.email.split('@')[0] ||
        'utente';

      // Converti data_nascita da stringa a DATE se presente
      let dataNascitaDate: Date | null = null;
      if (registrationData.data_nascita) {
        try {
          dataNascitaDate = new Date(registrationData.data_nascita);
          // Verifica che la data sia valida
          if (isNaN(dataNascitaDate.getTime())) {
            dataNascitaDate = null;
          }
        } catch {
          dataNascitaDate = null;
        }
      }

      const rpcParams = {
        p_id: authUserId,
        p_nickname: nickname,
        p_passkey_id: null,
        p_nome: registrationData.nome || null,
        p_cognome: registrationData.cognome || null,
        p_email: normalizedEmail || null,
        p_telefono: registrationData.telefono || null,
        p_data_nascita: dataNascitaDate ? dataNascitaDate.toISOString().split('T')[0] : null,
        p_squadra_id: randomSquadraId,
        p_is_admin: normalizedEmail?.toLowerCase() === 'admin@30diciaccio.it',
        p_avatar: avatarUrl,
      };
      
      console.log('[Register] Chiamata RPC insert_user_with_passkey con parametri:', {
        ...rpcParams,
        p_id: authUserId,
        p_squadra_id: randomSquadraId,
      });

      const { data: userDataArray, error: userError } = await supabase.rpc('insert_user_with_passkey', rpcParams as any);

      if (userError) {
        console.error('[Register] Errore dettagliato creazione profilo:', {
          error: userError,
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
        });
        const errorMessage = userError.message || userError.details || 'Errore durante la creazione del profilo utente';
        throw new Error(errorMessage);
      }

      const userDataArrayTyped = userDataArray as any[] | null;
      if (!userDataArrayTyped || userDataArrayTyped.length === 0) {
        console.error('[Register] Nessun dato restituito dalla funzione:', { userDataArray });
        throw new Error('Errore durante la creazione del profilo utente: nessun dato restituito');
      }
      
      console.log('[Register] Profilo utente creato con successo:', userDataArrayTyped[0]);

      const newUser = dbRowToUser(userDataArrayTyped[0] as any);
      setLoggedInUser(newUser, null);
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  // Login/Register - gestisce sia login con passkey esistente che registrazione con nuova passkey
  const login = async (registrationData: RegistrationData) => {
    console.log('[Auth] Tentativo login/registrazione...');
    
    // Prima prova a fare login con passkey esistente
    // Il browser mostrerà tutte le passkey disponibili per questo dominio
    // Se l'utente ne seleziona una, la usiamo per il login
    // Se l'utente annulla o non ci sono passkey, procediamo con la registrazione
    try {
      console.log('[Auth] Tentativo login con passkey esistente...');
      await loginWithPasskey();
      console.log('[Auth] ✅ Login con passkey esistente riuscito');
      return;
    } catch (error: any) {
      console.log('[Auth] Login con passkey fallito:', error.message);
      
      // Se il login fallisce perché:
      // 1. Nessuna passkey trovata (utente annulla o non ha passkey)
      // 2. Nessun account trovato nel database per quella passkey
      // Allora procediamo con la registrazione (crea nuova passkey)
      if (
        error.message?.includes('Nessun account trovato') || 
        error.message?.includes('Nessuna passkey trovata') ||
        error.message?.includes('Autenticazione annullata') ||
        error.name === 'NotFoundError'
      ) {
        console.log('[Auth] Procedo con registrazione (creazione nuova passkey)...');
        // Procedi con la registrazione - crea una nuova passkey
        await register(registrationData);
        console.log('[Auth] ✅ Registrazione con nuova passkey riuscita');
      } else {
        // Se è un altro errore (es. SecurityError, NotSupportedError), rilanciarlo
        console.error('[Auth] ❌ Errore durante login:', error);
        throw error;
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('30diciaccio_user');
    localStorage.removeItem('30diciaccio_passkey_id');
    // Best-effort: se l'utente è loggato via Supabase Auth (email+password), esegui signOut
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  const submitProva = async (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string | File) => {
    if (!user || !isSupabaseConfigured()) return;
    
    try {
      let contenutoUrl = '';
      
      // Se è un file, fai upload
      if (contenuto instanceof File) {
        const uploadedUrl = await uploadProofFile(contenuto, user.id, questId);
        if (!uploadedUrl) {
          throw new Error('Errore durante l\'upload del file. Nessun URL restituito.');
        }
        contenutoUrl = uploadedUrl;
      } else {
        contenutoUrl = contenuto;
      }

      // Salva la prova nel database
      const { data, error } = await supabase
        .from('prove_quest')
        .insert({
      quest_id: questId,
      user_id: user.id,
      tipo,
          contenuto: contenutoUrl,
      stato: 'in_verifica',
      voti_positivi: 0,
      voti_totali: 0,
        } as any)
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      // Segna la quest come completata nell'assegnazione
      // Assicurati che il giorno sia sempre tra 1 e 3 (il constraint del database lo richiede)
      const giornoRaw = gameState.giorno_corrente;
      const giornoCorrente = (giornoRaw >= 1 && giornoRaw <= 3) ? giornoRaw : 1;
      const { error: updateError } = await (supabase
        .from('user_quest_assignments') as any)
        .update({ completed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .eq('giorno', giornoCorrente);
      
      if (updateError) {
        console.error('Errore aggiornamento quest completata:', updateError);
      } else {
        console.log('[Submit Prova] ✅ Quest marcata come completata');
      }

      // Aggiorna lo stato locale delle quest immediatamente
      setQuests(prev => prev.map(q => 
        q.id === questId
          ? {
              ...q,
              completed: true,
              prova: {
                id: provaData.id as string,
                stato: provaData.stato as any,
                voti_positivi: provaData.voti_positivi ?? 0,
                voti_totali: provaData.voti_totali ?? 0,
              },
            }
          : q
      ));

      // Aggiorna lo stato locale della prova
      const provaData: any = data;
      const nuovaProva: ProvaQuest = {
        id: provaData.id as string,
        quest_id: provaData.quest_id,
        user_id: provaData.user_id,
        user: dbRowToUser(provaData.user as Database['public']['Tables']['users']['Row']),
        tipo: provaData.tipo as 'foto' | 'video' | 'testo',
        contenuto: provaData.contenuto,
        stato: provaData.stato as 'pending' | 'in_verifica' | 'validata' | 'rifiutata',
        voti_positivi: provaData.voti_positivi,
        voti_totali: provaData.voti_totali,
        created_at: provaData.created_at,
      };

      setProveInVerifica(prev => [nuovaProva, ...prev]);

      // Ricarica i dati per sincronizzare con il database
      await loadData();
    } catch (error) {
      console.error('Errore submit prova:', error);
      throw error;
    }
  };

  const votaProva = async (provaId: string, valore: boolean) => {
    if (!user || !isSupabaseConfigured()) return;
    
    try {
      // Verifica se l'utente ha già votato
      const { data: existingVote } = await supabase
        .from('voti')
        .select('*')
        .eq('prova_id', provaId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        throw new Error('Hai già votato per questa prova');
      }

      // Inserisci il voto (il trigger aggiornerà automaticamente la prova)
      const { error } = await supabase
        .from('voti')
        .insert({
          prova_id: provaId,
          user_id: user.id,
          valore,
        } as any);

      if (error) throw error;

      // Ricarica i dati per vedere gli aggiornamenti (il trigger ha già aggiornato tutto)
      await loadData();
    } catch (error) {
      console.error('Errore voto prova:', error);
      throw error;
    }
  };

  const assegnaVincitore = async (garaId: string, vincitoreId: string) => {
    if (!isSupabaseConfigured()) return;
    
    try {
      // Usa la funzione del database
      const { error } = await supabase.rpc('assign_gara_winner', {
        p_gara_id: garaId,
        p_vincitore_id: vincitoreId,
      } as any);

      if (error) throw error;

      // Ricarica i dati
      await loadData();
    } catch (error) {
      console.error('Errore assegnazione vincitore:', error);
      throw error;
    }
  };

  const assegnaClassifica = async (
    garaId: string, 
    classifiche: Array<{squadra_id: string, posizione: number}>
  ) => {
    if (!isSupabaseConfigured()) return;
    
    try {
      // Converti le classifiche in formato JSONB
      const classificheJsonb = classifiche.map(c => ({
        squadra_id: c.squadra_id,
        posizione: c.posizione,
      }));

      // Usa la funzione del database
      const { error } = await supabase.rpc('assegna_classifica_gara', {
        p_gara_id: garaId,
        p_classifiche: classificheJsonb as any,
      } as any);

      if (error) throw error;

      // Ricarica i dati
      await loadData();
    } catch (error) {
      console.error('Errore assegnazione classifica:', error);
      throw error;
    }
  };

  const creaGara = async (gara: {
    nome: string;
    descrizione: string;
    squadra_a_id: string;
    squadra_b_id: string;
    squadre_ids: string[]; // Tutte le squadre partecipanti
    punti_in_palio: number;
    orario: string;
    giorno: number;
  }) => {
    if (!user || !user.is_admin || !isSupabaseConfigured()) {
      throw new Error('Solo gli admin possono creare gare');
    }
    
    try {
      console.log('[Crea Gara] Dati gara:', {
        nome: gara.nome,
        squadra_a_id: gara.squadra_a_id,
        squadra_b_id: gara.squadra_b_id,
        squadre_ids: gara.squadre_ids,
        punti_in_palio: gara.punti_in_palio,
        orario: gara.orario,
        giorno: gara.giorno,
      });

      // Crea la gara (salva le prime due squadre in squadra_a_id e squadra_b_id per retrocompatibilità)
      const { data: garaData, error } = await supabase
        .from('gare')
        .insert({
          nome: gara.nome,
          descrizione: gara.descrizione,
          squadra_a_id: gara.squadra_a_id,
          squadra_b_id: gara.squadra_b_id,
          punti_in_palio: gara.punti_in_palio,
          orario: gara.orario,
          giorno: gara.giorno,
          stato: 'programmata',
        } as any)
        .select()
        .single();

      if (error) {
        console.error('[Crea Gara] Errore database:', error);
        throw new Error(`Errore durante la creazione della gara: ${error.message}`);
      }

      if (!garaData) {
        throw new Error('Errore: la gara non è stata creata');
      }

      console.log('[Crea Gara] ✅ Gara creata con successo:', garaData);

      // Salva tutte le squadre partecipanti nella tabella gare_squadre
      if (gara.squadre_ids && gara.squadre_ids.length > 0) {
        const { error: squadreError } = await supabase.rpc('aggiungi_squadre_a_gara', {
          p_gara_id: (garaData as any).id,
          p_squadre_ids: gara.squadre_ids,
        } as any);

        if (squadreError) {
          console.error('[Crea Gara] Errore salvataggio squadre:', squadreError);
          // Non facciamo fallire la creazione della gara, ma loggiamo l'errore
          console.warn('[Crea Gara] ⚠️ Gara creata ma alcune squadre non sono state salvate');
        } else {
          console.log('[Crea Gara] ✅ Squadre partecipanti salvate:', gara.squadre_ids);
        }
      }

      await loadData();
    } catch (error) {
      console.error('[Crea Gara] Errore completo:', error);
      throw error;
    }
  };

  const aggiungiBonus = async (userId: string, punti: number, motivo: string) => {
    if (!user || !user.is_admin || !isSupabaseConfigured()) {
      throw new Error('Solo gli admin possono assegnare bonus punti');
    }
    
    try {
      console.log('[Aggiungi Bonus] Dati bonus:', {
        userId,
        adminId: user.id,
        punti,
        motivo,
      });

      // Inserisci il bonus
      const { data: bonusData, error: bonusError } = await supabase
        .from('bonus_punti')
        .insert({
          user_id: userId,
          admin_id: user.id,
          punti,
          motivo,
        } as any)
        .select();

      if (bonusError) {
        console.error('[Aggiungi Bonus] Errore inserimento bonus:', bonusError);
        throw new Error(`Errore durante l'inserimento del bonus: ${bonusError.message}`);
      }

      console.log('[Aggiungi Bonus] ✅ Bonus inserito:', bonusData);

      // Aggiorna i punti dell'utente
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('punti_personali')
        .eq('id', userId)
        .single();

      if (userDataError) {
        console.error('[Aggiungi Bonus] Errore lettura utente:', userDataError);
        throw new Error(`Errore durante la lettura dei dati utente: ${userDataError.message}`);
      }

      if (userData) {
        const userRow = userData as any;
        const currentPunti = userRow.punti_personali || 0;
        const newPunti = currentPunti + punti;
        
        console.log('[Aggiungi Bonus] Aggiornamento punti:', {
          currentPunti,
          puntiBonus: punti,
          newPunti,
        });

        const { error: updateError } = await (supabase
          .from('users') as any)
          .update({ punti_personali: newPunti })
          .eq('id', userId);

        if (updateError) {
          console.error('[Aggiungi Bonus] Errore aggiornamento punti:', updateError);
          throw new Error(`Errore durante l'aggiornamento dei punti: ${updateError.message}`);
        }

        console.log('[Aggiungi Bonus] ✅ Punti aggiornati');
      }

      // Crea notifica
      const { error: notificaError } = await supabase
        .from('notifiche')
        .insert({
          user_id: userId,
          titolo: 'Bonus Punti! 🎁',
          messaggio: `Hai ricevuto ${punti} punti bonus: ${motivo}`,
          tipo: 'bonus',
        } as any);

      if (notificaError) {
        console.error('[Aggiungi Bonus] ⚠️ Errore creazione notifica:', notificaError);
        // Non blocchiamo il processo se la notifica fallisce
      } else {
        console.log('[Aggiungi Bonus] ✅ Notifica creata');
      }

      // Ricarica i dati
      await loadData();
      
      console.log('[Aggiungi Bonus] ✅ Processo completato con successo');
    } catch (error) {
      console.error('[Aggiungi Bonus] ❌ Errore completo:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  // Update user avatar
  const updateAvatar = async (file: File) => {
    if (!user) {
      throw new Error('Devi essere loggato per aggiornare l\'avatar');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      console.log('[Update Avatar] Inizio aggiornamento avatar...');
      
      // Carica il file su storage
      const avatarUrl = await uploadAvatar(file, user.id);
      
      if (!avatarUrl) {
        throw new Error('Errore durante il caricamento dell\'avatar');
      }

      console.log('[Update Avatar] Avatar caricato:', avatarUrl);

      // Aggiorna il campo avatar nella tabella users
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({ avatar: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('[Update Avatar] Errore aggiornamento database:', updateError);
        throw new Error(`Errore durante l'aggiornamento dell'avatar: ${updateError.message}`);
      }

      console.log('[Update Avatar] ✅ Avatar aggiornato con successo');

      // Ricarica i dati dell'utente
      const updatedUser = await fetchUserById(user.id);
      if (updatedUser) {
        setLoggedInUser(updatedUser);
      }

      // Ricarica tutti i dati per aggiornare l'avatar ovunque
      await loadData();
    } catch (error) {
      console.error('[Update Avatar] ❌ Errore completo:', error);
      throw error;
    }
  };

  // Squadre management (admin only)
  const creaSquadra = async (squadra: { nome: string; emoji: string; colore: string; userIds?: string[] }) => {
    if (!user?.is_admin) {
      throw new Error('Solo gli admin possono creare squadre');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      // Crea la squadra
      const { data, error } = await supabase
        .from('squadre')
        .insert({
          nome: squadra.nome,
          emoji: squadra.emoji,
          colore: squadra.colore,
          punti_squadra: 0,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('[Crea Squadra] Errore:', error);
        throw new Error(`Errore durante la creazione della squadra: ${error.message}`);
      }

      console.log('[Crea Squadra] ✅ Squadra creata:', data);

      // Se ci sono utenti da assegnare, assegnali alla squadra
      if (squadra.userIds && squadra.userIds.length > 0 && data) {
        const squadraId = (data as any).id;
        const { error: updateError } = await (supabase
          .from('users') as any)
          .update({ squadra_id: squadraId })
          .in('id', squadra.userIds);

        if (updateError) {
          console.error('[Crea Squadra] Errore assegnazione utenti:', updateError);
          // Non facciamo fallire la creazione della squadra, ma loggiamo l'errore
          console.warn('[Crea Squadra] ⚠️ Squadra creata ma alcuni utenti non sono stati assegnati');
        } else {
          console.log('[Crea Squadra] ✅ Utenti assegnati alla squadra');
        }
      }

      await loadData();
    } catch (error) {
      console.error('[Crea Squadra] ❌ Errore completo:', error);
      throw error;
    }
  };

  const modificaSquadra = async (squadraId: string, updates: { nome?: string; emoji?: string; colore?: string }) => {
    if (!user?.is_admin) {
      throw new Error('Solo gli admin possono modificare squadre');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      const updateData: any = {};
      if (updates.nome !== undefined) updateData.nome = updates.nome;
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji;
      if (updates.colore !== undefined) updateData.colore = updates.colore;

      if (Object.keys(updateData).length === 0) {
        throw new Error('Nessun campo da aggiornare');
      }

      const { error } = await (supabase
        .from('squadre') as any)
        .update(updateData)
        .eq('id', squadraId);

      if (error) {
        console.error('[Modifica Squadra] Errore:', error);
        throw new Error(`Errore durante la modifica della squadra: ${error.message}`);
      }

      console.log('[Modifica Squadra] ✅ Squadra modificata');
      await loadData();
    } catch (error) {
      console.error('[Modifica Squadra] ❌ Errore completo:', error);
      throw error;
    }
  };

  const eliminaSquadra = async (squadraId: string) => {
    if (!user?.is_admin) {
      throw new Error('Solo gli admin possono eliminare squadre');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      // Verifica se ci sono membri nella squadra
      const { data: membriData, error: membriError } = await supabase
        .from('users')
        .select('id')
        .eq('squadra_id', squadraId);

      if (membriError) {
        console.error('[Elimina Squadra] Errore verifica membri:', membriError);
        throw new Error(`Errore durante la verifica dei membri: ${membriError.message}`);
      }

      if (membriData && membriData.length > 0) {
        throw new Error(`Impossibile eliminare la squadra: ci sono ancora ${membriData.length} membri assegnati. Rimuovi prima i membri dalla squadra.`);
      }

      // Verifica se ci sono gare associate
      const { data: gareData, error: gareError } = await supabase
        .from('gare')
        .select('id')
        .or(`squadra_a_id.eq.${squadraId},squadra_b_id.eq.${squadraId}`);

      if (gareError) {
        console.error('[Elimina Squadra] Errore verifica gare:', gareError);
        throw new Error(`Errore durante la verifica delle gare: ${gareError.message}`);
      }

      if (gareData && gareData.length > 0) {
        throw new Error(`Impossibile eliminare la squadra: ci sono ancora ${gareData.length} gare associate. Elimina prima le gare.`);
      }

      // Elimina la squadra
      const { error } = await supabase
        .from('squadre')
        .delete()
        .eq('id', squadraId);

      if (error) {
        console.error('[Elimina Squadra] Errore:', error);
        throw new Error(`Errore durante l'eliminazione della squadra: ${error.message}`);
      }

      console.log('[Elimina Squadra] ✅ Squadra eliminata');
      await loadData();
    } catch (error) {
      console.error('[Elimina Squadra] ❌ Errore completo:', error);
      throw error;
    }
  };

  const cambiaSquadraUtente = async (userId: string, nuovaSquadraId: string | null) => {
    if (!user?.is_admin) {
      throw new Error('Solo gli admin possono cambiare la squadra degli utenti');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      setIsLoading(true);
      console.log('[Cambia Squadra Utente] Cambio squadra per utente:', userId, '→', nuovaSquadraId);

      // Se nuovaSquadraId è null, rimuovi l'utente dalla squadra
      // Altrimenti verifica che la squadra esista
      if (nuovaSquadraId !== null) {
        const { data: squadraData, error: squadraError } = await supabase
          .from('squadre')
          .select('id')
          .eq('id', nuovaSquadraId)
          .single();

        if (squadraError || !squadraData) {
          throw new Error(`Squadra non trovata: ${squadraError?.message || 'Squadra inesistente'}`);
        }
      }

      // Aggiorna la squadra dell'utente
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({ squadra_id: nuovaSquadraId })
        .eq('id', userId);

      if (updateError) {
        console.error('[Cambia Squadra Utente] Errore aggiornamento:', updateError);
        throw new Error(`Errore durante l'aggiornamento della squadra: ${updateError.message}`);
      }

      console.log('[Cambia Squadra Utente] ✅ Squadra utente aggiornata');
      await loadData(); // Refresh data per aggiornare le squadre con i nuovi membri
    } catch (error) {
      console.error('[Cambia Squadra Utente] ❌ Errore completo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const assegnaPuntiQuestSpeciale = async (provaId: string) => {
    if (!user?.is_admin) {
      throw new Error('Solo gli admin possono assegnare punti alle quest speciali');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      setIsLoading(true);
      console.log('[Assegna Punti Quest Speciale] Assegnazione punti per prova:', provaId);

      const { error } = await supabase.rpc('assegna_punti_quest_speciale', {
        p_prova_id: provaId,
        p_admin_id: user.id,
      } as any);

      if (error) {
        console.error('[Assegna Punti Quest Speciale] Errore:', error);
        throw new Error(`Errore durante l'assegnazione punti: ${error.message}`);
      }

      console.log('[Assegna Punti Quest Speciale] ✅ Punti assegnati');
      await loadData();
    } catch (error) {
      console.error('[Assegna Punti Quest Speciale] ❌ Errore completo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const creaPremio = async (premio: { titolo: string; descrizione?: string; immagine: string; tipo: 'squadra' | 'singolo' | 'giornaliero' | 'speciale'; punti_richiesti: number | null; posizione_classifica?: number }) => {
    if (!user?.is_admin) {
      throw new Error('Solo gli admin possono creare premi');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      setIsLoading(true);
      console.log('[Crea Premio] Creazione premio:', premio);

      // Prepara i dati per l'insert
      const insertData: any = {
        titolo: premio.titolo,
        descrizione: premio.descrizione || null,
        immagine: premio.immagine,
        tipo: premio.tipo,
      };

      if (premio.tipo === 'squadra') {
        // Per premi di squadra: punti_richiesti = null, posizione_classifica = numero
        insertData.punti_richiesti = null;
        if (premio.posizione_classifica && premio.posizione_classifica > 0) {
          insertData.posizione_classifica = premio.posizione_classifica;
        } else {
          throw new Error('Posizione classifica deve essere un numero maggiore di 0 per i premi di squadra');
        }
      } else {
        // Per altri premi: posizione_classifica = null, punti_richiesti = numero
        insertData.posizione_classifica = null;
        if (premio.punti_richiesti && premio.punti_richiesti > 0) {
          insertData.punti_richiesti = premio.punti_richiesti;
        } else {
          throw new Error('Punti richiesti deve essere un numero maggiore di 0');
        }
      }

      console.log('[Crea Premio] Dati insert:', insertData);

      const { data: newPremio, error } = await supabase
        .from('premi')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[Crea Premio] Errore:', error);
        throw new Error(`Errore durante la creazione del premio: ${error.message}`);
      }

      console.log('[Crea Premio] ✅ Premio creato:', newPremio);
      
      // Ricarica i dati per aggiornare la lista
      await loadData();
    } catch (error) {
      console.error('[Crea Premio] ❌ Errore completo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const eliminaPremio = async (premioId: string) => {
    if (!user?.is_admin) {
      throw new Error('Solo gli admin possono eliminare premi');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configurato');
    }

    try {
      setIsLoading(true);
      console.log('[Elimina Premio] Eliminazione premio:', premioId);

      const { error } = await supabase
        .from('premi')
        .delete()
        .eq('id', premioId);

      if (error) {
        console.error('[Elimina Premio] Errore:', error);
        throw new Error(`Errore durante l'eliminazione del premio: ${error.message}`);
      }

      console.log('[Elimina Premio] ✅ Premio eliminato');
      await loadData();
    } catch (error) {
      console.error('[Elimina Premio] ❌ Errore completo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Computed values
  const mySquadra = user?.squadra_id 
    ? squadre.find(s => s.id === user.squadra_id) || null 
    : null;

  const leaderboardSquadre = [...squadre].sort((a, b) => b.punti_squadra - a.punti_squadra);
  
  // Calcola leaderboard singoli da tutti gli utenti (inclusi quelli senza squadra)
  const leaderboardSingoli = [...allUsers]
    .sort((a, b) => {
      // Calcola punti totali per ogni utente
      const squadraA = squadre.find(s => s.id === a.squadra_id);
      const squadraB = squadre.find(s => s.id === b.squadra_id);
      const puntiTotaliA = Math.round(a.punti_personali * 0.7 + (squadraA?.punti_squadra || 0) * 0.3);
      const puntiTotaliB = Math.round(b.punti_personali * 0.7 + (squadraB?.punti_squadra || 0) * 0.3);
      return puntiTotaliB - puntiTotaliA;
    });

  const value: GameContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    squadre,
    quests,
    gare,
    proveInVerifica,
    gameState,
    notifiche,
    premi,
    login,
    loginWithPasskey,
    loginWithEmailPassword,
    register,
    registerWithEmailPassword,
    logout,
    submitProva,
    votaProva,
    assegnaVincitore,
    assegnaClassifica,
    creaGara,
    aggiungiBonus,
    refreshData,
    updateAvatar,
    creaSquadra,
    modificaSquadra,
    eliminaSquadra,
    cambiaSquadraUtente,
    assegnaPuntiQuestSpeciale,
    creaPremio,
    eliminaPremio,
    mySquadra,
    leaderboardSquadre,
    leaderboardSingoli,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
