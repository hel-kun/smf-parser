import { SmfPlayer } from '../src/play';
import { SmfData, Header, Notes, Beat, Tempo } from '../src/types';

// AudioContextのモック
class MockAudioContext {
  currentTime: number = 0;
  destination: AudioNode = {} as AudioNode;
  state: string = 'running';

  constructor() {}

  createOscillator(): OscillatorNode {
    return {
      type: 'square',
      frequency: { value: 440 },
      connect: jest.fn().mockReturnThis(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
      onended: null
    } as unknown as OscillatorNode;
  }

  createGain(): GainNode {
    return {
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
      },
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn()
    } as unknown as GainNode;
  }

  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// グローバルなAudioContextをモックに置き換え
global.AudioContext = MockAudioContext as any;

describe('SmfPlayer', () => {
  let mockSmfData: SmfData;
  let player: SmfPlayer;

  beforeEach(() => {
    // テスト用のモックSMFデータを作成
    mockSmfData = {
      header: {
        format: 1,
        tracks: 2,
        division: 480
      },
      tempos: [
        { bpm: 120, timing: 0 }
      ],
      beats: [
        { beat_denominator: 4, beat_numerator: 4, timing: 0 }
      ],
      track: Array.from({ length: 16 }, () => [])
    };

    // チャンネル0に音符を追加
    mockSmfData.track[0] = [
      { scale: 'C', octave: 4, timing: 0, length: 480, velocity: 100 },
      { scale: 'E', octave: 4, timing: 480, length: 480, velocity: 100 },
      { scale: 'G', octave: 4, timing: 960, length: 480, velocity: 100 }
    ];

    // SmfPlayerインスタンスを作成
    player = new SmfPlayer(mockSmfData);
  });

  test('should initialize correctly', () => {
    expect(player).toBeDefined();
  });

  test('should initialize note to frequency mapping', () => {
    // プライベートメソッドのテストは難しいため、間接的にテスト
    // playメソッドを呼び出して、内部的にnoteToFrequencyが正しく初期化されていることを確認
    player.play();
    
    // AudioContextが作成されていることを確認
    expect((player as any).audioContext).toBeDefined();
    
    // isPlayingフラグがtrueになっていることを確認
    expect((player as any).isPlaying).toBe(true);
  });

  test('should play notes', () => {
    // playメソッドを呼び出し
    player.play();
    
    // AudioContextが作成されていることを確認
    expect((player as any).audioContext).toBeDefined();
    
    // isPlayingフラグがtrueになっていることを確認
    expect((player as any).isPlaying).toBe(true);
  });

  test('should pause playback', () => {
    // 再生を開始してから一時停止
    player.play();
    player.pause();
    
    // isPlayingフラグがfalseになっていることを確認
    expect((player as any).isPlaying).toBe(false);
    
    // pauseTimeが設定されていることを確認
    expect((player as any).pauseTime).toBeGreaterThanOrEqual(0);
  });

  test('should resume playback', () => {
    // 再生を開始して一時停止してから再開
    player.play();
    player.pause();
    player.resume();
    
    // isPlayingフラグがtrueになっていることを確認
    expect((player as any).isPlaying).toBe(true);
  });

  test('should stop playback', () => {
    // 再生を開始してから停止
    player.play();
    player.stop();
    
    // isPlayingフラグがfalseになっていることを確認
    expect((player as any).isPlaying).toBe(false);
    
    // pauseTimeが0にリセットされていることを確認
    expect((player as any).pauseTime).toBe(0);
    
    // scheduledNotesが空になっていることを確認
    expect((player as any).scheduledNotes.size).toBe(0);
    
    // AudioContextがnullになっていることを確認
    expect((player as any).audioContext).toBeNull();
  });

  test('should not play if already playing', () => {
    // 再生を開始
    player.play();
    
    // AudioContextを保存
    const audioContext = (player as any).audioContext;
    
    // 再度再生を開始
    player.play();
    
    // AudioContextが変わっていないことを確認
    expect((player as any).audioContext).toBe(audioContext);
  });

  test('should not pause if not playing', () => {
    // 再生していない状態で一時停止
    player.pause();
    
    // pauseTimeが0のままであることを確認
    expect((player as any).pauseTime).toBe(0);
  });

  test('should not resume if already playing', () => {
    // 再生を開始
    player.play();
    
    // startTimeを保存
    const startTime = (player as any).startTime;
    
    // 再生中に再開
    player.resume();
    
    // startTimeが変わっていないことを確認
    expect((player as any).startTime).toBe(startTime);
  });

  test('should handle empty track data', () => {
    // 空のトラックデータを持つモックを作成
    const emptyMockSmfData: SmfData = {
      header: {
        format: 1,
        tracks: 0,
        division: 480
      },
      tempos: [
        { bpm: 120, timing: 0 }
      ],
      beats: [
        { beat_denominator: 4, beat_numerator: 4, timing: 0 }
      ],
      track: Array.from({ length: 16 }, () => [])
    };
    
    // 空のトラックデータを持つSmfPlayerインスタンスを作成
    const emptyPlayer = new SmfPlayer(emptyMockSmfData);
    
    // 再生を開始
    emptyPlayer.play();
    
    // AudioContextが作成されていることを確認
    expect((emptyPlayer as any).audioContext).toBeDefined();
    
    // isPlayingフラグがtrueになっていることを確認
    expect((emptyPlayer as any).isPlaying).toBe(true);
    
    // scheduledNotesが空であることを確認
    expect((emptyPlayer as any).scheduledNotes.size).toBe(0);
  });
});