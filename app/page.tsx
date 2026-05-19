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
      className={`absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 font-light tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)] pointer-events-none custom-float-anim whitespace-nowrap z-30
        ${data.isPerfect ? 'text-yellow-400 text-xl font-medium' : 'text-gray-400 text-lg'}`}
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
  
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{name: string, score: number}[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    initGameData();
  }, [initGameData]);

const handleInteraction = (e?: React.PointerEvent) => {
    if (e && (e.target as HTMLElement).closest('.ui-btn')) return;
    if (e && (e.target as HTMLElement).tagName === 'INPUT') return; 
    if (isShopOpen || isLeaderboardOpen) return;

    // YENİ: Haptic Feedback (Titreşim)
    // Eğer cihaz destekliyorsa (telefon/tablet), ekrana dokunulduğunda 15 milisaniyelik tok ve kısa bir titreşim verir.
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    initAudio(); 
    if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'playing') {
      triggerDrop();
    }
  };

  const shopItems = [
    { id: 'default', name: 'Brutalist Concrete', cost: 0, color: 'bg-neutral-600' },
    { id: 'cyber', name: 'Cyber Neon', cost: 100, color: 'bg-emerald-400' },
    { id: 'obsidian', name: 'Obsidian Gold', cost: 250, color: 'bg-amber-500' },
    { id: 'ruby', name: 'Ruby Crystal', cost: 500, color: 'bg-rose-600' },
  ];

  const submitScore = async (e: React.PointerEvent) => {
    e.stopPropagation();
    if(playerName.length < 3) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        body: JSON.stringify({ name: playerName, score: score })
      });
      openLeaderboard();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLeaderboard = async () => {
    setIsLeaderboardOpen(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboardData(data);
    } catch (e) {
      console.error("Leaderboard yüklenemedi", e);
    }
  };

  const handleShare = async (e: React.PointerEvent) => {
    e.stopPropagation();
    const shareText = `Monolith'te ${score.toLocaleString()} skor yaptım! Edush Interactive'in yeni oyununda beni geçebilir misin?`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Monolith - Edush Interactive',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Paylaşım iptal edildi veya desteklenmiyor.');
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert("Skor panoya kopyalandı! İstediğin yere yapıştırabilirsin.");
    }
  };

  const handleSupport = (e: React.PointerEvent) => {
    e.stopPropagation();
    window.open('https://www.patreon.com/SENIN_KULLANICI_ADIN', '_blank');
  };

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
        @keyframes pulseSoft {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }
        .animate-pulse-soft {
          animation: pulseSoft 2s infinite ease-in-out;
        }
      `}} />

      <MonolithScene />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <button 
          onPointerDown={handleSupport} 
          className="ui-btn flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-full text-rose-400 text-[9px] font-bold tracking-widest transition-all backdrop-blur-sm shadow-[0_0_10px_rgba(244,63,94,0.1)] animate-pulse-soft"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          SUPPORT STUDIO
        </button>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        {/* YENİ: Üst Bilgi Paneli Taslağa Uyarlandı */}
        <header className="w-full p-6 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/40 to-transparent pt-12 pb-16">
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-400 tracking-[0.2em] mb-0.5">BEST RECORD</span>
            <span className="text-sm text-yellow-500/90 font-bold tracking-wider">
              {mounted ? highScore.toLocaleString() : '0'}
            </span>
          </div>

          <div className="flex gap-8 text-right pr-2">
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-400 tracking-[0.2em]">SCORE</span>
              <span className="text-3xl font-light text-white tracking-wider leading-tight">{score.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-400 tracking-[0.2em]">CREDITS</span>
              <div className="flex items-center gap-1.5 justify-end mt-1">
                {/* YENİ: Elmas/Kristal İkonu */}
                <svg className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.8l7.2 7.2-7.2 7.2-7.2-7.2L12 4.8z" />
                  <path d="M12 7l5 5-5 5-5-5 5-5z" opacity="0.5" />
                </svg>
                <span className="text-xl font-light text-cyan-50 tracking-wider leading-none">
                  {mounted ? credits.toLocaleString() : '...'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          {gameState === 'playing' && floatingTexts.map(item => (
             <FloatingTextItem key={item.id} data={item} />
          ))}
          
          {gameState === 'playing' && combo > 1 && (
            <div className="absolute top-[60%] text-yellow-400/90 text-[13px] font-medium tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]">
              {combo}x PERFECT COMBO
            </div>
          )}

          {gameState === 'idle' && !isShopOpen && !isLeaderboardOpen && (
            <div className="absolute top-[35%] text-white text-2xl font-light tracking-[0.4em] animate-pulse drop-shadow-2xl">
              TAP TO START
            </div>
          )}

          {gameState === 'gameover' && !isShopOpen && !isLeaderboardOpen && (
            <div className="z-50 flex flex-col items-center justify-center p-8 bg-[#0a0a0a]/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-[0_0_50px_rgba(0,0,0,1)] pointer-events-auto min-w-[300px]">
              <h2 className="text-red-500/90 text-2xl font-light tracking-[0.3em] uppercase mb-6">Structure Failed</h2>
              
              <div className="flex w-full justify-between items-center mb-3 px-4 py-2 bg-white/5 rounded-sm">
                <span className="text-neutral-400 text-[10px] tracking-[0.2em] uppercase">Score</span>
                <span className="text-white text-lg font-bold">{score.toLocaleString()}</span>
              </div>
              
              <div className="flex w-full justify-between items-center mb-6 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-sm">
                <span className="text-yellow-500/80 text-[10px] tracking-[0.2em] uppercase">Best</span>
                <span className="text-yellow-400 text-lg font-bold">{Math.max(score, highScore).toLocaleString()}</span>
              </div>
              
              {score > 0 && (
                <div className="flex gap-2 mb-6 w-full">
                  <input 
                    type="text"
                    maxLength={3}
                    placeholder="AAA"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    className="w-1/3 bg-neutral-900 border border-neutral-700 rounded-sm text-center text-lg text-white font-medium tracking-widest outline-none focus:border-yellow-500 transition-colors uppercase"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  <button 
                    onPointerDown={submitScore}
                    disabled={playerName.length < 3 || isSubmitting}
                    className="ui-btn flex-1 bg-yellow-600/90 hover:bg-yellow-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold uppercase tracking-widest text-xs rounded-sm transition-all"
                  >
                    {isSubmitting ? '...' : 'SAVE SCORE'}
                  </button>
                </div>
              )}

              <div className="flex gap-2 w-full mt-2">
                <button 
                  onPointerDown={(e) => { e.stopPropagation(); startGame(); }}
                  className="ui-btn flex-1 py-3 bg-gradient-to-b from-neutral-300 to-neutral-500 rounded-sm text-black text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all"
                >
                  Try Again
                </button>
                
                <button 
                  onPointerDown={handleShare}
                  className="ui-btn w-12 flex items-center justify-center bg-cyan-600/90 hover:bg-cyan-500 rounded-sm text-white shadow-[0_0_10px_rgba(8,145,178,0.3)] hover:scale-105 active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* YENİ: Alt Panel (The Sanctuary & Butonlar) Taslağa Uyarlandı */}
        <div className="w-full flex flex-col pointer-events-none z-20">
          <div className="w-full bg-[#111] border-t border-b border-neutral-800 py-2 text-center shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
            <span className="text-[10px] text-neutral-400 tracking-[0.4em] uppercase font-light">The Sanctuary</span>
          </div>

          <div className="relative h-48 bg-gradient-to-t from-[#000] via-[#050505]/95 to-transparent flex flex-col items-center justify-end pb-8">
            <div className="text-[9px] text-neutral-600 tracking-[0.4em] uppercase absolute bottom-[130px] font-light">City of Monoliths</div>
            
            <div className="w-full px-6 flex justify-between items-center pointer-events-auto max-w-md mx-auto gap-4">
              
              <button 
                onPointerDown={(e) => { e.stopPropagation(); setIsShopOpen(true); }}
                className="ui-btn px-2 py-3.5 bg-gradient-to-b from-neutral-800 to-neutral-900 border-t border-neutral-600/50 rounded-sm flex-1 shadow-[0_5px_15px_rgba(0,0,0,0.5)] active:scale-95 transition-all backdrop-blur-md"
              >
                <span className="text-[9px] text-neutral-300 tracking-[0.2em] font-medium">UPGRADES</span>
              </button>

              {/* YENİ: Taslaktaki Devasa Sarı Neon "TAP TO DROP" Butonu */}
              <button 
                className="ui-btn w-28 h-28 rounded-full border-[2px] border-yellow-600/40 bg-gradient-to-b from-neutral-800 to-[#0a0a0a] flex items-center justify-center relative shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:scale-105 active:scale-95 transition-all shrink-0 group"
                onPointerDown={(e) => { e.stopPropagation(); handleInteraction(); }}
              >
                <div className="absolute inset-[-5px] rounded-full border border-yellow-500/20 group-hover:border-yellow-500/40 transition-colors"></div>
                <div className="absolute inset-1 rounded-full border-[3px] border-yellow-500/80 shadow-[inset_0_0_15px_rgba(234,179,8,0.3),0_0_15px_rgba(234,179,8,0.5)]"></div>
                
                <div className="flex flex-col items-center z-10 mt-1">
                  <svg className="w-5 h-5 text-neutral-300 mb-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                  </svg>
                  <span className="text-[9px] text-neutral-200 tracking-[0.15em] font-bold text-center leading-tight">TAP TO<br/>DROP</span>
                </div>
              </button>

              <button 
                onPointerDown={(e) => { e.stopPropagation(); openLeaderboard(); }}
                className="ui-btn px-2 py-3.5 bg-gradient-to-b from-neutral-800 to-neutral-900 border-t border-neutral-600/50 rounded-sm flex-1 shadow-[0_5px_15px_rgba(0,0,0,0.5)] active:scale-95 transition-all backdrop-blur-md"
              >
                <span className="text-[9px] text-neutral-300 tracking-[0.2em] font-medium">LEADERBOARD</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Shop Modals ... (Aynı Mantıkla Korundu) */}
      {mounted && isLeaderboardOpen && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-neutral-800 rounded-sm p-6 shadow-2xl relative">
            <header className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
              <h3 className="text-white font-light tracking-[0.3em] text-sm uppercase">Global Ranks</h3>
            </header>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mb-6 pr-1">
              {leaderboardData.length === 0 ? (
                <div className="text-center text-neutral-500 py-4 tracking-widest text-xs">CONNECTING SATELLITE...</div>
              ) : (
                leaderboardData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-[#111] rounded-sm border border-neutral-800/50">
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-sm ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-neutral-400' : index === 2 ? 'text-amber-700' : 'text-neutral-600'}`}>
                        #{index + 1}
                      </span>
                      <span className="text-neutral-200 font-medium tracking-[0.2em] text-xs">{item.name}</span>
                    </div>
                    <span className="text-cyan-400 font-light tracking-wider text-sm">{item.score.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            <button 
              onPointerDown={(e) => { e.stopPropagation(); setIsLeaderboardOpen(false); }}
              className="ui-btn w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/50 rounded-sm text-neutral-400 text-[10px] font-bold tracking-[0.3em] uppercase transition-colors"
            >
              Close Feed
            </button>
          </div>
        </div>
      )}

      {mounted && isShopOpen && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-neutral-800 rounded-sm p-6 shadow-2xl relative">
            <header className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
              <h3 className="text-white font-light tracking-[0.3em] text-sm uppercase">Core Upgrades</h3>
              <div className="flex items-center gap-1 bg-cyan-950/30 border border-cyan-800/30 px-2 py-1 rounded-sm text-cyan-400 text-xs font-medium">
                <span>{credits}</span>
                <span className="text-[10px]">CR</span>
              </div>
            </header>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mb-6 pr-1">
              {shopItems.map((item) => {
                const isOwned = unlockedSkins.includes(item.id);
                const isActive = currentSkin === item.id;

                return (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-[#111] rounded-sm border border-neutral-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color} shadow-lg`} />
                      <span className="text-xs text-neutral-300 font-light tracking-[0.1em]">{item.name}</span>
                    </div>

                    <div className="pointer-events-auto">
                      {isActive ? (
                        <span className="text-[10px] text-emerald-500/80 font-bold tracking-widest uppercase px-2 py-1">Equipped</span>
                      ) : isOwned ? (
                        <button 
                          onPointerDown={(e) => { e.stopPropagation(); equipSkin(item.id); }}
                          className="ui-btn text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-3 py-1.5 rounded-sm transition-colors tracking-widest uppercase"
                        >
                          Equip
                        </button>
                      ) : (
                        <button 
                          onPointerDown={(e) => { e.stopPropagation(); buySkin(item.id, item.cost); }}
                          disabled={credits < item.cost}
                          className={`ui-btn text-[10px] font-bold px-3 py-1.5 rounded-sm transition-all tracking-widest uppercase
                            ${credits >= item.cost ? 'bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-md' : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'}`}
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
              className="ui-btn w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/50 rounded-sm text-neutral-400 text-[10px] font-bold tracking-[0.3em] uppercase transition-colors"
            >
              Back To Sanctuary
            </button>
          </div>
        </div>
      )}
    </main>
  );
}