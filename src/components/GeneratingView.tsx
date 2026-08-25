/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Dna, Music } from 'lucide-react';

interface GeneratingViewProps {
  onComplete: () => void;
}

export const GeneratingView: React.FC<GeneratingViewProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  const stages = [
    { text: '正在重组声纹颗粒...', icon: Dna, color: 'text-primary' },
    { text: '正在提取和声振变音高...', icon: Sparkles, color: 'text-secondary' },
    { text: '正在捕捉灵魂钩子 (Hook)...', icon: Music, color: 'text-primary' },
    { text: '正在注入反调量子生命力...', icon: Sparkles, color: 'text-[#cf5cff]' },
  ];

  useEffect(() => {
    // Staggered status messages
    const timer = setInterval(() => {
      setStage(prev => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 1000);

    // Auto complete after 4.2 seconds
    const totalTimer = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => {
      clearInterval(timer);
      clearTimeout(totalTimer);
    };
  }, [onComplete, stages.length]);

  return (
    <div className="flex flex-col items-center h-full px-6 justify-center py-6 text-center">
      
      {/* Planetary Outer/Inner Orbits */}
      <div className="relative w-64 h-64 mb-16 shrink-0 flex items-center justify-center">
        
        {/* Outer Orbit Ring with Cyan satellite */}
        <div className="absolute inset-0 border border-white/5 rounded-full animate-orbit">
          <div className="absolute -top-2 left-1/2 -track-x-1/2 w-4 h-4 bg-primary-fixed-dim rounded-full shadow-[0_0_15px_#00f2ff]" />
        </div>

        {/* Inner reverse Orbit Ring with Purple satellite */}
        <div className="absolute inset-8 border border-white/5 rounded-full animate-orbit-reverse">
          <div className="absolute -top-3 left-1/2 -track-x-1/2 w-6 h-6 bg-secondary-container rounded-full shadow-[0_0_15px_#cf5cff]" />
        </div>

        {/* Center core pulse particle */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-fixed-dim/20 to-secondary-container/20 blur-md pointer-events-none"
        />

        <div className="absolute flex flex-col items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim animate-ping mb-2" />
          <span className="text-xs font-mono font-bold tracking-widest text-primary/70">MIXING</span>
        </div>

      </div>

      {/* Loading Stages with AnimatePresence */}
      <div className="h-28 w-full max-w-[300px] flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-3.5"
          >
            {/* Stage Icon */}
            <div className={`p-2 bg-white/2 rounded-xl glass border border-white/10 ${stages[stage]?.color}`}>
              {React.createElement(stages[stage]?.icon || Sparkles, { className: 'w-5 h-5' })}
            </div>

            {/* Stage text */}
            <h3 className="font-display text-md text-primary font-bold animate-pulse">
              {stages[stage]?.text}
            </h3>
            
            <p className="font-sans text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-bold">
              PLANETARY SYNCS IN ROUTE...
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};
