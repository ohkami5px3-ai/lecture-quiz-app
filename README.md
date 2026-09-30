# 講義用リアルタイムクイズアプリ

大学・高校の講義で使える、リアルタイムクイズ＆感想共有Webアプリです。

参加者がスマホやPCからアクセスし、講師が出題したクイズにリアルタイムで回答したり、感想を共有できます。

## 特徴

- リアルタイム同期（WebSocket / Socket.IO）
- 2〜4択のクイズ出題・回答・集計・結果発表
- フリーテキストの感想共有
- 個人情報不要（ニックネームのみ・任意）
- シンプルなUI（モバイル・PC両対応）
- サーバー再起動でデータクリア（永続化なし）

## 必要環境

- Node.js 18以上

## セットアップ

```bash
git clone https://github.com/<ユーザー名>/lecture-quiz-app.git
cd lecture-quiz-app
npm install
```

## 起動

```bash
npm start
```

ブラウザで http://localhost:3000 にアクセスしてください。

## 使い方

1. 講師が `npm start` でサーバーを起動
2. 講師がブラウザでアクセスし「出題者として始める」を選択
3. 参加者が各自の端末から同じURLにアクセスし「参加者として始める」を選択
4. 講師がクイズを作成・出題 → 参加者の画面にリアルタイム表示
5. 参加者が回答 → 講師の画面にリアルタイム集計
6. 講師が「結果発表」→ 全員に正解と集計結果を表示
7. 感想を投稿 → 全員の画面にリアルタイム反映

## 同一ネットワーク内での利用

講師PCのIPアドレスを共有すれば、同じネットワーク内の端末からアクセスできます。

```
http://192.168.x.x:3000
```

## インターネット公開（Render）

このアプリはNode.jsサーバーが必要なため、GitHub Pagesでは動作しません。
Render などのNode.js対応ホスティングにデプロイしてください。

1. https://render.com にGitHubアカウントでログイン
2. 「New +」→「Web Service」を選択
3. このリポジトリを選択
4. 設定（`render.yaml` があれば自動認識）:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 「Create Web Service」でデプロイ開始
6. 完了後、`https://<アプリ名>.onrender.com` で公開

※ 無料プランは一定時間アクセスがないとスリープします。次回アクセス時に起動まで数十秒かかります。

## 技術構成

- サーバー: Node.js + Express + Socket.IO
- クライアント: HTML / CSS / JavaScript（フレームワークなし）

## ライセンス

MIT
