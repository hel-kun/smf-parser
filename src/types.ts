export type SmfBinary = {
  headerBinary: ArrayBuffer;
  trackBinarys: ArrayBuffer[];
}

export type Scale = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";

export type Note = {
  scale: Scale;
  octave: Octave;
  timing: number;
  length: number;
  velocity: number;
}

export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export function isOctave(octave:number): octave is Octave {
  return [0,1,2,3,4,5,6,7].includes(octave)
}

export type Tempo = {
  bpm: number;
  timing: number;
}
export type Beat = {
  beat_denominator: number;
  beat_numerator: number;
  timing: number;
}

export type Track = {
  tempos: Tempo[];
  beats: Beat[];
  notes: Note[];
}

export type Header = {
  format: number;
  tracks: number;
  division: number;
}

export type SmfData = {
  header: Header;
  track: Track;
}