import { SmfBinary, SmfData, Header, Track, Note, Beat, Tempo, ActivateNote, Octave, Scale } from "./types";

const BYTE_SIGNAL_HEX = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  POLY_KEY_PRESSURE: 0xa0,
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
  CHANNEL_PRESSURE: 0xd0,
  PITCH_BEND: 0xe0,
  SYSEX_EVENT: 0xf0,
  SYSEX_EVENT_END: 0xf7,
  META_EVENT: 0xff,
}

const META_EVENT_HEX = {
  TEXT: 0x01,
  CP_RIGHT: 0x02,
  TR_NAME: 0x03,
  INST: 0x04,
  LYRIC: 0x05,
  MARKER: 0x06,
  CUE: 0x07,
  MIDI_CH_PREFIX: 0x20,
  MIDI_PORT: 0x21,
  END_OF_TRACK: 0x2f,
  TEMPO: 0x51,
  SMPTE: 0x54,
  TIME_SIG: 0x58,
  KEY_SIG: 0x59,
  SEQ_EVENT: 0x7f,
}

const ScaleList: Scale[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

class BufferReader {
  private buffer: ArrayBuffer;
  private cursor: number;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.cursor = 0;
  }

  readUint16(length: number, addCursor: boolean = true): number {
    const newUint16 = new DataView(this.buffer, this.cursor, length).getUint16(0);
    this.cursor += length * (addCursor ? 1 : 0);
    return newUint16;
  }

  readUint8(length: number, addCursor: boolean = true): number {
    const newUint8 = new DataView(this.buffer, this.cursor, length).getUint8(0);
    this.cursor += length * (addCursor ? 1 : 0);
    return newUint8;
  }

  addCursor(length: number): void {
    this.cursor += length;
  }
}

// TODO: 可変超数値表現によるdeltaTimeの取得
const getDeltaTime = (deltaTime: number): number => {
  return 0;
}

const getHeader = (headerBinary: ArrayBuffer): Header => {
  const headerReader = new BufferReader(headerBinary);
  headerReader.addCursor(8); // skip "MThd" and header length
  const format = headerReader.readUint16(2);
  const tracks = headerReader.readUint16(2);
  const division = headerReader.readUint16(2);
  return { format, tracks, division };
};

const getTrack = (trackBinary: ArrayBuffer): Track => {
  const tempos: Tempo[] = [], beats: Beat[] = [], notes: Note[] = [];
  let deltaTime: number = 0; // tic time
  const trackReader = new BufferReader(trackBinary);
  trackReader.addCursor(8); // skip "MTrk" and track length

  const metaEventHandlers: { [key: number]: () => void } = {
    [META_EVENT_HEX.TEXT]: () => {
      const textLength: number = trackReader.readUint8(1);
      trackReader.addCursor(textLength);
    },
    [META_EVENT_HEX.CP_RIGHT]: () => {
      const cpRightLength: number = trackReader.readUint8(1);
      trackReader.addCursor(cpRightLength);
    },
    [META_EVENT_HEX.TR_NAME]: () => {
      const trNameLength: number = trackReader.readUint8(1);
      trackReader.addCursor(trNameLength);
    },
    [META_EVENT_HEX.INST]: () => {
      const instLength: number = trackReader.readUint8(1);
      trackReader.addCursor(instLength);
    },
    [META_EVENT_HEX.LYRIC]: () => {
      const lyricLength: number = trackReader.readUint8(1);
      trackReader.addCursor(lyricLength);
    },
    [META_EVENT_HEX.MARKER]: () => {
      const markerLength: number = trackReader.readUint8(1);
      trackReader.addCursor(markerLength);
    },
    [META_EVENT_HEX.CUE]: () => {
      const cueLength: number = trackReader.readUint8(1);
      trackReader.addCursor(cueLength);
    },
    [META_EVENT_HEX.MIDI_CH_PREFIX]: () => {
      trackReader.addCursor(2);
    },
    [META_EVENT_HEX.TEMPO]: () => {
      const tempoLength: number = trackReader.readUint8(1);
      const tempo: number = (trackReader.readUint8(1) << 16) |
        (trackReader.readUint8(1) << 8) |
        trackReader.readUint8(1);
      tempos.push({ bpm: 60 / (tempo * 10 ** (-6)), timing: deltaTime });
    },
    [META_EVENT_HEX.SMPTE]: () => {
      trackReader.addCursor(6);
    },
    [META_EVENT_HEX.TIME_SIG]: () => {
      const beatLength: number = trackReader.readUint8(1);
      const beatNumerator: number = trackReader.readUint8(1);
      const beatDenominator: number = 2 ** trackReader.readUint8(1);
      beats.push({ beat_denominator: beatDenominator, beat_numerator: beatNumerator, timing: deltaTime });
    },
    [META_EVENT_HEX.KEY_SIG]: () => {
      trackReader.addCursor(3);
    },
    [META_EVENT_HEX.SEQ_EVENT]: () => {
      const sequencerLength: number = trackReader.readUint8(1);
      trackReader.addCursor(sequencerLength);
    }
  };

  let activeNotes: ActivateNote[] = [];

  while(true){
    const quotient: number = trackReader.readUint8(1);
    if (quotient >= 0x80) {
      const reminder: number = trackReader.readUint8(1);
      deltaTime += (quotient - 128) * 128 + reminder;
    }
    const statusByte = trackReader.readUint8(1);
    // console.log(statusByte);

    // TODO: この下を実装する
    switch (statusByte) {
      case BYTE_SIGNAL_HEX.META_EVENT: {
        const metaEvent = trackReader.readUint8(1);
        if (metaEvent === META_EVENT_HEX.END_OF_TRACK) {
          // console.log("end of track");
          return { tempos, beats, notes };
        }
        if (metaEventHandlers[metaEvent]) {
          metaEventHandlers[metaEvent]();
        }
        break;
      }
      case BYTE_SIGNAL_HEX.CONTROL_CHANGE: {
        trackReader.addCursor(2);
        break;
      }
      case BYTE_SIGNAL_HEX.PROGRAM_CHANGE: {
        trackReader.addCursor(1);
        break;
      }
      case BYTE_SIGNAL_HEX.PITCH_BEND: {
        trackReader.addCursor(2);
        break;
      }
      case BYTE_SIGNAL_HEX.NOTE_ON: {
        const note: number = trackReader.readUint8(1);
        const velocity: number = trackReader.readUint8(1);
        // note=30が3C(scale=C, octave=3)を基準に
        const octave: Octave = Math.floor((note + 6)/12) as Octave;
        const scale: Scale = ScaleList[(note + 6) % 12];
        activeNotes.push({ scale, octave, timing: deltaTime, velocity });
        break;
      }
      case BYTE_SIGNAL_HEX.NOTE_OFF: {
        const noteOff: number = trackReader.readUint8(1);
        const noteOffVelocity: number = trackReader.readUint8(1);
        const octave: Octave = Math.floor((noteOff + 6)/12) as Octave;
        const scale: Scale = ScaleList[(noteOff + 6) % 12];
        const activeNoteIndex = activeNotes.findIndex((activeNote) => {
          return activeNote.scale === scale && activeNote.octave === octave;
        });
        if (activeNoteIndex !== -1) {
          const activeNote = activeNotes[activeNoteIndex];
          notes.push({
            scale: activeNote.scale,
            octave: activeNote.octave,
            timing: activeNote.timing,
            length: deltaTime - activeNote.timing,
            velocity: activeNote.velocity,
          });
          activeNotes.splice(activeNoteIndex, 1);
        }
        break;
      }
    }
  }
  return { tempos, beats, notes };
};

export const analyze = (smfBinary: SmfBinary): SmfData => {
  const header = getHeader(smfBinary.headerBinary);
  const track: Track = {tempos: [], beats: [], notes: []};
  for (const trackBinary of smfBinary.trackBinarys) {
    const analyzedTrack = getTrack(trackBinary);
    track.tempos.push(...analyzedTrack.tempos);
    track.beats.push(...analyzedTrack.beats);
    track.notes.push(...analyzedTrack.notes);
  }
  return {
    header: header,
    track: track,
  };
};