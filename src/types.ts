/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PageId =
  | 'home'
  | 'record'
  | 'analysis'
  | 'identity'
  | 'creation'
  | 'generating'
  | 'result'
  | 'square'
  | 'remix'
  | 'snake'
  | 'squad';

export type RemixStyle = 'lofi' | 'cyber' | 'cosmic';

export interface SongData {
  title: string;
  lyrics: string[];
  chords: string[];
  notes: number[]; // frequencies or midi indexes for our synthesizer to play
  style: RemixStyle;
}

export interface AnalysisResult {
  userTitle: string;
  badgeLevel: string; // e.g. "慢半拍诗人", "量子跑调师"
  quote: string;
  offKeyDegree: number; // 跑偏度
  soulResonance: string; // 灵魂共鸣 percentage or S+
  badgesCount: number; // 反调勋章
  vocalColorScore: number; // 情感色彩提取 %
  rhythmLooseScore: number; // 节奏松弛度分析 %
  tags: string[];
  song: SongData;
}

export interface PostItem {
  id: string;
  username: string;
  avatar: string;
  timeAgo: string;
  content: string;
  mediaUrl?: string;
  likes: number;
  isLiked?: boolean;
  songTitle: string;
  lyrics: string[];
  style: RemixStyle;
  isCustom?: boolean;
}

export interface SquadItem {
  id: string;
  name: string;
  desc: string;
  membersCount: string;
  colorType: 'primary' | 'secondary' | 'accent';
}
