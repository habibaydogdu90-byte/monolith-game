'use client';
import { useEffect } from 'react';
import MonolithScene from '@/components/MonolithScene';
import { useGameStore, FloatingTextData } from '@/store/useGameStore';
import { initAudio } from '@/utils/soundEngine';

// Uçuşan Yazı Bileşeni (Taslaktaki gibi merkezde belirecek)
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
  const { score, combo, gameState, cityBuildings, floatingTexts, startGame, triggerDrop, initGameData } = useGameStore();

  useEffect(() => {
    initGameData();
  }, [initGameData]);

  // Ekrana tıklama yönetimi
  const handleInteraction = (e?: React.PointerEvent) => {
    // Menü butonlarına tıklanırsa oyun alanına tıklanmış sayma
    if (e && (e.target as HTMLElement).closest('button.ui-btn')) return;

    initAudio(); 
    if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'playing') {
      triggerDrop();
    }
  };

  return (
    <main 
      className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden font-sans select-none touch-none"
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
        
        {/* ÜST BAR (Taslaktaki gibi) */}
        <header className="w-full p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          
          {/* Sol Kısım: Ayarlar, Progress ve Bina İkonu */}
          <div className="flex gap-5 items-center">
            <button className="ui-btn w-12 h-12 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded-md flex items-center justify-center shadow-lg pointer-events-auto hover:bg-neutral-600 transition-colors">
              {/* Ayarlar İkonu */}
              <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </button>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-[0.2em] mb-1">PROGRESS</span>
              <div className="w-32 h-2.5 bg-neutral-900 border border-neutral-700 rounded-full overflow-hidden shadow-inner">
                {/* Altın Progress Bar */}
                <div className="w-[65%] h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-200"></div>
              </div>
            </div>

            <div className="flex flex-col items-center ml-2">
              <div className="w-8 h-8 rounded-full border border-neutral-600 bg-neutral-800/50 flex items-center justify-center">
                {/* Bina İkonu */}
                <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 font-bold">9/10</span>
            </div>
          </div>

          {/* Sağ Kısım: Score ve Credits */}
          <div className="flex gap-8 text-right pr-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-[0.2em]">SCORE</span>
              <span className="text-3xl font-light text-white tracking-wider">{score.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-[0.2em]">CREDITS</span>
              <div className="flex items-center gap-1 justify-end mt-1">
                {/* Elmas İkonu */}
                <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.73 7.73a1 1 0 01-.15-1.12l4-7a1 1 0 01.8-.45h5.24a1 1 0 01.8.45l4 7a1 1 0 01-.15 1.12l-7 8a1 1 0 01-1.5 0l-7-8z"></path>
                </svg>
                <span className="text-xl font-light text-cyan-50 tracking-wider">1,240</span>
              </div>
            </div>
          </div>
        </header>

        {/* ORTA EKRAN: Uçuşan Yazılar ve Kombo Durumu */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {floatingTexts.map(item => (
             <FloatingTextItem key={item.id} data={item} />
          ))}
          
          {/* Taslaktaki Sabit Perfect Combo Yazısı */}
          {combo > 1 && (
            <div className="absolute top-[55%] text-yellow-400/90 text-sm font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              {combo}x PERFECT COMBO
            </div>
          )}

          {gameState === 'idle' && (
            <div className="absolute top-[40%] text-white text-3xl font-light tracking-[0.3em] animate-pulse">
              TAP TO START
            </div>
          )}
        </div>

        {/* ALT PANEL (Taslaktaki Şehir ve Butonlar) */}
        <div className="w-full flex flex-col pointer-events-none">
          
          {/* Ayırıcı Çizgi ve Başlık */}
          <div className="w-full bg-gradient-to-b from-neutral-800 to-neutral-900 border-t border-b border-neutral-700/50 py-1.5 text-center">
            <span className="text-[10px] text-neutral-400 tracking-[0.3em] uppercase font-semibold">The Sanctuary</span>
          </div>

          {/* Arka Planı Koyulaşan Kontrol Paneli */}
          <div className="relative h-48 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end pb-8">
            
            {/* Şehir Başlığı */}
            <div className="absolute top-4 w-full text-center">
              <span className="text-xs text-neutral-500 tracking-[0.3em] uppercase">City of Monoliths</span>
            </div>

            {/* Butonlar */}
            <div className="w-full max-w-lg px-6 flex justify-between items-center pointer-events-auto">
              
              {/* Upgrades Butonu */}
              <button className="ui-btn px-5 py-3.5 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded flex-1 max-w-[120px] shadow-lg hover:brightness-110 active:scale-95 transition-all">
                <span className="text-[10px] text-neutral-300 tracking-[0.2em] font-semibold">UPGRADES</span>
              </button>

              {/* Dev TAP TO DROP Butonu */}
              <button 
                className="ui-btn w-32 h-32 rounded-full border-[6px] border-neutral-800 bg-gradient-to-b from-neutral-700 to-neutral-900 flex items-center justify-center relative shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:scale-105 active:scale-95 transition-all z-20 mx-4"
                onPointerDown={(e) => {
                  e.stopPropagation(); // Tıklamanın arkaya geçmesini engeller
                  handleInteraction();
                }}
              >
                {/* Altın Halka Işığı */}
                <div className="absolute inset-1 rounded-full border border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-neutral-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                  </svg>
                  <span className="text-[11px] text-neutral-200 tracking-[0.2em] font-bold text-center leading-tight">TAP TO<br/>DROP</span>
                </div>
              </button>

              {/* Leaderboard Butonu */}
              <button className="ui-btn px-5 py-3.5 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 rounded flex-1 max-w-[120px] shadow-lg hover:brightness-110 active:scale-95 transition-all">
                <span className="text-[10px] text-neutral-300 tracking-[0.2em] font-semibold">LEADERBOARD</span>
              </button>
              
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}