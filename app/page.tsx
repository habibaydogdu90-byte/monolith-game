'use client';
import { useEffect } from 'react';
import MonolithScene from '@/components/MonolithScene';
import { useGameStore, FloatingTextData } from '@/store/useGameStore';
import { initAudio } from '@/utils/soundEngine';

// Uçuşan Yazı Bileşeni
function FloatingTextItem({ data }: { data: FloatingTextData }) {
  const removeFloatingText = useGameStore(state => state.removeFloatingText);

  useEffect(() => {
    const timer = setTimeout(() => removeFloatingText(data.id), 1000);
    return () => clearTimeout(timer);
  }, [data.id, removeFloatingText]);

  return (
    <div 
      className={`absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 font-medium tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)] pointer-events-none custom-float-anim whitespace-nowrap
        ${data.isPerfect ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-lg'}`}
    >
      {data.text}
    </div>
  );
}

export default function Home() {
  const { score, combo, gameState, floatingTexts, startGame, triggerDrop, initGameData } = useGameStore();

  useEffect(() => {
    initGameData();
  }, [initGameData]);

  // Ekrana tıklama yönetimi
  const handleInteraction = (e?: React.PointerEvent) => {
    if (e && (e.target as HTMLElement).closest('button.ui-btn')) return;

    initAudio(); 
    if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'playing') {
      triggerDrop();
    }
  };

  return (
    // DÜZELTME 1: h-screen yerine h-[100dvh] kullanarak telefon ekranından taşmayı engelledik.
    <main 
      className="relative w-full h-[100dvh] bg-[#0a0a0a] overflow-hidden font-sans select-none touch-none"
      onPointerDown={handleInteraction} 
    >
      {/* Özel Animasyonlar */}
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

      {/* ARKA PLAN 3D SAHNE */}
      <MonolithScene />

      {/* --- ARAYÜZ (UI) KATMANI --- */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        
        {/* ÜST BAR */}
        <header className="w-full p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex gap-5 items-center">
            <button className="ui-btn w-12 h-12 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded-md flex items-center justify-center shadow-lg pointer-events-auto hover:bg-neutral-600 transition-colors">
              <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </button>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-[0.2em] mb-1">PROGRESS</span>
              <div className="w-32 h-2.5 bg-neutral-900 border border-neutral-700 rounded-full overflow-hidden shadow-inner">
                <div className="w-[65%] h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-200"></div>
              </div>
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
                <span className="text-xl font-light text-cyan-50 tracking-wider">1,240</span>
              </div>
            </div>
          </div>
        </header>

        {/* ORTA EKRAN: Uçuşan Yazılar, Başlangıç ve Oyun Bitiş Ekranları */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {gameState === 'playing' && floatingTexts.map(item => (
             <FloatingTextItem key={item.id} data={item} />
          ))}
          
          {gameState === 'playing' && combo > 1 && (
            <div className="absolute top-[60%] text-yellow-400/90 text-sm font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              {combo}x PERFECT COMBO
            </div>
          )}

          {gameState === 'idle' && (
            <div className="absolute top-[35%] text-white text-3xl font-light tracking-[0.3em] animate-pulse drop-shadow-2xl">
              TAP TO START
            </div>
          )}

          {/* DÜZELTME 2: Oyun Bitti (Game Over) Ekranı Eklendi */}
          {gameState === 'gameover' && (
            <div className="z-50 flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-md border border-neutral-800 rounded-xl shadow-[0_0_50px_rgba(0,0,0,1)] pointer-events-auto">
              <h2 className="text-red-500/90 text-3xl md:text-5xl font-black tracking-[0.3em] uppercase mb-2">Structure Failed</h2>
              <p className="text-neutral-400 text-sm md:text-base tracking-[0.2em] mb-8 uppercase">Final Score: <span className="text-white font-bold">{score}</span></p>
              
              <button 
                onPointerDown={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="ui-btn px-8 py-4 bg-gradient-to-b from-yellow-600 to-yellow-800 border border-yellow-500/50 rounded-md text-black font-bold tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:scale-105 active:scale-95 transition-all"
              >
                Rebuild
              </button>
            </div>
          )}
        </div>

        {/* ALT PANEL */}
        <div className="w-full flex flex-col pointer-events-none">
          <div className="w-full bg-gradient-to-b from-neutral-800 to-neutral-900 border-t border-b border-neutral-700/50 py-1.5 text-center">
            <span className="text-[10px] text-neutral-400 tracking-[0.3em] uppercase font-semibold">The Sanctuary</span>
          </div>

          <div className="relative h-40 md:h-48 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end pb-6 md:pb-8">
            <div className="absolute top-2 w-full text-center">
              <span className="text-[10px] md:text-xs text-neutral-500 tracking-[0.3em] uppercase">City of Monoliths</span>
            </div>

            <div className="w-full px-4 md:px-6 flex justify-center md:justify-between items-center pointer-events-auto gap-4">
              
              <button className="ui-btn hidden md:flex px-5 py-3.5 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded flex-1 max-w-[120px] shadow-lg">
                <span className="text-[10px] text-neutral-300 tracking-[0.2em] font-semibold">UPGRADES</span>
              </button>

              <button 
                className="ui-btn w-28 h-28 md:w-32 md:h-32 rounded-full border-[6px] border-neutral-800 bg-gradient-to-b from-neutral-700 to-neutral-900 flex items-center justify-center relative shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:scale-105 active:scale-95 transition-all z-20 shrink-0"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleInteraction();
                }}
              >
                <div className="absolute inset-1 rounded-full border border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-neutral-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                  </svg>
                  <span className="text-[9px] md:text-[11px] text-neutral-200 tracking-[0.2em] font-bold text-center leading-tight">TAP TO<br/>DROP</span>
                </div>
              </button>

              <button className="ui-btn hidden md:flex px-5 py-3.5 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded flex-1 max-w-[120px] shadow-lg">
                <span className="text-[10px] text-neutral-300 tracking-[0.2em] font-semibold">LEADERBOARD</span>
              </button>
              
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}