class SoundEngine {
  private sounds: Record<string, HTMLAudioElement> = {};
  private initialized = false;

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    
    try {
      // İndirdiğin ses dosyalarını belleğe alıyoruz
      this.sounds.drop = new Audio('/sounds/drop.mp3');
      this.sounds.perfect = new Audio('/sounds/perfect.mp3');
      this.sounds.gameover = new Audio('/sounds/gameover.mp3');
      
      Object.values(this.sounds).forEach(audio => {
        audio.load(); // Gecikmeyi önlemek için önceden yüklüyoruz
        audio.volume = 0.7; // Ses yüksekliği ayarı
      });
      
      this.initialized = true;
    } catch (error) {
      console.warn("[Ses Motoru] Başlatılamadı:", error);
    }
  }

  play(name: 'drop' | 'perfect' | 'gameover') {
    if (!this.initialized) this.init();
    if (typeof window === 'undefined') return;
    
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0; // Sesi başa sarıp tekrar çal
      sound.play().catch(e => console.warn("[Ses Motoru] Tarayıcı sesi engelledi:", e));
    }
  }
}

export const soundEngine = new SoundEngine();
export const initAudio = () => soundEngine.init();
export const playSound = (name: 'drop' | 'perfect' | 'gameover') => soundEngine.play(name);