
class AudioEngine {
  private context: AudioContext | null = null;
  private isEnabled = false;
  private bgMusic: HTMLAudioElement | null = null;
  private currentVolume = 0.5;

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public enable() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
    this.isEnabled = true;
  }

  public playMusic(url: string) {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic = null;
    }
    this.bgMusic = new Audio(url);
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.currentVolume;
    this.bgMusic.play().catch(e => console.error("Audio playback blocked or invalid format", e));
  }

  public stopMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.bgMusic) {
      this.bgMusic.volume = this.currentVolume;
    }
  }

  public getVolume() {
    return this.currentVolume;
  }

  private async playFrequency(freq: number, type: OscillatorType, volume: number, duration: number, ramp: 'exp' | 'linear' = 'exp') {
    if (!this.isEnabled || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    
    gain.gain.setValueAtTime(volume * this.currentVolume * 2, this.context.currentTime);
    if (ramp === 'exp') {
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    } else {
      gain.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
    }
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  public playHum() {
    this.playFrequency(40, 'sine', 0.05, 0.5);
  }

  public playSpark() {
    this.playFrequency(Math.random() * 2000 + 1000, 'square', 0.02, 0.05);
  }

  public playImpact() {
    this.playFrequency(60, 'sawtooth', 0.3, 1);
    this.playFrequency(30, 'sine', 0.5, 1.5);
  }

  public playGlassTing() {
    this.playFrequency(2500, 'sine', 0.2, 0.1);
    this.playFrequency(5000, 'sine', 0.1, 0.05);
  }

  public playSwoosh() {
    if (!this.isEnabled || !this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, this.context.currentTime + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(5000, this.context.currentTime + 0.5);

    gain.gain.setValueAtTime(0.2 * this.currentVolume * 2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.6);
  }

  public playWarp() {
    if (!this.isEnabled || !this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.frequency.setValueAtTime(100, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3000, this.context.currentTime + 1);
    gain.gain.setValueAtTime(0.1 * this.currentVolume * 2, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 1);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start();
    osc.stop(this.context.currentTime + 1.2);
  }
}

export const audioEngine = new AudioEngine();
