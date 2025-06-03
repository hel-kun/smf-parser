# SMF-Parser

SMF-Parser（Standard MIDI File Parser）は、MIDIファイルを解析して再生するためのTypeScriptライブラリです。

## 機能

- **パース**: MIDIファイル（.mid）をバイナリデータとして読み込み、解析可能な形式に変換
- **解析**: MIDIデータを音符、テンポ、拍子などの音楽情報に変換
- **再生**: 解析されたMIDIデータをブラウザのWeb Audio APIを使用して再生

## インストール

npmを使用してインストールできます：

```bash
npm install smf-parser
```

## 使用方法

### MIDIファイルのパースと解析

```typescript
import { parse, analyze } from 'smf-parser';

// ファイル選択イベントなどからFileオブジェクトを取得
const file = event.target.files[0];

// MIDIファイルをパースして解析
async function processMidiFile(file) {
  try {
    // ファイルをパース
    const smfBinary = await parse(file);
    
    // パースされたデータを解析
    const smfData = analyze(smfBinary);
    
    console.log('MIDI情報:', smfData);
    // smfDataには以下の情報が含まれます：
    // - header: フォーマット、トラック数、分解能
    // - tempos: テンポ情報の配列
    // - beats: 拍子情報の配列
    // - track: 16チャンネル分の音符情報
  } catch (error) {
    console.error('MIDIファイルの処理中にエラーが発生しました:', error);
  }
}
```

### MIDIデータの再生

```typescript
import { parse, analyze, SmfPlayer } from 'smf-parser';

async function playMidiFile(file) {
  try {
    // ファイルをパースして解析
    const smfBinary = await parse(file);
    const smfData = analyze(smfBinary);
    
    // プレイヤーを作成
    const player = new SmfPlayer(smfData);
    
    // 再生開始
    player.play();
    
    // 一時停止
    // player.pause();
    
    // 再開
    // player.resume();
    
    // 停止
    // player.stop();
  } catch (error) {
    console.error('MIDIファイルの再生中にエラーが発生しました:', error);
  }
}
```

## API

### `parse(file: File): Promise<SmfBinary>`

MIDIファイルをパースし、バイナリデータを返します。

### `analyze(smfBinary: SmfBinary): SmfData`

パースされたバイナリデータを解析し、音楽情報を含むオブジェクトを返します。

### SmfPlayer

MIDIデータを再生するためのクラス。

- **constructor(smfData: SmfData)**: プレイヤーを初期化
- **play()**: 再生を開始
- **pause()**: 再生を一時停止
- **resume()**: 一時停止した再生を再開
- **stop()**: 再生を停止

## 型定義

```typescript
// SMFのバイナリデータ
type SmfBinary = {
  headerBinary: ArrayBuffer;
  trackBinarys: ArrayBuffer[];
}

// 解析されたSMFデータ
type SmfData = {
  header: Header;
  tempos: Tempo[];
  beats: Beat[];
  track: Notes[];
}

// その他の型定義は、ライブラリをインポートして参照してください
```

## 開発

### 前提条件

- Node.js (v14以上)
- npm (v6以上)

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/smf-parser.git
cd smf-parser

# 依存関係をインストール
npm install

# ビルド
npm run build

# テスト
npm test
```