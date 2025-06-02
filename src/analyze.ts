import { SmfBinary, SmfData, Header, Notes, Beat, Tempo, ActivateNote, Octave, Scale } from "./types";

// MIDIイベントタイプ（上位4ビット）
const MIDI_EVENT_TYPE = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  POLY_KEY_PRESSURE: 0xA0,
  CONTROL_CHANGE: 0xB0,
  PROGRAM_CHANGE: 0xC0,
  CHANNEL_PRESSURE: 0xD0,
  PITCH_BEND: 0xE0,
  META_EVENT: 0xFF,
}

// ビットマスク
const EVENT_TYPE_MASK = 0xF0; // 上位4ビット（イベントタイプ）
const CHANNEL_MASK = 0x0F;    // 下位4ビット（チャンネル）

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

const getHeader = (headerBinary: ArrayBuffer): Header => {
  const headerReader = new BufferReader(headerBinary);
  headerReader.addCursor(8); // skip "MThd" and header length
  const format = headerReader.readUint16(2);
  const tracks = headerReader.readUint16(2);
  const division = headerReader.readUint16(2);
  return { format, tracks, division };
};

const getTrack = (trackBinary: ArrayBuffer): {tempos:Tempo[], beats:Beat[], track:Notes[]} => {
  console.log("getTrack");
  const tempos: Tempo[] = [], beats: Beat[] = [], track: Notes[] = Array.from({ length: 16 }, () => []);
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
    // 可変長数値
    let delta = 0;
    while (true) {
      const byte = trackReader.readUint8(1);
      delta = (delta << 7) | (byte & 0x7F);
      if ((byte & 0x80) === 0) break;
    }
    deltaTime += delta;
    const statusByte = trackReader.readUint8(1);

    // イベントタイプとチャンネルを取得
    const eventType = statusByte & EVENT_TYPE_MASK;
    const channel = statusByte & CHANNEL_MASK;

    if (statusByte === MIDI_EVENT_TYPE.META_EVENT) {
      const metaEvent = trackReader.readUint8(1);
      if (metaEvent === META_EVENT_HEX.END_OF_TRACK) {
      return { tempos, beats, track };
      }
      if (metaEventHandlers[metaEvent]) {
      metaEventHandlers[metaEvent]();
      }
      continue;
    }

    switch (eventType) {
      case MIDI_EVENT_TYPE.CONTROL_CHANGE:
        console.log("control change");
        trackReader.addCursor(2);
        break;
      case MIDI_EVENT_TYPE.PROGRAM_CHANGE:
        console.log("program change");
        trackReader.addCursor(1);
        break;
      case MIDI_EVENT_TYPE.PITCH_BEND:
        console.log("pitch bend");
        trackReader.addCursor(2);
        break;
      case MIDI_EVENT_TYPE.NOTE_OFF: {
        const note: number = trackReader.readUint8(1);
        const noteOffVelocity: number = trackReader.readUint8(1); // 多分使わないけど一応
        const octave: Octave = Math.floor(note/12)-1 as Octave;
        const scale: Scale = ScaleList[note % 12]
        const activeNoteIndex = activeNotes.findIndex((activeNote) => {
          return activeNote.scale === scale && activeNote.octave === octave && activeNote.channel === channel;
        });
          if (activeNoteIndex !== -1) {
            const activeNote = activeNotes[activeNoteIndex];
            track[channel].push({
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
      case MIDI_EVENT_TYPE.NOTE_ON: {
        console.log("NOTE_ON");
        const note: number = trackReader.readUint8(1);
        const velocity: number = trackReader.readUint8(1);
        // note=30(16進数)が3C(scale=C, octave=3)を基準に
        const octave: Octave = Math.floor(note/12)-1 as Octave;
        const scale: Scale = ScaleList[note % 12];
        activeNotes.push({ scale, octave, timing: deltaTime, velocity, channel });
        break;
      }
      default:
        break;
    }
  }
  return { tempos, beats, track };
};

export const analyze = (smfBinary: SmfBinary): SmfData => {
  const header = getHeader(smfBinary.headerBinary);
  const tempos: Tempo[] = [];
  const beats: Beat[] = [];
  const track: Notes[] = Array.from({ length: 16 }, () => []);
  for (const trackBinary of smfBinary.trackBinarys) {
    const analyzedTrack = getTrack(trackBinary);
    tempos.push(...analyzedTrack.tempos);
    beats.push(...analyzedTrack.beats);
    for (let i = 0; i < track.length; i++) {
      track[i].push(...analyzedTrack.track[i]);
    }
  }
  return {
    header: header,
    tempos: tempos,
    beats: beats,
    track: track,
  };
};