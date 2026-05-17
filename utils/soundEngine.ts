// src/utils/soundEngine.ts

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (typeof window === 'undefined') return;
  
  try {
    if (!audioCtx) {
      const AudioContext = (window.AudioContext || (window as any).webkitAudioContext) as typeof window.AudioContext;
      audioCtx = new AudioContext();
      console.log("🎵 [SES MOTORU]: Kuruldu. İlk durum:", audioCtx.state);
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        console.log("🔓 [SES MOTORU]: Tarayıcı kilidi kırıldı! Yeni durum:", audioCtx?.state);
      });
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.001; 
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
    
  } catch (error) {
    console.error("🚨 [SES MOTORU HATASI]:", error);
  }
};

export const playSound = (type: 'perfect' | 'cut' | 'gameover', comboLevel: number = 0) => {
  if (typeof window === 'undefined') return;
  
  if (!audioCtx) initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (!audioCtx) return; 

  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'perfect') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440 + (comboLevel * 50), now);
      // SES ŞİDDETİ ARTIRILDI: 0.5 -> 1.5
      gainNode.gain.setValueAtTime(1.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } 
    else if (type === 'cut') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(150, now);
      // SES ŞİDDETİ ARTIRILDI: 0.4 -> 1.2
      gainNode.gain.setValueAtTime(1.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } 
    else if (type === 'gameover') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100, now);
      oscillator.frequency.exponentialRampToValueAtTime(10, now + 1);
      // SES ŞİDDETİ ARTIRILDI: 0.6 -> 2.0 (Yıkılma anı artık çok daha gürültülü)
      gainNode.gain.setValueAtTime(2.0, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1);
      oscillator.start(now);
      oscillator.stop(now + 1);
    }
  } catch (err) {
    console.error("🚨 [SES EFEKT HATASI]:", err);
  }
};