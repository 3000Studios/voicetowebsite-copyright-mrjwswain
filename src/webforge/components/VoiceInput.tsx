import React, { useState, useEffect } from "react";

interface VoiceInputProps {
  onResult: (text: string) => void;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setSupported(true);
    }
  }, []);

  const toggleListening = () => {
    if (!supported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (!isListening) {
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`${className} flex items-center justify-center transition-all ${
        isListening
          ? "bg-red-500/20 text-red-400 border-red-500 animate-pulse"
          : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500"
      } border rounded-xl p-3`}
      title={isListening ? "Listening..." : "Voice Command"}
    >
      <i className={`fa-solid ${isListening ? "fa-microphone-lines" : "fa-microphone"}`}></i>
    </button>
  );
};

export default VoiceInput;
