/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface HomeViewProps {
  onStartRecord: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartRecord }) => {
  return (
    <div className="flex flex-col items-center h-full px-5 text-center justify-between py-4">
      
      {/* Planetary visuals */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-60 h-60 my-6 flex items-center justify-center shrink-0"
      >
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-full glass animate-slow-pulse" />
        
        {/* Active Orbit Circle Ring */}
        <div className="absolute inset-2 border border-white/5 rounded-full animate-orbit">
          {/* Orbital Satellite */}
          <div className="w-5 h-5 rounded-full bg-primary-fixed-dim shadow-[0_0_15px_#00dbe7] absolute -top-2.5 left-1/2 -translate-x-1/2" />
        </div>

        {/* Dynamic planetary texture - mix blend with glowing core */}
        <div className="w-[195px] h-[195px] rounded-full overflow-hidden relative shadow-[0_0_35px_rgba(0,219,231,0.3)]">
          <img 
            className="w-full h-full object-cover mix-blend-screen" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA-0G0dZHMXN_vSWb3aWhS7NVmE4gV8htfOsHG8FngtaHj4VoJOTnedyeV7XfEzXX7d4l7N7MDOEsSnjKgSgJxFeDkB5rbqsg9TgfmfN7dPGp_bgvFVcaEqACjkh-0APQOT5E65dlzPyVIsTvlaGN1bOy1xDdKsot4FU5VybNCEw5s4a_99aNFpII_xqICT9G-W8t6VdyFNPqRXjbajbc6m7xGaI_dkmEHBttgaNlriWG8akrdUgG7zkzyJ6GQimYrCdS9pgrUrBEN" 
            alt="Cosmic swirler planet"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>

      {/* Narrative Section */}
      <div className="flex flex-col items-center gap-4 px-2 my-2">
        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-display font-black text-[32px] leading-tight text-primary drop-shadow-[0_2px_10px_rgba(0,219,231,0.2)]"
        >
          跑调不扣分，
          <br />
          跑偏才出圈。
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-sans text-sm text-on-surface-variant leading-relaxed max-w-[280px]"
        >
          在这个星球，你的每一次跑调都是一次完美的采样。
        </motion.p>
      </div>

      {/* Large Neon CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full px-2 mt-4 shrink-0"
      >
        <button
          onClick={onStartRecord}
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-[#111417] font-display font-extrabold text-md tracking-wider shadow-[0_0_22px_rgba(0,219,231,0.45)] hover:shadow-[0_0_35px_rgba(0,219,231,0.6)] cursor-pointer active:scale-97 transition-all duration-200"
        >
          开始跑调
        </button>
      </motion.div>

    </div>
  );
};
