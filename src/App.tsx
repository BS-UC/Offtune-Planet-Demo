/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { PageId, AnalysisResult, PostItem, SquadItem, RemixStyle } from './types';
import { Shell } from './components/Shell';
import { HomeView } from './components/HomeView';
import { RecordView } from './components/RecordView';
import { AnalysisView } from './components/AnalysisView';
import { IdentityView } from './components/IdentityView';
import { StyleSelectorView } from './components/StyleSelectorView';
import { GeneratingView } from './components/GeneratingView';
import { ResultPlayerView } from './components/ResultPlayerView';
import { SquareView } from './components/SquareView';
import { RemixChainView } from './components/RemixChainView';
import { SquadView } from './components/SquadView';
import { SnakeView } from './components/SnakeView';
import { OffTuneSynth } from './utils/audioSynth';

// Initial preloaded community square items to mirror the mockup with clickable players
const INITIAL_POST_ITEMS: PostItem[] = [
  {
    id: 'p1',
    username: '林中宇',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUDhU7ybnSrIb91Oa5JgqERLBn6B-QNNmnoHEUb4TvnGZ9FNvd1EyCOEYN54G2Rt2Hw4rMcGU-qVN7B7Rc9K5dQD8dssx5Ir-Q8XRn60kaajTXjRYG02xNZrYCDO7LRWg7iKV8-Of0fqxYkUk-IVCvtegQdAvNtX0dkKJMfe9FwBc7Glqmmq8Ozikk1wfgWGMBqAD8V_kM-7U-KChEMc3XPE3DXLebyNXiQyKz-imv64Kw_89j_XG4v1JrPfDvJZR0RfGBr_UhKhLi',
    timeAgo: '2小时前',
    content: '这首歌跑得我想跳舞，谁来接个故障段落？',
    mediaUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArzgjnjcvePU0KtkVKgVpJeKfgsxvGW9KVIL25FHGaK_d1fKGICp1zd84gqFy2R0PFxiuD6x5l3r3ZdKB99NEZ1kaLPX8oxYKHRmJQpIPCAflsfhq9GBklkjJf-BkmW52BKfOD43xXORoM7_3F6Z3OqYtgTUIJ3BWPM5IHxqdIeFbvVkab9tZAiNKr7UYLLJAfvoJ2lXRPGvn5feKyumUjMuIQbIzHg4Kg3ic_1WoplCIW1If6GYFcZcGZTiAkvPG6wPDwziaDiUIr',
    likes: 64,
    songTitle: '《故障的开端》',
    lyrics: ['故障是唯一的韵律', '我们在波源里交叉', '把错误连缀成星云', '让频率慢慢滑行'],
    style: 'cyber',
  },
  {
    id: 'p2',
    username: '猫眼星人',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnls8jfnZDTjitBaKLUQ3JG_F6QjqopiAOZ1Ujn1YDPZhfXmLZcyPd-IJ7_NZ2DpbdyY7JPcWzE4F7_-2hj6YoocT_m858u0FQ-NjK5sKpYgy8UmwUGR3MyJRs3fIwTVEvCy2i55IGCFicIJLvbmRrQTfjmAZTj8yhsHtB14lgv0jQIMahnfePGSEGyxOH_ebojrH5xm28sRt3iIwCDJgQq8Tw4kCamjSPWsVtZ1Hl-aYjvThu4H9i8kd7_QF7BIEJHjgZ32jObV1q',
    timeAgo: '5小时前',
    content: '深夜的哼唱，如果不准，那才叫真诚。',
    likes: 121,
    songTitle: '《在星云中迷失》',
    lyrics: ['不要理会准时的钟摆', '音符在错轨中绽放', '唱出你不完美的直觉', '像月亮从未在正午升起'],
    style: 'cosmic',
  },
];

const INITIAL_SQUADS: SquadItem[] = [
  { id: 's1', name: '慢半拍合唱团', desc: '只唱慢半拍的虚无灵魂', membersCount: '12.5k', colorType: 'primary' },
  { id: 's2', name: '故障艺术社', desc: '放大每一次偶然的失误与裂缝', membersCount: '8.2k', colorType: 'secondary' },
  { id: 's3', name: '碎碎念研究中心', desc: '将生活中的日常杂音谱写成诗', membersCount: '5.1k', colorType: 'accent' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [vocalPrompt, setVocalPrompt] = useState('');
  const [recordingStats, setRecordingStats] = useState({ pitchVariance: '宽阶波动', volumeFluctuation: '弹拉连音' });
  const [analysisReport, setAnalysisReport] = useState<AnalysisResult | null>(null);
  
  // Community social posts and clans state queue
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POST_ITEMS);
  const [squads, setSquads] = useState<SquadItem[]>(INITIAL_SQUADS);
  const [joinedSquadIds, setJoinedSquadIds] = useState<string[]>(['s1']);

  // Shared audio synthesizer object
  const synth = useMemo(() => new OffTuneSynth(), []);

  // Safe stop when user leaves active player screens
  const handleNavigate = (page: PageId) => {
    synth.init();
    synth.stop();
    setCurrentPage(page);
  };

  // Recording transition
  const handleStartRecord = () => {
    setCurrentPage('record');
  };

  // Analysis completion transition
  const handleAnalysisStart = (promptText: string, stats: { pitchVariance: string; volumeFluctuation: string }) => {
    setVocalPrompt(promptText);
    setRecordingStats(stats);
    setCurrentPage('analysis');
  };

  // Launch AI query for song details & stats
  const fetchAIAnalysis = async (styleSelected: RemixStyle) => {
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: styleSelected,
          prompt: vocalPrompt,
          recordingStats: recordingStats,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned failure status');
      }

      const backendReport: AnalysisResult = await response.json();
      setAnalysisReport(backendReport);
    } catch (err) {
      console.warn('API connection failed or key missing. Resorting to robust offline-fallback algorithm:');
      
      // Infinite operational resilience algorithm: Construct beautiful customized vaporwave profiles if offline
      const genericQuotes = [
        '“有些声音天生就不适合准时到达，就像月亮从未在正午升起。”',
        '“数字故障在空气里结晶，错拍是灵魂向世界投掷的艺术徽章。”',
        '“完美的音阶往往缺乏呼吸，而在失真与摩擦之间，我们的声音才真正活着。”',
        '“声频往星尘外滑行，在宇宙引力最弱的地方，重置你的声弦。”',
      ];
      
      const allowedIdentities = [
        '自信跑偏派',
        '慢半拍诗人',
        '破音火山派',
        '低语梦游者',
        '怪声炼金师',
        '反拍舞步怪'
      ];

      const chosenIdentity = allowedIdentities[Math.floor(Math.random() * allowedIdentities.length)];
      const chosenQuote = genericQuotes[Math.floor(Math.random() * genericQuotes.length)];
      const userTitle = `ID: ${chosenIdentity}`;

      const songTitle = vocalPrompt.trim() 
        ? `《关于 ${vocalPrompt.slice(0, 8)} 的反调》` 
        : `《第 ${Math.floor(Math.random() * 190) + 10} 次跑调》`;

      const fallbackLyrics = [
        vocalPrompt ? `你说你想哼着 "${vocalPrompt}"` : '不要听从主流音域的指挥',
        '音符在错列的小区中飘散',
        '在 0.5 倍速的延迟回音里',
        '我们是唯一不准时的慢跑者'
      ];

      const fallbackNotes = styleSelected === 'cyber'
        ? [146.83, 174.61, 220.00, 246.94, 293.66, 329.63]
        : styleSelected === 'cosmic'
        ? [196.00, 220.00, 261.63, 293.66, 349.23, 392.00]
        : [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

      const mockReport: AnalysisResult = {
        userTitle,
        badgeLevel: chosenIdentity,
        quote: chosenQuote,
        offKeyDegree: Math.floor(Math.random() * 70) + 110,
        soulResonance: ['S+', 'SS', 'AAA+', 'S'][Math.floor(Math.random() * 4)],
        badgesCount: Math.floor(Math.random() * 30) + 15,
        vocalColorScore: Math.floor(Math.random() * 15) + 80,
        rhythmLooseScore: Math.floor(Math.random() * 20) + 75,
        tags: styleSelected === 'lofi' ? ['# 节奏松弛', '# 白噪音哼哼', '# 慢拍诗人'] : ['# 电磁故障', '# 波形溢出', '# 蒸汽余晖'],
        song: {
          title: songTitle,
          lyrics: fallbackLyrics,
          chords: [],
          notes: fallbackNotes,
          style: styleSelected,
        },
      };

      setAnalysisReport(mockReport);
    }
  };

  const handleStyleSelected = async (style: RemixStyle) => {
    setCurrentPage('generating');
    await fetchAIAnalysis(style);
  };

  // Publish dynamic generated user song to square flow
  const handlePublishToSquare = () => {
    if (!analysisReport) return;
    
    const userPost: PostItem = {
      id: `post_${Date.now()}`,
      username: '跑调王小波',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXs06pbk59I8oIYaFV4l7TIOdqy92HLpF2gFD3HYo7qxcCvhsMsbSu_X8LBDE4AZtUpLOMFOCsI62zliNUEuS_-h3QXiqO8CNbKmV0q1yLks9O7r4qGEmSbAySX4wlYGVFzImAv5yfRufXnnFVBSIXFawg80gNRiUwpMrXtDgZnti-HMzpFdg-inGWZoqroXDA5x5unSPVSRe52MVZyf9Snek3cS-zEAh0Es6hSR-u4IICnIphIWExBZQ5VxlfKnVYsEcQTDX5FzMS',
      timeAgo: '刚刚',
      content: vocalPrompt.trim() ? `这是我围绕"${vocalPrompt}"融合出的全新作品！` : '我在反调星球重构的主旋律，跑调也感觉极其真诚。',
      likes: 1,
      songTitle: analysisReport.song.title,
      lyrics: analysisReport.song.lyrics,
      style: analysisReport.song.style,
      isCustom: true,
    };

    setPosts([userPost, ...posts]);
    setCurrentPage('square');
  };

  // Handle post like updates
  const handleLikePost = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          isLiked: !p.isLiked,
        };
      }
      return p;
    }));
  };

  // Join clans
  const handleJoinSquad = (id: string) => {
    setJoinedSquadIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  // Add custom user clans
  const handleAddSquad = (name: string, desc: string, colorType: 'primary' | 'secondary' | 'accent') => {
    const newGuild: SquadItem = {
      id: `squad_${Date.now()}`,
      name,
      desc,
      membersCount: '1 成员',
      colorType,
    };
    setSquads([...squads, newGuild]);
    setJoinedSquadIds(prev => [...prev, newGuild.id]);
  };

  return (
    <Shell currentPage={currentPage} onNavigate={handleNavigate}>
      
      {/* View routing router switch */}
      {currentPage === 'home' && (
        <HomeView onStartRecord={handleStartRecord} />
      )}

      {currentPage === 'record' && (
        <RecordView onAnalysisStart={handleAnalysisStart} />
      )}

      {currentPage === 'analysis' && (
        <AnalysisView 
          onComplete={() => setCurrentPage('identity')} 
          recordingStats={recordingStats}
        />
      )}

      {currentPage === 'identity' && (
        <IdentityView 
          result={analysisReport} 
          onUpdateUserTitle={(newTitle) => {
            if (analysisReport) {
              setAnalysisReport({ ...analysisReport, userTitle: newTitle });
            } else {
              setAnalysisReport({
                userTitle: newTitle,
                badgeLevel: '慢半拍诗人',
                quote: '“有些声音天生就不适合准时到达，就像月亮从未在正午升起。”',
                offKeyDegree: 128,
                soulResonance: 'S+',
                badgesCount: 42,
                vocalColorScore: 85,
                rhythmLooseScore: 80,
                tags: ['# 节奏松弛', '# 慢拍诗人'],
                song: {
                  title: `《我的反调》`,
                  lyrics: [],
                  chords: [],
                  notes: [],
                  style: 'lofi',
                }
              });
            }
          }}
          onNext={() => setCurrentPage('creation')} 
        />
      )}

      {currentPage === 'creation' && (
        <StyleSelectorView onStyleSelected={handleStyleSelected} />
      )}

      {currentPage === 'generating' && (
        <GeneratingView onComplete={() => setCurrentPage('result')} />
      )}

      {currentPage === 'result' && analysisReport && (
        <ResultPlayerView
          result={analysisReport}
          synth={synth}
          onPublishToSquare={handlePublishToSquare}
          onRemixChain={() => setCurrentPage('remix')}
        />
      )}

      {currentPage === 'square' && (
        <SquareView
          posts={posts}
          synth={synth}
          onLikePost={handleLikePost}
          onRemixPost={(id) => setCurrentPage('remix')}
          onPlaySnake={() => setCurrentPage('snake')}
        />
      )}

      {currentPage === 'remix' && (
        <RemixChainView onStartChain={handleStartRecord} />
      )}

      {currentPage === 'squad' && (
        <SquadView
          squads={squads}
          onAddSquad={handleAddSquad}
          onJoinSquad={handleJoinSquad}
          joinedSquadIds={joinedSquadIds}
        />
      )}

      {currentPage === 'snake' && (
        <SnakeView
          defaultUsername={analysisReport?.userTitle ? analysisReport.userTitle.replace(/^(ID|身份)[:：]\s*/i, '') : '跑调王小波'}
          onBack={() => setCurrentPage('identity')}
        />
      )}

    </Shell>
  );
}
