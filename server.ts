/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google Gen AI to prevent boot-time crashes if key is empty
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini Analysis and Song generation proxy
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { style, prompt, recordingStats } = req.body;
    
    // Choose specific music/evaluation criteria depending on the recorded vibe
    const styleNameMap: Record<string, string> = {
      lofi: 'Lo-Fi Slow Chat (Muffled, warm, retro vintage tape vibe)',
      cyber: 'Cyberpunk Glitch (Neon, fast rhythm, random electric crackles)',
      cosmic: 'Cosmic Nebula (Spacious, infinite feedback delays, drifting)',
    };
    
    const targetStyle = styleNameMap[style] || 'Experimental Free Form';
    const client = getAiClient();

    const result = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `User Hum Description/Prompt: "${prompt || 'Authentic soulful off-song humming'}"
Selected Music Vibe: "${targetStyle}"
Vocal Metadata Captured: Average frequency variance: ${recordingStats?.pitchVariance || 'High'}, Volume instability: ${recordingStats?.volumeFluctuation || 'Medium'}.
Analyze this creative, off-key "Hum/Vocal" performance and generate a stylized OffTune Identity Card and a short 4-line procedural song.`,
      config: {
        systemInstruction: `You are the creative core of 'OffTune Planet' (反调星球) - a futuristic, digital world where being out-of-tune, glitchy, and imperfect is celebrated as high-end custom art.
Assess their input hum/prompt in a highly cool, philosophical, Gen-Z poetic voice. Provide a complete, formatted JSON response translating their imperfection into high art.
CRITICAL: badgeLevel MUST be exactly one of these six Chinese identities: '自信跑偏派', '慢半拍诗人', '破音火山派', '低语梦游者', '怪声炼金师', '反拍舞步怪'. Do not include any prefix (like "ID:" or "身份:") in badgeLevel. All output visible content must be in Chinese.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            userTitle: { 
              type: Type.STRING, 
              description: 'A stylized 3-4 word title for this creator, e.g. 慢拍旅行家, 故障声纹学者, 蒸汽哼唱者.' 
            },
            badgeLevel: { 
              type: Type.STRING, 
              enum: [
                '自信跑偏派',
                '慢半拍诗人',
                '破音火山派',
                '低语梦游者',
                '怪声炼金师',
                '反拍舞步怪'
              ],
              description: 'Exactly one of the six allowed Chinese identities: 自信跑偏派, 慢半拍诗人, 破音火山派, 低语梦游者, 怪声炼金师, 反拍舞步怪.' 
            },
            quote: { 
              type: Type.STRING, 
              description: 'A stunningly beautiful, deep, poetic quote about the perfection of mistakes and vocals (1-2 short sentences in Chinese).' 
            },
            offKeyDegree: { 
              type: Type.INTEGER, 
              description: 'A creative Index metric rating their off-tune deviation from normal pitches, random scale: 80 to 220.' 
            },
            soulResonance: { 
              type: Type.STRING, 
              description: 'A compatible soul resonance tier value e.g. S+, SS, S, AAA+, AAA.' 
            },
            badgesCount: { 
              type: Type.INTEGER, 
              description: 'Random creative counter for collected off-tune badges, range 15 to 60.' 
            },
            vocalColorScore: { 
              type: Type.INTEGER, 
              description: 'Vocal color extraction level, range 75 to 99.' 
            },
            rhythmLooseScore: { 
              type: Type.INTEGER, 
              description: 'Rhythm looseness and slide elasticity index, range 70 to 98.' 
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 3 creative hashtag strings in Chinese starting with # like #灵魂错位, #噪音美学, #时空慢跑.'
            },
            songTitle: { 
              type: Type.STRING, 
              description: 'A creative title for the customized off-tune song, formatted in Chinese like 《第 101 次跑调》 or 《光速之外的慢摇》.' 
            },
            lyrics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 4 beautiful, artistic Chinese lyric lines. Must feel dreamlike, vaporwave, and spacey.'
            },
            notes: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: 'An array of exactly 6 beautiful sound frequencies mapped mathematically to their hum vibe, matching standard pentatonic scale frequencies, e.g., 220.00, 261.63, 293.66, 329.63, 392.00, 440.00.'
            }
          },
          required: [
            'userTitle',
            'badgeLevel',
            'quote',
            'offKeyDegree',
            'soulResonance',
            'badgesCount',
            'vocalColorScore',
            'rhythmLooseScore',
            'tags',
            'songTitle',
            'lyrics',
            'notes',
          ]
        }
      }
    });

    const parsedData = JSON.parse(result.text || '{}');
    // Ensure style is attached to song
    parsedData.song = {
      title: parsedData.songTitle,
      lyrics: parsedData.lyrics,
      chords: [],
      notes: parsedData.notes,
      style: style,
    };
    
    res.json(parsedData);
  } catch (err: any) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze vocal profile' });
  }
});

// Configure Vite middleware or Static files hosting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OffTune Planet Backend] Server listening at http://localhost:${PORT}`);
  });
}

startServer();
