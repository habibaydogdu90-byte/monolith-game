import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  highScore: number;
  credits: number;
  
  // MAĞAZA DEVLET DEĞİŞKENLERİ
  currentSkin: string;
  unlockedSkins: string[];
  
  startGame: () => void;
  triggerDrop: () => void;
  addBlock: (block: BlockData, isPerfect: boolean, isGrowth?: boolean) => void;
  addDebris: (debris: BlockData) => void;
  setGameOver: () => void;
  removeFloatingText: (id: number) => void;
  initGameData: () => void;
  
  // MAĞAZA FONKSİYONLARI
  buySkin: (skinId: string, cost: number) => boolean;
  equipSkin: (skinId: string) => void;
}

const INITIAL_BLOCK: BlockData = { position: [0, 0, 0], size: [3, 1, 3] };

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      blocks: [INITIAL_BLOCK],
      debris: [],
      gameState: 'idle',
      score: 0,
      combo: 0,
      actionTrigger: 0,
      floatingTexts: [],
      highScore: 0,
      credits: 0,
      
      // Varsayılan Mağaza Verileri
      currentSkin: 'default',
      unlockedSkins: ['default'],

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
        let points = isPerfect ? 10 * newCombo : 5;
        if (isGrowth) points += 50; 
        
        let earnedCredits = isPerfect ? 5 : 1;
        if (isGrowth) earnedCredits += 25; 
        
        let text = isPerfect ? (isGrowth ? "RESTORED!" : "PERFECT") : "GOOD";
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
          credits: state.credits + earnedCredits,
          floatingTexts: [...state.floatingTexts, newText]
        };
      }),

      addDebris: (debris) => set((state) => ({ debris: [...state.debris, debris] })),

      setGameOver: () => set((state) => ({ 
        gameState: 'gameover',
        highScore: Math.max(state.highScore, state.score) 
      })),

      removeFloatingText: (id) => set((state) => ({
        floatingTexts: state.floatingTexts.filter(t => t.id !== id)
      })),

      initGameData: () => set({ gameState: 'idle' }),

      // Satın Alma Sistemi
      buySkin: (skinId, cost) => {
        const state = get();
        if (state.credits >= cost && !state.unlockedSkins.includes(skinId)) {
          set({
            credits: state.credits - cost,
            unlockedSkins: [...state.unlockedSkins, skinId],
            currentSkin: skinId // Otomatik kuşan
          });
          return true;
        }
        return false;
      },

      // Kuşanma Sistemi
      equipSkin: (skinId) => {
        if (get().unlockedSkins.includes(skinId)) {
          set({ currentSkin: skinId });
        }
      }
    }),
    {
      name: 'edush-monolith-storage',
      partialize: (state) => ({ 
        highScore: state.highScore, 
        credits: state.credits,
        currentSkin: state.currentSkin,
        unlockedSkins: state.unlockedSkins
      }),
    }
  )
);