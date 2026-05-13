import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Zap, Settings, Activity, Ear, StopCircle, Play, Wind, RotateCcw, 
  SlidersHorizontal, ChevronDown, ChevronRight, FileVideo, Download, 
  Type, ShieldAlert, Cpu, Globe, MessageSquare
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage } from "@google/genai";
import { AudioService } from './services/audioService';
import Visualizer from './components/Visualizer';

const STORAGE_KEY = 'audio-boost-3k-settings-v4';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

interface AppSettings {
  boostLevel: number;
  monitorVolume: number;
  highPassFreq: number;
  eqGains: number[];
  blockedBands: boolean[];
}

const defaultSettings: AppSettings = {
  boostLevel: 2.0,
  monitorVolume: 0.3,
  highPassFreq: 40,
  eqGains: new Array(10).fill(0),
  blockedBands: new Array(10).fill(false)
};

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("SYSTEM READY");
  const [realTimeTranscript, setRealTimeTranscript] = useState("");
  const [aiSpeech, setAiSpeech] = useState("Hey! I'm Ai3k. Ready to boost your audio to the moon? 🚀");
  const [mediaFileUrl, setMediaFileUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const audioServiceRef = useRef<AudioService>(new AudioService());
  const videoRef = useRef<HTMLVideoElement>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const transcriptionContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (isProcessing) {
      audioServiceRef.current.setGain(settings.boostLevel);
      audioServiceRef.current.setMonitorVolume(settings.monitorVolume);
      settings.eqGains.forEach((g, i) => audioServiceRef.current.setEqBandGain(i, g));
      settings.blockedBands.forEach((b, i) => audioServiceRef.current.setBlockBand(i, b));
    }
  }, [settings, isProcessing]);

  // Handle Real-time Transcription via Live API using the BOOSTED signal
  const setupRealTimeTranscription = async (processedStream: MediaStream) => {
    if (!process.env.GEMINIAPIKEY2) return;
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINIAPIKEY2 });
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    transcriptionContextRef.current = audioContext;
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          const source = audioContext.createMediaStreamSource(processedStream);
          const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(session => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);
          setStatus("NEURAL LINK ENGAGED");
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            setRealTimeTranscript(prev => (prev + " " + text).slice(-300));
          }
        },
        onerror: (e) => console.error("Neural Error:", e),
        onclose: () => setStatus("NEURAL LINK CUT")
      },
      config: {
        responseModalities: ['AUDIO'],
        inputAudioTranscription: {},
        systemInstruction: "You are the Audio Boost 3k Transcriber. You will receive boosted audio. Focus on deciphering whispered, faint, or sub-sonic words. Output exactly what you hear in real-time."
      }
    });

    liveSessionRef.current = sessionPromise;
  };

  const startProcessing = async (fromMic = true) => {
    try {
      setStatus("BOOTING ENGINE...");
      setAiSpeech("Warming up the sub-sonic sensors... This is going to be clear!");
      
      let input: MediaStream | HTMLMediaElement;
      
      if (fromMic) {
        input = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        if (!videoRef.current) throw new Error("No media element found");
        input = videoRef.current;
      }

      await audioServiceRef.current.initialize(input);
      setAnalyser(audioServiceRef.current.getAnalyserNode());
      setIsProcessing(true);
      
      // Get the processed (BOOSTED) stream for transcription
      const processedStream = audioServiceRef.current.getProcessedStream();
      if (processedStream) {
        setupRealTimeTranscription(processedStream);
      }

      setStatus("SIGNAL LIVE");
      setAiSpeech("The 3000 Studios Engine is at 100% power. Deciphering now.");
      
      if (!fromMic && videoRef.current) {
        videoRef.current.play();
      }
    } catch (err) {
      setStatus("ERROR");
      setAiSpeech("Oops! My circuits tripped. Make sure I have mic/media access!");
      console.error(err);
    }
  };

  const stopProcessing = async () => {
    await audioServiceRef.current.close();
    if (liveSessionRef.current) {
      liveSessionRef.current.then((s: any) => s.close());
      liveSessionRef.current = null;
    }
    if (transcriptionContextRef.current) {
      await transcriptionContextRef.current.close();
    }
    setIsProcessing(false);
    setAnalyser(null);
    setStatus("SIGNAL HALTED");
    setAiSpeech("Processors cooled down. Ai3k is standing by!");
    if (videoRef.current) videoRef.current.pause();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (mediaFileUrl) URL.revokeObjectURL(mediaFileUrl);
      const url = URL.createObjectURL(file);
      setMediaFileUrl(url);
      setStatus("FILE LOADED");
      setAiSpeech("I've got the file! Hit MIC LINK or play the video to start the boost.");
      // Small timeout to ensure the video element is mounted before we try to attach audio source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 100);
    }
  };

  const handleRecord = async () => {
    if (!isRecording) {
      audioServiceRef.current.startRecording();
      setIsRecording(true);
      setStatus("CAPTURING...");
      setAiSpeech("Recording the enhanced feed. Every whisper is being tracked!");
    } else {
      const blob = await audioServiceRef.current.stopRecording();
      setIsRecording(false);
      setStatus("EXPORT READY");
      setAiSpeech("Boosted file saved! Crystal clear audio incoming.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AudioBoost3k_SubSonic_Export_${Date.now()}.webm`;
      a.click();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen pb-12">
      {/* 3000 Studios Header */}
      <div className="w-full text-center py-2 bg-black/90 border-b border-sky-900/40 relative z-30 shadow-lg">
        <span className="text-[9px] font-black tracking-[0.5em] text-sky-400 uppercase opacity-80 drop-shadow-[0_0_5px_#00f2ff]">made by 3000 Studios</span>
      </div>

      <div className="max-w-7xl w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-20">
        
        {/* Left Side: Controls and Visuals */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          
          {/* Brand Panel */}
          <div className="flex flex-col md:flex-row items-center gloss-panel p-6 rounded-3xl border-l-4 border-l-cyan-400 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-cyan-500/10 transition-all duration-700"></div>
            <div className="flex-1 text-center md:text-left relative z-10">
              <h1 className="text-5xl font-black neon-text-blue uppercase tracking-tighter leading-none italic mb-1 drop-shadow-lg">
                Audio Boost 3k
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold tracking-widest uppercase bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/20">
                  <Activity size={10} className={isProcessing ? "animate-pulse" : ""} /> {status}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 md:mt-0 relative z-10">
              {!isProcessing ? (
                <>
                  <button onClick={() => startProcessing(true)} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center gap-2 uppercase text-xs active:scale-95">
                    <Mic size={18} /> MIC LINK
                  </button>
                  <label className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 uppercase text-xs border border-slate-700 active:scale-95">
                    <FileVideo size={18} /> UPLOAD MEDIA
                    <input type="file" className="hidden" accept="audio/*,video/*" onChange={onFileChange} />
                  </label>
                </>
              ) : (
                <button onClick={stopProcessing} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all flex items-center gap-2 uppercase text-xs shadow-lg shadow-red-900/30 active:scale-95">
                  <StopCircle size={18} /> TERMINATE
                </button>
              )}
            </div>
          </div>

          {/* REAL-TIME SPELLING BOX (Green Display) */}
          <div className="crt-green-display p-6 rounded-2xl min-h-[140px] flex flex-col justify-start border-4 border-emerald-900/50 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
             <div className="text-[10px] uppercase font-black opacity-60 mb-3 tracking-[0.3em] flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                <MessageSquare size={12} className="text-emerald-400" /> Neural Deciphering Display
             </div>
             <div className="text-xl md:text-3xl font-mono leading-relaxed whitespace-pre-wrap break-words drop-shadow-[0_0_8px_rgba(0,255,65,0.6)]">
                {isProcessing ? (realTimeTranscript || "> DECODING SUB-SONIC SIGNALS_") : "> SYSTEM_OFFLINE [IDLE]"}
             </div>
          </div>

          {/* Player Area - Prominent */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             <div className="md:col-span-7 h-72 gloss-panel rounded-3xl p-1 neon-border-blue relative overflow-hidden">
                <Visualizer analyser={analyser} isActive={isProcessing} />
             </div>
             <div className="md:col-span-5 h-72 gloss-panel rounded-3xl overflow-hidden bg-black/80 flex items-center justify-center relative border border-slate-800 shadow-inner group">
               {mediaFileUrl ? (
                 <video 
                    ref={videoRef} 
                    src={mediaFileUrl} 
                    crossOrigin="anonymous" 
                    className="w-full h-full object-contain cursor-pointer" 
                    controls={!isProcessing}
                    onPlay={() => !isProcessing && startProcessing(false)}
                 />
               ) : (
                 <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <FileVideo size={48} className="text-slate-500" />
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] italic">No Media Source</div>
                 </div>
               )}
               {mediaFileUrl && !isProcessing && (
                  <button 
                    onClick={() => startProcessing(false)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                  >
                     <div className="bg-cyan-500 p-4 rounded-full shadow-[0_0_20px_#00f2ff]">
                        <Play fill="white" size={32} />
                     </div>
                  </button>
               )}
             </div>
          </div>

          {/* Splitting Engine EQ */}
          <div className="gloss-panel p-8 rounded-3xl border-r-4 border-r-purple-600 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -ml-16 -mt-16"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="text-xs font-black tracking-widest text-slate-400 uppercase italic flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-purple-400" /> Multi-Band splitting engine
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setSettings(defaultSettings)} className="text-[9px] font-black uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-cyan-400 transition-colors">Reset Graph</button>
                 <button onClick={handleRecord} className={`text-[9px] font-black px-4 py-1.5 rounded-lg border uppercase flex items-center gap-2 tracking-widest transition-all ${isRecording ? 'bg-red-900/20 border-red-500 text-red-500 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-cyan-400'}`}>
                    {isRecording ? <StopCircle size={10} /> : <Download size={10} />} {isRecording ? "Capturing..." : "Export Feed"}
                 </button>
              </div>
            </div>

            <div className="flex justify-between items-end h-48 gap-3 overflow-x-auto pb-4 scrollbar-hide relative z-10">
              {AudioService.EQ_FREQUENCIES.map((freq, i) => (
                <div key={freq} className="flex-1 flex flex-col items-center min-w-[40px]">
                  <button 
                    onClick={() => {
                      const newBlocked = [...settings.blockedBands];
                      newBlocked[i] = !newBlocked[i];
                      setSettings(s => ({ ...s, blockedBands: newBlocked }));
                    }}
                    className={`w-full aspect-square mb-4 rounded-xl border transition-all flex items-center justify-center shadow-lg
                      ${settings.blockedBands[i] ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-slate-950/80 border-slate-800 text-slate-600 hover:border-cyan-500/50'}
                    `}
                  >
                    <ShieldAlert size={14} className={settings.blockedBands[i] ? "animate-pulse" : ""} />
                  </button>

                  <div className="h-28 w-2 bg-black/40 rounded-full relative shadow-inner">
                    <input 
                      type="range" min="-15" max="15" step="0.05" orient="vertical"
                      value={settings.eqGains[i]}
                      onChange={(e) => {
                        const newGains = [...settings.eqGains];
                        newGains[i] = parseFloat(e.target.value);
                        setSettings(s => ({ ...s, eqGains: newGains }));
                      }}
                      className="appearance-none w-2 h-full bg-transparent absolute top-0 left-0 accent-cyan-400 cursor-pointer z-20"
                      style={{ WebkitAppearance: 'slider-vertical' } as any}
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.6)] rounded-full transition-all duration-75" style={{ height: `${((settings.eqGains[i] + 15) / 30) * 100}%` }}></div>
                  </div>

                  <div className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-tighter opacity-70">
                    {freq < 1000 ? `${freq}Hz` : `${freq / 1000}k`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Ai3k Character and Core Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Ai3k Character Panel */}
          <div className="gloss-panel p-6 rounded-3xl border-t-4 border-t-cyan-500 flex flex-col items-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
            
            {/* Ai3k Character Drawing (SVG) */}
            <div className="w-40 h-40 mb-2 ai3k-bounce relative z-10 drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">
               <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Body */}
                  <rect x="25" y="30" width="50" height="50" rx="12" fill="#0f172a" stroke="#00f2ff" strokeWidth="2.5" />
                  {/* Head */}
                  <rect x="30" y="10" width="40" height="28" rx="10" fill="#0f172a" stroke="#00f2ff" strokeWidth="2.5" />
                  {/* Screen/Face */}
                  <rect x="35" y="14" width="30" height="18" rx="6" fill="#021a02" stroke="#00ff41" strokeWidth="1.5" />
                  {/* Eyes */}
                  <circle cx="42" cy="23" r="2.5" fill="#00ff41" className="animate-pulse" />
                  <circle cx="58" cy="23" r="2.5" fill="#00ff41" className="animate-pulse" />
                  {/* Arms */}
                  <path d="M25,50 L10,65" stroke="#00f2ff" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 6" className="animate-pulse" />
                  <path d="M75,50 L90,65" stroke="#00f2ff" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 6" className="animate-pulse" />
                  {/* Antenna */}
                  <line x1="50" y1="10" x2="50" y2="2" stroke="#7000ff" strokeWidth="3" />
                  <circle cx="50" cy="2" r="3" fill="#7000ff" className="animate-ping" />
                  <circle cx="50" cy="2" r="3" fill="#7000ff" />
               </svg>
            </div>

            <div className="bg-black/80 rounded-2xl p-4 border border-slate-800 text-xs font-bold text-cyan-200 italic leading-relaxed text-center relative z-10 w-full mb-6 shadow-2xl min-h-[60px] flex items-center justify-center">
              <span className="drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]">"{aiSpeech}"</span>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 relative z-10">
               <button onClick={() => setAiSpeech("My Sub-Sonic Engine can hear a pin drop in a concert! 🎧")} className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900/80 border border-slate-800 py-3 rounded-xl hover:border-cyan-400 transition-all active:scale-95 shadow-lg">Tech Specs</button>
               <button onClick={() => setAiSpeech("3000 Studios tuned my neural net specifically for vocal extraction. 🤖")} className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900/80 border border-slate-800 py-3 rounded-xl hover:border-cyan-400 transition-all active:scale-95 shadow-lg">Systems</button>
            </div>
          </div>

          {/* Master Faders - More Responsive */}
          <div className="gloss-panel p-6 rounded-3xl space-y-8 relative overflow-hidden shadow-xl border border-slate-800/50">
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2"><Zap size={16} fill="#00f2ff" className="opacity-50" /> Gain Overdrive</label>
                  <span className="font-mono text-sm font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">{settings.boostLevel}x</span>
                </div>
                <input 
                  type="range" min="1" max="15" step="0.01" 
                  value={settings.boostLevel} 
                  onInput={e => {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    setSettings(s => ({ ...s, boostLevel: val }));
                  }} 
                  className="w-full fader-track" 
                />
             </div>
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2"><Ear size={16} fill="#10b981" className="opacity-50" /> Monitor Output</label>
                  <span className="font-mono text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">{Math.round(settings.monitorVolume * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="2.0" step="0.005" 
                  value={settings.monitorVolume} 
                  onInput={e => {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    setSettings(s => ({ ...s, monitorVolume: val }));
                  }} 
                  className="w-full fader-track" 
                />
             </div>
          </div>

          {/* Neural Engine Diagnostic */}
          <div className="gloss-panel p-6 rounded-3xl border-b-4 border-b-purple-600 flex flex-col relative overflow-hidden shadow-xl">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
            <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-purple-400 uppercase tracking-widest italic relative z-10">
              <Cpu size={16} className="text-purple-500" /> Advanced vocal extraction
            </div>

            <div className="bg-black/70 rounded-2xl p-4 border border-slate-800 text-[10px] font-mono leading-relaxed text-slate-500 min-h-[140px] relative z-10 shadow-inner overflow-hidden">
               <div className="opacity-40 animate-pulse">
                  {isProcessing ? (
                    <>
                      SCANNING FREQ_SUB: [ACTIVE]<br/>
                      DECODING_VOCALS: [RUNNING]<br/>
                      NEURAL_STRENGTH: 98.4%<br/>
                      BUFFER_SIZE: 16.0KB<br/>
                      AI3K_LINK: [STABLE]
                    </>
                  ) : "ENGINE_STATUS: [IDLE]\nWAITING_FOR_SIGNAL..."}
               </div>
            </div>

            <button 
              onClick={() => {
                setAiSpeech("Running full neural diagnostic! I'll pinpoint every frequency spike.");
                setStatus("NEURAL SCAN...");
                setTimeout(() => setStatus("SIGNAL LIVE"), 2000);
              }}
              disabled={!isProcessing}
              className={`mt-6 w-full py-4 rounded-2xl font-black text-[11px] tracking-[0.4em] text-white uppercase shadow-2xl transition-all relative z-10 border border-purple-500/30 active:scale-95
                ${isProcessing ? 'bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-700 hover:to-indigo-800' : 'bg-slate-900 text-slate-700 cursor-not-allowed'}
              `}
            >
              INITIATE VOCAL SCAN
            </button>
          </div>
        </div>
      </div>

      {/* Brand Footer */}
      <div className="mt-auto w-full py-10 flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-all duration-500 relative z-30">
        <a href="https://VoiceToWebsite.com" target="_blank" className="text-[12px] font-black neon-text-blue uppercase tracking-[0.4em] flex items-center gap-3 hover:scale-105 transition-transform group">
          <Globe size={16} className="group-hover:rotate-180 transition-transform duration-1000" /> VoiceToWebsite.com
        </a>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        <p className="text-[10px] font-black text-slate-700 tracking-[0.3em] uppercase italic">Audio Boost 3k | Precision Engineering by 3000 Studios</p>
      </div>

    </div>
  );
}
