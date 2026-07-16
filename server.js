const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 静的ファイル配信
app.use(express.static(path.join(__dirname, 'public')));

// サーバー状態（メモリ上のみ、永続化なし）
const state = {
  participants: new Map(),  // socketId → { nickname, mode }
  currentQuiz: null,        // { question, choices, correctIndex, isRevealed }
  responses: new Map(),     // socketId → choiceIndex
  comments: []              // [{ nickname, text, timestamp }]
};

// 参加者数を計算して全員に通知
function broadcastParticipantCount() {
  let count = 0;
  for (const p of state.participants.values()) {
    if (p.mode === 'participant') count++;
  }
  io.emit('participants:update', { count });
}

// 回答集計を計算
function calculateTally() {
  const quiz = state.currentQuiz;
  if (!quiz) return [];
  const tally = new Array(quiz.choices.length).fill(0);
  for (const choiceIndex of state.responses.values()) {
    if (choiceIndex >= 0 && choiceIndex < tally.length) {
      tally[choiceIndex]++;
    }
  }
  return tally;
}

io.on('connection', (socket) => {
  console.log(`接続: ${socket.id}`);

  // 入室
  socket.on('join', ({ nickname, mode }) => {
    const name = nickname && nickname.trim() ? nickname.trim() : '匿名ユーザー';
    state.participants.set(socket.id, { nickname: name, mode });
    console.log(`入室: ${name} (${mode})`);
    broadcastParticipantCount();

    // 現在のクイズ状態を送信（途中参加対応）
    if (state.currentQuiz) {
      if (state.currentQuiz.isRevealed) {
        socket.emit('quiz:result', {
          question: state.currentQuiz.question,
          choices: state.currentQuiz.choices,
          correctIndex: state.currentQuiz.correctIndex,
          tally: calculateTally()
        });
      } else {
        socket.emit('quiz:start', {
          question: state.currentQuiz.question,
          choices: state.currentQuiz.choices
        });
      }
    }

    // 既存の感想一覧を送信
    if (state.comments.length > 0) {
      socket.emit('comment:list', state.comments);
    }
  });

  // クイズ作成・出題
  socket.on('quiz:create', ({ question, choices, correctIndex }) => {
    state.currentQuiz = {
      question,
      choices,
      correctIndex,
      isRevealed: false
    };
    state.responses.clear();
    console.log(`出題: ${question}`);

    // 全参加者にクイズ配信
    io.emit('quiz:start', { question, choices });
  });

  // クイズ回答
  socket.on('quiz:answer', ({ choiceIndex }) => {
    const participant = state.participants.get(socket.id);
    if (!participant || !state.currentQuiz || state.currentQuiz.isRevealed) return;

    // 既に回答済みの場合は無視
    if (state.responses.has(socket.id)) return;

    state.responses.set(socket.id, choiceIndex);
    console.log(`回答: ${participant.nickname} → 選択肢${choiceIndex + 1}`);

    // 集計を出題者に配信
    const tally = calculateTally();
    io.emit('quiz:tally', { tally });
  });

  // 結果発表
  socket.on('quiz:reveal', () => {
    if (!state.currentQuiz) return;
    state.currentQuiz.isRevealed = true;
    const tally = calculateTally();
    console.log(`結果発表: 正解は選択肢${state.currentQuiz.correctIndex + 1}`);

    io.emit('quiz:result', {
      question: state.currentQuiz.question,
      choices: state.currentQuiz.choices,
      correctIndex: state.currentQuiz.correctIndex,
      tally
    });
  });

  // クイズリセット
  socket.on('quiz:reset', () => {
    state.currentQuiz = null;
    state.responses.clear();
    console.log('クイズリセット');
    io.emit('quiz:cleared');
  });

  // 感想投稿
  socket.on('comment:post', ({ text }) => {
    const participant = state.participants.get(socket.id);
    if (!participant || !text || !text.trim()) return;

    const comment = {
      nickname: participant.nickname,
      text: text.trim(),
      timestamp: Date.now()
    };
    state.comments.push(comment);
    console.log(`感想: ${participant.nickname} - ${comment.text}`);

    // 全員に配信
    io.emit('comment:new', comment);
  });

  // 切断
  socket.on('disconnect', () => {
    const participant = state.participants.get(socket.id);
    if (participant) {
      console.log(`退室: ${participant.nickname}`);
    }
    state.participants.delete(socket.id);
    state.responses.delete(socket.id);
    broadcastParticipantCount();
  });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================`);
  console.log(`  講義用クイズアプリ起動中`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`====================================`);
});
