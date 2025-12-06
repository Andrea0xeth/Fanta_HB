import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Squadra, Quest, ProvaQuest, Gara, GameState, Notifica } from '../types';

// Mock data per demo (quando Supabase non è configurato)
const mockSquadre: Squadra[] = [
  { id: '1', nome: 'Tigri Pazze', emoji: '🐯', punti_squadra: 325, colore: '#FF6B6B', membri: [] },
  { id: '2', nome: 'Pecore Volanti', emoji: '🐑', punti_squadra: 298, colore: '#4ECDC4', membri: [] },
  { id: '3', nome: 'Matti del Bosco', emoji: '🌲', punti_squadra: 267, colore: '#FFE66D', membri: [] },
  { id: '4', nome: 'Leoni Ruggenti', emoji: '🦁', punti_squadra: 245, colore: '#FF9F43', membri: [] },
  { id: '5', nome: 'Aquile Veloci', emoji: '🦅', punti_squadra: 212, colore: '#6C5CE7', membri: [] },
  { id: '6', nome: 'Lupi Notturni', emoji: '🐺', punti_squadra: 189, colore: '#A29BFE', membri: [] },
];

const mockQuests: Quest[] = [
  {
    id: '1',
    giorno: 1,
    titolo: 'Fai 10 flessioni',
    descrizione: 'Filmati mentre fai 10 flessioni complete!',
    punti: 25,
    difficolta: 'media',
    tipo_prova: ['video'],
    emoji: '💪',
    scadenza: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    giorno: 1,
    titolo: 'Selfie con sconosciuto',
    descrizione: 'Fatti un selfie con una persona che non conosci!',
    punti: 35,
    difficolta: 'difficile',
    tipo_prova: ['foto'],
    emoji: '🤳',
    scadenza: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    giorno: 1,
    titolo: 'Imita Di Ciaccio',
    descrizione: 'Video imitazione della risata di Di Ciaccio!',
    punti: 50,
    difficolta: 'epica',
    tipo_prova: ['video'],
    emoji: '🎭',
    scadenza: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
  },
];

const mockGare: Gara[] = [
  {
    id: '1',
    nome: 'Birra Flip',
    descrizione: 'Chi riesce a fare il flip della birra più velocemente!',
    squadra_a_id: '1',
    squadra_b_id: '2',
    squadra_a: mockSquadre[0],
    squadra_b: mockSquadre[1],
    vincitore_id: null,
    punti_in_palio: 50,
    orario: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    giorno: 1,
    stato: 'programmata',
  },
  {
    id: '2',
    nome: 'Karaoke Battle',
    descrizione: 'Sfida di karaoke tra le squadre!',
    squadra_a_id: '3',
    squadra_b_id: '4',
    squadra_a: mockSquadre[2],
    squadra_b: mockSquadre[3],
    vincitore_id: null,
    punti_in_palio: 75,
    orario: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    giorno: 1,
    stato: 'programmata',
  },
];

const mockProve: ProvaQuest[] = [
  {
    id: '1',
    quest_id: '1',
    user_id: '2',
    user: { id: '2', nickname: 'Pippo', squadra_id: '1', punti_personali: 85, is_admin: false, created_at: '' },
    tipo: 'video',
    contenuto: 'https://example.com/video1.mp4',
    stato: 'in_verifica',
    voti_positivi: 4,
    voti_totali: 6,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    quest_id: '2',
    user_id: '3',
    user: { id: '3', nickname: 'Pluto', squadra_id: '2', punti_personali: 62, is_admin: false, created_at: '' },
    tipo: 'foto',
    contenuto: 'https://example.com/foto1.jpg',
    stato: 'in_verifica',
    voti_positivi: 3,
    voti_totali: 5,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

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
  login: (nickname: string) => Promise<void>;
  logout: () => void;
  submitProva: (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string) => Promise<void>;
  votaProva: (provaId: string, valore: boolean) => Promise<void>;
  assegnaVincitore: (garaId: string, vincitoreId: string) => Promise<void>;
  aggiungiBonus: (userId: string, punti: number, motivo: string) => Promise<void>;
  
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
  const [squadre, setSquadre] = useState<Squadra[]>(mockSquadre);
  const [quests] = useState<Quest[]>(mockQuests);
  const [gare, setGare] = useState<Gara[]>(mockGare);
  const [proveInVerifica, setProveInVerifica] = useState<ProvaQuest[]>(mockProve);
  const [notifiche] = useState<Notifica[]>([]);
  
  const [gameState] = useState<GameState>({
    giorno_corrente: 1,
    evento_iniziato: true,
    data_inizio: new Date().toISOString(),
    data_fine: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('30diciaccio_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Login with passkey simulation
  const login = async (nickname: string) => {
    setIsLoading(true);
    
    // Simulate passkey auth delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Assign random team
    const randomSquadra = squadre[Math.floor(Math.random() * squadre.length)];
    
    const newUser: User = {
      id: crypto.randomUUID(),
      nickname: nickname || `Giocatore${Math.floor(Math.random() * 1000)}`,
      squadra_id: randomSquadra.id,
      punti_personali: 0,
      is_admin: nickname.toLowerCase() === 'admin', // Secret admin mode
      created_at: new Date().toISOString(),
    };
    
    setUser(newUser);
    localStorage.setItem('30diciaccio_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('30diciaccio_user');
  };

  const submitProva = async (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string) => {
    if (!user) return;
    
    const nuovaProva: ProvaQuest = {
      id: crypto.randomUUID(),
      quest_id: questId,
      user_id: user.id,
      user: user,
      tipo,
      contenuto,
      stato: 'in_verifica',
      voti_positivi: 0,
      voti_totali: 0,
      created_at: new Date().toISOString(),
    };
    
    setProveInVerifica(prev => [...prev, nuovaProva]);
  };

  const votaProva = async (provaId: string, valore: boolean) => {
    setProveInVerifica(prev => prev.map(prova => {
      if (prova.id === provaId) {
        const nuoviVotiPositivi = prova.voti_positivi + (valore ? 1 : 0);
        const nuoviVotiTotali = prova.voti_totali + 1;
        const percentualePositivi = nuoviVotiPositivi / nuoviVotiTotali;
        
        // Se >= 66% e almeno 3 voti, valida automaticamente
        const nuovoStato = nuoviVotiTotali >= 3 && percentualePositivi >= 0.66 
          ? 'validata' 
          : prova.stato;
        
        return {
          ...prova,
          voti_positivi: nuoviVotiPositivi,
          voti_totali: nuoviVotiTotali,
          stato: nuovoStato,
        };
      }
      return prova;
    }));
  };

  const assegnaVincitore = async (garaId: string, vincitoreId: string) => {
    setGare(prev => prev.map(gara => {
      if (gara.id === garaId) {
        return {
          ...gara,
          vincitore_id: vincitoreId,
          stato: 'completata' as const,
        };
      }
      return gara;
    }));
    
    // Aggiorna punti squadra vincitrice
    const gara = gare.find(g => g.id === garaId);
    if (gara) {
      setSquadre(prev => prev.map(squadra => {
        if (squadra.id === vincitoreId) {
          return {
            ...squadra,
            punti_squadra: squadra.punti_squadra + gara.punti_in_palio,
          };
        }
        return squadra;
      }));
    }
  };

  const aggiungiBonus = async (userId: string, punti: number, motivo: string) => {
    // In una vera implementazione, questo aggiornerebbe il database
    console.log(`Bonus di ${punti} punti assegnato a ${userId} per: ${motivo}`);
  };

  // Computed values
  const mySquadra = user?.squadra_id 
    ? squadre.find(s => s.id === user.squadra_id) || null 
    : null;

  const leaderboardSquadre = [...squadre].sort((a, b) => b.punti_squadra - a.punti_squadra);
  
  const leaderboardSingoli: User[] = [
    { id: '1', nickname: 'Pippo', squadra_id: '1', punti_personali: 125, is_admin: false, created_at: '' },
    { id: '2', nickname: 'Topolino', squadra_id: '2', punti_personali: 98, is_admin: false, created_at: '' },
    { id: '3', nickname: 'Pluto', squadra_id: '3', punti_personali: 87, is_admin: false, created_at: '' },
    { id: '4', nickname: 'Paperino', squadra_id: '1', punti_personali: 76, is_admin: false, created_at: '' },
    { id: '5', nickname: 'Minnie', squadra_id: '4', punti_personali: 65, is_admin: false, created_at: '' },
    ...(user ? [user] : []),
  ].sort((a, b) => b.punti_personali - a.punti_personali);

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
    logout,
    submitProva,
    votaProva,
    assegnaVincitore,
    aggiungiBonus,
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
