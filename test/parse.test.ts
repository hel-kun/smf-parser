import { parse } from '../src/parse';
import { SmfBinary } from '../src/types';

// モックのFileReaderを作成
class MockFileReader {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  result: ArrayBuffer | null = null;

  readAsArrayBuffer(file: File): void {
    // モックの実装
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

// グローバルなFileReaderをモックに置き換え
global.FileReader = MockFileReader as any;

describe('parse', () => {
  // searchBinary関数のテスト
  describe('searchBinary', () => {
    // searchBinaryはプライベート関数なので、parseモジュール内部でテストする必要があります
    // ここでは間接的にテストします
    
    test('should find pattern in binary data', async () => {
      // モックのArrayBufferを作成 - バッファサイズをさらに増やす
      const buffer = new ArrayBuffer(24);
      const view = new DataView(buffer);
      
      // パターン "MThd" (0x4D, 0x54, 0x68, 0x64) を設定
      view.setUint8(0, 0x4D);
      view.setUint8(1, 0x54);
      view.setUint8(2, 0x68);
      view.setUint8(3, 0x64);
      // ヘッダー長を設定
      view.setUint32(4, 6);
      
      // パターン "MTrk" (0x4D, 0x54, 0x72, 0x6B) を設定
      view.setUint8(14, 0x4D);
      view.setUint8(15, 0x54);
      view.setUint8(16, 0x72);
      view.setUint8(17, 0x6B);
      // トラック長を設定
      view.setUint32(18, 0);
      
      // モックのFileオブジェクトを作成
      const mockFile = new File([buffer], 'test.mid', { type: 'audio/midi' });
      
      // FileReaderのモックを設定
      const originalFileReader = global.FileReader;
      global.FileReader = class extends MockFileReader {
        readAsArrayBuffer(file: File): void {
          this.result = buffer;
          if (this.onload) {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }
      } as any;
      
      try {
        // parse関数を呼び出し
        const result = await parse(mockFile);
        
        // 結果を検証
        expect(result).toBeDefined();
        expect(result.headerBinary).toBeDefined();
        expect(result.trackBinarys).toBeDefined();
        expect(result.trackBinarys.length).toBe(1);
      } finally {
        // テスト後にFileReaderを元に戻す
        global.FileReader = originalFileReader;
      }
    });
    
    test('should throw error if header not found', async () => {
      // ヘッダーのないモックのArrayBufferを作成
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      
      // "MTrk" だけを設定 (ヘッダーなし)
      view.setUint8(0, 0x4D);
      view.setUint8(1, 0x54);
      view.setUint8(2, 0x72);
      view.setUint8(3, 0x6B);
      
      // モックのFileオブジェクトを作成
      const mockFile = new File([buffer], 'test.mid', { type: 'audio/midi' });
      
      // FileReaderのモックを設定
      const originalFileReader = global.FileReader;
      global.FileReader = class extends MockFileReader {
        readAsArrayBuffer(file: File): void {
          this.result = buffer;
          if (this.onload) {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }
      } as any;
      
      try {
        // parse関数を呼び出し、エラーが発生することを期待
        await expect(parse(mockFile)).rejects.toThrow('Invalid SMF file');
      } finally {
        // テスト後にFileReaderを元に戻す
        global.FileReader = originalFileReader;
      }
    });
  });
  
  // readBinary関数のテスト
  describe('readBinary', () => {
    test('should read file as ArrayBuffer', async () => {
      // モックのArrayBufferを作成
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, 0x12345678);
      
      // モックのFileオブジェクトを作成
      const mockFile = new File([buffer], 'test.bin', { type: 'application/octet-stream' });
      
      // FileReaderのモックを設定
      const originalFileReader = global.FileReader;
      global.FileReader = class extends MockFileReader {
        readAsArrayBuffer(file: File): void {
          this.result = buffer;
          if (this.onload) {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }
      } as any;
      
      try {
        // readBinaryは直接テストできないため、parse関数を通じてテスト
        const result = await parse(mockFile);
        
        // 結果を検証
        expect(result).toBeDefined();
      } catch (e) {
        // ヘッダーがないためエラーが発生するが、readBinaryは正常に動作している
        expect((e as Error).message).toBe('Invalid SMF file');
      } finally {
        // テスト後にFileReaderを元に戻す
        global.FileReader = originalFileReader;
      }
    });
    
    test('should handle FileReader error', async () => {
      // モックのFileオブジェクトを作成
      const mockFile = new File([], 'test.bin', { type: 'application/octet-stream' });
      
      // FileReaderのモックを設定（エラーを発生させる）
      const originalFileReader = global.FileReader;
      global.FileReader = class extends MockFileReader {
        readAsArrayBuffer(file: File): void {
          if (this.onerror) {
            setTimeout(() => {
              if (this.onerror) this.onerror();
            }, 0);
          }
        }
      } as any;
      
      try {
        // parse関数を呼び出し、エラーが発生することを期待
        await expect(parse(mockFile)).rejects.toThrow('Error reading file');
      } finally {
        // テスト後にFileReaderを元に戻す
        global.FileReader = originalFileReader;
      }
    });
  });
  
  // parse関数の総合テスト
  describe('parse function', () => {
    test('should parse valid SMF file', async () => {
      // 有効なSMFファイルのモックを作成
      const buffer = new ArrayBuffer(30);
      const view = new DataView(buffer);
      
      // "MThd" + length(4) + format(2) + tracks(2) + division(2)
      view.setUint8(0, 0x4D); // M
      view.setUint8(1, 0x54); // T
      view.setUint8(2, 0x68); // h
      view.setUint8(3, 0x64); // d
      view.setUint32(4, 6);   // ヘッダー長
      view.setUint16(8, 1);   // フォーマット
      view.setUint16(10, 1);  // トラック数
      view.setUint16(12, 480); // 分解能
      
      // "MTrk" + length(4) + イベントデータ
      view.setUint8(14, 0x4D); // M
      view.setUint8(15, 0x54); // T
      view.setUint8(16, 0x72); // r
      view.setUint8(17, 0x6B); // k
      view.setUint32(18, 8);   // トラック長
      
      // 簡単なイベントデータ（END OF TRACK）
      view.setUint8(22, 0x00); // デルタタイム
      view.setUint8(23, 0xFF); // メタイベント
      view.setUint8(24, 0x2F); // END OF TRACK
      view.setUint8(25, 0x00); // 長さ
      
      // モックのFileオブジェクトを作成
      const mockFile = new File([buffer], 'test.mid', { type: 'audio/midi' });
      
      // FileReaderのモックを設定
      const originalFileReader = global.FileReader;
      global.FileReader = class extends MockFileReader {
        readAsArrayBuffer(file: File): void {
          this.result = buffer;
          if (this.onload) {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }
      } as any;
      
      try {
        // parse関数を呼び出し
        const result = await parse(mockFile);
        
        // 結果を検証
        expect(result).toBeDefined();
        expect(result.headerBinary).toBeDefined();
        expect(result.trackBinarys).toBeDefined();
        expect(result.trackBinarys.length).toBe(1);
        
        // ヘッダーバイナリの検証
        const headerView = new DataView(result.headerBinary);
        expect(headerView.getUint8(0)).toBe(0x4D); // M
        expect(headerView.getUint8(1)).toBe(0x54); // T
        expect(headerView.getUint8(2)).toBe(0x68); // h
        expect(headerView.getUint8(3)).toBe(0x64); // d
        
        // トラックバイナリの検証
        const trackView = new DataView(result.trackBinarys[0]);
        expect(trackView.getUint8(0)).toBe(0x4D); // M
        expect(trackView.getUint8(1)).toBe(0x54); // T
        expect(trackView.getUint8(2)).toBe(0x72); // r
        expect(trackView.getUint8(3)).toBe(0x6B); // k
      } finally {
        // テスト後にFileReaderを元に戻す
        global.FileReader = originalFileReader;
      }
    });
  });
});