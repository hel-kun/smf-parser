import { analyze } from '../src/analyze';
import { SmfBinary, SmfData, Header, Notes, Beat, Tempo } from '../src/types';

// モックデータの作成ヘルパー関数
function createMockHeaderBuffer(): ArrayBuffer {
  // "MThd" + length(4) + format(2) + tracks(2) + division(2)
  const buffer = new ArrayBuffer(14);
  const view = new DataView(buffer);
  
  // "MThd" (4D 54 68 64)
  view.setUint8(0, 0x4D);
  view.setUint8(1, 0x54);
  view.setUint8(2, 0x68);
  view.setUint8(3, 0x64);
  
  // length (6)
  view.setUint32(4, 6);
  
  // format (1)
  view.setUint16(8, 1);
  
  // tracks (2)
  view.setUint16(10, 2);
  
  // division (480)
  view.setUint16(12, 480);
  
  return buffer;
}

function createMockTrackBuffer(): ArrayBuffer {
  // "MTrk" + length(4) + delta(1) + NOTE_ON(3) + delta(1) + NOTE_OFF(3) + delta(1) + META_END_OF_TRACK(3)
  const buffer = new ArrayBuffer(21); // 1バイト増やす
  const view = new DataView(buffer);
  
  // "MTrk" (4D 54 72 6B)
  view.setUint8(0, 0x4D);
  view.setUint8(1, 0x54);
  view.setUint8(2, 0x72);
  view.setUint8(3, 0x6B);
  
  // length (12)
  view.setUint32(4, 12);
  
  // delta time (0)
  view.setUint8(8, 0x00);
  
  // NOTE_ON event (0x90, 0x3C, 0x64) - channel 0, note C4, velocity 100
  view.setUint8(9, 0x90);
  view.setUint8(10, 0x3C);
  view.setUint8(11, 0x64);
  
  // delta time (480)
  view.setUint8(12, 0x83);
  view.setUint8(13, 0x60);
  
  // NOTE_OFF event (0x80, 0x3C, 0x00) - channel 0, note C4, velocity 0
  view.setUint8(14, 0x80);
  view.setUint8(15, 0x3C);
  view.setUint8(16, 0x00);
  
  // delta time (0)
  view.setUint8(17, 0x00);
  
  // META_END_OF_TRACK event (0xFF, 0x2F, 0x00)
  view.setUint8(18, 0xFF);
  view.setUint8(19, 0x2F);
  view.setUint8(20, 0x00);
  
  return buffer;
}

function createMockTempoTrackBuffer(): ArrayBuffer {
  // "MTrk" + length(4) + delta(1) + META_TEMPO(5) + delta(1) + META_END_OF_TRACK(3)
  const buffer = new ArrayBuffer(19); // 1バイト増やす
  const view = new DataView(buffer);
  
  // "MTrk" (4D 54 72 6B)
  view.setUint8(0, 0x4D);
  view.setUint8(1, 0x54);
  view.setUint8(2, 0x72);
  view.setUint8(3, 0x6B);
  
  // length (10)
  view.setUint32(4, 10);
  
  // delta time (0)
  view.setUint8(8, 0x00);
  
  // META_TEMPO event (0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20) - 500,000 microseconds per quarter note (120 BPM)
  view.setUint8(9, 0xFF);
  view.setUint8(10, 0x51);
  view.setUint8(11, 0x03);
  view.setUint8(12, 0x07);
  view.setUint8(13, 0xA1);
  view.setUint8(14, 0x20);
  
  // delta time (0)
  view.setUint8(15, 0x00);
  
  // META_END_OF_TRACK event (0xFF, 0x2F, 0x00)
  view.setUint8(16, 0xFF);
  view.setUint8(17, 0x2F);
  view.setUint8(18, 0x00);
  return buffer;
}

describe('analyze', () => {
  let mockSmfBinary: SmfBinary;
  
  beforeEach(() => {
    // テスト前に毎回モックデータを作成
    mockSmfBinary = {
      headerBinary: createMockHeaderBuffer(),
      trackBinarys: [createMockTempoTrackBuffer(), createMockTrackBuffer()]
    };
  });
  
  test('should correctly analyze SMF binary data', () => {
    // analyzeメソッドのテスト
    const result = analyze(mockSmfBinary);
    
    // 期待される結果の検証
    expect(result).toBeDefined();
    expect(result.header).toBeDefined();
    expect(result.header.format).toBe(1);
    expect(result.header.tracks).toBe(2);
    expect(result.header.division).toBe(480);
    
    // トラックデータの検証
    expect(result.track).toBeDefined();
    expect(Array.isArray(result.track)).toBe(true);
    expect(result.track.length).toBe(16); // 16チャンネル分のトラック
    
    // テンポデータの検証
    expect(result.tempos).toBeDefined();
    expect(Array.isArray(result.tempos)).toBe(true);
    
    // 拍子データの検証
    expect(result.beats).toBeDefined();
    expect(Array.isArray(result.beats)).toBe(true);
  });
  
  test('should handle empty track data', () => {
    // 空のトラックデータを持つモックを作成
    const emptyMockSmfBinary: SmfBinary = {
      headerBinary: createMockHeaderBuffer(),
      trackBinarys: []
    };
    
    const result = analyze(emptyMockSmfBinary);
    
    // ヘッダーは正しく解析されるべき
    expect(result.header).toBeDefined();
    expect(result.header.format).toBe(1);
    expect(result.header.tracks).toBe(2);
    expect(result.header.division).toBe(480);
    
    // トラックデータは空の配列になるべき
    expect(result.track).toBeDefined();
    expect(Array.isArray(result.track)).toBe(true);
    expect(result.track.length).toBe(16); // 16チャンネル分のトラック
    
    // 各チャンネルは空の配列になるべき
    for (let i = 0; i < 16; i++) {
      expect(result.track[i]).toEqual([]);
    }
    
    // テンポデータと拍子データも空の配列になるべき
    expect(result.tempos).toEqual([]);
    expect(result.beats).toEqual([]);
  });
});