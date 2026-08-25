/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RemixStyle } from '../types';

export class OffTuneSynth {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private isCurrentlyPlaying = false;
  private bpm = 85;
  private sequencerTimer: any = null;
  private currentStep = 0;
  
  // Analyser node for visualizers
  public analyser: AnalyserNode | null = null;
  private onBeatCallback: ((step: number) => void) | null = null;

  constructor() {
    // Lazy creation
  }

  public init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
    }
  }

  public setOnBeat(cb: (step: number) => void) {
    this.onBeatCallback = cb;
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public start(style: RemixStyle, customNotes?: number[]) {
    this.init();
    if (!this.ctx) return;

    if (this.isCurrentlyPlaying) {
      this.stop();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isCurrentlyPlaying = true;
    this.currentStep = 0;
    
    // Choose tempo based on genre
    switch (style) {
      case 'lofi':
        this.bpm = 75;
        this.startLofi(customNotes);
        break;
      case 'cyber':
        this.bpm = 110;
        this.startCyber(customNotes);
        break;
      case 'cosmic':
        this.bpm = 60;
        this.startCosmic(customNotes);
        break;
    }
  }

  public stop() {
    this.isCurrentlyPlaying = false;
    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }
    this.activeNodes.forEach(node => {
      try {
        (node as any).stop?.();
        node.disconnect();
      } catch (e) {
        // Already stopped/disconnected
      }
    });
    this.activeNodes = [];
  }

  private addNode(node: AudioNode) {
    this.activeNodes.push(node);
  }

  // --- LO-FI STYLE: Warm Triangle Waves + Soft Vinyl Hiss ---
  private startLofi(customNotes?: number[]) {
    if (!this.ctx || !this.analyser) return;

    // 1. Vinyl Hiss Simulator
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.015; // Soft vinyl hum
    }
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000; // Muffled vinyl hiss

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.3;

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.analyser);
    
    noiseNode.start(0);
    this.addNode(noiseNode);

    // 2. Chord / Beat Sequencer
    // Standard beautiful Lo-Fi chord progression (Cmaj7 -> Am9 -> Fmaj7 -> G11)
    const baseChords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 146.83, 174.61, 220.00], // Dm7 or Am9
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G7
    ];

    const notesToUse = customNotes && customNotes.length > 0 ? customNotes : [261.63, 293.66, 329.63, 392.00, 440.00];

    const stepInterval = (60 / this.bpm) * 1000; // Interval per beat
    
    const playStep = () => {
      if (!this.isCurrentlyPlaying || !this.ctx || !this.analyser) return;

      const chordIndex = Math.floor(this.currentStep / 4) % baseChords.length;
      const bitOfStep = this.currentStep % 4;

      this.onBeatCallback?.(this.currentStep);

      // Warm Electric Piano Synth for chords (On the downbeat)
      if (bitOfStep === 0) {
        baseChords[chordIndex].forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'triangle';
          osc.frequency.value = freq;

          // Gentle vibrato
          const lfo = this.ctx!.createOscillator();
          const lfoGain = this.ctx!.createGain();
          lfo.frequency.value = 4.5; // 4.5Hz
          lfoGain.gain.value = 1.2; // small vibrato
          
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();

          gain.gain.setValueAtTime(0, this.ctx!.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 2.8);

          osc.connect(gain);
          gain.connect(this.analyser!);

          osc.start();
          lfo.start();
          
          setTimeout(() => {
            try {
              osc.stop();
              lfo.stop();
            } catch (e) {}
          }, 3000);
        });
      }

      // Soft kick on beat 0/2, soft snare on 1/3 (Simulated with synthesized frequencies)
      if (bitOfStep === 0 || bitOfStep === 2) {
        // Kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start();
        setTimeout(() => { try { osc.stop(); } catch(e) {} }, 200);
      } else if (bitOfStep === 1 || bitOfStep === 3) {
        // Snare (Soft noise burst)
        const snBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const snData = snBuffer.getChannelData(0);
        for(let i=0; i<snData.length; i++) {
          snData[i] = (Math.random() * 2 - 1) * 0.05;
        }
        const snSource = this.ctx.createBufferSource();
        snSource.buffer = snBuffer;
        
        const snFilter = this.ctx.createBiquadFilter();
        snFilter.type = 'highpass';
        snFilter.frequency.value = 1200;

        const snGain = this.ctx.createGain();
        snGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        snGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        snSource.connect(snFilter);
        snFilter.connect(snGain);
        snGain.connect(this.analyser);
        snSource.start();
      }

      // Play custom melody note
      if (Math.random() > 0.4) {
        const noteFreq = notesToUse[Math.floor(Math.random() * notesToUse.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High lo-fi rhodes bell
        osc.type = 'sine';
        osc.frequency.value = noteFreq * 2; // high octave

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start();
        setTimeout(() => { try { osc.stop(); } catch(e) {} }, 1000);
      }

      this.currentStep++;
    };

    playStep();
    this.sequencerTimer = setInterval(playStep, stepInterval);
  }

  // --- CYBER STYLE: Gritty Sawtooth, Rapid Glitch Arpeggios ---
  private startCyber(customNotes?: number[]) {
    if (!this.ctx || !this.analyser) return;

    const baseCyberChords = [
      [146.83, 174.61, 220.00], // Dm (Cyber Moody)
      [130.81, 164.81, 196.00], // C
      [116.54, 138.59, 174.61], // Bb minor
      [146.83, 185.00, 220.00], // D major glitch
    ];

    const notesToUse = customNotes && customNotes.length > 0 ? customNotes : [146.83, 174.61, 220.00, 246.94, 293.66, 329.63];

    const stepInterval = (60 / this.bpm) * 1000 / 2; // Double speed (eighth notes!)

    const playStep = () => {
      if (!this.isCurrentlyPlaying || !this.ctx || !this.analyser) return;

      const chordIndex = Math.floor(this.currentStep / 8) % baseCyberChords.length;
      const bitOfStep = this.currentStep % 8;

      this.onBeatCallback?.(this.currentStep);

      // Bass drone with buzz
      if (this.currentStep % 16 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        // Double root bass frequency
        bassOsc.frequency.value = baseCyberChords[chordIndex][0] / 2; 

        // Glitchy Low pass sweeping
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 1.2);
        
        bassGain.gain.setValueAtTime(0, this.ctx.currentTime);
        bassGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
        bassGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1.0);
        bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.analyser);
        bassOsc.start();
        setTimeout(() => { try { bassOsc.stop(); } catch(e) {} }, 2800);
      }

      // Cyber punch kick on step 0, 4. Tech glitch clap on step 2, 6.
      if (bitOfStep === 0 || bitOfStep === 4) {
        // Deep punchy electronic kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start();
        setTimeout(() => { try { osc.stop(); } catch(e) {} }, 200);
      } else if (bitOfStep === 2 || bitOfStep === 6) {
        // Glitch Clack / Snare
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 600 + Math.random() * 400; // Glitch pitch fluctuation

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start();
        setTimeout(() => { try { osc.stop(); } catch (e) {} }, 150);
      }

      // High cyber arpeggiation (Fast 16th note arpeggios!)
      if (Math.random() > 0.3) {
        const synthOsc = this.ctx.createOscillator();
        const synthGain = this.ctx.createGain();

        synthOsc.type = 'sawtooth';
        // Pick of chord or custom notes
        const tone = Math.random() > 0.5 
          ? notesToUse[Math.floor(Math.random() * notesToUse.length)] 
          : baseCyberChords[chordIndex][Math.floor(Math.random() * 3)] * (Math.random() > 0.5 ? 2 : 4);

        synthOsc.frequency.value = tone;

        // Glitch resonant filter
        const bandFilter = this.ctx.createBiquadFilter();
        bandFilter.type = 'bandpass';
        bandFilter.Q.value = 8;
        bandFilter.frequency.value = 800 + Math.sin(this.currentStep) * 600;

        synthGain.gain.setValueAtTime(0, this.ctx.currentTime);
        synthGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.01);
        synthGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

        synthOsc.connect(bandFilter);
        bandFilter.connect(synthGain);
        synthGain.connect(this.analyser);

        synthOsc.start();
        setTimeout(() => { try { synthOsc.stop(); } catch(e) {} }, 250);
      }

      this.currentStep++;
    };

    playStep();
    this.sequencerTimer = setInterval(playStep, stepInterval);
  }

  // --- COSMIC STYLE: Slow ethereal space pads and echoes ---
  private startCosmic(customNotes?: number[]) {
    if (!this.ctx || !this.analyser) return;

    const cosmicPads = [
      [220.00, 277.18, 329.63, 392.00], // Amaj7 (Cosmic warm)
      [220.00, 261.63, 329.63, 392.00], // Am7 (Cosmic cold)
      [196.00, 246.94, 293.66, 349.23], // G7
      [174.61, 220.00, 261.63, 311.13], // F7
    ];

    const notesToUse = customNotes && customNotes.length > 0 ? customNotes : [220.00, 261.63, 293.66, 329.63, 392.00, 440.00];

    const stepInterval = (60 / this.bpm) * 1000; // Slow beats

    // Delayed Echo setup
    const delay = this.ctx.createDelay(2.0);
    delay.delayTime.value = 0.45; // Stereo echo style
    const delayGain = this.ctx.createGain();
    delayGain.gain.value = 0.4; // feedback

    delay.connect(delayGain);
    delayGain.connect(delay); // Feedback loops
    delayGain.connect(this.analyser);
    
    const playStep = () => {
      if (!this.isCurrentlyPlaying || !this.ctx || !this.analyser) return;

      const chordIndex = Math.floor(this.currentStep / 4) % cosmicPads.length;
      const bitOfStep = this.currentStep % 4;

      this.onBeatCallback?.(this.currentStep);

      // Majestic cinematic slow pads
      if (bitOfStep === 0) {
        cosmicPads[chordIndex].forEach((freq, idx) => {
          const oscNode = this.ctx!.createOscillator();
          const pGain = this.ctx!.createGain();

          oscNode.type = 'sine';
          oscNode.frequency.value = freq;

          // Slow swell
          pGain.gain.setValueAtTime(0, this.ctx!.currentTime);
          pGain.gain.linearRampToValueAtTime(0.04, this.ctx!.currentTime + 1.2);
          pGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 3.8);

          oscNode.connect(pGain);
          pGain.connect(this.analyser!);
          // Also route pad through the echo line!
          pGain.connect(delay);

          oscNode.start();
          setTimeout(() => { try { oscNode.stop(); } catch(e) {} }, 4000);
        });
      }

      // Procedural space chime note (Echoey and randomized)
      if (Math.random() > 0.3) {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.value = notesToUse[Math.floor(Math.random() * notesToUse.length)] * 2; // high starry chime

        chimeGain.gain.setValueAtTime(0, this.ctx.currentTime);
        chimeGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

        chime.connect(chimeGain);
        chimeGain.connect(this.analyser);
        chimeGain.connect(delay);

        chime.start();
        setTimeout(() => { try { chime.stop(); } catch(e) {} }, 2000);
      }

      this.currentStep++;
    };

    playStep();
    this.sequencerTimer = setInterval(playStep, stepInterval);
  }
}
