import React, { useState, useEffect, useRef } from 'react';

export default function InstantDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isRecording && timeLeft === 0) {
      handleStop();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRecording, timeLeft]);

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendToAI(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTimeLeft(10);
      setResult(null);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendToAI = async (blob) => {
    setIsProcessing(true);
    setShowModal(true);
    
    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        body: blob
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error("API Error");
      }
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to process audio. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="instant-demo-wrapper" id="website-generator" style={{ margin: '4rem auto', maxWidth: '600px' }}>
      <div className="studio-card card-3000" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1rem' }}>
        <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>Experience the Neural Engine</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>Speak for 10 seconds to generate a full site structure instantly.</p>
        
        {!isRecording ? (
          <button 
            onClick={handleStart}
            style={{
              padding: '1rem 3rem',
              backgroundColor: '#fbbf24',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
              animation: 'pulse-gold 2s infinite'
            }}
          >
            Start Recording
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse-red 1s infinite'
            }}>
              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.5rem' }}>{timeLeft}s</span>
            </div>
            <button onClick={handleStop} style={{ marginTop: '1rem', padding: '0.5rem 2rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '999px', cursor: 'pointer' }}>
              Stop Early
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content card-3000" style={{ backgroundColor: '#0f172a', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(251, 191, 36, 0.3)', width: '95%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="loader" style={{ border: '4px solid #1e293b', borderTop: '4px solid #fbbf24', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: '#fff' }}>Whisper & Llama are building your site...</p>
              </div>
            ) : result?.error ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>{result.error}</p>
                <button onClick={() => setShowModal(false)} style={{ marginTop: '1rem', padding: '0.5rem 2rem', backgroundColor: '#fbbf24', borderRadius: '0.5rem', border: 'none', fontWeight: 'bold' }}>Try Again</button>
              </div>
            ) : (
              <div>
                <div style={{ color: '#fbbf24', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '1rem' }}>Neural Generation Complete</div>
                
                <div className="preview-blur" style={{ position: 'relative', overflow: 'hidden', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                   <div style={{ filter: 'blur(8px)', opacity: 0.6 }}>
                      <h2 style={{ color: '#fff' }}>{result?.skeleton?.title}</h2>
                      {result?.skeleton?.sections?.map((s, i) => (
                        <div key={i} style={{ marginBottom: '1rem' }}>
                          <h4 style={{ color: '#fbbf24' }}>{s.heading}</h4>
                          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{s.body}</p>
                        </div>
                      ))}
                   </div>
                   <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                      <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid rgba(251, 191, 36, 0.3)', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                        <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Save Your Site</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Unlock the source code and deploy live.</p>
                        <a 
                          href="https://buy.stripe.com/cNi14nfxj5mKeVOcEabAs0c" 
                          style={{ display: 'block', padding: '0.75rem 1.5rem', backgroundColor: '#fbbf24', color: '#000', fontWeight: 'bold', borderRadius: '0.5rem', textDecoration: 'none' }}
                        >
                          Unlock Full Site - $49
                        </a>
                      </div>
                   </div>
                </div>

                <button onClick={() => setShowModal(false)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Close Preview
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(251, 191, 36, 0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
