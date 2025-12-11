import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Squadra, Quest, ProvaQuest, Gara, GameState, Notifica, RegistrationData } from '../types';
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
  
  // Actions
  login: (registrationData: RegistrationData) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  register: (registrationData: RegistrationData) => Promise<void>;
  logout: () => void;
  submitProva: (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string | File) => Promise<void>;
  votaProva: (provaId: string, valore: boolean) => Promise<void>;
  assegnaVincitore: (garaId: string, vincitoreId: string) => Promise<void>;
  aggiungiBonus: (userId: string, punti: number, motivo: string) => Promise<void>;
  refreshData: () => Promise<void>;
  
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
  const [quests, setQuests] = useState<Quest[]>([]);
  const [gare, setGare] = useState<Gara[]>([]);
  const [proveInVerifica, setProveInVerifica] = useState<ProvaQuest[]>([]);
  const [notifiche, setNotifiche] = useState<Notifica[]>([]);
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

      // Carica quest del giorno corrente
      const giornoCorrente = gameStateData ? (gameStateData as Database['public']['Tables']['game_state']['Row']).giorno_corrente : 1;
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

      // Carica gare
      const { data: gareData, error: gareError } = await supabase
        .from('gare')
        .select('*')
        .order('orario', { ascending: true });

      if (gareError) throw gareError;

      const gareList = (gareData || []).map((g: Database['public']['Tables']['gare']['Row']) => {
        const squadraA = squadreWithMembers.find(s => s.id === g.squadra_a_id);
        const squadraB = squadreWithMembers.find(s => s.id === g.squadra_b_id);
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
        };
      });

      setGare(gareList);

      // Carica prove in verifica
      const { data: proveData, error: proveError } = await supabase
        .from('prove_quest')
        .select(`
          *,
          user:users(*)
        `)
        .eq('stato', 'in_verifica')
        .order('created_at', { ascending: false });

      if (proveError) throw proveError;

      const proveList = (proveData || []).map((p: any) => ({
        id: p.id,
        quest_id: p.quest_id,
        user_id: p.user_id,
        user: dbRowToUser(p.user),
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
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    }
  }, [user]);

  // Check for existing session on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedUser = localStorage.getItem('30diciaccio_user');
      const savedPasskeyId = localStorage.getItem('30diciaccio_passkey_id');
      
      if (savedUser && savedPasskeyId && isSupabaseConfigured()) {
        try {
          // Verifica che l'utente esista ancora nel database
        const user = JSON.parse(savedUser);
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (error || !data) {
              // Utente non trovato, pulisci localStorage
              localStorage.removeItem('30diciaccio_user');
              localStorage.removeItem('30diciaccio_passkey_id');
              setIsLoading(false);
              return;
            }
            
          // Verifica che la passkey corrisponda ancora
          const userRow = data as Database['public']['Tables']['users']['Row'];
          if (userRow.passkey_id !== savedPasskeyId) {
            // Passkey cambiata, richiedi nuovo login
            localStorage.removeItem('30diciaccio_user');
            localStorage.removeItem('30diciaccio_passkey_id');
            setIsLoading(false);
            return;
          }
          
            const userData = dbRowToUser(data as Database['public']['Tables']['users']['Row']);
          setUser(userData);
        } catch (error) {
          console.error('Errore caricamento utente:', error);
          // In caso di errore, pulisci e richiedi nuovo login
          localStorage.removeItem('30diciaccio_user');
          localStorage.removeItem('30diciaccio_passkey_id');
        }
      }
      
      setIsLoading(false);
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
      setUser(loggedInUser);
      localStorage.setItem('30diciaccio_user', JSON.stringify(loggedInUser));
      localStorage.setItem('30diciaccio_passkey_id', credentialId);
      
      // Ricarica i dati
      await loadData();
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      throw error;
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
            avatarUrl = await uploadAvatar(registrationData.foto_profilo, userId);
            if (!avatarUrl) {
              throw new Error('Errore durante il caricamento della foto profilo');
            }
            console.log('[Register] ✅ Avatar caricato:', avatarUrl);
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
        setUser(newUser);
        localStorage.setItem('30diciaccio_user', JSON.stringify(newUser));
        localStorage.setItem('30diciaccio_passkey_id', passkeyCredential.id);
      
      // Ricarica i dati per aggiornare le squadre con il nuovo membro
      await loadData();
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      throw error;
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
  };

  const submitProva = async (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string | File) => {
    if (!user || !isSupabaseConfigured()) return;
    
    try {
      let contenutoUrl = '';
      
      // Se è un file, fai upload
      if (contenuto instanceof File) {
        const uploadedUrl = await uploadProofFile(contenuto, user.id, questId);
        if (!uploadedUrl) {
          throw new Error('Errore durante l\'upload del file');
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

      // Aggiorna lo stato locale
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

  const aggiungiBonus = async (userId: string, punti: number, motivo: string) => {
    if (!user || !user.is_admin || !isSupabaseConfigured()) return;
    
    try {
      // Inserisci il bonus
      const { error: bonusError } = await supabase
        .from('bonus_punti')
        .insert({
          user_id: userId,
          admin_id: user.id,
          punti,
          motivo,
        } as any);

      if (bonusError) throw bonusError;

      // Aggiorna i punti dell'utente
      const { data: userData } = await supabase
        .from('users')
        .select('punti_personali')
        .eq('id', userId)
        .single();

      if (userData) {
        const userRow = userData as any;
        const newPunti = (userRow.punti_personali || 0) + punti;
        const { error: updateError } = await (supabase
          .from('users') as any)
          .update({ punti_personali: newPunti })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      // Crea notifica
      await supabase
        .from('notifiche')
        .insert({
          user_id: userId,
          titolo: 'Bonus Punti! 🎁',
          messaggio: `Hai ricevuto ${punti} punti bonus: ${motivo}`,
          tipo: 'bonus',
        } as any);

      // Ricarica i dati
      await loadData();
    } catch (error) {
      console.error('Errore aggiunta bonus:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  // Computed values
  const mySquadra = user?.squadra_id 
    ? squadre.find(s => s.id === user.squadra_id) || null 
    : null;

  const leaderboardSquadre = [...squadre].sort((a, b) => b.punti_squadra - a.punti_squadra);
  
  // Calcola leaderboard singoli dai dati reali
  const leaderboardSingoli = squadre
    .flatMap(s => s.membri)
    .sort((a, b) => b.punti_personali - a.punti_personali);

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
    login,
    loginWithPasskey,
    register,
    logout,
    submitProva,
    votaProva,
    assegnaVincitore,
    aggiungiBonus,
    refreshData,
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
