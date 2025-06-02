import { SmfData, Note } from './types';

export class SmfPlayer {
  private smfData: SmfData;
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private scheduledNotes: Map<number, { oscillator: OscillatorNode, gain: GainNode }> = new Map();
  private noteToFrequency: Map<string, number> = new Map();

  constructor(smfData: SmfData) {
    this.smfData = smfData;
    this.initNoteToFrequency();
  }

  private initNoteToFrequency() {
    const baseFrequency = 440; // A4の周波数
    const scales = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    
    for (let octave = -1; octave <= 9; octave++) {
      for (let i = 0; i < scales.length; i++) {
        const n = (octave - 4) * 12 + i - 9; // A4からの半音数
        const freq = baseFrequency * Math.pow(2, n / 12);
        this.noteToFrequency.set(`${scales[i]}${octave}`, freq);
      }
    }
  }

  private playNote(note: Note, startTime: number) {
    if (!this.audioContext) return;

    const division = this.smfData.header.division;
    const tempos = this.smfData.tempos;
    const tempo = tempos.reduce((prev, curr) => {
      return curr.timing <= note.timing ? curr.bpm : prev;
    }, tempos[0].bpm);

    const noteKey = `${note.scale}${note.octave}`;
    const noteStartTime = startTime + note.timing*60/(tempo*division);
    const noteEndTime = noteStartTime + note.length*60/(tempo*division);
    const gainValue = note.velocity / 127 * 0.3;
    const frequency = this.noteToFrequency.get(noteKey);
    
    if (!frequency) {
      console.warn(`Unknown note: ${noteKey}`);
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(gainValue, noteStartTime);
    gainNode.gain.exponentialRampToValueAtTime(0.05, noteEndTime - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, noteEndTime);

    // オシレーター -> ゲイン -> 出力
    oscillator.connect(gainNode).connect(this.audioContext.destination);

    oscillator.start(noteStartTime);
    oscillator.stop(noteEndTime);

    const id = Date.now() + Math.random();
    this.scheduledNotes.set(id, { oscillator, gain: gainNode });

    oscillator.onended = () => {
      this.scheduledNotes.delete(id);
    };
  }

  play() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    } else if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;

    // すべての音符をスケジュール
    this.smfData.track.forEach((notes, idx) => {
      if (idx === 9) return; // ドラムパートはスキップ
      notes.forEach(n => {
      this.playNote(n, this.startTime);
      });
    });

    console.log('再生開始');
  }

  pause() {
    if (!this.isPlaying || !this.audioContext) return;

    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.audioContext.suspend();
    this.isPlaying = false;

    console.log('一時停止');
  }

  resume() {
    if (this.isPlaying || !this.audioContext) return;

    this.audioContext.resume();
    this.startTime = this.audioContext.currentTime - this.pauseTime;
    this.isPlaying = true;

    console.log('再開');
  }

  stop() {
    if (!this.audioContext) return;

    // すべてのスケジュールされた音を停止
    this.scheduledNotes.forEach(({ oscillator, gain }) => {
      try {
        oscillator.stop();
        oscillator.disconnect();
        gain.disconnect();
      } catch (e) {
        // すでに停止している場合はエラーが発生するので無視
      }
    });

    this.scheduledNotes.clear();
    this.isPlaying = false;
    this.pauseTime = 0;

    // AudioContextを閉じる
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('停止');
  }
}
