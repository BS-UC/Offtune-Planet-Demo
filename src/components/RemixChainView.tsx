/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, Play, Mic, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface RemixChainViewProps {
  onStartChain: () => void;
  selectedPostUsername?: string;
}

export const RemixChainView: React.FC<RemixChainViewProps> = ({
  onStartChain,
  selectedPostUsername = '林中宇',
}) => {
  return (
    <div className="flex flex-col h-full px-5 text-left py-2">
      
      {/* Upper info content */}
      <div className="mb-8">
        <h2 className="font-display font-black text-2xl text-primary">
          反调接龙
        </h2>
        <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">
          接力前一人的跑偏颗粒，用全新的曲风重组数字和声
        </p>
      </div>

      {/* Linked Step Timeline */}
      <div className="relative pl-10 space-y-10 mb-8 flex-1">
        
        {/* Continuous Neon Gradient connector rod */}
        <div className="absolute left-3.5 top-2.5 bottom-8.5 w-[3px] bg-gradient-to-b from-primary via-secondary to-primary/40 rounded-full" />

        {/* Timeline node item 1 */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          {/* Circular pointer marker */}
          <div className="absolute -left-[35px] top-2 w-5 h-5 rounded-full bg-primary shadow-[0_0_12px_#00f2ff] border-4 border-background z-10" />
          
          <div className="glass p-4 rounded-2xl border border-primary/20 relative group hover:border-primary/40 transition-colors">
            <span className="font-mono text-[8.5px] font-extrabold tracking-widest text-primary uppercase block mb-1">
              ORIGINAL BY {selectedPostUsername}
            </span>
            <h4 className="font-display font-bold text-xs text-on-surface">
              《故障的开端》
            </h4>
            <p className="font-sans text-[10px] text-on-surface-variant/70 mt-1 leading-relaxed">
              “节拍在 1.5 倍音轨跃迁，拉扯出了极其慵懒的呼吸感觉。”
            </p>
          </div>
        </motion.div>

        {/* Timeline node item 2 */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="relative"
        >
          {/* Circular pointer marker */}
          <div className="absolute -left-[35px] top-2 w-5 h-5 rounded-full bg-secondary shadow-[0_0_12px_#cf5cff] border-4 border-background z-10" />
          
          <div className="glass p-4 rounded-2xl border border-secondary/20 relative hover:border-secondary/40 transition-colors">
            <span className="font-mono text-[8.5px] font-extrabold tracking-widest text-secondary uppercase block mb-1">
              REMIX 1 BY 猫眼星人
            </span>
            <h4 className="font-display font-bold text-xs text-on-surface">
              《在星云中迷失》
            </h4>
            <p className="font-sans text-[10px] text-on-surface-variant/70 mt-1 leading-relaxed">
              “我加入了空灵宇宙混响链，配合他的第一句，犹如星尘飘落。”
            </p>
          </div>
        </motion.div>

        {/* Timeline node item 3: Your turn active block */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative"
        >
          {/* Rippling hot ping anchor marker */}
          <div className="absolute -left-[35px] top-2.5 w-5 h-5 rounded-full bg-primary-container shadow-[0_0_15px_#00dbe7] border-4 border-background z-10 animate-pulse" />
          
          <div className="bg-primary/5 border border-dashed border-primary/35 p-6 rounded-2xl text-center shadow-[0_0_15px_rgba(0,219,231,0.06)] relative overflow-hidden group">
            <h4 className="font-display font-extrabold text-[#e1e2e7] text-md mb-1.5 flex items-center justify-center gap-1.5">
              轮到你了
            </h4>
            <p className="font-sans text-[11px] text-on-surface-variant mb-4.5 max-w-[200px] mx-auto leading-relaxed">
              点击录制你的一句反调音频，与猫眼星人的声频交叉叠加
            </p>
            
            <button
              onClick={onStartChain}
              className="px-5 py-2.5 rounded-full bg-primary text-surface font-mono text-[10px] font-extrabold uppercase tracking-widest cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.3)] hover:shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-103 transition-all flex items-center gap-1.5 mx-auto"
            >
              <Mic className="w-3.5 h-3.5 fill-current" />
              开始接龙
            </button>
          </div>
        </motion.div>

      </div>

    </div>
  );
};
