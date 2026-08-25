/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { AnalysisResult } from '../types';
import { Play, Pause, SkipBack, SkipForward, Flame, Share2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OffTuneSynth } from '../utils/audioSynth';

interface ResultPlayerViewProps {
  result: AnalysisResult;
  synth: OffTuneSynth;
  onPublishToSquare: () => void;
  onRemixChain: () => void;
}

export const ResultPlayerView: React.FC<ResultPlayerViewProps> = ({
  result,
  synth,
  onPublishToSquare,
  onRemixChain,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [vibeStyle, setVibeStyle] = useState('lofi');
  
  // Scrubber progress simulator
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Sync state values with synth
  useEffect(() => {
    // Lazy attach beat hook so we can highlight correct lyrics lines!
    synth.setOnBeat((step) => {
      setActiveStep(step);
      setProgress(((step % 16) / 16) * 100);
    });

    // Start playing automatically when the user arrives on this screen
    handleTogglePlay(true);

    return () => {
      synth.stop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Set up visualizer drawing loop
  useEffect(() => {
    if (isPlaying) {
      drawVisuals();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isPlaying]);

  const drawVisuals = () => {
    if (!canvasRef.current || !synth.analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = synth.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !synth.analyser) return;
      animationRef.current = requestAnimationFrame(draw);

      synth.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.8;

        // Custom cyber/purple gradient for visual effects
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#cf5cff');
        gradient.addColorStop(1, '#00dbe7');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  const handleTogglePlay = (forceState?: boolean) => {
    const nextState = typeof forceState === 'boolean' ? forceState : !isPlaying;
    
    if (nextState) {
      setIsPlaying(true);
      synth.start(result.song.style, result.song.notes);
    } else {
      setIsPlaying(false);
      synth.stop();
    }
  };

  // Skip tracks (randomizes notes for fun synth variations on the fly!)
  const handleRandomizeRemix = () => {
    const active = isPlaying;
    if (active) synth.stop();
    
    // Mix notes array randomly
    const prevNotes = [...result.song.notes];
    result.song.notes = prevNotes.map(n => n * (Math.random() > 0.5 ? 1.5 : 0.75));
    
    if (active) {
      synth.start(result.song.style, result.song.notes);
    } else {
      handleTogglePlay(true);
    }
  };

  // Safely grab dynamic variables
  const songTitle = result.song.title || '《第 101 次跑调》';
  const lyrics = result.song.lyrics || [];
  const styleChineseName = {
    lofi: 'Lo-fi 碎语',
    cyber: '赛博故障',
    cosmic: '空灵宇宙',
  }[result.song.style] || '未知道';

  return (
    <div className="flex flex-col h-full px-5 justify-between py-2">
      
      {/* Upper aspect poster */}
      <div className="w-full glass rounded-3xl overflow-hidden aspect-[4/5] relative shadow-2xl border border-white/10 shrink-0">
        <img 
          className="w-full h-full object-cover opacity-65 mix-blend-screen select-none pointer-events-none" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn4VXqnJfaFNcLnU3_iyHR5VYoh1ij08N1j-zQZGuNkEbGS7VUEcQklUL0RN8rdC5SV4z4tnEuKTxLOjJ_zuXaJDzo-m5jJ13unwD7BpHOWrAi7mc5MPHcKe97uj5KbbEz27k2pVRh9cSaNN-4Qcf1s-eCRS1fEfJo4Cy0ZwrRDfNsWY0mOEk0UEDeE--pr6zoKLEt1d5lISyi66YI9n111C2WPYHhbx3EFGqj52eOItQIEWhO_YBIHkc6MAZxY8g-9u0gmdyfR65E" 
          alt="Atmospheric cyber wave record"
          referrerPolicy="no-referrer"
        />
        
        {/* Dark vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/10 to-transparent pointer-events-none" />

        {/* Dynamic audio waves canvas integrated in album view */}
        <div className="absolute inset-x-0 bottom-14 h-11 pointer-events-none px-6">
          <canvas 
            ref={canvasRef} 
            width={340} 
            height={44}
            className="w-full h-full opacity-40" 
          />
        </div>

        {/* Text descriptions inside card */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-1.5 mb-1 bg-primary/10 border border-primary/20 w-fit px-2 py-0.5 rounded-full select-none">
            <Flame className="w-3 h-3 text-primary-fixed-dim" />
            <span className="text-[9px] text-primary uppercase font-mono tracking-wider font-extrabold">{styleChineseName}</span>
          </div>

          <h3 className="font-display font-extrabold text-lg text-primary mb-0.5 tracking-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
            {songTitle}
          </h3>
          <p className="font-sans text-xs text-on-surface-variant/80">
            Featuring. OffTune Planet AI
          </p>
        </div>
      </div>

      {/* Dynamic Synced Lyrics block */}
      <div className="my-2 h-[85px] py-1 flex flex-col justify-center items-center overflow-hidden shrink-0">
        <ul className="text-center space-y-1 w-full px-4">
          {lyrics.map((line, idx) => {
            // Check if current line matches step timing
            const isLineActive = isPlaying && (activeStep % 4) === idx;
            
            return (
              <motion.li
                key={idx}
                animate={{ 
                  scale: isLineActive ? 1.05 : 0.95,
                  opacity: isLineActive ? 1 : 0.45 
                }}
                transition={{ duration: 0.2 }}
                className={`font-sans text-[11px] leading-relaxed select-none ${
                  isLineActive 
                    ? 'text-primary font-bold drop-shadow-[0_0_8px_rgba(0,219,231,0.5)]' 
                    : 'text-on-surface-variant'
                }`}
              >
                {line}
              </motion.li>
            );
          })}
        </ul>
      </div>

      {/* Play / pause controls */}
      <div className="flex items-center justify-center gap-10 shrink-0 my-1">
        
        {/* Skip Back */}
        <button 
          onClick={handleRandomizeRemix}
          className="text-on-surface-variant/70 hover:text-primary transition-all cursor-pointer active:scale-90"
          title="重洗音轨"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        {/* Play core with giant pulse rings */}
        <button 
          onClick={() => handleTogglePlay()}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-fixed-dim to-secondary-container flex items-center justify-center shadow-[0_0_20px_rgba(0,219,231,0.5)] hover:shadow-[0_0_35px_rgba(207,92,255,0.7)] cursor-pointer relative transition-transform active:scale-95 duration-200"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-surface fill-current" />
          ) : (
            <Play className="w-7 h-7 text-surface fill-current translate-x-0.5" />
          )}
        </button>

        {/* Skip Forward */}
        <button 
          onClick={handleRandomizeRemix}
          className="text-on-surface-variant/70 hover:text-primary transition-all cursor-pointer active:scale-90"
          title="生成变奏"
        >
          <SkipForward className="w-6 h-6" />
        </button>

      </div>

      {/* Scrub bar */}
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden shrink-0 relative mt-1">
        <div 
          className="h-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container rounded-full transition-all duration-300" 
          style={{ width: `${isPlaying ? progress : 0}%` }}
        />
      </div>

      {/* Multi Action buttons */}
      <div className="flex gap-4 shrink-0 mt-3.5 mb-1.5 w-full">
        {/* Remix invite */}
        <button 
          onClick={onRemixChain}
          className="flex-1 py-3 text-[11px] font-bold rounded-xl glass hover:bg-white/5 border border-secondary-container/20 hover:border-secondary-container/40 text-secondary transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          邀请朋友接一句
        </button>
        
        {/* Publish */}
        <button 
          onClick={onPublishToSquare}
          className="flex-1 py-3 text-[11px] font-bold rounded-xl bg-primary-container text-surface hover:opacity-90 hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          发布到广场
        </button>
      </div>

    </div>
  );
};
