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

export type ActivateNote = {
  scale: Scale;
  octave: Octave;
  timing: number;
  velocity: number;
  channel: number;
}

export type Octave = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Tempo = {
  bpm: number;
  timing: number;
}
export type Beat = {
  beat_denominator: number;
  beat_numerator: number;
  timing: number;
}

export type Notes = Note[];

export type Header = {
  format: number;
  tracks: number;
  division: number;
}

export type SmfData = {
  header: Header;
  tempos: Tempo[];
  beats: Beat[];
  track: Notes[];
}