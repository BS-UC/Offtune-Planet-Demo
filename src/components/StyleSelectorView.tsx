/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RemixStyle } from '../types';
import { Sparkles, Radio, Zap, Rocket, Music } from 'lucide-react';
import { motion } from 'motion/react';

interface StyleSelectorViewProps {
  onStyleSelected: (style: RemixStyle) => void;
}

export const StyleSelectorView: React.FC<StyleSelectorViewProps> = ({ onStyleSelected }) => {
  const [selectedStyle, setSelectedStyle] = useState<RemixStyle>('lofi');

  const options = [
    {
      id: 'lofi' as RemixStyle,
      title: 'Lo-fi 碎语',
      desc: '低保真的浪漫，适合半梦半醒的哼唱',
      icon: Radio,
      color: 'text-primary',
      borderColor: 'border-primary-container/30',
      bgColor: 'bg-primary-container/5',
      glowColor: 'shadow-[0_0_15px_rgba(0,219,231,0.25)]',
    },
    {
      id: 'cyber' as RemixStyle,
      title: '赛博故障',
      desc: '电子故障音，将错误转化为艺术',
      icon: Zap,
      color: 'text-secondary-fixed-dim',
      borderColor: 'border-secondary-container/20',
      bgColor: 'bg-secondary-container/5',
      glowColor: 'shadow-[0_0_15px_rgba(207,92,255,0.25)]',
    },
    {
      id: 'cosmic' as RemixStyle,
      title: '空灵宇宙',
      desc: '无尽的回声，迷失在星云之间',
      icon: Rocket,
      color: 'text-primary-fixed',
      borderColor: 'border-white/10',
      bgColor: 'bg-white/2',
      glowColor: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]',
    },
  ];

  return (
    <div className="flex flex-col h-full px-5 justify-between py-3">
      
      {/* Upper text */}
      <div className="text-center">
        <h2 className="font-display font-black text-2xl text-primary mt-2">
          选择你的反调基调
        </h2>
        <p className="font-sans text-xs text-on-surface-variant leading-relaxed mt-1">
          将你的哼唱声轨，与以下数字星球声场融合
        </p>
      </div>

      {/* Styled Grid List options */}
      <div className="grid grid-cols-1 gap-4.5 my-4 w-full">
        {options.map((opt) => {
          const IconComponent = opt.icon;
          const isSelected = selectedStyle === opt.id;

          return (
            <motion.div
              key={opt.id}
              onClick={() => setSelectedStyle(opt.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${
                isSelected
                  ? `${opt.borderColor} ${opt.bgColor} ${opt.glowColor} ring-1 ring-primary/25 border-opacity-100`
                  : 'border-white/5 bg-white/1 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="text-left flex-1 pr-4">
                <h4 className={`font-display font-extrabold text-[#e1e2e7] text-md mb-1.5 flex items-center gap-2`}>
                  <Music className={`w-4 h-4 ${opt.color}`} />
                  {opt.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant/85 font-sans leading-relaxed">
                  {opt.desc}
                </p>
              </div>
              
              <div className={`w-11 h-11 rounded-xl glass flex items-center justify-center shrink-0 border border-white/10 ${opt.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA trigger */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-2 mt-4 shrink-0"
      >
        <button
          onClick={() => onStyleSelected(selectedStyle)}
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-[#111417] font-display font-extrabold text-md shadow-[0_0_20px_rgba(0,219,231,0.35)] cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          一键融合生成
        </button>
      </motion.div>

    </div>
  );
};
