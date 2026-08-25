/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, ArrowRight, Keyboard, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecordViewProps {
  onAnalysisStart: (promptText: string, recordingStats: { pitchVariance: string; volumeFluctuation: string }) => void;
}

export const RecordView: React.FC<RecordViewProps> = ({ onAnalysisStart }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showInputHelper, setShowInputHelper] = useState(false);
  
  // Audio state
  const [micActive, setMicActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>([10, 15, 8, 22, 14, 18, 12, 16]);

  const intervalRef = useRef<any>(null);

  // Suggested short prompts to inspire the user
  const suggestions = [
    '哼一首走调的《小星星》',
    '带着沙哑嗓音的电子碎碎念',
    '太空放克律动，随意乱哼哼',
    '深夜空灵哼唱，像漂浮在宇宙',
  ];

  // Request actual microphone stream for rich visualizers
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicActive(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateWaves = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Convert audio frequency data to heights (between 8px and 60px)
        const heights = Array.from(dataArray).slice(0, 8).map(val => {
          return Math.max(10, Math.floor((val / 255) * 60));
        });
        
        // If everything is completely silent, add a very gentle idle flicker
        if (heights.every(h => h <= 10)) {
          setWaveHeights([
            12 + Math.sin(Date.now() / 150) * 4,
            16 + Math.cos(Date.now() / 120) * 6,
            10 + Math.sin(Date.now() / 180) * 5,
            24 + Math.cos(Date.now() / 200) * 8,
            15 + Math.sin(Date.now() / 160) * 6,
            20 + Math.cos(Date.now() / 140) * 5,
            13 + Math.sin(Date.now() / 170) * 4,
            18 + Math.cos(Date.now() / 130) * 7,
          ]);
        } else {
          setWaveHeights(heights);
        }
        animationFrameRef.current = requestAnimationFrame(updateWaves);
      };
      
      updateWaves();
    } catch (e) {
      console.warn('Microphone permission not granted or unavailable. Utilizing high-fidelity simulation visualizer.');
      setMicActive(false);
      startSimulationVisuals();
    }
  };

  const startSimulationVisuals = () => {
    intervalRef.current = setInterval(() => {
      setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 45) + 12));
    }, 120);
  };

  const stopMic = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setMicActive(false);
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setCountdown(0);
      startMic();
    } else {
      handleFinishRecord();
    }
  };

  const handleFinishRecord = () => {
    stopMic();
    setIsRecording(false);
    // Generate simulated evaluation values depending on content/pitch variability
    const hasPromptLength = prompt.trim().length;
    const stats = {
      pitchVariance: hasPromptLength % 2 === 0 ? '极高波动' : '缓步滑音',
      volumeFluctuation: prompt.includes('太空') || prompt.includes('空灵') ? '深呼吸频率' : '宽幅爆音阶',
    };
    onAnalysisStart(prompt, stats);
  };

  return (
    <div className="flex flex-col items-center h-full px-5 justify-between py-2 text-center">
      
      {/* Title block */}
      <div>
        <h2 className="font-display font-bold text-2xl text-primary mt-2">
          大胆唱出你的不完美
        </h2>
        <p className="font-sans text-xs text-on-surface-variant/80 mt-1 max-w-[280px] mx-auto">
          不用唱准，AI 会捕捉你的灵魂律动并合成整首歌曲
        </p>
      </div>

      {/* Waveform Visualization area */}
      <div className="w-full flex justify-center items-center h-28 my-2">
        <div className="flex items-center gap-1.5 h-16 min-w-[150px] justify-center px-4 rounded-2xl bg-white/2">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-100"
              style={{
                height: isRecording ? `${h}px` : '8px',
                background: 'linear-gradient(to top, #00dbe7, #cf5cff)',
                boxShadow: isRecording ? '0 0 10px rgba(0, 219, 231, 0.4)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Mic Trigger / Animation Sphere */}
      <div className="relative flex items-center justify-center my-4 h-44 w-full">
        <AnimatePresence>
          {isRecording && (
            <>
              {/* Multiplying ripple rings */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full border border-primary-fixed-dim/40 pointer-events-none"
              />
              <motion.div 
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={{ scale: 1.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2.2, delay: 0.7, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full border border-secondary-container/40 pointer-events-none"
              />
              <motion.div 
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{ scale: 1.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2.2, delay: 1.4, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full border border-primary/30 pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        {/* Central Button */}
        <button
          onClick={handleToggleRecord}
          className={`w-28 h-28 rounded-full flex items-center justify-center cursor-pointer relative z-10 transition-all duration-300 ${
            isRecording 
              ? 'bg-gradient-to-tr from-[#00dbe7] to-[#cf5cff] shadow-[0_0_30px_rgba(207,92,255,0.6)] scale-102 border-2 border-white/20' 
              : 'bg-surface-container border-2 border-primary-container hover:border-white shadow-[0_0_20px_rgba(0,219,231,0.2)] hover:scale-105'
          }`}
        >
          <Mic className={`w-10 h-10 transition-all ${isRecording ? 'text-surface scale-110' : 'text-primary'}`} />
        </button>

        <p className="absolute bottom-1 font-mono text-[10px] font-bold tracking-widest text-primary/50">
          {isRecording ? 'TAP TO COMPLETE' : 'TAP TO RECORD'}
        </p>
      </div>

      {/* Suggested themes / Text Inputs Helper */}
      <div className="w-full px-2 max-w-[340px] shrink-0 mb-4 z-20">
        
        <div className="flex justify-between items-center mb-2 px-1 text-left">
          <label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            Vibe Prompt / 哼唱配词
          </label>
          <span className="text-[9px] text-on-surface-variant/70">
            (可选 · 辅助AI作词)
          </span>
        </div>

        {/* Custom Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="说说你哼这首歌时的心情，或哼哼的曲风..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-xs focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim/30 placeholder-on-surface-variant/50 transition-all text-on-surface pr-10"
          />
          {prompt.trim().length > 0 && !isRecording && (
            <button
              onClick={handleFinishRecord}
              className="absolute right-2 p-1.5 rounded-lg bg-primary-fixed-dim/20 text-primary-fixed-dim hover:bg-primary-fixed-dim hover:text-surface transition-all cursor-pointer"
              title="一键直接生成"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Hints pills wrapper */}
        <div className="flex flex-wrap gap-1.5 mt-2.5 justify-start max-h-[70px] overflow-y-auto pr-1">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(sug)}
              className="px-2.5 py-1 text-[10px] rounded-full border border-white/5 bg-white/2 text-on-surface-variant hover:text-primary hover:border-primary-container/40 hover:bg-primary-container/10 transition-all cursor-pointer truncate max-w-[145px]"
            >
              {sug}
            </button>
          ))}
        </div>

      </div>

    </div>
  );
};
