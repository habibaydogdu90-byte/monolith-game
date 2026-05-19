import { useGameStore } from '@/store/useGameStore';

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playSound = (type: 'drop' | 'perfect' | 'gameover') => {
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'drop') {
    // Derin Beton Düşüş Sesi (Sub-bass thud)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    gainNode.gain.setValueAtTime(0.5, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.start(t);
    osc.stop(t + 0.3);

  } else if (type === 'perfect') {
    // ASMR Kristal/Cam Çınlaması (Kombo arttıkça nota yükselir)
    // Zustand store'dan anlık kombo sayısını alıyoruz
    const currentCombo = useGameStore.getState().combo;
    
    // Her komboda frekansı %15 artırarak o "tırmanış" hissini (Dopamin) veriyoruz
    const baseFreq = 600; 
    const pitchMultiplier = Math.pow(1.15, Math.min(currentCombo, 15)); 
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime((baseFreq * pitchMultiplier) / 2, t + 0.8);

    // Hafif yankı (reverb) hissi için sesin yavaşça sönümlenmesi
    gainNode.gain.setValueAtTime(0.3, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    osc.start(t);
    osc.stop(t + 0.8);

  } else if (type === 'gameover') {
    // Güç Kesilmesi / Sistem Çöküşü (Sinematik bass drop)
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 1.5);

    gainNode.gain.setValueAtTime(0.3, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    osc.start(t);
    osc.stop(t + 1.5);
  }
};