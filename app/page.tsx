'use client';
import { useEffect, useState } from 'react';
import MonolithScene from '@/components/MonolithScene';
import { useGameStore, FloatingTextData } from '@/store/useGameStore';
import { initAudio } from '@/utils/soundEngine';

interface FloatingTextItemProps {
  data: FloatingTextData;
}

function FloatingTextItem({ data }: FloatingTextItemProps) {
  const removeFloatingText = useGameStore(state => state.removeFloatingText);

  useEffect(() => {
    const timer = setTimeout(() => removeFloatingText(data.id), 1000);
    return () => clearTimeout(timer);
  }, [data.id, removeFloatingText]);

  return (
    <div 
      className={`absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 font-medium tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)] pointer-events-none custom-float-anim whitespace-nowrap z-30
        ${data.isPerfect ? 'text-yellow-400 text-2xl font-bold' : 'text-gray-300 text-lg'}`}
    >
      {data.text}
    </div>
  );
}

export default function Home() {
  const { 
    score, combo, gameState, floatingTexts, startGame, triggerDrop, initGameData, 
    credits, highScore, currentSkin, unlockedSkins, buySkin, equipSkin 
  } = useGameStore();
  
  const [mounted, setMounted] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    initGameData();
  }, [initGameData]);

  const handleInteraction = (e?: React.PointerEvent) => {
    if (e && (e.target as HTMLElement).closest('.ui-btn')) return;
    if (isShopOpen) return;

    initAudio(); 
    if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'playing') {
      triggerDrop();
    }
  };

  // MAĞAZA ÜRÜN LİSTESİ
  const shopItems = [
    { id: 'default', name: 'Brutalist Concrete', cost: 0, color: 'bg-neutral-600' },
    { id: 'cyber', name: 'Cyber Neon', cost: 100, color: 'bg-emerald-400' },
    { id: 'obsidian', name: 'Obsidian Gold', cost: 250, color: 'bg-amber-500' },
    { id: 'ruby', name: 'Ruby Crystal', cost: 500, color: 'bg-rose-600' },
  ];

  return (
    <main 
      className="relative w-full h-[100dvh] bg-[#0a0a0a] overflow-hidden font-sans select-none touch-none"
      onPointerDown={handleInteraction} 
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.9); }
          15% { opacity: 1; transform: translate(-50%, -10px) scale(1.1); }
          80% { opacity: 1; transform: translate(-50%, -30px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -40px) scale(0.9); }
        }
        .custom-float-anim {
          animation: floatUp 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}} />

      <MonolithScene />

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        <header className="w-full p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex gap-5 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-[0.2em] mb-1">BEST RECORD</span>
              <span className="text-sm text-yellow-500/90 font-bold tracking-wider">
                {mounted ? highScore.toLocaleString() : '0'}
              </span>
            </div>
          </div>

          <div className="flex gap-8 text-right pr-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-[0.2em]">SCORE</span>
              <span className="text-3xl font-light text-white tracking-wider">{score.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-[0.2em]">CREDITS</span>
              <div className="flex items-center gap-1 justify-end mt-1">
                <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.73 7.73a1 1 0 01-.15-1.12l4-7a1 1 0 01.8-.45h5.24a1 1 0 01.8.45l4 7a1 1 0 01-.15 1.12l-7 8a1 1 0 01-1.5 0l-7-8z"></path>
                </svg>
                <span className="text-xl font-light text-cyan-50 tracking-wider">
                  {mounted ? credits.toLocaleString() : '...'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ORTA PANEL METİNLERİ */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          {gameState === 'playing' && floatingTexts.map(item => (
             <FloatingTextItem key={item.id} data={item} />
          ))}
          
          {gameState === 'playing' && combo > 1 && (
            <div className="absolute top-[60%] text-yellow-400/90 text-sm font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              {combo}x COMBO
            </div>
          )}

          {gameState === 'idle' && !isShopOpen && (
            <div className="absolute top-[35%] text-white text-3xl font-light tracking-[0.3em] animate-pulse drop-shadow-2xl">
              TAP TO START
            </div>
          )}

          {gameState === 'gameover' && !isShopOpen && (
            <div className="z-50 flex flex-col items-center justify-center p-8 bg-black/90 backdrop-blur-md border border-neutral-800 rounded-xl shadow-[0_0_50px_rgba(0,0,0,1)] pointer-events-auto min-w-[300px]">
              <h2 className="text-red-500/90 text-3xl font-black tracking-[0.3em] uppercase mb-4">Structure Failed</h2>
              
              <div className="flex w-full justify-between items-center mb-2 px-4 py-2 bg-white/5 rounded">
                <span className="text-neutral-400 text-xs tracking-[0.2em] uppercase">Score</span>
                <span className="text-white text-xl font-bold">{score.toLocaleString()}</span>
              </div>
              
              <div className="flex w-full justify-between items-center mb-8 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <span className="text-yellow-500/80 text-xs tracking-[0.2em] uppercase">Best</span>
                <span className="text-yellow-400 text-xl font-bold">{Math.max(score, highScore).toLocaleString()}</span>
              </div>
              
              <button 
                onPointerDown={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="ui-btn px-8 py-4 w-full bg-gradient-to-b from-neutral-200 to-neutral-400 rounded-md text-black font-black tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* ALTYAPI BUTONLARI VE FOOTER */}
        <div className="w-full flex flex-col pointer-events-none z-20">
          <div className="w-full bg-gradient-to-b from-neutral-800 to-neutral-900 border-t border-b border-neutral-700/50 py-1.5 text-center">
            <span className="text-[10px] text-neutral-400 tracking-[0.3em] uppercase font-semibold">The Sanctuary</span>
          </div>

          <div className="relative h-40 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end pb-6">
            <div className="w-full px-6 flex justify-between items-center pointer-events-auto max-w-md mx-auto gap-4">
              
              {/* UPGRADES ARTIK AKTİF VE MOBİLDE GÖRÜNÜR */}
              <button 
                onPointerDown={(e) => { e.stopPropagation(); setIsShopOpen(true); }}
                className="ui-btn px-4 py-3 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded flex-1 shadow-lg active:scale-95 transition-all"
              >
                <span className="text-[10px] text-cyan-400 tracking-[0.2em] font-bold">UPGRADES</span>
              </button>

              <button 
                className="ui-btn w-24 h-24 rounded-full border-[6px] border-neutral-800 bg-gradient-to-b from-neutral-700 to-neutral-900 flex items-center justify-center relative shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:scale-105 active:scale-95 transition-all shrink-0"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleInteraction();
                }}
              >
                <div className="absolute inset-1 rounded-full border border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-neutral-200 tracking-[0.2em] font-bold text-center leading-tight">TAP</span>
                </div>
              </button>

              <button className="ui-btn px-4 py-3 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded flex-1 shadow-lg opacity-40 cursor-not-allowed">
                <span className="text-[10px] text-yellow-500 tracking-[0.2em] font-bold">RANKS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAĞAZA MODAL PANELİ ================= */}
      {mounted && isShopOpen && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl relative">
            
            <header className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
              <h3 className="text-white font-bold tracking-[0.2em] text-lg uppercase">Core Upgrades</h3>
              <div className="flex items-center gap-1 bg-cyan-950/50 border border-cyan-800/30 px-3 py-1 rounded text-cyan-400 text-sm font-bold">
                <span>{credits}</span>
                <span className="text-xs">CR</span>
              </div>
            </header>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto mb-6 pr-1">
              {shopItems.map((item) => {
                const isOwned = unlockedSkins.includes(item.id);
                const isActive = currentSkin === item.id;

                return (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-neutral-950 rounded border border-neutral-800/60">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${item.color} shadow-lg`} />
                      <span className="text-sm text-neutral-200 font-medium tracking-wide">{item.name}</span>
                    </div>

                    <div className="pointer-events-auto">
                      {isActive ? (
                        <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase border border-emerald-500/25 px-2 py-1 rounded bg-emerald-950/20">Equipped</span>
                      ) : isOwned ? (
                        <button 
                          onPointerDown={(e) => { e.stopPropagation(); equipSkin(item.id); }}
                          className="ui-btn text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-3 py-1 rounded transition-colors"
                        >
                          Equip
                        </button>
                      ) : (
                        <button 
                          onPointerDown={(e) => { 
                            e.stopPropagation(); 
                            buySkin(item.id, item.cost); 
                          }}
                          disabled={credits < item.cost}
                          className={`ui-btn text-xs font-bold px-3 py-1 rounded transition-all
                            ${credits >= item.cost 
                              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md' 
                              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'}`}
                        >
                          {item.cost} CR
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onPointerDown={(e) => { e.stopPropagation(); setIsShopOpen(false); }}
              className="ui-btn w-full py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-300 text-xs font-bold tracking-[0.2em] uppercase transition-colors"
            >
              Back To Sanctuary
            </button>
          </div>
        </div>
      )}
    </main>
  );
}