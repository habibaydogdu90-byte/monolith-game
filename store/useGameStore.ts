import { create } from 'zustand';

export interface BlockData {
  position: [number, number, number];
  size: [number, number, number];
  isPerfect?: boolean;
}

export interface FloatingTextData {
  id: number;
  text: string;
  isPerfect: boolean;
}

interface GameState {
  blocks: BlockData[];
  debris: BlockData[];
  gameState: 'idle' | 'playing' | 'gameover' | 'city_view';
  score: number;
  combo: number;
  actionTrigger: number;
  floatingTexts: FloatingTextData[];
  
  startGame: () => void;
  triggerDrop: () => void;
  // isGrowth parametresini ekledik
  addBlock: (block: BlockData, isPerfect: boolean, isGrowth?: boolean) => void;
  addDebris: (debris: BlockData) => void;
  setGameOver: () => void;
  removeFloatingText: (id: number) => void;
  initGameData: () => void;
}

const INITIAL_BLOCK: BlockData = { position: [0, 0, 0], size: [3, 1, 3] };

export const useGameStore = create<GameState>((set) => ({
  blocks: [INITIAL_BLOCK],
  debris: [],
  gameState: 'idle',
  score: 0,
  combo: 0,
  actionTrigger: 0,
  floatingTexts: [],

  startGame: () => set({
    blocks: [INITIAL_BLOCK],
    debris: [],
    gameState: 'playing',
    score: 0,
    combo: 0,
    actionTrigger: 0,
    floatingTexts: []
  }),

  triggerDrop: () => set((state) => ({ actionTrigger: state.actionTrigger + 1 })),

  addBlock: (block, isPerfect, isGrowth = false) => set((state) => {
    const newCombo = isPerfect ? state.combo + 1 : 0;
    
    // Büyüme (Restoration) yaparsa ekstra 50 bonus puan alır
    let points = isPerfect ? 10 * newCombo : 5;
    if (isGrowth) points += 50; 
    
    // Ekranda çıkacak dinamik yazılar
    let text = isPerfect ? (isGrowth ? "RESTORED!" : "PERFECT") : "GOOD";
    // Eğer bloğun canı çok azaldıysa ve hata yaptıysa uyarı ver
    if (!isPerfect && newCombo === 0 && (block.size[0] < 0.8 || block.size[2] < 0.8)) text = "DANGER!";
    
    const newText: FloatingTextData = {
      id: Date.now(),
      text: text,
      isPerfect: isPerfect || isGrowth
    };

    return {
      blocks: [...state.blocks, { ...block, isPerfect }],
      combo: newCombo,
      score: state.score + points,
      floatingTexts: [...state.floatingTexts, newText]
    };
  }),

  addDebris: (debris) => set((state) => ({ debris: [...state.debris, debris] })),

  setGameOver: () => set({ gameState: 'gameover' }),

  removeFloatingText: (id) => set((state) => ({
    floatingTexts: state.floatingTexts.filter(t => t.id !== id)
  })),

  initGameData: () => set({ gameState: 'idle' })
}));