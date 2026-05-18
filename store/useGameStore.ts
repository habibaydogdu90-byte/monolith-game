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
  
  // YENİ EKLENENLER: Kalıcı Ekonomi ve Rekor
  highScore: number;
  credits: number;
  
  startGame: () => void;
  triggerDrop: () => void;
  addBlock: (block: BlockData, isPerfect: boolean, isGrowth?: boolean) => void;
  addDebris: (debris: BlockData) => void;
  setGameOver: () => void;
  removeFloatingText: (id: number) => void;
  initGameData: () => void;
}

const INITIAL_BLOCK: BlockData = { position: [0, 0, 0], size: [3, 1, 3] };

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      blocks: [INITIAL_BLOCK],
      debris: [],
      gameState: 'idle',
      score: 0,
      combo: 0,
      actionTrigger: 0,
      floatingTexts: [],
      highScore: 0, // Başlangıç rekoru
      credits: 0,   // Başlangıç parası

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
        
        // YENİ: Ekonomi Mantığı (Perfect yapan daha çok kazanır)
        let earnedCredits = isPerfect ? 5 : 1;
        if (isGrowth) earnedCredits += 25; // Kurtarma hamlesine büyük ödül
        
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
          credits: state.credits + earnedCredits, // Parayı kasaya ekle
          floatingTexts: [...state.floatingTexts, newText]
        };
      }),

      addDebris: (debris) => set((state) => ({ debris: [...state.debris, debris] })),

      // YENİ: Oyun bittiğinde rekor kırılmış mı kontrol et
      setGameOver: () => set((state) => ({ 
        gameState: 'gameover',
        highScore: Math.max(state.highScore, state.score) 
      })),

      removeFloatingText: (id) => set((state) => ({
        floatingTexts: state.floatingTexts.filter(t => t.id !== id)
      })),

      initGameData: () => set({ gameState: 'idle' })
    }),
    {
      name: 'edush-monolith-storage', // Tarayıcıdaki veritabanı adı
      // Sadece highScore ve credits değerlerini kalıcı yap, diğerleri her oyunda sıfırlansın
      partialize: (state) => ({ highScore: state.highScore, credits: state.credits }),
    }
  )
);