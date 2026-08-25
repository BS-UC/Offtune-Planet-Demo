/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Gamepad2, 
  Play, 
  RotateCcw, 
  Home as HomeIcon, 
  Trophy, 
  Zap, 
  ChevronLeft, 
  User, 
  Award,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react';

// Define the 6 allowed identities for enemy snakes
const ENEMY_NAMES = [
  '自信跑偏派',
  '慢半拍诗人',
  '破音火山派',
  '低语梦游者',
  '怪声炼金师',
  '反拍舞步怪'
];

interface SnakeSegment {
  x: number;
  y: number;
}

interface Snake {
  id: string;
  name: string;
  segments: SnakeSegment[];
  angle: number;
  targetAngle: number;
  speed: number;
  isBoost: boolean;
  color: string;
  isPlayer: boolean;
  score: number;
  pulseTimer: number;
}

interface Food {
  x: number;
  y: number;
  value: number;
  color: string;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface SnakeViewProps {
  onBack: () => void;
  defaultUsername?: string;
}

export const SnakeView: React.FC<SnakeViewProps> = ({ onBack, defaultUsername = '跑调王小波' }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'dead'>('start');
  const [username, setUsername] = useState('');
  const [gameMode, setGameMode] = useState<'endless' | 'time'>('endless');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [muted, setMuted] = useState(false);

  // Stats
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(10);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [rank, setRank] = useState(1);

  // Highscores
  const [bestScore, setBestScore] = useState(0);
  const [bestLength, setBestLength] = useState(0);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; isPlayer: boolean }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game loops and refs
  const gameStateRef = useRef<'start' | 'playing' | 'dead'>('start');
  const gameLoopRef = useRef<(timestamp: number) => void>(() => {});
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const playTimeRef = useRef<number>(0);
  const lastScoreSoundRef = useRef<number>(0);

  const setAndSyncGameState = (state: 'start' | 'playing' | 'dead') => {
    gameStateRef.current = state;
    setGameState(state);
  };

  // Virtual Joypad State for Mobile
  const joystickPos = useRef({ x: 0, y: 0 });
  const joystickActive = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showJoystick, setShowJoystick] = useState(false);

  // Web Audio Synth for OffTune retro bleeps & sound effects
  const playSound = (type: 'eat' | 'boost' | 'death' | 'start') => {
    if (muted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'eat') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        // OffTune sound styling: slightly sliding and quirky frequency pluck
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + Math.random() * 150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'boost') {
        // Continuous subtle low pulse synth
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.21);
      } else if (type === 'death') {
        // Falling retro explosive sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.52);
      } else if (type === 'start') {
        // Uplifting arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.15);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.16);
        });
      }
    } catch (e) {
      // Audio context warning safely ignored
    }
  };

  // Load username & stats from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('offtune_snake_username') || defaultUsername;
    setUsername(savedName);

    const savedBestScore = parseInt(localStorage.getItem('offtune_snake_best_score') || '0', 10);
    const savedBestLength = parseInt(localStorage.getItem('offtune_snake_best_length') || '0', 10);
    setBestScore(savedBestScore);
    setBestLength(savedBestLength);

    // Check device type
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [defaultUsername]);

  // Handle countdown timer for Time Mode
  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'time') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerDeath();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameMode]);

  // Main Arena Simulation Refs
  const MAP_SIZE = 2400;
  const snakesRef = useRef<Snake[]>([]);
  const foodsRef = useRef<Food[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef({ x: MAP_SIZE / 2, y: MAP_SIZE / 2, zoom: 1 });
  const playerBoostEnergyRef = useRef<number>(100);
  const [boostEnergy, setBoostEnergy] = useRefState(100);

  // Custom hook to keep state and ref in sync for render loops
  function useRefState<T>(initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>] {
    const [state, setState] = useState(initialValue);
    const ref = useRef(initialValue);
    const setRefState = (value: T | ((currVal: T) => T)) => {
      if (typeof value === 'function') {
        const computed = (value as Function)(ref.current);
        ref.current = computed;
        setState(computed);
      } else {
        ref.current = value;
        setState(value);
      }
    };
    return [state, setRefState, ref];
  }

  // Keyboard controls listener
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sync the latest gameLoop on every render to avoid stale closures
  useEffect(() => {
    gameLoopRef.current = gameLoop;
  });

  const tick = (timestamp: number) => {
    if (gameStateRef.current !== 'playing') return;
    gameLoopRef.current(timestamp);
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState]);

  const triggerDeath = () => {
    playSound('death');
    setAndSyncGameState('dead');
    
    // Read directly from the ref to avoid stale closure state
    const player = snakesRef.current.find(s => s.isPlayer);
    const finalScore = player ? player.score : 0;
    const finalLength = player ? Math.max(5, Math.floor(player.score / 10) + 10) : 10;

    const currentBestScore = parseInt(localStorage.getItem('offtune_snake_best_score') || '0', 10);
    const currentBestLength = parseInt(localStorage.getItem('offtune_snake_best_length') || '0', 10);

    if (finalScore > currentBestScore) {
      setBestScore(finalScore);
      localStorage.setItem('offtune_snake_best_score', finalScore.toString());
    }
    if (finalLength > currentBestLength) {
      setBestLength(finalLength);
      localStorage.setItem('offtune_snake_best_length', finalLength.toString());
    }
  };

  const handleStartGame = () => {
    const finalUsername = username.trim() ? username.trim() : '玩家001';
    setUsername(finalUsername);
    localStorage.setItem('offtune_snake_username', finalUsername);

    // Initialize map, player snake, AI enemy snakes, and foods
    initGameSimulation(finalUsername);

    setAndSyncGameState('playing');
    setTimeLeft(180);
    setSurvivalTime(0);
    setScore(0);
    setLength(10);
    playerBoostEnergyRef.current = 100;
    setBoostEnergy(100);
    playSound('start');

    lastTimeRef.current = performance.now();
    playTimeRef.current = 0;
  };

  const initGameSimulation = (pName: string) => {
    // 1. Generate foods
    const foods: Food[] = [];
    const colors = ['#00dbe7', '#cf5cff', '#fface8', '#74f5ff', '#ecb2ff', '#ffd7f0'];
    for (let i = 0; i < 350; i++) {
      foods.push({
        x: Math.random() * MAP_SIZE,
        y: Math.random() * MAP_SIZE,
        value: Math.floor(Math.random() * 3) + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 3
      });
    }
    foodsRef.current = foods;

    // 2. Clear particles
    particlesRef.current = [];

    // 3. Create Snakes
    const snakes: Snake[] = [];
    
    // Player Snake at center
    const playerSegments: SnakeSegment[] = [];
    const startX = MAP_SIZE / 2;
    const startY = MAP_SIZE / 2;
    for (let i = 0; i < 100; i++) {
      playerSegments.push({ x: startX, y: startY + i * 1.2 });
    }

    snakes.push({
      id: 'player',
      name: pName,
      segments: playerSegments,
      angle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      speed: 1,
      isBoost: false,
      color: '#00dbe7', // Gorgeous player neon cyan
      isPlayer: true,
      score: 0,
      pulseTimer: 0
    });

    // Create 7 AI enemy snakes spread across the map with Chinese names
    for (let i = 0; i < 7; i++) {
      const aiName = ENEMY_NAMES[i % ENEMY_NAMES.length];
      const aiSegments: SnakeSegment[] = [];
      const aiX = Math.random() * (MAP_SIZE - 400) + 200;
      const aiY = Math.random() * (MAP_SIZE - 400) + 200;
      const aiLen = (Math.floor(Math.random() * 15) + 10) * 10;
      const aiAngle = Math.random() * Math.PI * 2;
      
      for (let j = 0; j < aiLen; j++) {
        aiSegments.push({ 
          x: aiX + Math.cos(aiAngle) * j * 1.2, 
          y: aiY + Math.sin(aiAngle) * j * 1.2 
        });
      }

      snakes.push({
        id: `ai_${i}`,
        name: aiName,
        segments: aiSegments,
        angle: aiAngle,
        targetAngle: aiAngle,
        speed: 1,
        isBoost: false,
        color: i % 2 === 0 ? '#cf5cff' : '#ecb2ff', // Neon Purple and Soft Magenta
        isPlayer: false,
        score: (aiLen - 5) * 15,
        pulseTimer: Math.random() * 10
      });
    }

    snakesRef.current = snakes;
    cameraRef.current = { x: startX, y: startY, zoom: 1 };
  };

  // Main Loop
  const gameLoop = (timestamp: number) => {
    if (gameStateRef.current !== 'playing') return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Track survival time
    playTimeRef.current += delta / 1000;
    setSurvivalTime(Math.floor(playTimeRef.current));

    // Update Game Logic
    updateGameLogic();

    // Render Game Map onto Canvas
    renderGame();
  };

  const updateGameLogic = () => {
    const snakes = snakesRef.current;
    const foods = foodsRef.current;
    const particles = particlesRef.current;
    const player = snakes.find(s => s.isPlayer);

    if (!player) return;

    // 1. Process player controls & steering
    let steerX = 0;
    let steerY = 0;

    if (joystickActive.current) {
      steerX = joystickPos.current.x;
      steerY = joystickPos.current.y;
    } else {
      if (keysPressed.current['w'] || keysPressed.current['arrowup']) steerY = -1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) steerY = 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) steerX = -1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) steerX = 1;
    }

    if (steerX !== 0 || steerY !== 0) {
      player.targetAngle = Math.atan2(steerY, steerX);
    }

    // Boost toggle
    const isSpaceBoost = keysPressed.current[' '] || keysPressed.current['space'];
    const isMobileBoost = joystickActive.current && joystickPos.current.x === 0 && joystickPos.current.y === 0; // fallback or UI boost
    const wantsBoost = (isSpaceBoost || keysPressed.current['boost_active']) && player.segments.length > 5 && playerBoostEnergyRef.current > 1;

    player.isBoost = wantsBoost;

    // Adjust speed based on boost
    if (player.isBoost) {
      player.speed = 2;
      playerBoostEnergyRef.current = Math.max(0, playerBoostEnergyRef.current - 0.4);
      setBoostEnergy(playerBoostEnergyRef.current);
      
      // Boost consumes length slowly
      if (Math.random() < 0.08 && player.score > 20) {
        player.score -= 5;
        for (let j = 0; j < 10; j++) {
          const lastSeg = player.segments.pop();
          if (lastSeg && j === 0) {
            foods.push({
              x: lastSeg.x + (Math.random() - 0.5) * 15,
              y: lastSeg.y + (Math.random() - 0.5) * 15,
              value: 2,
              color: player.color,
              size: 4
            });
          }
        }
      }

      // Play continuous boost sound softly
      if (Math.random() < 0.2) {
        playSound('boost');
      }
    } else {
      player.speed = 1;
      // Recover boost energy slowly
      playerBoostEnergyRef.current = Math.min(100, playerBoostEnergyRef.current + 0.15);
      setBoostEnergy(playerBoostEnergyRef.current);
    }

    // 2. Simulate AI enemy snakes
    snakes.forEach(snake => {
      if (snake.isPlayer) return;

      snake.pulseTimer += 0.05;

      // Simple AI logic: Head for closest food or avoid walls / other snake bodies
      const head = snake.segments[0];
      
      // Boundary check
      let nearBoundary = false;
      let boundaryAngle = 0;
      const buffer = 150;
      if (head.x < buffer) { nearBoundary = true; boundaryAngle = 0; }
      else if (head.x > MAP_SIZE - buffer) { nearBoundary = true; boundaryAngle = Math.PI; }
      if (head.y < buffer) { nearBoundary = true; boundaryAngle = Math.PI / 2; }
      else if (head.y > MAP_SIZE - buffer) { nearBoundary = true; boundaryAngle = -Math.PI / 2; }

      // Obstacle avoidance (other snakes bodies)
      let avoidObstacle = false;
      let avoidAngle = 0;
      
      snakes.forEach(other => {
        if (avoidObstacle) return;
        // Check collision distance with other segments
        const startIdx = other.id === snake.id ? 4 : 0; // Avoid its own head
        for (let i = startIdx; i < other.segments.length; i++) {
          const seg = other.segments[i];
          const dist = Math.hypot(head.x - seg.x, head.y - seg.y);
          if (dist < 100) {
            avoidObstacle = true;
            avoidAngle = Math.atan2(head.y - seg.y, head.x - seg.x);
            break;
          }
        }
      });

      if (nearBoundary) {
        // Steer away from boundary
        snake.targetAngle = boundaryAngle + (Math.random() - 0.5) * 0.5;
      } else if (avoidObstacle) {
        // Steer away from obstacles
        snake.targetAngle = avoidAngle;
      } else {
        // Find nearest food
        let nearestFood: Food | null = null;
        let minDist = 300; // food tracking distance limit
        foods.forEach(f => {
          const dist = Math.hypot(head.x - f.x, head.y - f.y);
          if (dist < minDist) {
            minDist = dist;
            nearestFood = f;
          }
        });

        if (nearestFood) {
          snake.targetAngle = Math.atan2((nearestFood as Food).y - head.y, (nearestFood as Food).x - head.x);
        } else {
          // Wander randomly
          if (Math.random() < 0.04) {
            snake.targetAngle += (Math.random() - 0.5) * 1.5;
          }
        }
      }

      // Randomly boost
      if (Math.random() < 0.01) {
        snake.isBoost = !snake.isBoost;
      }
      snake.speed = snake.isBoost ? 0.5 : 0.25;
    });

    // 3. Move all snakes smoothly
    snakes.forEach(snake => {
      // Rotate towards target angle
      let angleDiff = snake.targetAngle - snake.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      snake.angle += angleDiff * 0.15;

      const head = snake.segments[0];
      const nextX = head.x + Math.cos(snake.angle) * snake.speed;
      const nextY = head.y + Math.sin(snake.angle) * snake.speed;

      // Insert new head
      const newHead = { x: nextX, y: nextY };
      snake.segments.unshift(newHead);

      // Keep segments count matching current length target
      const maxSegments = Math.max(50, (Math.floor(snake.score / 10) + 10) * 10);
      while (snake.segments.length > maxSegments) {
        snake.segments.pop();
      }
    });

    // 4. Boundary Wall Collision Check
    snakes.forEach(snake => {
      const head = snake.segments[0];
      if (head.x < 10 || head.x > MAP_SIZE - 10 || head.y < 10 || head.y > MAP_SIZE - 10) {
        if (snake.isPlayer) {
          triggerDeath();
        } else {
          // Explode AI
          explodeSnake(snake);
        }
      }
    });

    // 5. Inter-snake Head-Body Crash & Head-Head Collision Detection
    const deadSnakes = new Set<string>();
    for (let i = 0; i < snakes.length; i++) {
      const s1 = snakes[i];
      if (deadSnakes.has(s1.id)) continue;
      const head1 = s1.segments[0];

      for (let j = 0; j < snakes.length; j++) {
        const s2 = snakes[j];
        if (deadSnakes.has(s2.id)) continue;

        if (s1.id === s2.id) {
          // Check collision with its own body (skip first 70 segments)
          for (let k = 80; k < s1.segments.length; k += 10) {
            const seg = s1.segments[k];
            if (Math.hypot(head1.x - seg.x, head1.y - seg.y) < 18) {
              if (s1.isPlayer) {
                triggerDeath();
              } else {
                deadSnakes.add(s1.id);
              }
              break;
            }
          }
        } else {
          // Check if s1 head crashed into s2 body
          for (let k = 0; k < s2.segments.length; k += 5) {
            const seg = s2.segments[k];
            // If it is the head segment, check only if index is j < i to avoid double-checking
            if (k === 0 && j < i) {
              // Head to head crash
              if (Math.hypot(head1.x - seg.x, head1.y - seg.y) < 22) {
                // Shorter snake dies, or both die. Let's make the one with smaller score die
                if (s1.score <= s2.score) {
                  if (s1.isPlayer) triggerDeath();
                  else deadSnakes.add(s1.id);
                } else {
                  if (s2.isPlayer) triggerDeath();
                  else deadSnakes.add(s2.id);
                }
              }
            } else if (k > 0) {
              // Head to body crash
              if (Math.hypot(head1.x - seg.x, head1.y - seg.y) < 18) {
                if (s1.isPlayer) {
                  triggerDeath();
                } else {
                  deadSnakes.add(s1.id);
                }
                
                // Reward s2 for the kill
                s2.score += 50;
                break;
              }
            }
          }
        }
      }
    }

    // Process dead AI snakes (explode into foods and respawn after delay)
    deadSnakes.forEach(id => {
      const deadSnake = snakes.find(s => s.id === id);
      if (deadSnake) {
        explodeSnake(deadSnake);
      }
    });

    // 6. Food Collisions & Eating
    snakes.forEach(snake => {
      const head = snake.segments[0];
      const eatRadius = snake.isBoost ? 30 : 20;

      for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        if (Math.hypot(head.x - food.x, head.y - food.y) < eatRadius) {
          // Eat!
          snake.score += food.value * 5;
          if (snake.isPlayer) {
            setScore(snake.score);
            setLength(Math.max(5, Math.floor(snake.score / 10) + 10));
            playSound('eat');

            // Add subtle particle effect
            for (let p = 0; p < 3; p++) {
              particles.push({
                x: food.x,
                y: food.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: food.color,
                size: Math.random() * 2 + 1.5,
                alpha: 1,
                decay: 0.05
              });
            }
          }

          // Remove food and respawn another one
          foods.splice(i, 1);
          
          const colors = ['#00dbe7', '#cf5cff', '#fface8', '#74f5ff', '#ecb2ff', '#ffd7f0'];
          foods.push({
            x: Math.random() * MAP_SIZE,
            y: Math.random() * MAP_SIZE,
            value: Math.floor(Math.random() * 3) + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 4 + 3
          });
        }
      }
    });

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // 7. Dynamic Camera Follow with elastic spring interpolation
    cameraRef.current.x += (player.segments[0].x - cameraRef.current.x) * 0.1;
    cameraRef.current.y += (player.segments[0].y - cameraRef.current.y) * 0.1;

    // Calculate Leaderboard & Rank
    const sortedLeaderboard = snakes
      .map(s => ({ name: s.name, score: s.score, isPlayer: s.isPlayer }))
      .sort((a, b) => b.score - a.score);

    setLeaderboard(sortedLeaderboard.slice(0, 6));

    const pRank = sortedLeaderboard.findIndex(s => s.isPlayer) + 1;
    setRank(pRank);
  };

  const explodeSnake = (snake: Snake) => {
    const foods = foodsRef.current;
    const particles = particlesRef.current;

    // Explode segments into rich foods
    snake.segments.forEach((seg, idx) => {
      if (idx % 10 === 0) {
        foods.push({
          x: seg.x + (Math.random() - 0.5) * 15,
          y: seg.y + (Math.random() - 0.5) * 15,
          value: Math.floor(Math.random() * 4) + 3,
          color: snake.color,
          size: Math.random() * 5 + 5
        });

        // Large particle explosion
        for (let p = 0; p < 4; p++) {
          particles.push({
            x: seg.x,
            y: seg.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: snake.color,
            size: Math.random() * 4 + 2,
            alpha: 1,
            decay: 0.03
          });
        }
      }
    });

    // Remove or Respawn AI snake
    if (!snake.isPlayer) {
      const idx = snakesRef.current.findIndex(s => s.id === snake.id);
      if (idx !== -1) {
        snakesRef.current.splice(idx, 1);
      }

      // Respawn AI after short delay
      setTimeout(() => {
        if (gameStateRef.current !== 'playing') return;
        const aiName = ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)];
        const aiSegments: SnakeSegment[] = [];
        const aiX = Math.random() * (MAP_SIZE - 400) + 200;
        const aiY = Math.random() * (MAP_SIZE - 400) + 200;
        const aiLen = (Math.floor(Math.random() * 12) + 8) * 10;
        const aiAngle = Math.random() * Math.PI * 2;
        
        for (let j = 0; j < aiLen; j++) {
          aiSegments.push({ 
            x: aiX + Math.cos(aiAngle) * j * 1.2, 
            y: aiY + Math.sin(aiAngle) * j * 1.2 
          });
        }

        snakesRef.current.push({
          id: `ai_${Date.now()}_${Math.random()}`,
          name: aiName,
          segments: aiSegments,
          angle: aiAngle,
          targetAngle: aiAngle,
          speed: 1,
          isBoost: false,
          color: Math.random() < 0.5 ? '#cf5cff' : '#ecb2ff',
          isPlayer: false,
          score: (aiLen - 5) * 15,
          pulseTimer: Math.random() * 10
        });
      }, 3500);
    }
  };

  // Canvas Renderer
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear with Deep Cosmic background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, width, height);

    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    const zoom = cameraRef.current.zoom;

    // Map Coordinates Translator Helper
    const worldToScreen = (wx: number, wy: number) => {
      return {
        x: (wx - camX) * zoom + width / 2,
        y: (wy - camY) * zoom + height / 2
      };
    };

    // 1. Draw Arena Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 80;

    // Grid bounding boxes
    const screenLeft = camX - width / 2 / zoom;
    const screenRight = camX + width / 2 / zoom;
    const screenTop = camY - height / 2 / zoom;
    const screenBottom = camY + height / 2 / zoom;

    const startX = Math.max(0, Math.floor(screenLeft / gridSize) * gridSize);
    const endX = Math.min(MAP_SIZE, Math.ceil(screenRight / gridSize) * gridSize);
    const startY = Math.max(0, Math.floor(screenTop / gridSize) * gridSize);
    const endY = Math.min(MAP_SIZE, Math.ceil(screenBottom / gridSize) * gridSize);

    for (let x = startX; x <= endX; x += gridSize) {
      const p1 = worldToScreen(x, Math.max(0, screenTop));
      const p2 = worldToScreen(x, Math.min(MAP_SIZE, screenBottom));
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const p1 = worldToScreen(Math.max(0, screenLeft), y);
      const p2 = worldToScreen(Math.min(MAP_SIZE, screenRight), y);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Draw Arena Borders (Cyan Glowing Boundary)
    ctx.strokeStyle = '#00dbe7';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00dbe7';
    ctx.shadowBlur = 15;
    
    const topLeft = worldToScreen(0, 0);
    const bottomRight = worldToScreen(MAP_SIZE, MAP_SIZE);

    ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // 2. Draw Food Particles
    foodsRef.current.forEach(food => {
      const pos = worldToScreen(food.x, food.y);
      // Fast clipping check
      if (pos.x < -20 || pos.x > width + 20 || pos.y < -20 || pos.y > height + 20) return;

      ctx.fillStyle = food.color;
      ctx.shadowColor = food.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, food.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset

    // 3. Draw Snakes
    snakesRef.current.forEach(snake => {
      // Draw tail-to-head to overlay correctly
      const segments = snake.segments;
      if (segments.length === 0) return;

      // Draw body segments
      for (let i = segments.length - 1; i >= 1; i--) {
        if (i % 10 !== 0 && i !== segments.length - 1) continue;

        const seg = segments[i];
        const pos = worldToScreen(seg.x, seg.y);
        
        // Fast clipping check
        if (pos.x < -30 || pos.x > width + 30 || pos.y < -30 || pos.y > height + 30) continue;

        // Draw segment with dynamic size gradient (tapers off slightly near the tail)
        const sizeRatio = 1 - (i / segments.length) * 0.35;
        const segmentRadius = (snake.isPlayer ? 9.5 : 8) * sizeRatio;

        ctx.fillStyle = snake.color;
        
        // Boost glow trails for player/enemies
        if (snake.isBoost && i % 3 === 0) {
          ctx.shadowColor = snake.color;
          ctx.shadowBlur = 12;
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, segmentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw inner accent core for premium neon aesthetic
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(pos.x - segmentRadius * 0.2, pos.y - segmentRadius * 0.2, segmentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw snake head
      const head = segments[0];
      const headPos = worldToScreen(head.x, head.y);
      const headRadius = snake.isPlayer ? 12.5 : 10;

      // Outer head ring
      ctx.fillStyle = snake.color;
      if (snake.isPlayer) {
        ctx.shadowColor = '#00dbe7';
        ctx.shadowBlur = 15;
      }
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, headRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes (glowing white dots rotated with snake angle)
      const eyeOffsetAngle = 0.55;
      const eyeDist = headRadius * 0.55;
      const leftEyeX = headPos.x + Math.cos(snake.angle - eyeOffsetAngle) * eyeDist;
      const leftEyeY = headPos.y + Math.sin(snake.angle - eyeOffsetAngle) * eyeDist;
      const rightEyeX = headPos.x + Math.cos(snake.angle + eyeOffsetAngle) * eyeDist;
      const rightEyeY = headPos.y + Math.sin(snake.angle + eyeOffsetAngle) * eyeDist;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 2.5, 0, Math.PI * 2);
      ctx.arc(rightEyeX, rightEyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (black dots looking forward)
      const pupilOffsetAngle = 0.5;
      const pupilDist = headRadius * 0.7;
      const leftPupilX = headPos.x + Math.cos(snake.angle - pupilOffsetAngle) * pupilDist;
      const leftPupilY = headPos.y + Math.sin(snake.angle - pupilOffsetAngle) * pupilDist;
      const rightPupilX = headPos.x + Math.cos(snake.angle + pupilOffsetAngle) * pupilDist;
      const rightPupilY = headPos.y + Math.sin(snake.angle + pupilOffsetAngle) * pupilDist;

      ctx.fillStyle = '#05070a';
      ctx.beginPath();
      ctx.arc(leftPupilX, leftPupilY, 1.2, 0, Math.PI * 2);
      ctx.arc(rightPupilX, rightPupilY, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Draw custom name pill attached to head
      ctx.save();
      const textX = headPos.x;
      const textY = headPos.y - headRadius - 12;

      ctx.font = snake.isPlayer 
        ? 'bold 11px "Space Grotesk", sans-serif' 
        : '9px "Space Grotesk", sans-serif';

      const labelText = snake.name;
      const textWidth = ctx.measureText(labelText).width;
      
      // Draw background pill
      ctx.fillStyle = 'rgba(12, 14, 18, 0.75)';
      ctx.strokeStyle = snake.isPlayer ? 'rgba(0, 219, 231, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      
      const padW = 7;
      const padH = 4;
      
      // Rounded pill rect
      const rx = textX - textWidth / 2 - padW;
      const ry = textY - 8 - padH;
      const rw = textWidth + padW * 2;
      const rh = 15 + padH * 2;
      const radius = 6;
      
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Text color highlighting
      ctx.fillStyle = snake.isPlayer ? '#00dbe7' : '#e1e2e7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, textX, textY + 1);
      ctx.restore();
    });

    // 4. Draw Particles explosions
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0; // reset
  };

  // Joystick touch interactions
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    joystickActive.current = true;
    setShowJoystick(true);
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    // Set baseline joystick center
    joystickPos.current = { x: 0, y: 0 };
    (e.currentTarget as any).touchCenter = { x: touchX, y: touchY };
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive.current) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const center = (e.currentTarget as any).touchCenter || { x: rect.width / 2, y: rect.height / 2 };
    const dx = touchX - center.x;
    const dy = touchY - center.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist === 0) {
      joystickPos.current = { x: 0, y: 0 };
    } else {
      const maxRange = 50;
      const limitedDist = Math.min(dist, maxRange);
      const angle = Math.atan2(dy, dx);
      
      joystickPos.current = {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };

      // Draw dynamic visual knob state offset
      const visualKnob = document.getElementById('joystick-knob');
      if (visualKnob) {
        visualKnob.style.transform = `translate(${Math.cos(angle) * limitedDist}px, ${Math.sin(angle) * limitedDist}px)`;
      }
    }
  };

  const handleJoystickEnd = () => {
    joystickActive.current = false;
    joystickPos.current = { x: 0, y: 0 };
    const visualKnob = document.getElementById('joystick-knob');
    if (visualKnob) {
      visualKnob.style.transform = `translate(0px, 0px)`;
    }
  };

  // Resize canvas responsively when container changes
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        renderGame();
      }
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [gameState]);

  return (
    <div className="flex flex-col h-full bg-[#05070a] text-on-surface select-none relative overflow-hidden" ref={containerRef}>
      {/* Main Renderer Canvas - ALWAYS mounted in the background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full" />
      
      {/* 1. START MENU SCREEN */}
      {gameState === 'start' && (
        <div className="flex flex-col items-center justify-between h-full p-6 relative z-10 bg-black/50 backdrop-blur-[2px]">
          
          <div className="text-center w-full mt-4">
            {/* Title Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 shadow-[0_0_15px_rgba(0,219,231,0.15)] mb-3">
              <Gamepad2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-mono text-[10px] font-bold tracking-widest uppercase">
                MINI-GAME SPECIAL
              </span>
            </div>
            
            <h2 className="font-display font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed-dim via-[#74f5ff] to-secondary-container tracking-tight">
              反调贪吃蛇
            </h2>
            <p className="font-sans text-xs text-on-surface-variant/80 mt-1.5 max-w-[280px] mx-auto">
              跑调声纹演化出自主生命，吃掉散落的音乐粒子，做反调星球上最长的歌。
            </p>
          </div>

          {/* Form & Setup */}
          <div className="w-full max-w-[320px] bg-white/5 border border-white/10 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] my-4 flex flex-col gap-4">
            
            {/* Name input */}
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-on-surface-variant/70 uppercase mb-1.5">
                设置你的玩家 ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 16))}
                  placeholder="请输入您的名称..."
                  className="w-full bg-[#0c0e12]/80 text-primary border border-primary/30 rounded-full pl-10 pr-4 py-2.5 text-sm font-display font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[0_0_10px_rgba(0,219,231,0.05)]"
                />
              </div>
            </div>

            {/* Game mode selector */}
            <div>
              <span className="block text-[10px] font-mono tracking-wider text-on-surface-variant/70 uppercase mb-1.5">
                游戏模式
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode('endless')}
                  className={`py-2 rounded-xl text-xs font-bold font-sans cursor-pointer border transition-all ${
                    gameMode === 'endless'
                      ? 'bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(0,219,231,0.1)]'
                      : 'bg-[#0c0e12]/60 text-on-surface-variant/60 border-white/5 hover:text-on-surface'
                  }`}
                >
                  无尽模式
                </button>
                <button
                  onClick={() => setGameMode('time')}
                  className={`py-2 rounded-xl text-xs font-bold font-sans cursor-pointer border transition-all ${
                    gameMode === 'time'
                      ? 'bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(0,219,231,0.1)]'
                      : 'bg-[#0c0e12]/60 text-on-surface-variant/60 border-white/5 hover:text-on-surface'
                  }`}
                >
                  限时挑战 (3分)
                </button>
              </div>
            </div>

            {/* Audio configuration & instructions */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-1">
              <span className="text-[11px] text-on-surface-variant">游戏音效</span>
              <button
                onClick={() => setMuted(!muted)}
                className="p-1.5 rounded-lg bg-[#0c0e12]/80 border border-white/10 hover:border-primary/30 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-[320px] text-center mb-2">
            <div className="bg-white/3 border border-white/5 p-2 rounded-2xl">
              <p className="text-[9px] text-on-surface-variant/60">历史最高分数</p>
              <p className="text-md font-mono font-black text-primary drop-shadow-[0_2px_5px_rgba(0,219,231,0.1)]">{bestScore}</p>
            </div>
            <div className="bg-white/3 border border-white/5 p-2 rounded-2xl">
              <p className="text-[9px] text-on-surface-variant/60">历史最长长度</p>
              <p className="text-md font-mono font-black text-secondary drop-shadow-[0_2px_5px_rgba(207,92,255,0.1)]">{bestLength}</p>
            </div>
          </div>

          {/* Play / Return Controls */}
          <div className="w-full flex flex-col gap-2 shrink-0">
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-[#111417] font-display font-extrabold text-md shadow-[0_0_20px_rgba(0,219,231,0.35)] cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Play className="w-4 h-4 fill-current" />
              进入星轨对决
            </button>

            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface-variant font-display font-semibold text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              返回反调印记
            </button>
          </div>
        </div>
      )}

      {/* 2. LIVE GAMEPLAY HUD */}
      {gameState === 'playing' && (
        <div className="flex-1 w-full h-full relative flex flex-col justify-between">

          {/* HUD Overlay (Leaderboard, Score, energy bar) */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
            {/* Player Metrics */}
            <div className="flex flex-col gap-1.5 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse shadow-[0_0_6px_#00dbe7]" />
                <span className="text-[10px] text-on-surface-variant font-bold font-mono">得分: <span className="text-primary font-bold text-xs">{score}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_6px_#cf5cff]" />
                <span className="text-[10px] text-on-surface-variant font-bold font-mono">长度: <span className="text-secondary font-bold text-xs">{length}</span></span>
              </div>
              
              {/* Dynamic timer or endless survival tracker */}
              <div className="flex items-center gap-2 border-t border-white/5 pt-1 mt-1">
                <Clock className="w-3 h-3 text-on-surface-variant" />
                {gameMode === 'time' ? (
                  <span className="text-[10px] text-error font-mono font-bold">
                    倒计时: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <span className="text-[10px] text-primary-container font-mono">
                    已生存: {survivalTime}秒
                  </span>
                )}
              </div>
            </div>

            {/* Quick Leaderboard */}
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 w-40 pointer-events-auto flex flex-col gap-1">
              <span className="text-[9px] font-mono tracking-widest text-on-surface-variant border-b border-white/5 pb-1 flex items-center gap-1 font-bold">
                <Trophy className="w-3 h-3 text-secondary" />
                星轨排行榜
              </span>
              <div className="flex flex-col gap-0.5">
                {leaderboard.map((user, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between text-[9px] font-sans truncate py-0.5 ${
                      user.isPlayer ? 'text-primary font-extrabold' : 'text-on-surface-variant/80'
                    }`}
                  >
                    <span className="truncate max-w-[100px] flex gap-1 items-center">
                      <span className={`font-mono ${user.isPlayer ? 'text-primary' : ''}`}>{idx + 1}.</span>
                      {user.name}
                    </span>
                    <span className="font-mono">{user.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Controls / Virtual Joypad Zone */}
          <div className="absolute bottom-4 left-0 w-full px-4 flex justify-between items-end z-20">
            {/* Desktop hint message or Virtual touch joystick */}
            {isMobile ? (
              <div 
                className="w-28 h-28 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center relative touch-none pointer-events-auto"
                onTouchStart={handleJoystickStart}
                onTouchMove={handleJoystickMove}
                onTouchEnd={handleJoystickEnd}
              >
                {/* Outer ring label */}
                <span className="absolute text-[8px] text-on-surface-variant/40 font-mono tracking-widest pointer-events-none -top-4">
                  拖拽虚拟舵盘
                </span>
                {/* Dynamic Inner knob */}
                <div 
                  id="joystick-knob"
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-fixed-dim to-secondary-container shadow-[0_0_15px_rgba(0,219,231,0.4)] pointer-events-none transition-transform duration-75"
                />
              </div>
            ) : (
              <div className="bg-black/60 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-full text-[9px] text-on-surface-variant/80 font-sans pointer-events-none">
                ⌨️ 电脑控制: <span className="text-primary font-bold">W A S D / 方向键</span> 转向，<span className="text-secondary font-bold">空格键</span> 氮气加速
              </div>
            )}

            {/* Boost/Nitrogen button */}
            <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
              {/* Boost meter bar */}
              <div className="w-18 bg-white/5 border border-white/10 rounded-full p-0.5 relative overflow-hidden h-2.5">
                <div 
                  className="h-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container rounded-full transition-all duration-100" 
                  style={{ width: `${boostEnergy}%` }} 
                />
              </div>
              <button
                onTouchStart={() => { keysPressed.current['boost_active'] = true; }}
                onTouchEnd={() => { keysPressed.current['boost_active'] = false; }}
                onMouseDown={() => { keysPressed.current['boost_active'] = true; }}
                onMouseUp={() => { keysPressed.current['boost_active'] = false; }}
                onMouseLeave={() => { keysPressed.current['boost_active'] = false; }}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-fixed-dim/20 to-secondary-container/20 border-2 border-primary-fixed-dim/60 flex flex-col items-center justify-center text-primary font-display font-black text-[10px] tracking-widest hover:border-primary active:scale-90 transition-transform select-none shadow-[0_0_15px_rgba(0,219,231,0.2)] cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current mb-0.5" />
                加速
              </button>
            </div>
          </div>

          {/* Pause button top middle */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
            <button
              onClick={triggerDeath}
              className="px-3 py-1 bg-black/60 border border-white/10 rounded-full text-[9px] text-error hover:text-white transition-colors cursor-pointer"
            >
              结束游玩
            </button>
          </div>
        </div>
      )}

      {/* 3. DEAD / RESULT SUMMARY SCREEN */}
      {gameState === 'dead' && (
        <div className="flex flex-col items-center justify-between h-full p-6 relative z-10 bg-black/60 backdrop-blur-[2px]">
          <div className="text-center w-full mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/15 border border-error/25 shadow-[0_0_15px_rgba(255,180,171,0.15)] mb-3">
              <Award className="w-3.5 h-3.5 text-error" />
              <span className="text-error font-mono text-[10px] font-bold tracking-widest uppercase">
                ROUND OVER
              </span>
            </div>
            <h2 className="font-display font-black text-3xl text-error tracking-tight">
              对决结束
            </h2>
            <p className="font-sans text-xs text-on-surface-variant mt-1">
              不完美的反调轨迹在虚空中定格！
            </p>
          </div>

          {/* Detailed results card */}
          <div className="w-full max-w-[320px] bg-white/5 border border-white/10 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] my-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-error/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col gap-4 text-center">
              <div>
                <p className="text-[10px] text-on-surface-variant/60 font-mono tracking-wider uppercase">最终得分</p>
                <p className="font-display font-black text-4xl text-primary drop-shadow-[0_4px_10px_rgba(0,219,231,0.3)]">{score}</p>
              </div>

              <div className="h-[1px] bg-white/5" />

              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-on-surface-variant/60">最终长度</p>
                  <p className="text-lg font-mono font-black text-secondary">{length}</p>
                </div>
                <div>
                  <p className="text-[9px] text-on-surface-variant/60">生存时间</p>
                  <p className="text-lg font-mono font-black text-primary-container">{survivalTime} 秒</p>
                </div>
              </div>

              <div className="h-[1px] bg-white/5" />

              <div className="text-center">
                <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant/80 bg-white/3 px-3 py-1 rounded-full">
                  当前对局排名: 第 <span className="text-primary font-bold">{rank}</span> 名
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2 shrink-0 mb-4">
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-[#111417] font-display font-extrabold text-md shadow-[0_0_20px_rgba(0,219,231,0.35)] cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              再来一局
            </button>

            <button
              onClick={onBack}
              className="w-full py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface-variant font-display font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              返回反调印记
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
