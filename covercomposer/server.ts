import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import MidiWriter from "midi-writer-js";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Music Generation Logic
  const NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
  const MINOR_NOTES = ["C4", "D4", "Eb4", "F4", "G4", "Ab4", "Bb4", "C5"];

  interface GenerationParams {
    mood: string;
    genre: string;
    style: string;
    tempo: number;
  }

  app.post("/api/generate-music", (req, res) => {
    const { mood, genre, style, tempo } = req.body as GenerationParams;

    // 1. Markov Chain Melody Generation
    const track = new MidiWriter.Track();
    track.setTempo(tempo || 120);
    track.addTrackName('Generated Melody');

    // Define scale based on mood
    const scale = (mood === "Sad" || mood === "Calm") ? MINOR_NOTES : NOTES;
    
    let currentNoteIndex = Math.floor(Math.random() * scale.length);
    const melodyLength = 32; // 32 notes
    const notesToPlay: string[] = [];

    for (let i = 0; i < melodyLength; i++) {
      notesToPlay.push(scale[currentNoteIndex]);

      // Markov transition: move to adjacent note or stay
      const rand = Math.random();
      if (rand < 0.4) {
        // Stay
      } else if (rand < 0.7) {
        // Move up
        currentNoteIndex = (currentNoteIndex + 1) % scale.length;
      } else {
        // Move down
        currentNoteIndex = (currentNoteIndex - 1 + scale.length) % scale.length;
      }
    }

    // Add notes to MIDI track
    notesToPlay.forEach((note) => {
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: [note],
        duration: '4', // quarter note
        velocity: 80 + Math.floor(Math.random() * 20)
      }));
    });

    const write = new MidiWriter.Writer(track);
    const midiBase64 = write.dataUri(); // Returns data:audio/midi;base64,...

    res.json({
      midi: midiBase64,
      notes: notesToPlay,
      params: { mood, genre, style, tempo }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
