/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { 
  Music, 
  Play, 
  Square, 
  Download, 
  RefreshCcw, 
  Settings, 
  Info, 
  Volume2, 
  Zap, 
  Moon, 
  Sun,
  Github,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface GeneratedMusic {
  midi: string;
  notes: string[];
  params: {
    mood: string;
    genre: string;
    style: string;
    tempo: number;
  };
}

// --- Constants ---
const MOODS = ["Happy", "Calm", "Energetic", "Sad"];
const GENRES = ["Classical", "Lo-fi", "Electronic", "Ambient"];
const STYLES = ["Piano", "Synth", "Strings", "Guitar"];

export default function App() {
  const [mood, setMood] = useState(MOODS[0]);
  const [genre, setGenre] = useState(GENRES[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [tempo, setTempo] = useState(120);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // --- Audio Setup ---
  useEffect(() => {
    // Initialize synth based on style
    const setupSynth = () => {
      if (synthRef.current) synthRef.current.dispose();
      
      let synth;
      switch (style) {
        case "Synth":
          synth = new Tone.PolySynth(Tone.Synth).toDestination();
          break;
        case "Strings":
          synth = new Tone.PolySynth(Tone.AMSynth).toDestination();
          break;
        case "Guitar":
          synth = new Tone.PolySynth(Tone.FMSynth).toDestination();
          break;
        default: // Piano
          synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
          }).toDestination();
      }
      synthRef.current = synth;
    };

    setupSynth();
  }, [style]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, genre, style, tempo })
      });
      const data = await response.json();
      setGeneratedMusic(data);
      setIsPlaying(false);
      setProgress(0);
      if (sequenceRef.current) sequenceRef.current.dispose();
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = async () => {
    if (!generatedMusic) return;

    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
      return;
    }

    await Tone.start();
    
    if (sequenceRef.current) sequenceRef.current.dispose();

    const notes = generatedMusic.notes;
    Tone.Transport.bpm.value = tempo;

    sequenceRef.current = new Tone.Sequence((time, note) => {
      synthRef.current?.triggerAttackRelease(note, "4n", time);
      // Update progress (approximate)
      Tone.Draw.schedule(() => {
        setProgress((prev) => (prev + 1) % notes.length);
      }, time);
    }, notes, "4n").start(0);

    Tone.Transport.start();
    setIsPlaying(true);
  };

  const handleDownload = () => {
    if (!generatedMusic) return;
    const link = document.createElement('a');
    link.href = generatedMusic.midi;
    link.download = `covercomposer-${mood.toLowerCase()}-${genre.toLowerCase()}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* --- Header --- */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Music className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic">COVERCOMPOSER</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#generator" className="hover:text-emerald-400 transition-colors">Generator</a>
            <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
            <a href="https://github.com" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" /> GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        {/* --- Hero Section --- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-12 md:p-24 text-center space-y-8">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest uppercase rounded-full border border-emerald-500/20">
              AI-Powered Music
            </span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
              GENERATE <span className="text-emerald-500">UNIQUE</span> <br />
              INSTRUMENTAL TRACKS.
            </h2>
            <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl font-light">
              Create custom melodies instantly using Markov Chain algorithms. Select your mood, choose a genre, and let the AI compose your next masterpiece.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a href="#generator" className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
              Start Composing <ChevronRight className="w-5 h-5" />
            </a>
            <button className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-full hover:bg-zinc-700 transition-colors">
              View Showcase
            </button>
          </motion.div>
        </section>

        {/* --- Generator Panel --- */}
        <section id="generator" className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8 bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-emerald-500" />
              <h3 className="text-2xl font-bold italic uppercase tracking-tight">Generator Panel</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mood</label>
                <select 
                  value={mood} 
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Genre</label>
                <select 
                  value={genre} 
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Style</label>
                <select 
                  value={style} 
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tempo (BPM)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="60" 
                    max="180" 
                    value={tempo} 
                    onChange={(e) => setTempo(parseInt(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="w-12 text-center font-mono font-bold text-emerald-500">{tempo}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-emerald-500 text-black font-black uppercase italic tracking-tighter rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate Music
                </>
              )}
            </button>
          </div>

          {/* --- Output Section --- */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {generatedMusic ? (
                <motion.div 
                  key="output"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-6 h-6 text-emerald-500" />
                      <h3 className="text-2xl font-bold italic uppercase tracking-tight">Output</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/20">
                        {generatedMusic.params.mood}
                      </span>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/20">
                        {generatedMusic.params.genre}
                      </span>
                    </div>
                  </div>

                  {/* Visualizer Placeholder */}
                  <div className="h-32 bg-black rounded-2xl border border-white/5 flex items-end justify-center gap-1 p-4 overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ 
                          height: isPlaying ? [10, Math.random() * 80 + 10, 10] : 10 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.5 + Math.random(),
                          ease: "easeInOut"
                        }}
                        className="w-1 bg-emerald-500/50 rounded-full"
                      />
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={togglePlayback}
                      className="flex-1 py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                    >
                      {isPlaying ? <><Square className="w-5 h-5 fill-current" /> Stop</> : <><Play className="w-5 h-5 fill-current" /> Play Preview</>}
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="p-4 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                      title="Download MIDI"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Note Sequence */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Note Sequence</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedMusic.notes.map((note, i) => (
                        <span 
                          key={i} 
                          className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                            progress === i ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black text-zinc-400 border-white/10'
                          }`}
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-12 space-y-4"
                >
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-zinc-500">No Music Generated Yet</h4>
                    <p className="text-zinc-600 max-w-xs">Configure the parameters on the left and click "Generate Music" to start.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* --- About Section --- */}
        <section id="about" className="space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black italic uppercase tracking-tight">How it Works</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              CoverComposer combines mathematical probability with musical theory to generate unique instrumental tracks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <RefreshCcw className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="text-xl font-bold">Markov Chains</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Our AI uses Markov Chains to predict the next note based on the current one, ensuring melodic flow while maintaining randomness.
              </p>
            </div>
            <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="text-xl font-bold">MIDI Synthesis</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Generated notes are converted into MIDI data, which can be downloaded or synthesized in real-time using advanced SoundFont technology.
              </p>
            </div>
            <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="text-xl font-bold">Theory-Based</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The algorithm adheres to musical scales (Major/Minor) based on the selected mood, ensuring the output is always harmonically pleasing.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
              <Music className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-sm font-bold tracking-tighter uppercase italic text-zinc-500">COVERCOMPOSER</span>
          </div>
          <p className="text-xs text-zinc-600">
            &copy; 2026 COVERCOMPOSER AI. All rights reserved. Built for the future of music.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
