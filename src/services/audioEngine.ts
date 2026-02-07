class AudioEngine {
  private context: AudioContext | null = null;
  private isEnabled = false;
  private bgMusic: HTMLAudioElement | null = null;
  private currentVolume = 0.5;
  private musicSource: MediaElementAudioSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserTimeData: Uint8Array<ArrayBuffer> | null = null;
  private analyserFreqData: Uint8Array<ArrayBuffer> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public async enable() {
    if (this.context?.state === "suspended") {
      try {
        await this.context.resume();
      } catch (_) {}
    }
    this.isEnabled = true;
  }

  private teardownMusicGraph() {
    try {
      this.musicSource?.disconnect();
    } catch (_) {}
    try {
      this.analyser?.disconnect();
    } catch (_) {}
    try {
      this.musicGain?.disconnect();
    } catch (_) {}
    this.musicSource = null;
    this.musicGain = null;
    this.analyser = null;
    this.analyserTimeData = null;
    this.analyserFreqData = null;
  }

  public async playMusic(url: string) {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic = null;
    }

    this.teardownMusicGraph();

    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audio.preload = "auto";

    // Prefer routing music through Web Audio so we can drive reactive visuals.
    if (this.context) {
      try {
        const source = this.context.createMediaElementSource(audio);
        const analyser = this.context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.82;

        const gain = this.context.createGain();
        gain.gain.setValueAtTime(this.currentVolume, this.context.currentTime);

        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(this.context.destination);

        this.musicSource = source;
        this.analyser = analyser;
        this.musicGain = gain;
        this.analyserTimeData = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
        this.analyserFreqData = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      } catch (err) {
        // Fallback to direct element playback if the graph cannot be constructed.
        audio.volume = this.currentVolume;
      }
    } else {
      audio.volume = this.currentVolume;
    }

    this.bgMusic = audio;

    try {
      await this.bgMusic.play();
      return true;
    } catch (e) {
      console.error("Audio playback blocked or invalid format", e);
      return false;
    }
  }

  public stopMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.context) {
      this.musicGain.gain.setTargetAtTime(this.currentVolume, this.context.currentTime, 0.03);
      return;
    }
    if (this.bgMusic) this.bgMusic.volume = this.currentVolume;
  }

  public getVolume() {
    return this.currentVolume;
  }

  public getMusicTimeDomainData() {
    if (!this.analyser || !this.analyserTimeData) return null;
    this.analyser.getByteTimeDomainData(this.analyserTimeData);
    return this.analyserTimeData;
  }

  public getMusicFrequencyData() {
    if (!this.analyser || !this.analyserFreqData) return null;
    this.analyser.getByteFrequencyData(this.analyserFreqData);
    return this.analyserFreqData;
  }

  public getMusicEnergy() {
    const freq = this.getMusicFrequencyData();
    if (!freq || !freq.length) return 0;
    let sum = 0;
    for (let i = 0; i < freq.length; i++) sum += freq[i];
    return Math.min(1, sum / (freq.length * 255));
  }

  private async playFrequency(
    freq: number,
    type: OscillatorType,
    volume: number,
    duration: number,
    ramp: "exp" | "linear" = "exp"
  ) {
    if (!this.isEnabled || !this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);

    gain.gain.setValueAtTime(volume * this.currentVolume * 2, this.context.currentTime);
    if (ramp === "exp") {
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
    this.playFrequency(40, "sine", 0.05, 0.5);
  }

  public playSpark() {
    this.playFrequency(Math.random() * 2000 + 1000, "square", 0.02, 0.05);
  }

  public playImpact() {
    this.playFrequency(60, "sawtooth", 0.3, 1);
    this.playFrequency(30, "sine", 0.5, 1.5);
  }

  public playGlassTing() {
    this.playFrequency(2500, "sine", 0.2, 0.1);
    this.playFrequency(5000, "sine", 0.1, 0.05);
  }

  public playSwoosh() {
    if (!this.isEnabled || !this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, this.context.currentTime + 0.5);

    filter.type = "lowpass";
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
