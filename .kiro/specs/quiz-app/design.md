# 講義用リアルタイムクイズ＆感想共有Webアプリ — 設計

## アーキテクチャ

```
┌─────────────┐     WebSocket      ┌──────────────┐
│  クライアント  │ ◄──────────────► │  Node.js     │
│  (ブラウザ)   │   Socket.IO      │  サーバー     │
└─────────────┘                    └──────────────┘
       ↑                                  │
       │         HTTP (静的配信)           │
       └──────────────────────────────────┘
```

- **サーバー**: Node.js + Express + Socket.IO
  - 静的ファイル配信（`public/index.html`）
  - WebSocket によるリアルタイム通信ハブ
  - メモリ上でクイズ状態・回答・感想を管理

- **クライアント**: `public/index.html`（単一ファイル）
  - Socket.IO クライアント（サーバーから自動配信される `/socket.io/socket.io.js` を使用）
  - バニラJS でUI操作

## Socket.IO イベント設計

### クライアント → サーバー

| イベント名 | データ | 説明 |
|-----------|--------|------|
| `join` | `{ nickname, mode }` | 入室 |
| `quiz:create` | `{ question, choices, correctIndex }` | クイズ作成・出題 |
| `quiz:answer` | `{ choiceIndex }` | クイズ回答 |
| `quiz:reveal` | — | 結果発表 |
| `quiz:reset` | — | クイズリセット |
| `comment:post` | `{ text }` | 感想投稿 |

### サーバー → クライアント

| イベント名 | データ | 説明 |
|-----------|--------|------|
| `participants:update` | `{ count }` | 参加者数更新 |
| `quiz:start` | `{ question, choices }` | クイズ開始通知 |
| `quiz:tally` | `{ tally: [count, ...] }` | 回答集計更新 |
| `quiz:result` | `{ correctIndex, tally }` | 結果発表 |
| `quiz:cleared` | — | クイズリセット通知 |
| `comment:new` | `{ nickname, text, timestamp }` | 新規感想通知 |
| `comment:list` | `[{ nickname, text, timestamp }, ...]` | 感想一覧（入室時） |

## データ構造（サーバーサイド）

```javascript
// サーバー状態
const state = {
  participants: new Map(),  // socketId → { nickname, mode }
  currentQuiz: null,        // { question, choices, correctIndex, isRevealed }
  responses: new Map(),     // socketId → choiceIndex
  comments: []              // [{ nickname, text, timestamp }]
};
```

## ファイル構成

```
project/
├── server.js           # Node.js サーバー
├── package.json        # 依存定義・起動スクリプト
└── public/
    └── index.html      # クライアントUI（HTML/CSS/JS一体）
```

## UI デザイン方針

- カラースキーム: 青系ベース（#2563eb をアクセントカラー）
- フォントサイズ: プロジェクター表示考慮で大きめ（本文18px〜）
- ボタン: タッチ操作しやすい大きめサイズ（最小48px高）
- レスポンシブ: Flexbox ベース、モバイルファースト
- 棒グラフ: CSS width% + transition アニメーション
