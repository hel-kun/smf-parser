import { SmfBinary } from "@/types";

import { promises as fs } from 'fs';
import { join } from 'path';

const readBinary = async (file: File): Promise<ArrayBuffer> => {
  const filePath = join(__dirname, file.name);
  const buffer = await fs.readFile(filePath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

const searchBinary = (buffer: ArrayBuffer, target: Uint8Array): number[] => {
  const bufferArray = new Uint8Array(buffer);
  const positions: number[] = [];
  for (let i = 0; i <= bufferArray.length - target.length; i++) {
    let found = true;
    for (let j = 0; j < target.length; j++) {
      if (bufferArray[i + j] !== target[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      positions.push(i);
    }
  }
  if (positions.length === 0) {
    positions.push(-1);
  }
  return positions;
};

export const parse = async (smfFile: File): Promise<SmfBinary> => {
  const data: SmfBinary = {
    headerBinary: new ArrayBuffer(0),
    trackBinarys: [],
  };

  const buffer: ArrayBuffer = await readBinary(smfFile);

  // parse header
  const headerPoint = searchBinary(buffer, new Uint8Array([0x4d, 0x54, 0x68, 0x64]))[0];
  if (headerPoint === -1) {
    throw new Error("Invalid SMF file");
  }
  const headerLength: number = new DataView(buffer, headerPoint + 4, 4).getUint32(0) + 8;
  data.headerBinary = buffer.slice(headerPoint, headerPoint + headerLength);

  // parse tracks
  const trackPoints: number[] = searchBinary(buffer, new Uint8Array([0x4d, 0x54, 0x72, 0x6b]));
  for (let i = 0; i < trackPoints.length; i++) {
    if (trackPoints[i] === -1) {
      throw new Error("Invalid SMF file");
    }
    const trackLength: number = new DataView(buffer, trackPoints[i] + 4, 4).getUint32(0) + 8;
    data.trackBinarys.push(buffer.slice(trackPoints[i], trackPoints[i] + trackLength));
  }
  
  return {
    headerBinary: data.headerBinary,
    trackBinarys: data.trackBinarys,
  };
};