export type MusicTrack = {
  id: string;
  title: string;
  mood: string;
  bpm: number;
  bass: number[];
  lead: number[];
  pad: number;
};

export const musicTracks: MusicTrack[] = [
  {
    id: "neon-breach",
    title: "Neon Breach",
    mood: "dark pulse",
    bpm: 92,
    bass: [55, 55, 65.41, 73.42],
    lead: [220, 246.94, 261.63, 329.63, 293.66],
    pad: 110
  },
  {
    id: "zero-day-rain",
    title: "Zero-Day Rain",
    mood: "slow synth",
    bpm: 78,
    bass: [49, 61.74, 65.41, 61.74],
    lead: [196, 233.08, 261.63, 311.13],
    pad: 98
  },
  {
    id: "packet-runner",
    title: "Packet Runner",
    mood: "fast chase",
    bpm: 122,
    bass: [65.41, 73.42, 82.41, 98],
    lead: [261.63, 329.63, 392, 493.88, 440],
    pad: 130.81
  }
];
