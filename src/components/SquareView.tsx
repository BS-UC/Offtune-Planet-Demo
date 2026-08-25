/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PostItem, RemixStyle } from '../types';
import { Heart, Share2, Play, Pause, ListMusic, PlusCircle, Headphones, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OffTuneSynth } from '../utils/audioSynth';

interface SquareViewProps {
  posts: PostItem[];
  synth: OffTuneSynth;
  onLikePost: (id: string) => void;
  onRemixPost: (id: string) => void;
  onPlaySnake: () => void;
}

export const SquareView: React.FC<SquareViewProps> = ({
  posts,
  synth,
  onLikePost,
  onRemixPost,
  onPlaySnake,
}) => {
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);

  const handlePlayPost = (post: PostItem) => {
    if (playingPostId === post.id) {
      synth.stop();
      setPlayingPostId(null);
    } else {
      synth.stop();
      setPlayingPostId(post.id);
      
      // Seed distinct frequencies depending on username length/id for procedural variation
      let frequencyPool = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00];
      if (post.style === 'cyber') {
        frequencyPool = [146.83, 174.61, 220.00, 246.94, 293.66, 329.63];
      } else if (post.style === 'cosmic') {
        frequencyPool = [196.00, 220.00, 261.63, 293.66, 349.23, 392.00];
      }

      synth.start(post.style, frequencyPool);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-5 text-left py-2 space-y-5">
      
      {/* Title */}
      <h2 className="font-display font-black text-2xl text-primary animate-float mb-2">
        反调广场
      </h2>

      {/* Feed list */}
      <div className="space-y-4 pb-4">
        {posts.map((post) => {
          const isPlaying = playingPostId === post.id;
          
          return (
            <motion.div
              layout
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4.5 flex flex-col gap-4 border border-white/6"
            >
              {/* Creator details row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    src={post.avatar}
                    alt={post.username}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-display font-bold text-[#e1e2e7] text-xs">
                      {post.username}
                    </h4>
                    <p className="text-[9px] text-on-surface-variant/70 font-mono tracking-wide">
                      {post.timeAgo} 发布
                    </p>
                  </div>
                </div>

                {/* Styled Badge Indicator */}
                <div className="px-2.5 py-0.5 rounded-full bg-white/4 border border-white/5 select-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim" />
                  <span className="text-[8px] font-mono font-extrabold text-on-surface-variant uppercase tracking-wider">
                    {post.style}
                  </span>
                </div>
              </div>

              {/* Status Caption */}
              <p className="font-sans text-xs text-on-surface leading-relaxed">
                {post.content}
              </p>

              {/* Player Waveform Box */}
              <div className="rounded-xl overflow-hidden relative group">
                {/* Simulated album artwork background */}
                {post.mediaUrl ? (
                  <div className="aspect-[21/9] w-full relative overflow-hidden bg-surface-container">
                    <img
                      className="w-full h-full object-cover opacity-35 filter blur-[1px] group-hover:scale-105 transition-transform duration-500"
                      src={post.mediaUrl}
                      alt="Soundwave art"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  </div>
                ) : (
                  <div className="h-14 w-full bg-white/2 rounded-xl flex items-center justify-between px-4 border border-white/5">
                    <div className="flex items-center gap-2">
                      <ListMusic className="w-4 h-4 text-secondary" />
                      <span className="text-[11px] font-display text-primary truncate max-w-[200px]">
                        {post.songTitle}
                      </span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant font-mono">FEAT. OFFTUNE AI</span>
                  </div>
                )}

                {/* Central Play Badge overlay when media poster exists */}
                {post.mediaUrl && (
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between w-full relative z-10">
                      <div>
                        <span className="text-[9px] font-mono text-primary-fixed-dim uppercase tracking-widest font-bold">CURRENT SINGLE</span>
                        <h5 className="font-display font-black text-xs text-primary max-w-[190px] truncate">
                          {post.songTitle}
                        </h5>
                      </div>
                      
                      {/* Interactive play trigger */}
                      <button
                        onClick={() => handlePlayPost(post)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                          isPlaying 
                            ? 'bg-gradient-to-tr from-primary-fixed-dim to-secondary-container shadow-[0_0_15px_#00dbe7] rotate-360 active:scale-90 scale-102' 
                            : 'bg-surface/80 border border-primary-fixed-dim hover:bg-primary-fixed-dim hover:text-surface'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current text-surface" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-primary-fixed-dim fill-current translate-x-0.5 group-hover:text-surface" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Simple play button for row styles */}
                {!post.mediaUrl && (
                  <button
                    onClick={() => handlePlayPost(post)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      isPlaying 
                        ? 'bg-gradient-to-tr from-[#00dbe7] to-[#cf5cff] shadow-[0_0_10px_rgba(202,91,254,0.5)]' 
                        : 'bg-white/5 border border-white/10 hover:border-primary-fixed-dim text-on-surface-variant hover:text-primary-fixed-dim'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3 h-3 text-surface" /> : <Play className="w-3 h-3 translate-x-0.5" />}
                  </button>
                )}
              </div>

              {/* Bottom control feedback actions */}
              <div className="flex justify-between items-center border-t border-white/4 pt-3 mt-1 shrink-0">
                <div className="flex gap-4.5 text-on-surface-variant/70">
                  {/* Like */}
                  <button
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-1.5 text-xs hover:text-[#ffb4ab] transition-colors cursor-pointer ${
                      post.isLiked ? 'text-[#ffb4ab]' : ''
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current text-error' : ''}`} />
                    <span className="font-mono text-[10px]">{post.likes}</span>
                  </button>
                  
                  {/* Share info popup */}
                  <button className="hover:text-primary transition-colors cursor-pointer">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Remix Action trigger */}
                <button
                  onClick={() => onRemixPost(post.id)}
                  className="px-4 py-1.5 rounded-full bg-secondary-container/10 border border-secondary-container/20 hover:bg-secondary-container/20 text-secondary font-mono text-[9px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors"
                >
                  我来接一句
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Snake game entrance at the bottom */}
      <div className="sticky bottom-4 pb-2 pt-2 z-10 mt-auto">
        <button
          onClick={onPlaySnake}
          className="w-full py-3 rounded-full bg-surface-container/90 backdrop-blur-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-display font-extrabold text-sm shadow-[0_0_15px_rgba(0,219,231,0.3)] cursor-pointer flex items-center justify-center gap-2"
        >
          游玩反调贪吃蛇
          <Gamepad2 className="w-4.5 h-4.5" />
        </button>
      </div>

    </div>
  );
};
