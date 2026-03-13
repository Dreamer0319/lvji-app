const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

let db;

async function initDB() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'lvji.db');
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, nickname TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, target_value INTEGER DEFAULT 1, target_unit TEXT DEFAULT '次', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS checkins (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, habit_id TEXT NOT NULL, date TEXT NOT NULL, completed INTEGER DEFAULT 0, value INTEGER DEFAULT 0, note TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS achievements (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  
  saveDB();
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(path.join(__dirname, 'lvji.db'), buffer);
}

const DEFAULT_HABITS = [
  { name: '运动', category: '修身', target_value: 30, target_unit: '分钟' },
  { name: '阅读', category: '修心', target_value: 60, target_unit: '分钟' },
  { name: '情绪控制', category: '修未来', target_value: 1, target_unit: '自评' }
];

app.post('/api/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();

  try {
    db.run('INSERT INTO users (id, username, password, nickname) VALUES (?, ?, ?, ?)', [userId, username, hashedPassword, nickname || username]);
    DEFAULT_HABITS.forEach(habit => {
      const habitId = uuidv4();
      db.run('INSERT INTO habits (id, user_id, name, category, target_value, target_unit) VALUES (?, ?, ?, ?, ?, ?)', [habitId, userId, habit.name, habit.category, habit.target_value, habit.target_unit]);
    });
    saveDB();
    res.json({ success: true, userId, username, nickname: nickname || username });
  } catch (err) {
    if (err.message.includes('UNIQUE')) res.status(400).json({ error: '用户名已存在' });
    else res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const result = db.exec("SELECT * FROM users WHERE username = ?", [username]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const row = result[0].values[0];
  const user = { id: row[0], username: row[1], password: row[2], nickname: row[3] };

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  res.json({ success: true, userId: user.id, username: user.username, nickname: user.nickname });
});

app.get('/api/habits/:userId', (req, res) => {
  const result = db.exec("SELECT * FROM habits WHERE user_id = ?", [req.params.userId]);
  const habits = result.length > 0 ? result[0].values.map(row => ({
    id: row[0], user_id: row[1], name: row[2], category: row[3], target_value: row[4], target_unit: row[5], created_at: row[6]
  })) : [];
  res.json(habits);
});

app.get('/api/checkins/:userId/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const result = db.exec(`SELECT c.id, c.user_id, c.habit_id, c.date, c.completed, c.value, c.note, h.name, h.category, h.target_value, h.target_unit FROM checkins c JOIN habits h ON c.habit_id = h.id WHERE c.user_id = ? AND c.date = ?`, [req.params.userId, today]);
  const checkins = result.length > 0 ? result[0].values.map(row => ({
    id: row[0], user_id: row[1], habit_id: row[2], date: row[3], completed: row[4], value: row[5], note: row[6], name: row[7], category: row[8], target_value: row[9], target_unit: row[10]
  })) : [];
  res.json(checkins);
});

app.post('/api/checkins', (req, res) => {
  const { userId, habitId, value, note } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const checkinId = uuidv4();

  const existing = db.exec('SELECT id FROM checkins WHERE user_id = ? AND habit_id = ? AND date = ?', [userId, habitId, today]);

  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run('UPDATE checkins SET completed = 1, value = ? WHERE id = ?', [value || 1, existing[0].values[0][0]]);
    saveDB();
    res.json({ success: true, checkinId: existing[0].values[0][0] });
  } else {
    db.run('INSERT INTO checkins (id, user_id, habit_id, date, completed, value, note) VALUES (?, ?, ?, ?, 1, ?, ?)', [checkinId, userId, habitId, today, value || 1, note || '']);
    saveDB();
    res.json({ success: true, checkinId });
  }
});

app.delete('/api/checkins/:checkinId', (req, res) => {
  db.run('UPDATE checkins SET completed = 0 WHERE id = ?', [req.params.checkinId]);
  saveDB();
  res.json({ success: true });
});

app.get('/api/checkins/:userId/streak', (req, res) => {
  const userId = req.params.userId;
  const habitsResult = db.exec('SELECT COUNT(*) FROM habits WHERE user_id = ?', [userId]);
  const totalHabits = habitsResult.length > 0 ? habitsResult[0].values[0][0] : 0;
  if (totalHabits === 0) return res.json({ streak: 0 });

  const datesResult = db.exec(`SELECT date, SUM(completed) as completed_count FROM checkins WHERE user_id = ? GROUP BY date ORDER BY date DESC`, [userId]);
  const dates = datesResult.length > 0 ? datesResult[0].values : [];

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date();

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayRecord = dates.find(d => d[0] === dateStr);
    
    if (dayRecord && dayRecord[1] >= totalHabits) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr === today) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  res.json({ streak });
});

app.get('/api/checkins/:userId/week', (req, res) => {
  const userId = req.params.userId;
  const habitsResult = db.exec('SELECT COUNT(*) FROM habits WHERE user_id = ?', [userId]);
  const totalHabits = habitsResult.length > 0 ? habitsResult[0].values[0][0] : 0;
  const today = new Date();
  const weekData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const result = db.exec(`SELECT SUM(completed) FROM checkins WHERE user_id = ? AND date = ?`, [userId, dateStr]);
    const completed = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] || 0 : 0;

    weekData.push({
      date: dateStr,
      day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      completed: completed,
      total: totalHabits,
      done: completed >= totalHabits
    });
  }

  res.json(weekData);
});

app.get('/api/checkins/:userId/month', (req, res) => {
  const userId = req.params.userId;
  const habitsResult = db.exec('SELECT COUNT(*) FROM habits WHERE user_id = ?', [userId]);
  const totalHabits = habitsResult.length > 0 ? habitsResult[0].values[0][0] : 0;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  let completedDays = 0;
  
  for (let d = 1; d <= today.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split('T')[0];
    
    const result = db.exec(`SELECT SUM(completed) FROM checkins WHERE user_id = ? AND date = ?`, [userId, dateStr]);
    const completed = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] || 0 : 0;

    if (completed >= totalHabits) {
      completedDays++;
    }
  }

  res.json({ completedDays, totalDays: today.getDate(), daysInMonth: new Date(year, month + 1, 0).getDate() });
});

initDB().then(() => {
  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath));
  
  app.listen(PORT, HOST, () => {
    console.log(`律己服务运行在端口 ${PORT}`);
  });
});