/* ==============================================
   DMA GAME ZONE — games.js
   Games: Tic Tac Toe · Memory Match · Word Scramble
   ============================================== */

'use strict';

/* ─────────────────────────────────────
   GAME HUB NAVIGATION
───────────────────────────────────── */
window.openGame = function(gameId) {
  document.getElementById('gameHub').style.display = 'none';
  document.querySelectorAll('.game-arena').forEach(a => a.classList.remove('active'));
  const arena = document.getElementById('arena-' + gameId);
  if (arena) arena.classList.add('active');

  if (gameId === 'tictactoe') tttInit();
  if (gameId === 'memory') memoryInit();
  if (gameId === 'scramble') wsInit();
};

window.closeGame = function() {
  document.querySelectorAll('.game-arena').forEach(a => a.classList.remove('active'));
  document.getElementById('gameHub').style.display = 'block';
  clearInterval(memTimer);
  clearInterval(wsTimerInt);
};

/* ══════════════════════════════════════════
   GAME 1: TIC TAC TOE
   ══════════════════════════════════════════ */
const ttt = {
  board: Array(9).fill(null),
  current: 'X',
  mode: 'ai', // 'ai' or '2p'
  gameOver: false,
  scores: { X: 0, O: 0, D: 0 },
  wins: [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
};

function tttInit() {
  ttt.board = Array(9).fill(null);
  ttt.current = 'X';
  ttt.gameOver = false;
  document.querySelectorAll('.ttt-cell').forEach(c => {
    c.textContent = '';
    c.classList.remove('taken','x-mark','o-mark','winner');
    c.style.pointerEvents = 'auto';
  });
  tttUpdateStatus('Your turn! Tap a square ☝️');
  tttUpdatePlayerUI();
}

window.setTTTMode = function(mode) {
  ttt.mode = mode;
  const aiBtn = document.getElementById('tttModeAI');
  const tpBtn = document.getElementById('tttMode2P');
  const p2Label = document.getElementById('tttP2');
  if (mode === 'ai') {
    aiBtn.className = 'btn btn-sm'; aiBtn.style.background = 'var(--primary)'; aiBtn.style.color = '#fff';
    tpBtn.className = 'btn btn-outline btn-sm'; tpBtn.style.cssText = '';
    p2Label.textContent = '⭕ AI (O)';
  } else {
    aiBtn.className = 'btn btn-outline btn-sm'; aiBtn.style.cssText = '';
    tpBtn.className = 'btn btn-sm'; tpBtn.style.background = 'var(--primary)'; tpBtn.style.color = '#fff';
    p2Label.textContent = '⭕ Player 2 (O)';
  }
  tttInit();
};

window.tttMove = function(index) {
  if (ttt.gameOver || ttt.board[index]) return;
  if (ttt.mode === 'ai' && ttt.current === 'O') return;

  placeMark(index, ttt.current);

  const winner = tttCheckWinner();
  if (winner) return;
  if (ttt.board.every(c => c)) return tttDraw();

  ttt.current = ttt.current === 'X' ? 'O' : 'X';
  tttUpdatePlayerUI();

  if (ttt.mode === 'ai' && ttt.current === 'O') {
    tttUpdateStatus('AI is thinking...');
    document.querySelectorAll('.ttt-cell').forEach(c => c.style.pointerEvents = 'none');
    setTimeout(() => {
      const move = tttAIMove();
      placeMark(move, 'O');
      const w = tttCheckWinner();
      if (!w && !ttt.board.every(c => c)) {
        ttt.current = 'X';
        tttUpdatePlayerUI();
        tttUpdateStatus('Your turn! Tap a square ☝️');
        document.querySelectorAll('.ttt-cell:not(.taken)').forEach(c => c.style.pointerEvents = 'auto');
      }
    }, 600);
  } else {
    tttUpdateStatus(ttt.current === 'X' ? '❌ X\'s turn!' : '⭕ O\'s turn!');
  }
};

function placeMark(index, mark) {
  ttt.board[index] = mark;
  const cell = document.querySelector(`.ttt-cell[data-index="${index}"]`);
  cell.textContent = mark === 'X' ? '✕' : '○';
  cell.classList.add('taken', mark === 'X' ? 'x-mark' : 'o-mark');
}

function tttAIMove() {
  // Minimax AI
  let best = -Infinity, bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!ttt.board[i]) {
      ttt.board[i] = 'O';
      const score = minimax(ttt.board, 0, false);
      ttt.board[i] = null;
      if (score > best) { best = score; bestMove = i; }
    }
  }
  return bestMove;
}

function minimax(board, depth, isMax) {
  const w = tttCheckBoard(board);
  if (w === 'O') return 10 - depth;
  if (w === 'X') return depth - 10;
  if (board.every(c => c)) return 0;
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) { board[i] = 'O'; best = Math.max(best, minimax(board, depth+1, false)); board[i] = null; }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) { board[i] = 'X'; best = Math.min(best, minimax(board, depth+1, true)); board[i] = null; }
    }
    return best;
  }
}

function tttCheckBoard(board) {
  for (const [a,b,c] of ttt.wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function tttCheckWinner() {
  for (const [a,b,c] of ttt.wins) {
    if (ttt.board[a] && ttt.board[a] === ttt.board[b] && ttt.board[a] === ttt.board[c]) {
      const winner = ttt.board[a];
      [a,b,c].forEach(i => document.querySelector(`.ttt-cell[data-index="${i}"]`).classList.add('winner'));
      ttt.gameOver = true;
      ttt.scores[winner]++;
      updateTTTScores();
      document.querySelectorAll('.ttt-cell').forEach(c => c.style.pointerEvents = 'none');
      const msg = winner === 'X'
        ? (ttt.mode === 'ai' ? '🎉 You win! Amazing!' : '🎉 X wins!')
        : (ttt.mode === 'ai' ? '🤖 AI wins! Try again!' : '🎉 O wins!');
      tttUpdateStatus(msg);
      if (winner === 'X' || (winner === 'O' && ttt.mode === '2p')) spawnConfetti();
      return true;
    }
  }
  return false;
}

function tttDraw() {
  ttt.gameOver = true;
  ttt.scores.D++;
  updateTTTScores();
  tttUpdateStatus("🤝 It's a draw! Well played!");
  document.querySelectorAll('.ttt-cell').forEach(c => c.style.pointerEvents = 'none');
}

function tttUpdateStatus(msg) {
  const el = document.getElementById('tttStatus');
  if (el) { el.textContent = msg; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'fadeInUp .3s ease'; }
}
function tttUpdatePlayerUI() {
  document.getElementById('tttP1')?.classList.toggle('active', ttt.current === 'X');
  document.getElementById('tttP2')?.classList.toggle('active', ttt.current === 'O');
}
function updateTTTScores() {
  document.getElementById('ttt-score-x').textContent = ttt.scores.X;
  document.getElementById('ttt-score-o').textContent = ttt.scores.O;
  document.getElementById('ttt-score-d').textContent = ttt.scores.D;
}
window.tttReset = tttInit;

/* ══════════════════════════════════════════
   GAME 2: MEMORY MATCH
   ══════════════════════════════════════════ */
const MEMORY_EMOJIS = ['🧬','⚗️','🔭','📐','🧪','🌍','⚡','🧠','🔬','🌱','💡','🎯','📚','🏆','🎲','🦋'];
let memFlipped = [], memMatched = 0, memMoves = 0, memTimer, memSeconds = 0, memBest = { moves: Infinity, time: Infinity };
let memIsLocked = false;

function memoryInit() {
  memFlipped = []; memMatched = 0; memMoves = 0; memSeconds = 0; memIsLocked = false;
  clearInterval(memTimer);
  document.getElementById('memMoves').textContent = '0';
  document.getElementById('memPairs').textContent = '0';
  document.getElementById('memTimer').textContent = '0:00';

  const emojis = [...MEMORY_EMOJIS.slice(0, 8), ...MEMORY_EMOJIS.slice(0, 8)];
  const shuffled = emojis.sort(() => Math.random() - 0.5);
  const board = document.getElementById('memoryBoard');
  board.innerHTML = '';

  shuffled.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.emoji = emoji;
    card.dataset.index = i;
    card.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-card-front"><span style="font-size:22px;color:var(--text-3)">❓</span></div>
        <div class="memory-card-back">${emoji}</div>
      </div>`;
    card.addEventListener('click', () => memFlip(card));
    board.appendChild(card);
  });

  memTimer = setInterval(() => {
    memSeconds++;
    const m = Math.floor(memSeconds / 60).toString().padStart(2,'0');
    const s = (memSeconds % 60).toString().padStart(2,'0');
    document.getElementById('memTimer').textContent = m + ':' + s;
  }, 1000);
}

function memFlip(card) {
  if (memIsLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');
  memFlipped.push(card);
  if (memFlipped.length === 2) {
    memMoves++;
    document.getElementById('memMoves').textContent = memMoves;
    memIsLocked = true;
    setTimeout(memCheckMatch, 700);
  }
}

function memCheckMatch() {
  const [a, b] = memFlipped;
  if (a.dataset.emoji === b.dataset.emoji) {
    a.classList.add('matched'); b.classList.add('matched');
    memMatched++;
    document.getElementById('memPairs').textContent = memMatched;
    if (memMatched === 8) {
      clearInterval(memTimer);
      if (memMoves < memBest.moves) { memBest.moves = memMoves; document.getElementById('memBestMoves').textContent = memMoves; }
      if (memSeconds < memBest.time) {
        memBest.time = memSeconds;
        const m = Math.floor(memSeconds/60).toString().padStart(2,'0');
        const s = (memSeconds%60).toString().padStart(2,'0');
        document.getElementById('memBestTime').textContent = m+':'+s;
      }
      spawnConfetti();
      setTimeout(() => { if(confirm('🎉 You matched all pairs! Play again?')) memoryReset(); }, 300);
    }
  } else {
    a.classList.remove('flipped'); b.classList.remove('flipped');
  }
  memFlipped = [];
  memIsLocked = false;
}

window.memoryReset = memoryInit;

/* ══════════════════════════════════════════
   GAME 3: WORD SCRAMBLE
   ══════════════════════════════════════════ */
const WS_WORDS = [
  { word: 'PHOTOSYNTHESIS', hint: 'The process plants use to convert sunlight into food using chlorophyll', category: 'Biology' },
  { word: 'MITOCHONDRIA', hint: 'The powerhouse of the cell — produces ATP energy', category: 'Biology' },
  { word: 'CHROMOSOME', hint: 'A structure in the cell nucleus that carries genetic information (DNA)', category: 'Biology' },
  { word: 'ALGEBRA', hint: 'Branch of mathematics using letters and symbols to represent numbers', category: 'Mathematics' },
  { word: 'TRIANGLE', hint: 'A polygon with exactly three sides and three angles', category: 'Mathematics' },
  { word: 'VELOCITY', hint: 'Speed in a specific direction — a vector quantity in Physics', category: 'Physics' },
  { word: 'ELECTRON', hint: 'A negatively charged subatomic particle that orbits the nucleus', category: 'Chemistry' },
  { word: 'MOLECULE', hint: 'Two or more atoms bonded together — the smallest unit of a compound', category: 'Chemistry' },
  { word: 'ECOSYSTEM', hint: 'A community of living organisms interacting with their environment', category: 'Biology' },
  { word: 'FRICTION', hint: 'The force that resists motion between two surfaces in contact', category: 'Physics' },
  { word: 'GRAMMAR', hint: 'The rules and structure of a language', category: 'English' },
  { word: 'GENETICS', hint: 'The study of heredity and the variation of inherited characteristics', category: 'Biology' },
  { word: 'OSMOSIS', hint: 'Movement of water through a semi-permeable membrane from high to low concentration', category: 'Biology' },
  { word: 'EQUATION', hint: 'A mathematical statement that two expressions are equal', category: 'Mathematics' },
  { word: 'NUCLEUS', hint: 'The control center of the cell, containing DNA', category: 'Biology' },
];

const ws = {
  words: [],
  current: 0,
  score: 0,
  streak: 0,
  timeLeft: 60,
  timerInt: null,
  answer: [],
  letters: [],
  usedIndices: []
};
let wsTimerInt = null;

function wsInit() {
  ws.words = [...WS_WORDS].sort(() => Math.random() - 0.5).slice(0, 10);
  ws.current = 0;
  ws.score = 0;
  ws.streak = 0;
  ws.timeLeft = 60;
  clearInterval(wsTimerInt);
  updateWSScores();
  wsLoadWord();
  wsTimerInt = setInterval(() => {
    ws.timeLeft--;
    document.getElementById('wsTimer').textContent = ws.timeLeft;
    if (ws.timeLeft <= 10) document.getElementById('wsTimer').style.color = 'var(--danger)';
    if (ws.timeLeft <= 0) {
      clearInterval(wsTimerInt);
      wsFeedback('⏰ Time\'s up! Final score: ' + ws.score, 'var(--warning)');
      document.querySelectorAll('.scramble-letter').forEach(l => l.style.pointerEvents = 'none');
    }
  }, 1000);
}

function wsLoadWord() {
  if (ws.current >= ws.words.length) {
    clearInterval(wsTimerInt);
    wsFeedback('🏆 All words done! Score: ' + ws.score, 'var(--accent-green)');
    spawnConfetti();
    return;
  }
  const item = ws.words[ws.current];
  ws.answer = Array(item.word.length).fill(null);
  ws.usedIndices = [];
  ws.letters = item.word.split('').sort(() => Math.random() - 0.5);
  // Ensure it's actually scrambled
  let tries = 0;
  while (ws.letters.join('') === item.word && tries++ < 20) ws.letters.sort(() => Math.random() - 0.5);

  document.getElementById('wsCategory').textContent = item.category;
  document.getElementById('wsHint').textContent = '💡 ' + item.hint;
  document.getElementById('wsProgress').textContent = `Word ${ws.current + 1} of ${ws.words.length}`;
  wsFeedback('Tap letters to spell the word!', 'var(--text-2)');
  renderWSLetters();
  renderWSAnswer();
}

function renderWSLetters() {
  const container = document.getElementById('wsLetters');
  container.innerHTML = '';
  ws.letters.forEach((letter, i) => {
    const btn = document.createElement('div');
    btn.className = 'scramble-letter' + (ws.usedIndices.includes(i) ? ' used' : '');
    btn.textContent = letter;
    btn.dataset.idx = i;
    if (!ws.usedIndices.includes(i)) {
      btn.addEventListener('click', () => wsPickLetter(i, letter, btn));
    }
    container.appendChild(btn);
  });
}

function renderWSAnswer() {
  const container = document.getElementById('wsAnswer');
  container.innerHTML = '';
  ws.answer.forEach((ch, i) => {
    const slot = document.createElement('div');
    slot.className = 'answer-slot' + (ch ? ' filled' : '');
    slot.textContent = ch || '';
    slot.dataset.pos = i;
    if (ch) slot.addEventListener('click', () => wsRemoveLetter(i));
    container.appendChild(slot);
  });
}

function wsPickLetter(letterIdx, letter, btn) {
  const firstEmpty = ws.answer.indexOf(null);
  if (firstEmpty === -1) return;
  ws.answer[firstEmpty] = letter;
  ws.usedIndices.push(letterIdx);
  btn.classList.add('used');
  btn.style.pointerEvents = 'none';
  renderWSAnswer();
}

function wsRemoveLetter(pos) {
  const letter = ws.answer[pos];
  if (!letter) return;
  // Find last usage of this letter in usedIndices
  const letterOccurrences = ws.letters.map((l, i) => ({ l, i })).filter(({l, i}) => l === letter && ws.usedIndices.includes(i));
  if (letterOccurrences.length) {
    const last = letterOccurrences[letterOccurrences.length - 1].i;
    ws.usedIndices.splice(ws.usedIndices.lastIndexOf(last), 1);
  }
  ws.answer[pos] = null;
  // Shift remaining answers left
  const filled = ws.answer.filter(c => c !== null);
  ws.answer = [...filled, ...Array(ws.words[ws.current].word.length - filled.length).fill(null)];
  renderWSLetters();
  renderWSAnswer();
}

window.wsCheck = function() {
  const word = ws.words[ws.current].word;
  const attempt = ws.answer.join('');
  if (attempt.length < word.length || ws.answer.includes(null)) {
    wsFeedback('⚠️ Not complete yet — fill all slots!', 'var(--warning)');
    return;
  }
  if (attempt === word) {
    ws.score += 10 + ws.streak * 2;
    ws.streak++;
    updateWSScores();
    wsFeedback('🎉 Correct! +' + (10 + (ws.streak-1)*2) + ' points!', 'var(--accent-green)');
    document.querySelectorAll('.answer-slot').forEach(s => s.classList.add('correct-anim'));
    setTimeout(() => { ws.current++; wsLoadWord(); }, 1200);
  } else {
    ws.streak = 0;
    document.getElementById('wsStreak').textContent = '0';
    wsFeedback('❌ Not quite! Try again or skip', 'var(--danger)');
    document.querySelectorAll('.answer-slot').forEach(s => s.classList.add('wrong-anim'));
    setTimeout(() => document.querySelectorAll('.answer-slot').forEach(s => s.classList.remove('wrong-anim')), 500);
  }
};

window.wsClear = function() {
  ws.answer = Array(ws.words[ws.current].word.length).fill(null);
  ws.usedIndices = [];
  renderWSLetters();
  renderWSAnswer();
};

window.wsSkip = function() {
  ws.streak = 0;
  document.getElementById('wsStreak').textContent = '0';
  const word = ws.words[ws.current].word;
  wsFeedback('⏭ Skipped! The word was: ' + word, 'var(--accent-orange)');
  setTimeout(() => { ws.current++; wsLoadWord(); }, 1500);
};

function wsFeedback(msg, color) {
  const el = document.getElementById('wsFeedback');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || 'var(--text-2)';
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'popIn .35s ease';
}

function updateWSScores() {
  document.getElementById('wsScore').textContent = ws.score;
  document.getElementById('wsStreak').textContent = ws.streak;
}

/* ══════════════════════════════════════════
   CONFETTI
   ══════════════════════════════════════════ */
function spawnConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  const colors = ['#6c63ff','#ff6584','#ffd93d','#6bcb77','#48dbfb','#ff9f43','#a78bfa'];
  container.innerHTML = '';
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = (-20 - Math.random() * 100) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 10) + 'px';
    piece.style.height = (6 + Math.random() * 10) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}
