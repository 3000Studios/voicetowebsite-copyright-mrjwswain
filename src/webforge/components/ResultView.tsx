import React, { useState } from "react";
import { GeneratedCode, TabType } from "../types";
import { refineCode, enhanceCode } from "../services/geminiService";

interface ResultViewProps {
  result: GeneratedCode;
  onUpdate: (newResult: GeneratedCode) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onUpdate, isAnalyzing, setIsAnalyzing }) => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.PREVIEW);
  const [copied, setCopied] = useState(false);
  const [refineInput, setRefineInput] = useState("");

  const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.html);
    setCopied(true);
    playSound("https://www.soundboard.com/handler/Downloadaudio.ashx?id=258525");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInput || isAnalyzing) return;
    setIsAnalyzing(true);
    playSound("https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529");
    try {
      const newResult = await refineCode(result.html, refineInput);
      onUpdate(newResult);
      setRefineInput("");
      playSound("https://www.soundboard.com/handler/Downloadaudio.ashx?id=258532");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEnhance = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    playSound("https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529");
    try {
      const newResult = await enhanceCode(result.html);
      onUpdate(newResult);
      playSound("https://www.soundboard.com/handler/Downloadaudio.ashx?id=258532");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="w-full h-[600px] flex flex-col beveled-box overflow-hidden border-2 border-slate-700/50">
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/90">
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab(TabType.PREVIEW);
                playSound("https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529");
              }}
              className={`px-6 py-2 rounded-lg text-xs font-black orbitron transition-all ${activeTab === TabType.PREVIEW ? "bg-slate-100 text-slate-900 shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
            >
              PREVIEW
            </button>
            <button
              onClick={() => {
                setActiveTab(TabType.CODE);
                playSound("https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529");
              }}
              className={`px-6 py-2 rounded-lg text-xs font-black orbitron transition-all ${activeTab === TabType.CODE ? "bg-slate-100 text-slate-900 shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
            >
              CODE
            </button>
          </div>

          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleEnhance}
              disabled={isAnalyzing}
              className="btn-3d px-6 py-2.5 rounded-xl text-xs font-black orbitron flex items-center bg-indigo-900/50 border-indigo-500 text-indigo-100 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> ENHANCE
            </button>
            <button
              onClick={copyToClipboard}
              className={`btn-3d px-6 py-2.5 rounded-xl text-xs font-black orbitron flex items-center ${copied ? "text-green-400 border-green-500/50" : "text-slate-200"}`}
            >
              <i className={`fa-solid ${copied ? "fa-check" : "fa-skull"} mr-2`}></i>
              {copied ? "COPIED!" : "GET OVER HERE!"}
            </button>
            <button
              onClick={() => {
                const blob = new Blob([result.html], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "forged-component.html";
                a.click();
              }}
              className="btn-3d btn-3d-primary px-6 py-2.5 rounded-xl text-xs font-black orbitron flex items-center"
            >
              <i className="fa-solid fa-download mr-2"></i> EXPORT
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-white">
          {activeTab === TabType.PREVIEW ? (
            <iframe
              srcDoc={result.html}
              title="Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="w-full h-full bg-[#0d1117] overflow-auto code-scrollbar p-8">
              <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
                <code>{result.html}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="beveled-box p-6 border-slate-700/50 flex flex-col space-y-4">
        <h3 className="text-xs font-black orbitron text-slate-400 uppercase tracking-widest flex items-center">
          <i className="fa-solid fa-pen-nib mr-2"></i> Interactive Adjustment
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            placeholder="Tell the forge what to change... (e.g. 'Make the hero section have a larger font')"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-6 py-3 text-sm font-bold text-slate-100 outline-none focus:border-slate-500"
            onKeyDown={(e) => e.key === "Enter" && handleRefine()}
          />
          <button
            onClick={handleRefine}
            disabled={isAnalyzing || !refineInput}
            className="btn-3d px-8 py-3 rounded-xl font-black orbitron text-xs text-slate-200"
          >
            APPLY CHANGES
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
