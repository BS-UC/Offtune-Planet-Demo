/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageId } from '../types';
import { Home, Compass, User, Users, Radio, Bell, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface ShellProps {
  children: React.ReactNode;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  title?: string;
}

export const Shell: React.FC<ShellProps> = ({
  children,
  currentPage,
  onNavigate,
  title = 'OffTune Planet',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05070a] p-4 font-sans select-none overflow-hidden relative">
      
      {/* Decorative ambient blurred cosmic glows in the background to simulate deep space */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-primary-fixed-dim/5 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-container/5 rounded-full blur-[12rem] pointer-events-none" />

      {/* Device Emulation Container */}
      <div 
        id="device-frame"
        className="w-full max-w-[390px] h-[844px] rounded-[40px] border border-white/10 bg-background relative shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300"
      >
        
        {/* Starfield Background inside the emulator */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* Top Header Bar */}
        <header className="w-full h-16 shrink-0 flex justify-between items-center px-4 bg-surface/40 backdrop-blur-xl border-b border-white/10 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse shadow-[0_0_8px_#00dbe7]" />
            <h1 className="font-display font-black text-lg text-primary tracking-tight">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <button className="hover:text-primary transition-colors cursor-pointer" aria-label="Search">
              <Search className="w-4 h-4" />
            </button>
            <button className="hover:text-primary transition-colors cursor-pointer relative" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-secondary rounded-full" />
            </button>
          </div>
        </header>

        {/* Dynamic Screen View Space */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative pb-22 pt-3">
          {children}
        </main>

        {/* Floating Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 w-full h-22 bg-surface-dim/80 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center px-2 pb-5 pt-2 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          
          {/* Home Nav Item */}
          <button
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center w-12 transition-all cursor-pointer ${
              currentPage === 'home' 
                ? 'text-primary drop-shadow-[0_0_10px_#00dbe7]' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            <Home className="w-5 h-5 transition-transform duration-200 active:scale-95" />
            <span className="font-mono text-[9px] font-bold tracking-wider mt-1">首页</span>
          </button>

          {/* Square Nav Item */}
          <button
            onClick={() => onNavigate('square')}
            className={`flex flex-col items-center justify-center w-12 transition-all cursor-pointer ${
              currentPage === 'square' || currentPage === 'remix'
                ? 'text-primary drop-shadow-[0_0_10px_#00dbe7]' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            <Compass className="w-5 h-5 transition-transform duration-200 active:scale-95" />
            <span className="font-mono text-[9px] font-bold tracking-wider mt-1">广场</span>
          </button>

          {/* Central Expression Button */}
          <button
            onClick={() => onNavigate('record')}
            className="flex flex-col items-center justify-center -mt-8 relative cursor-pointer group"
          >
            <div className="absolute inset-0 bg-primary-fixed-dim/20 rounded-full blur-md group-hover:scale-110 transition-transform duration-300" />
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-primary-fixed-dim to-secondary-container flex items-center justify-center shadow-[0_0_20px_rgba(0,163,171,0.5)] group-hover:shadow-[0_0_30px_rgba(0,219,231,0.8)] transition-all duration-300 relative z-10 active:scale-95">
              <Radio className="w-6 h-6 text-surface font-black" />
            </div>
          </button>

          {/* Squad Nav Item */}
          <button
            onClick={() => onNavigate('squad')}
            className={`flex flex-col items-center justify-center w-12 transition-all cursor-pointer ${
              currentPage === 'squad'
                ? 'text-primary drop-shadow-[0_0_10px_#00dbe7]' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            <Users className="w-5 h-5 transition-transform duration-200 active:scale-95" />
            <span className="font-mono text-[9px] font-bold tracking-wider mt-1">小队</span>
          </button>

          {/* Profile Nav Item */}
          <button
            onClick={() => onNavigate('identity')}
            className={`flex flex-col items-center justify-center w-12 transition-all cursor-pointer ${
              currentPage === 'identity' || currentPage === 'creation' || currentPage === 'generating' || currentPage === 'result'
                ? 'text-primary drop-shadow-[0_0_10px_#00dbe7]' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            <User className="w-5 h-5 transition-transform duration-200 active:scale-95" />
            <span className="font-mono text-[9px] font-bold tracking-wider mt-1">我的</span>
          </button>

        </nav>
      </div>
    </div>
  );
};
