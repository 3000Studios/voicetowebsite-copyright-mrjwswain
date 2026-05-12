import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { postJSON, ApiError } from "../../lib/api";
import { enrichPrompt } from "../../lib/secretFeatures";
import { cn } from "../../lib/utils";

interface Variation {
  id: string; name: string; mood: string;
  fontPair: string; palette: string[];
  qualityScore: number; html: string;
}
type Stage = "idle"|"thinking"|"building"|"done"|"error";
type DeviceMode = "desktop"|"tablet"|"mobile";

const PROMPTS = [
  "Personal injury attorney in Houston. We fight for accident victims, no win no fee.",
  "Dog grooming salon in Chicago. Mobile grooming, all breeds welcome.",
  "Family Mexican restaurant in Phoenix. Authentic recipes since 1987.",
  "HVAC installation and repair across Dallas. 24/7 emergency service.",
  "Licensed electrician in Atlanta. Residential & commercial, same-day.",
  "Plumbing company in Miami. Emergency service, water heaters, drain cleaning.",
];

const THINKING = [
  "Analyzing your business...", "Extracting brand identity...",
  "Architecting layout...", "Generating 3 variations...",
  "Writing your copy...", "Applying premium styling...",
  "Optimizing for conversions...", "Rendering your site...",
];

const DEVICE: Record<DeviceMode, {w:string;icon:string;h:number}> = {
  desktop: { w:"100%", icon:"🖥", h:620 },
  tablet:  { w:"768px", icon:"📱", h:700 },
  mobile:  { w:"375px", icon:"📲", h:600 },
};

// ─── Particles ────────────────────────────────────────────────────────────────
function Particles({ active }: { active: boolean }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", !active && "hidden")}>
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full"
          style={{ background: i%3===0?"#06b6d4":i%3===1?"#8b5cf6":"#f59e0b",
            left:`${Math.random()*100}%`, top:`${Math.random()*100}%` }}
          animate={{ y:[0,-50-Math.random()*50], x:[(Math.random()-.5)*30], opacity:[0,1,0], scale:[0,1.5,0] }}
          transition={{ duration:1.5+Math.random()*2, repeat:Infinity, delay:Math.random()*2 }}
        />
      ))}
    </div>
  );
}

// ─── Thinking Bar ─────────────────────────────────────────────────────────────
function ThinkingBar({ stage, line }: { stage: Stage; line: string }) {
  const active = stage === "thinking" || stage === "building";
  return (
    <AnimatePresence>
      {active && (
        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
          className="flex flex-col gap-2 mt-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0,1,2].map(i=>(
                <motion.div key={i} className="w-2 h-2 rounded-full bg-brand-cyan"
                  animate={{scale:[1,1.6,1],opacity:[0.3,1,0.3]}}
                  transition={{duration:0.7,repeat:Infinity,delay:i*0.15}}/>
              ))}
            </div>
            <motion.span key={line} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}}
              className="text-[10px] font-mono text-brand-cyan/70 tracking-widest uppercase">{line}</motion.span>
          </div>
          <div className="w-full h-px bg-white/5 overflow-hidden rounded-full">
            <motion.div className="h-full bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan"
              animate={{x:["-100%","100%"]}} transition={{duration:1.4,repeat:Infinity,ease:"easeInOut"}}/>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────
function Preview({ html, device, building }: { html:string; device:DeviceMode; building:boolean }) {
  const { w, h } = DEVICE[device];
  return (
    <div className="flex justify-center w-full">
      <motion.div layout transition={{duration:0.4,ease:[0.4,0,0.2,1]}}
        style={{width:w,maxWidth:"100%"}}
        className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
        {/* Browser bar */}
        <div className="bg-[#141414] px-4 py-3 flex items-center gap-3 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"/><div className="w-3 h-3 rounded-full bg-yellow-500/50"/>
            <div className="w-3 h-3 rounded-full bg-green-500/50"/>
          </div>
          <div className="flex-1 bg-white/5 rounded-lg px-3 py-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400/60"/>
            <span className="text-[10px] text-white/25 font-mono">yourbusiness.voicetowebsite.com</span>
          </div>
        </div>
        {/* Frame */}
        <div className="relative bg-[#0a0a0a]" style={{height:h}}>
          {building && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
              <motion.div animate={{rotate:360}} transition={{duration:1.2,repeat:Infinity,ease:"linear"}}
                className="w-10 h-10 border-2 border-white/10 border-t-brand-cyan rounded-full mb-4"/>
              <p className="text-[10px] font-mono text-brand-cyan/50 tracking-[0.3em] uppercase">Building your site</p>
            </div>
          )}
          {html ? (
            <iframe srcDoc={html} title="Website Preview" className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-10">
              <div className="text-center">
                <div className="text-6xl mb-3">🌐</div>
                <p className="text-xs font-mono tracking-widest uppercase">Preview renders here</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export const GeneratorSection = () => {
  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [line, setLine] = useState(THINKING[0]);
  const [error, setError] = useState<string|null>(null);
  const [listening, setListening] = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);
  const recRef = useRef<any>(null);
  const lineRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => {
    const t = setInterval(() => setPromptIdx(i => (i+1)%PROMPTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (stage==="thinking"||stage==="building") {
      let i=0;
      lineRef.current = setInterval(() => { i=(i+1)%THINKING.length; setLine(THINKING[i]); }, 800);
    } else if (lineRef.current) clearInterval(lineRef.current);
    return () => { if(lineRef.current) clearInterval(lineRef.current); };
  }, [stage]);

  const toggleVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported in this browser. Try Chrome."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const r = new SR(); r.continuous=true; r.interimResults=true; r.lang="en-US";
    r.onstart = () => setListening(true);
    r.onresult = (e: any) => {
      let t=""; for(let i=e.resultIndex;i<e.results.length;i++) t+=e.results[i][0].transcript;
      setPrompt(t);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recRef.current = r; r.start();
  }, [listening]);

  const generate = useCallback(async () => {
    const text = prompt.trim();
    if (!text || text.length < 5) return;
    setStage("thinking"); setError(null); setVariations([]);
    try {
      const { prompt: enriched } = enrichPrompt(text);
      const data = await postJSON<{variations?:Variation[]}>("/api/generate",{prompt:enriched},{timeoutMs:60000});
      if (!data.variations?.length) throw new Error("No variations returned");
      setStage("building");
      await new Promise(r=>setTimeout(r,1000));
      setVariations(data.variations); setActiveIdx(0); setStage("done");
    } catch(err) {
      const msg = err instanceof ApiError ? `${err.message}${err.status?` (${err.status})`:""}` : err instanceof Error ? err.message : "Generation failed";
      setError(msg); setStage("error");
    }
  }, [prompt]);

  const reset = () => { setStage("idle"); setVariations([]); setError(null); setPrompt(""); };
  const v = variations[activeIdx];
  const building = stage==="building";

  return (
    <section id="generator" className="relative py-24 px-4 lg:px-12 overflow-hidden">
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-brand-cyan/4 rounded-full blur-[150px]"/>
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-brand-purple/4 rounded-full blur-[150px]"/>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan text-[10px] font-black uppercase tracking-widest mb-6">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" animate={{scale:[1,1.8,1]}} transition={{duration:1.5,repeat:Infinity}}/>
            Live Generator — No Account Required
          </motion.div>
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.1}}
            className="text-5xl lg:text-7xl font-black italic tracking-tight mb-5">
            Speak. Watch It{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-purple to-pink-500">Appear.</span>
          </motion.h2>
          <motion.p initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.2}}
            className="text-white/35 max-w-xl mx-auto">
            Describe your business in plain English. AI architects, designs, and writes your full website in seconds.
          </motion.p>
        </div>

        {/* Input */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="relative group">
            {/* Glow */}
            <div className={cn("absolute -inset-px rounded-3xl transition-all duration-500 blur-sm",
              listening ? "bg-gradient-to-r from-red-500 to-red-400 opacity-50 animate-pulse"
              : stage==="thinking"||stage==="building" ? "bg-gradient-to-r from-brand-cyan to-brand-purple opacity-30"
              : "opacity-0 group-focus-within:opacity-20 bg-gradient-to-r from-brand-cyan to-brand-purple"
            )}/>
            <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-4">
              <div className="flex gap-3">
                {/* Voice btn */}
                <button onClick={toggleVoice}
                  className={cn("relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    listening ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-white/5 text-brand-cyan hover:bg-brand-cyan/10 hover:scale-105")}>
                  <Particles active={listening}/>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </svg>
                  {listening && <motion.div className="absolute inset-0 rounded-2xl border-2 border-red-400"
                    animate={{scale:[1,1.25,1],opacity:[1,0,1]}} transition={{duration:1,repeat:Infinity}}/>}
                </button>
                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();generate();}}}
                    placeholder={PROMPTS[promptIdx]} rows={3}
                    disabled={stage==="thinking"||stage==="building"}
                    className="w-full bg-transparent resize-none text-base text-white placeholder-white/20 focus:outline-none leading-relaxed disabled:opacity-40"/>
                  {listening && (
                    <div className="absolute bottom-1 left-0 right-2 h-3 flex gap-0.5 items-end">
                      {Array.from({length:24}).map((_,i)=>(
                        <motion.div key={i} className="flex-1 rounded-full bg-brand-cyan/50 min-h-[2px]"
                          animate={{scaleY:[0.2,Math.random()*0.8+0.2,0.2]}}
                          transition={{duration:0.25+Math.random()*0.3,repeat:Infinity,delay:i*0.04}}/>
                      ))}
                    </div>
                  )}
                </div>
                {/* Generate/Reset btn */}
                <button onClick={stage==="done"||stage==="error"?reset:generate}
                  disabled={stage==="thinking"||stage==="building"||(!prompt.trim()&&stage==="idle")}
                  className={cn("flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                    stage==="done"||stage==="error"
                    ? "bg-white/8 text-white hover:bg-white/15"
                    : "bg-gradient-to-br from-brand-cyan to-brand-purple text-white hover:scale-105 hover:shadow-xl hover:shadow-brand-cyan/20 disabled:opacity-25 disabled:scale-100")}>
                  {(stage==="thinking"||stage==="building") ? (
                    <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"/>
                  ) : (stage==="done"||stage==="error") ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  )}
                </button>
              </div>
              <ThinkingBar stage={stage} line={line}/>
              <AnimatePresence>
                {stage==="error"&&error&&(
                  <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className="mt-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">{error}</motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick prompts */}
          <AnimatePresence>
            {stage==="idle"&&(
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="mt-4 flex gap-2 flex-wrap justify-center">
                {["Personal injury attorney in Houston","Dog grooming salon in Chicago","Mexican restaurant in Phoenix","HVAC repair in Dallas"].map(p=>(
                  <button key={p} onClick={()=>setPrompt(p)}
                    className="text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-white/8 hover:border-brand-cyan/40 hover:bg-brand-cyan/5 transition-all text-white/25 hover:text-brand-cyan">{p}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <AnimatePresence>
          {variations.length>0&&(
            <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.5}}>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 px-1">
                <div className="flex gap-2 flex-wrap">
                  {variations.map((vv,i)=>(
                    <button key={vv.id} onClick={()=>setActiveIdx(i)}
                      className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        activeIdx===i?"bg-white/10 border border-white/20 text-white":"bg-white/[0.03] border border-white/5 text-white/35 hover:text-white/60 hover:bg-white/6")}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:vv.palette[0]}}/>
                      {vv.name}
                      {activeIdx===i&&<span className="text-[9px] text-brand-cyan font-black ml-0.5">{vv.qualityScore}%</span>}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white/[0.03] border border-white/8 rounded-xl p-1 gap-0.5">
                    {(["desktop","tablet","mobile"] as DeviceMode[]).map(d=>(
                      <button key={d} onClick={()=>setDevice(d)}
                        className={cn("px-2.5 py-1.5 rounded-lg text-xs transition-all",
                          device===d?"bg-white/10 text-white":"text-white/25 hover:text-white/50")}>
                        {DEVICE[d].icon}
                      </button>
                    ))}
                  </div>
                  <Link to="/setup"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple text-black text-xs font-black hover:scale-105 transition-transform shadow-lg shadow-brand-cyan/20">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Publish Site
                  </Link>
                </div>
              </div>

              {/* Variation meta */}
              {v&&(
                <motion.div key={activeIdx} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                  className="flex items-center gap-3 mb-4 px-1">
                  <div className="flex gap-1.5">
                    {v.palette.slice(0,4).map((c,i)=>(
                      <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{background:c}}/>
                    ))}
                  </div>
                  <span className="text-[10px] text-white/25 font-mono">{v.fontPair}</span>
                  <span className="text-white/15">·</span>
                  <span className="text-[10px] text-white/25 italic">{v.mood}</span>
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black"
                    style={{background:"#22c55e15",border:"1px solid #22c55e30",color:"#22c55e"}}>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
                      animate={{scale:[1,1.4,1]}} transition={{duration:2,repeat:Infinity}}/>
                    {v.qualityScore||92}% QUALITY
                  </div>
                </motion.div>
              )}

              <Preview html={v?.html||""} device={device} building={building}/>

              {/* CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/pricing"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">
                  View All Plans
                </Link>
                <Link to="/setup"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-purple text-black text-sm font-black hover:scale-105 transition-transform shadow-xl shadow-brand-cyan/20">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Publish This Site — Start at $1
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {stage==="idle"&&variations.length===0&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-6 text-center">
            <div className="inline-flex flex-col items-center gap-3 p-10 rounded-3xl border border-white/[0.05] bg-white/[0.02]">
              <motion.div animate={{y:[0,-10,0]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}}
                className="text-5xl opacity-15">🌐</motion.div>
              <p className="text-white/15 text-xs font-mono tracking-[0.25em] uppercase">Your website preview renders here</p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default GeneratorSection;
