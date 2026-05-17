import { create } from 'zustand';

export type BlockData = {
  position: [number, number, number];
  size: [number, number, number];
  isPerfect?: boolean; 
  comboLevel?: number; 
  // theme özelliğini tamamen kaldırdık çünkü artık tek bir fotorealistik beton konseptimiz var.
};

export type CityBuilding = {
  id: string;
  gridX: number; 
  gridZ: number; 
  blocks: BlockData[]; 
  score: number;
};

export type FloatingTextData = {
  id: string;
  text: string;
  isPerfect: boolean;
};

interface GameStore {
  score: number;
  highScore: number;
  combo: number;
  gameState: 'idle' | 'playing' | 'gameover' | 'city_view'; 
  blocks: BlockData[];
  debris: BlockData[]; 
  cityBuildings: CityBuilding[];
  floatingTexts: FloatingTextData[];
  actionTrigger: number;
  
  initGameData: () => void;
  startGame: () => void;
  triggerDrop: () => void;
  addBlock: (block: BlockData, isPerfect: boolean) => void;
  addDebris: (debrisPiece: BlockData) => void;
  removeFloatingText: (id: string) => void;
  setGameOver: () => void;
  changeState: (state: 'idle' | 'city_view') => void;
}

const initialBlock: BlockData = { 
  position: [0, 0, 0], 
  size: [3, 1, 3], 
  isPerfect: false, 
  comboLevel: 0
};

export const useGameStore = create<GameStore>((set, get) => ({
  score: 0,
  highScore: 0,
  combo: 0,
  blocks: [initialBlock],
  debris: [],
  cityBuildings: [],
  floatingTexts: [],
  gameState: 'idle',
  actionTrigger: 0,

  initGameData: () => {
    if (typeof window !== 'undefined') {
      const savedScore = localStorage.getItem('monolith_highscore');
      const savedCity = localStorage.getItem('monolith_city');
      set({
        highScore: savedScore ? parseInt(savedScore) : 0,
        cityBuildings: savedCity ? JSON.parse(savedCity) : []
      });
    }
  },

  startGame: () => set({ 
    score: 0, 
    combo: 0, 
    blocks: [initialBlock],
    debris: [],
    floatingTexts: [],
    gameState: 'playing',
    actionTrigger: 0
  }),

  triggerDrop: () => set((state) => ({ 
    actionTrigger: state.actionTrigger + 1 
  })),

  addBlock: (block, isPerfect) => set((state) => {
    const newCombo = isPerfect ? state.combo + 1 : 0;
    
    const points = isPerfect ? 100 * newCombo : 50;
    let msg = `+${points}`;
    if (isPerfect) {
      msg = newCombo > 3 ? `UNSTOPPABLE! +${points}` : `PERFECT! +${points}`;
    }

    const newFloatingText: FloatingTextData = {
      id: Math.random().toString(),
      text: msg,
      isPerfect: isPerfect
    };

    return {
      blocks: [...state.blocks, { ...block, isPerfect, comboLevel: newCombo }],
      score: state.score + points,
      combo: newCombo,
      floatingTexts: [...state.floatingTexts, newFloatingText]
    };
  }),

  removeFloatingText: (id) => set((state) => ({
    floatingTexts: state.floatingTexts.filter(t => t.id !== id)
  })),

  addDebris: (debrisPiece) => set((state) => ({
    debris: [...state.debris, debrisPiece]
  })),

  setGameOver: () => {
    const { score, highScore, blocks, cityBuildings } = get();
    const newHighScore = score > highScore ? score : highScore;

    if (typeof window !== 'undefined') {
      if (score > highScore) localStorage.setItem('monolith_highscore', newHighScore.toString());
      if (blocks.length > 1) {
        const gridX = (Math.floor(Math.random() * 5) - 2) * 5;
        const gridZ = (Math.floor(Math.random() * 5) - 2) * 5;
        const newBuilding: CityBuilding = { id: Date.now().toString(), gridX, gridZ, blocks, score };
        const updatedCity = [...cityBuildings, newBuilding];
        localStorage.setItem('monolith_city', JSON.stringify(updatedCity));
        set({ cityBuildings: updatedCity });
      }
    }
    set({ gameState: 'gameover', highScore: newHighScore });
  },

  changeState: (newState) => set({ gameState: newState })
}));