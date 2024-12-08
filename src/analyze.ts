import { SmfBinary, SmfData, Header } from "./types";

class BufferReader {
  private buffer: ArrayBuffer;
  private cursor: number;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.cursor = 0;
  }

  readUint16(length: number): number {
    const newUint16 = new DataView(this.buffer, this.cursor, length).getUint16(0);
    this.cursor += length;
    return newUint16;
  }

  readUint8(length: number): number {
    const newUint8 = new DataView(this.buffer, this.cursor, length).getUint8(0);
    this.cursor += length;
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

export const analyze = (smfBinary: SmfBinary): SmfData => {
  const header = getHeader(smfBinary.headerBinary);
  return {
    header,
    tracks: {
      tempos: [],
      beats: [],
      notes: [],
    }
  };
};