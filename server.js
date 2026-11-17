'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const express = require('express');
const XLSX = require('xlsx');
const { Server } = require('socket.io');

const config = require('./src/config');
const clock = require('./src/clock');
const { loadQuestions } = require('./src/questions');
const { createGame } = require('./src/gameEngine');
const { attachSocket } = require('./src/socket');

const questions = loadQuestions();
if (questions.length !== config.QUESTION_COUNT) {
  console.warn(
    `[cảnh báo] questions.json có ${questions.length} câu, luật chơi chính thức là ${config.QUESTION_COUNT} câu.`
  );
}
if (!config.ADMIN_PASSWORD) {
  console.warn('[cảnh báo] Chưa đặt ADMIN_PASSWORD: không ai đăng nhập MC được.');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // Điện thoại hay đổi mạng: cho phép khôi phục kết nối ngắn mà không mất phòng.
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  pingInterval: 10000,
  pingTimeout: 10000,
});

const out = {
  all: (event, data) => io.emit(event, data),
  room: (room, event, data) => io.to(room).emit(event, data),
  player: (id, event, data) => io.to('p:' + id).emit(event, data),
};

// Lưu snapshot (gộp nhiều lần gọi trong 1 giây thành 1 lần ghi)
const snapshotPath = path.resolve(config.SNAPSHOT_FILE);
let saveTimer = null;
const hooks = {
  persist() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      fs.writeFile(snapshotPath, JSON.stringify(engine.serialize()), () => {});
    }, 1000);
  },
};

const engine = createGame({ questions, config, clock, out, hooks });

try {
  if (fs.existsSync(snapshotPath) && engine.restore(JSON.parse(fs.readFileSync(snapshotPath, 'utf8')))) {
    console.log('Đã khôi phục người chơi và điểm từ snapshot.');
  }
} catch (e) {
  console.warn('Không đọc được snapshot, bắt đầu mới:', e.message);
}

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Tải Excel có xác thực bằng mật khẩu quản trị (nên triển khai qua HTTPS).
app.get('/admin/results.xlsx', (req, res) => {
  const crypto = require('node:crypto');
  const supplied = req.get('x-admin-password') || '';
  const expected = config.ADMIN_PASSWORD || '';
  const a = crypto.createHash('sha256').update(String(supplied)).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  if (!expected || !crypto.timingSafeEqual(a, b)) return res.status(401).send('Không có quyền tải file.');
  const data = engine.serialize();
  const summary = data.players.map((p) => ({
    'Họ tên': p.name, 'Điểm': p.score, 'Số câu đúng': p.correctCount,
    'Thời gian trả lời đúng (ms)': p.totalTimeMs
  }));
  summary.sort((a,b) => b['Điểm']-a['Điểm'] || a['Thời gian trả lời đúng (ms)']-b['Thời gian trả lời đúng (ms)']);
  summary.forEach((p,i) => p['Xếp hạng'] = i+1);
  const detail = [];
  for (const p of data.players) for (const h of (p.history || [])) {
    const q = questions[h.qIndex];
    detail.push({
      'Họ tên': p.name, 'Câu': h.qIndex+1, 'Mức độ': q.level || '',
      'Nội dung câu hỏi': q.text,
      'Đáp án đã chọn': h.choice == null ? 'Bỏ qua' : q.options[h.choice],
      'Đáp án đúng': q.options[q.answer],
      'Kết quả': h.correct ? 'Đúng' : 'Sai/Không trả lời',
      'Điểm đạt': h.gained, 'Thời gian (ms)': h.timeMs == null ? '' : h.timeMs
    });
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Tong hop');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detail), 'Chi tiet');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  const exportDir = path.join(__dirname, 'exports');
  fs.mkdirSync(exportDir, { recursive: true });
  fs.writeFileSync(path.join(exportDir, 'ket-qua-hoa-hoc-10.xlsx'), buffer);
  res.setHeader('Content-Disposition', 'attachment; filename="ket-qua-hoa-hoc-10.xlsx"');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buffer);
});


attachSocket(io, engine, { config, clock });

server.listen(config.PORT, () => console.log('Game chạy tại cổng ' + config.PORT));
