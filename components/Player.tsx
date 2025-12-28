import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, ChevronDown, FileText, Sliders } from 'lucide-react';

interface PlayerProps {
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
  transcript?: string;
}

export const Player: React.FC<PlayerProps> = ({ audioBuffer, audioContext, transcript }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pitch, setPitch] = useState(0); // in cents
  
  // Refs for audio handling
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  
  // Create a gain node for volume control (could add slider later)
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize gain node
    gainNodeRef.current = audioContext.createGain();
    gainNodeRef.current.connect(audioContext.destination);
    
    return () => {
      stopAudio();
      gainNodeRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioContext]);

  // Update detune in real-time
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.detune.value = pitch;
    }
  }, [pitch]);

  const updateProgress = useCallback(() => {
    const currentTime = audioContext.currentTime;
    
    // Note: This calculation assumes 1x playback speed for simplicity.
    // Significant pitch shifting (detuning) will affect playback speed and 
    // cause the progress bar to slightly drift from the actual audio content.
    const elapsed = currentTime - startTimeRef.current + pauseTimeRef.current;
    
    const p = Math.min((elapsed / audioBuffer.duration) * 100, 100);
    setProgress(p);

    if (elapsed < audioBuffer.duration && isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else if (elapsed >= audioBuffer.duration) {
      // We rely on onended mostly, but this is a fallback for UI sync
      // If we are significantly detuned, the audio might have already stopped.
    }
  }, [audioBuffer.duration, audioContext, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isPlaying, updateProgress]);

  const playAudio = () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.detune.value = pitch; // Set initial pitch
    source.connect(gainNodeRef.current!);
    
    // Start playing from the paused position
    const offset = pauseTimeRef.current;
    
    source.start(0, offset);
    startTimeRef.current = audioContext.currentTime;
    sourceNodeRef.current = source;
    
    source.onended = () => {
      // When the audio naturally finishes
      // We check if it was manually stopped (sourceNodeRef is null) or natural end
      if (sourceNodeRef.current) {
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setProgress(100);
        sourceNodeRef.current = null;
      }
    };

    setIsPlaying(true);
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      // We must clear the onended handler so it doesn't trigger the reset logic
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      // Record how much we played
      pauseTimeRef.current += audioContext.currentTime - startTimeRef.current;
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    pauseTimeRef.current = 0;
    setProgress(0);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      // If we reached the end, reset
      if (progress >= 100) {
        pauseTimeRef.current = 0;
      }
      playAudio();
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentSeconds = (progress / 100) * audioBuffer.duration;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Visualizer header area */}
      <div className="bg-indigo-600 px-6 py-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90"></div>
        
        {/* Abstract animated waves */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
             <div className="flex gap-1 h-32 items-center">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-white rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDuration: `${0.4 + Math.random() * 0.5}s`
                    }}
                  />
                ))}
             </div>
          </div>
        )}

        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Seu Briefing Diário
          </h2>
          <p className="text-indigo-100 text-sm opacity-90">Gerado por Inteligência Artificial</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 text-xs text-slate-500 font-medium font-mono">
          <span>{formatTime(currentSeconds)}</span>
          <span>{formatTime(audioBuffer.duration)}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-6 mb-8">
           <button 
             onClick={stopAudio}
             className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
             title="Reiniciar"
           >
             <RotateCcw className="w-5 h-5" />
           </button>

           <button 
             onClick={togglePlay}
             className="w-16 h-16 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
           >
             {isPlaying ? (
               <Pause className="w-7 h-7 fill-current" />
             ) : (
               <Play className="w-7 h-7 fill-current ml-1" />
             )}
           </button>

           <div className="w-11" /> {/* Spacer for alignment */}
        </div>

        {/* Pitch Control */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
          <Sliders className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 w-16">Tom</span>
          <input 
            type="range" 
            min="-400" 
            max="400" 
            step="10" 
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700"
          />
          <span className="text-xs font-mono font-medium text-slate-500 w-12 text-right">
            {pitch > 0 ? '+' : ''}{Math.round(pitch / 100 * 10) / 10}st
          </span>
        </div>
      </div>

      {/* Transcript toggle */}
      {transcript && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-50 mt-2">
           <details className="group">
             <summary className="list-none flex items-center justify-between cursor-pointer py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-indigo-600 transition-colors select-none">
               <span className="flex items-center gap-2">
                 <FileText className="w-4 h-4" />
                 Ler Transcrição
               </span>
               <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180" />
             </summary>
             <div className="mt-3 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed max-h-60 overflow-y-auto border border-slate-100 shadow-inner font-serif whitespace-pre-wrap">
               {transcript}
             </div>
           </details>
        </div>
      )}
    </div>
  );
};