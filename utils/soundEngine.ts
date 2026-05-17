class SoundEngine {
  private sounds: Record<string, HTMLAudioElement> = {};
  private initialized = false;

  init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    
    try {
      this.sounds.drop = new window.Audio('/sounds/drop.mp3');
      this.sounds.perfect = new window.Audio('/sounds/perfect.mp3');
      this.sounds.gameover = new window.Audio('/sounds/gameover.mp3');
      
      Object.values(this.sounds).forEach(audio => {
        audio.load();
        audio.volume = 0.7;
      });
      
      this.initialized = true;
    } catch (error) {
      console.warn("[Ses Motoru] Başlatılamadı:", error);
    }
  }

  play(name: 'drop' | 'perfect' | 'gameover'): void {
    if (!this.initialized) this.init();
    if (typeof window === 'undefined') return;
    
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Tarayıcı etkileşim uyarısını sessizce geçiştirir
      });
    }
  }
}

export const soundEngine = new SoundEngine();
export const initAudio = (): void => soundEngine.init();
export const playSound = (name: 'drop' | 'perfect' | 'gameover'): void => soundEngine.play(name);