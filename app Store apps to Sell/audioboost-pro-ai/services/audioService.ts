
export class AudioService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private eqBands: BiquadFilterNode[] = [];
  private bandBlockers: BiquadFilterNode[] = [];
  
  private monitorGainNode: GainNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  public isInitialized = false;
  public static readonly EQ_FREQUENCIES = [16, 32, 64, 125, 250, 500, 1000, 4000, 8000, 20000];

  async initialize(input: MediaStream | HTMLMediaElement): Promise<void> {
    if (this.audioContext) await this.close();
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (input instanceof MediaStream) {
      this.mediaStream = input;
      this.sourceNode = this.audioContext.createMediaStreamSource(input);
    } else {
      this.sourceNode = this.audioContext.createMediaElementSource(input);
    }

    this.gainNode = this.audioContext.createGain();
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.highPassFilter = this.audioContext.createBiquadFilter();
    this.analyserNode = this.audioContext.createAnalyser();
    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.monitorGainNode = this.audioContext.createGain();

    this.compressorNode.threshold.value = -40;
    this.compressorNode.ratio.value = 12;

    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = 80;

    // Create EQ Bands
    this.eqBands = AudioService.EQ_FREQUENCIES.map(freq => {
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      filter.gain.value = 0;
      return filter;
    });

    // Create Notch Filters (Blockers)
    this.bandBlockers = AudioService.EQ_FREQUENCIES.map(freq => {
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = 'notch';
      filter.frequency.value = freq;
      filter.Q.value = 10; // Sharp cut
      // Initially bypassed (effectively) by using a frequency far away or just not connecting them? 
      // Better to keep them in chain and just toggle their frequency or Q. 
      // Actually let's use a GainNode for each band splitter if we wanted true splitting, 
      // but "blocking" is best done with Notch filters.
      // We will set their frequency to 0 to bypass when "unblocked".
      return filter;
    });

    this.analyserNode.fftSize = 2048;
    this.monitorGainNode.gain.value = 0;

    // Chain: Source -> HPF -> Compressor -> [Notch Blockers] -> [EQ Bands] -> Gain -> Analyser
    let lastNode: AudioNode = this.sourceNode;
    lastNode.connect(this.highPassFilter);
    lastNode = this.highPassFilter;
    
    lastNode.connect(this.compressorNode);
    lastNode = this.compressorNode;

    // Connect blockers
    this.bandBlockers.forEach(blocker => {
      lastNode.connect(blocker);
      lastNode = blocker;
    });

    // Connect EQ
    this.eqBands.forEach(band => {
      lastNode.connect(band);
      lastNode = band;
    });

    lastNode.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);
    
    this.analyserNode.connect(this.destinationNode);
    this.analyserNode.connect(this.monitorGainNode);
    this.monitorGainNode.connect(this.audioContext.destination);

    this.isInitialized = true;
  }

  setBlockBand(index: number, isBlocked: boolean) {
    if (!this.audioContext || !this.bandBlockers[index]) return;
    const freq = AudioService.EQ_FREQUENCIES[index];
    // To "unblock", we move the notch frequency out of audible range or set Q to 0.001
    this.bandBlockers[index].frequency.setTargetAtTime(isBlocked ? freq : 0, this.audioContext.currentTime, 0.05);
  }

  setGain(value: number) {
    if (this.gainNode && this.audioContext) this.gainNode.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.1);
  }

  setMonitorVolume(value: number) {
    if (this.monitorGainNode && this.audioContext) this.monitorGainNode.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.1);
  }

  setEqBandGain(index: number, dbValue: number) {
    if (this.eqBands[index] && this.audioContext) this.eqBands[index].gain.setTargetAtTime(dbValue, this.audioContext.currentTime, 0.1);
  }

  getAnalyserNode(): AnalyserNode | null { return this.analyserNode; }
  getProcessedStream(): MediaStream | null { return this.destinationNode?.stream || null; }

  startRecording() {
    if (!this.destinationNode) return;
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.destinationNode.stream);
    this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
    this.mediaRecorder.start();
  }

  // Changed return type from Blob to Promise<Blob> to correctly reflect that it returns a Promise.
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(new Blob());
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  async close() {
    if (this.audioContext) await this.audioContext.close();
    this.audioContext = null;
    this.isInitialized = false;
  }
}
