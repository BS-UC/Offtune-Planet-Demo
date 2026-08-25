/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Award, Compass, Star, ArrowRight, Edit2, Check, X } from 'lucide-react';
import { AnalysisResult } from '../types';

interface IdentityViewProps {
  result: AnalysisResult | null;
  onNext: () => void;
  onUpdateUserTitle: (newTitle: string) => void;
}

const IDENTITY_IMAGE_MAP: Record<string, string> = {
  '自信跑偏派': '/assets/自信跑偏派.png',
  '慢半拍诗人': '/assets/慢半拍诗人.png',
  '破音火山派': '/assets/破音火山派.png',
  '低语梦游者': '/assets/低语梦游者.png',
  '怪声炼金师': '/assets/怪声炼金师.png',
  '反拍舞步怪': '/assets/反拍舞步怪.png',
};

function getNormalizedIdentity(badgeLevel: string): string {
  if (!badgeLevel) return '慢半拍诗人';
  let clean = badgeLevel.trim();
  // Remove ID:, 身份:, ID：, 身份： prefix if present
  clean = clean.replace(/^(ID|身份)[:：]\s*/i, '');
  clean = clean.trim();
  if (clean in IDENTITY_IMAGE_MAP) {
    return clean;
  }
  return '慢半拍诗人';
}

export const IdentityView: React.FC<IdentityViewProps> = ({ result, onNext, onUpdateUserTitle }) => {
  // Safe fallbacks to display the authentic mockup data if no record has been summarized yet
  const userTitle = result?.userTitle || 'ID: 跑调王小波';
  const rawBadgeLevel = result?.badgeLevel || '慢半拍诗人';
  const normalizedIdentity = getNormalizedIdentity(rawBadgeLevel);
  const quote = result?.quote || '“有些声音天生就不适合准时到达，就像月亮从未在正午升起。”';
  const offKeyDegree = result?.offKeyDegree || 128;
  const soulResonance = result?.soulResonance || 'S+';
  const badgesCount = result?.badgesCount || 42;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(userTitle);

  // Sync editValue when userTitle changes
  React.useEffect(() => {
    setEditValue(userTitle);
  }, [userTitle]);

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdateUserTitle(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(userTitle);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-full px-5 justify-between py-3">
      
      {/* Title block */}
      <div className="text-center">
        <h2 className="font-display font-black text-xl text-primary">
          你的反调星轨印记
        </h2>
        <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
          由 AI 深度声振共振网生成
        </p>
      </div>

      {/* Main Glassmorphic Identity Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full glass rounded-3xl p-6 relative overflow-hidden my-4 shadow-[0_15px_35px_rgba(0,0,0,0.5)] border border-white/10"
      >
        {/* Colorful glowing nebulas bleeding in the card edges */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary-container/10 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary-container/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="flex flex-col items-center relative z-10">
          
          {/* Identity Card Image Presentation */}
          <div className="w-48 h-48 rounded-2xl border border-primary/20 p-1.5 mb-4 flex items-center justify-center relative bg-surface-dim shadow-[0_0_20px_rgba(0,219,231,0.15)] overflow-hidden">
            <img 
              className="w-full h-full object-contain rounded-xl" 
              src={IDENTITY_IMAGE_MAP[normalizedIdentity]} 
              alt={normalizedIdentity}
              referrerPolicy="no-referrer"
            />
            {/* Subtle overlay border for depth */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/5" />
          </div>

          {/* Title tag & edit action */}
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2 w-full max-w-[240px]">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-surface-dim/80 text-primary border border-primary/40 rounded-lg px-2.5 py-1 text-sm font-display font-extrabold text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[0_0_10px_rgba(0,219,231,0.2)]"
                autoFocus
                maxLength={30}
              />
              <button
                onClick={handleSave}
                className="p-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer"
                title="保存"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditValue(userTitle);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-lg bg-white/5 text-on-surface-variant hover:bg-white/10 transition-colors cursor-pointer"
                title="取消"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 group">
              <h3 className="font-display font-extrabold text-lg text-primary tracking-tight">
                {userTitle}
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-md text-on-surface-variant/70 hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
                title="编辑 ID"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="px-3.5 py-1 rounded-full bg-primary/10 border border-primary/25 shadow-[0_0_10px_rgba(0,219,231,0.1)] mb-5">
            <span className="text-primary font-mono text-[10px] font-bold tracking-widest uppercase">
              {normalizedIdentity}
            </span>
          </div>

          {/* Aesthetic quote */}
          <div className="text-center italic font-sans text-xs text-on-surface-variant leading-relaxed max-w-[245px] mb-6 relative">
            <span className="text-primary text-xl absolute -top-3.5 left-1 font-serif opacity-30">“</span>
            <p className="px-4">{quote}</p>
            <span className="text-primary text-xl absolute -bottom-4 right-1 font-serif opacity-30">”</span>
          </div>

          <div className="w-full h-[1px] bg-white/5 mb-5" />

          {/* Core Stats metrics grid */}
          <div className="w-full grid grid-cols-3 gap-2 text-center">
            
            {/* Stat Item 1 */}
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-xl text-primary drop-shadow-[0_2px_5px_rgba(0,219,231,0.3)]">
                {offKeyDegree}
              </span>
              <span className="text-[10px] text-on-surface-variant/60 font-mono tracking-wider mt-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-primary-fixed-dim" />
                跑偏度
              </span>
            </div>

            {/* Stat Item 2 */}
            <div className="flex flex-col items-center border-x border-white/5">
              <span className="font-display font-black text-xl text-secondary drop-shadow-[0_2px_5px_rgba(207,92,255,0.3)]">
                {soulResonance}
              </span>
              <span className="text-[10px] text-on-surface-variant/60 font-mono tracking-wider mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-secondary" />
                灵魂共鸣
              </span>
            </div>

            {/* Stat Item 3 */}
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-xl text-primary-container">
                {badgesCount}
              </span>
              <span className="text-[10px] text-on-surface-variant/60 font-mono tracking-wider mt-1 flex items-center gap-1">
                <Award className="w-3 h-3 text-primary-container" />
                反调勋章
              </span>
            </div>

          </div>

        </div>

      </motion.div>

      {/* Primary generate singing button */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-2 shrink-0 flex flex-col gap-2 mt-2"
      >
        <button
          onClick={onNext}
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-[#111417] font-display font-extrabold text-md shadow-[0_0_20px_rgba(0,219,231,0.35)] cursor-pointer flex items-center justify-center gap-2"
        >
          {result ? '重新编曲我这首' : '生成我的反调歌'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </motion.div>

    </div>
  );
};
