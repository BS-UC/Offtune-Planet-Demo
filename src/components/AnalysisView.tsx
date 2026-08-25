/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, HelpCircle, Activity } from 'lucide-react';

interface AnalysisViewProps {
  onComplete: () => void;
  recordingStats: { pitchVariance: string; volumeFluctuation: string };
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ onComplete, recordingStats }) => {
  const [vocalColor, setVocalColor] = useState(25);
  const [rhythmLoose, setRhythmLoose] = useState(30);
  const [phaseText, setPhaseText] = useState('初始化音频解析通道...');

  // Progress counter simulation
  useEffect(() => {
    const timer1 = setInterval(() => {
      setVocalColor(prev => {
        if (prev >= 85) {
          clearInterval(timer1);
          return 85;
        }
        return prev + Math.floor(Math.random() * 8) + 3;
      });
    }, 150);

    const timer2 = setInterval(() => {
      setRhythmLoose(prev => {
        if (prev >= 92) {
          clearInterval(timer2);
          return 92;
        }
        return prev + Math.floor(Math.random() * 9) + 4;
      });
    }, 120);

    // Dynamic phase statuses
    const phases = [
      '初始化音频解析通道...',
      '对齐微音高变分参数...',
      '提取不规则振幅波形...',
      '捕捉声码器色彩共鸣...',
      '校准非正弦多维和弦...',
    ];
    let phaseIdx = 0;
    const phaseTimer = setInterval(() => {
      if (phaseIdx < phases.length - 1) {
        phaseIdx++;
        setPhaseText(phases[phaseIdx]);
      } else {
        clearInterval(phaseTimer);
      }
    }, 600);

    // Auto-navigate after 3.2s
    const doneTimer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(phaseTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col h-full px-6 justify-between py-6">
      
      {/* Upper header */}
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="w-10 h-10 mx-auto rounded-full bg-primary-fixed-dim/15 flex items-center justify-center text-primary-fixed-dim border border-primary-fixed-dim/30 mb-3"
        >
          <Cpu className="w-5 h-5" />
        </motion.div>
        
        <h2 className="font-display font-black text-2xl text-primary">
          AI 深度共鸣中...
        </h2>
        <p className="font-mono text-[10px] text-on-surface-variant/80 tracking-widest mt-1">
          RESONATING VOCAL PROFILES
        </p>
      </div>

      {/* Dynamic parameters details columns */}
      <div className="space-y-6 my-4 w-full">
        
        {/* Metric 1 */}
        <div className="glass p-4 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              情感色彩提取
            </span>
            <span className="font-display font-extrabold text-sm text-primary">
              {vocalColor}%
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              style={{ width: `${vocalColor}%` }}
              className="h-full bg-gradient-to-r from-primary-fixed-dim to-primary shadow-[0_0_8px_#00f2ff]" 
            />
          </div>
          <span className="text-[10px] text-on-surface-variant/50 mt-1.5 block text-left">
            实时比对特征: {recordingStats.pitchVariance || '宽阶音高跃升'}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="glass p-4 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
              节奏松弛度分析
            </span>
            <span className="font-display font-extrabold text-sm text-secondary">
              {rhythmLoose}%
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              style={{ width: `${rhythmLoose}%` }}
              className="h-full bg-gradient-to-r from-secondary-container to-secondary shadow-[0_0_8px_#cf5cff]" 
            />
          </div>
          <span className="text-[10px] text-on-surface-variant/50 mt-1.5 block text-left">
            微时区弹拉系数: {recordingStats.volumeFluctuation || '半深度气息拖延'}
          </span>
        </div>

      </div>

      {/* Floating tag clouds */}
      <div className="flex flex-wrap gap-2.5 justify-center w-full px-2 my-2">
        <motion.span 
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="px-3.5 py-1.5 rounded-full glass border-primary-fixed-dim/20 text-primary-fixed-dim font-display text-[11px] font-bold"
        >
          # 节奏松弛
        </motion.span>
        
        <motion.span 
          animate={{ y: [0, -7, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, delay: 0.2, ease: 'easeInOut' }}
          className="px-3.5 py-1.5 rounded-full glass border-secondary-container/20 text-secondary-fixed-dim font-display text-[11px] font-bold"
        >
          # 迷幻嗓音
        </motion.span>
        
        <motion.span 
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: 'easeInOut' }}
          className="px-3.5 py-1.5 rounded-full glass border-white/10 text-on-surface font-display text-[11px] font-bold"
        >
          # 灵魂错位
        </motion.span>
      </div>

      {/* Bottom ticker statuses */}
      <div className="text-center mt-4 w-full h-8 flex items-center justify-center border-t border-white/5 pt-3">
        <Activity className="w-3.5 h-3.5 text-primary-fixed-dim animate-pulse mr-2" />
        <span className="font-mono text-[10px] tracking-wider text-on-surface-variant uppercase">
          {phaseText}
        </span>
      </div>

    </div>
  );
};
