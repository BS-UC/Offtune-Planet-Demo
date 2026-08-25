/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SquadItem } from '../types';
import { Users, Sparkles, Radio, Plus, Check, Heart, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SquadViewProps {
  squads: SquadItem[];
  onAddSquad: (name: string, desc: string, colorType: 'primary' | 'secondary' | 'accent') => void;
  onJoinSquad: (id: string) => void;
  joinedSquadIds: string[];
}

export const SquadView: React.FC<SquadViewProps> = ({
  squads,
  onAddSquad,
  onJoinSquad,
  joinedSquadIds,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadDesc, setNewSquadDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState<'primary' | 'secondary' | 'accent'>('primary');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSquadName.trim() && newSquadDesc.trim()) {
      onAddSquad(newSquadName, newSquadDesc, selectedColor);
      setNewSquadName('');
      setNewSquadDesc('');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-5 text-left py-2 space-y-4">
      
      {/* Upper header title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-black text-2xl text-primary">
            反调小队
          </h2>
          <p className="font-sans text-xs text-on-surface-variant mt-0.5">
            加入或创建你最合拍的反调艺术工会
          </p>
        </div>
      </div>

      {/* Grid of Squad bento cards */}
      <div className="grid grid-cols-2 gap-4 flex-1 pb-4">
        {squads.map((squad) => {
          const isJoined = joinedSquadIds.includes(squad.id);
          
          let iconColor = 'text-primary';
          let bgColor = 'bg-primary/20';
          if (squad.colorType === 'secondary') {
            iconColor = 'text-secondary';
            bgColor = 'bg-secondary/20';
          } else if (squad.colorType === 'accent') {
            iconColor = 'text-primary-container';
            bgColor = 'bg-primary-container/20';
          }

          return (
            <motion.div
              layout
              key={squad.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-5 rounded-3xl flex flex-col items-center text-center justify-between border border-white/6 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/2 rounded-bl-full pointer-events-none" />

              <div className="flex flex-col items-center">
                {/* Decorative Icon */}
                <div className={`w-13 h-13 rounded-2xl ${bgColor} flex items-center justify-center mb-3.5 shadow-inner`}>
                  <Users className={`w-6 h-6 ${iconColor}`} />
                </div>

                <h4 className="font-display font-black text-[#e1e2e7] text-xs leading-snug truncate max-w-[140px]">
                  {squad.name}
                </h4>
                
                <p className="text-[10px] text-on-surface-variant/75 font-sans mt-1 leading-normal max-w-[130px] line-clamp-2 min-h-[30px]">
                  {squad.desc}
                </p>
              </div>

              {/* Stats counter */}
              <div className="w-full mt-4">
                <span className="px-3 py-1 rounded-full bg-surface-container font-mono text-[9px] text-on-surface-variant/80 tracking-snug block mb-2.5">
                  {squad.membersCount} 成员
                </span>

                <button
                  onClick={() => onJoinSquad(squad.id)}
                  className={`w-full py-1.5 rounded-xl font-mono text-[9px] font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center justify-center gap-1 border ${
                    isJoined
                      ? 'bg-transparent border-primary/25 text-primary'
                      : 'bg-[#111417] border-white/10 hover:border-primary-fixed-dim text-on-surface-variant hover:text-primary-fixed-dim'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check className="w-3 h-3" />
                      已加入
                    </>
                  ) : (
                    '加入小队'
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Action button card: Create a squad */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="glass p-5 rounded-3xl border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-primary-fixed-dim/30 hover:shadow-[0_0_15px_rgba(0,219,231,0.04)] transition-all min-h-[220px]"
        >
          <div className="w-13 h-13 rounded-full bg-white/2 border border-white/5 flex items-center justify-center mb-3 text-on-surface-variant">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#e1e2e7]">
            创建小队
          </p>
          <span className="text-[9px] text-on-surface-variant/60 block mt-1">组建你专属的反调公社</span>
        </motion.button>
      </div>

      {/* Creation pop-up Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl p-6 w-full max-w-[340px] border border-white/10 relative z-50 shadow-2xl bg-surface-dim"
            >
              <h3 className="font-display font-extrabold text-md text-primary mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary-fixed-dim" />
                组建你的反调联盟
              </h3>
              <p className="font-sans text-[10px] text-on-surface-variant/80 mb-4 leading-relaxed">
                聚拢所有偏离常规轨道的声音，让意外成为我们工会的名片
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Field 1 */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/80">小队学名 (Name)</label>
                  <input
                    type="text"
                    required
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    placeholder="例如: 节奏滑音研究社"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/4 border border-white/10 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-fixed-dim"
                  />
                </div>

                {/* Field 2 */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/80">核心纲领 (Manifesto)</label>
                  <textarea
                    required
                    rows={2}
                    value={newSquadDesc}
                    onChange={(e) => setNewSquadDesc(e.target.value)}
                    placeholder="不超过 30 个字，如: 只收集不合拍的错位声频"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/4 border border-white/10 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-fixed-dim resize-none"
                  />
                </div>

                {/* Theme Color selectors */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/80">小队光谱 (Vantage Vibe)</label>
                  <div className="flex gap-2">
                    {['primary', 'secondary', 'accent'].map((col) => {
                      let bg = 'bg-[#00dbe7]';
                      if (col === 'secondary') bg = 'bg-[#cf5cff]';
                      if (col === 'accent') bg = 'bg-[#74f5ff]';

                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col as any)}
                          className={`w-6 h-6 rounded-full ${bg} relative cursor-pointer flex items-center justify-center transition-all ${
                            selectedColor === col ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {selectedColor === col && <Check className="w-3.5 h-3.5 text-surface font-extrabold" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 font-sans text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-primary-container text-surface font-sans text-[11px] font-extrabold cursor-pointer hover:opacity-90"
                  >
                    开始组建
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
