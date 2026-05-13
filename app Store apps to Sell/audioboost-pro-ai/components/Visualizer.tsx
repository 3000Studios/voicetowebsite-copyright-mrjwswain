
// Add React import to resolve 'Cannot find namespace React' error
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Darker clear for the tech theme
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#00f2ff'; // Neon Blue
      canvasCtx.shadowBlur = 15;
      canvasCtx.shadowColor = '#00f2ff';

      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isActive]);

  return (
    <div className="w-full h-full bg-black/40 rounded-lg overflow-hidden relative">
       <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full h-full object-cover"
      />
      {!isActive && (
         <div className="absolute inset-0 flex items-center justify-center text-slate-700">
            <span className="text-xs font-black tracking-[0.5em] uppercase italic opacity-50">Signal Offline</span>
         </div>
      )}
    </div>
  );
};

export default Visualizer;
