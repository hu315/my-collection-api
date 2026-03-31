const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// 上传配置
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// 数据库
const db = new sqlite3.Database('./data.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    title TEXT,
    url TEXT,
    type TEXT,
    category TEXT
  )`);
});

// 注册
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(`INSERT INTO users (username, password) VALUES (?,?)`,
    [username, password],
    function (err) {
      if (err) res.json({ ok: 0, msg: '用户名已存在' });
      else res.json({ ok: 1, msg: '注册成功' });
    }
  );
});

// 登录
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT id FROM users WHERE username=? AND password=?`,
    [username, password], (err, row) => {
      if (row) res.json({ ok: 1, userId: row.id });
      else res.json({ ok: 0, msg: '账号或密码错误' });
    }
  );
});

// 添加收藏
app.post('/addItem', (req, res) => {
  const { userId, title, url, type, category } = req.body;
  db.run(`INSERT INTO items (userId, title, url, type, category)
          VALUES (?,?,?,?,?)`,
    [userId, title, url, type, category],
    () => res.json({ ok: 1 })
  );
});

// 获取我的收藏
app.post('/getItems', (req, res) => {
  const { userId, category } = req.body;
  let sql = `SELECT * FROM items WHERE userId=?`;
  let params = [userId];
  if (category && category !== 'all') {
    sql += ` AND category=?`;
    params.push(category);
  }
  db.all(sql, params, (err, rows) => res.json(rows));
});

// 删除
app.post('/delItem', (req, res) => {
  const { id, userId } = req.body;
  db.run(`DELETE FROM items WHERE id=? AND userId=?`, [id, userId], () => {
    res.json({ ok: 1 });
  });
});

// 编辑
app.post('/editItem', (req, res) => {
  const { id, userId, title, url, type, category } = req.body;
  db.run(`UPDATE items
          SET title=?, url=?, type=?, category=?
          WHERE id=? AND userId=?`,
    [title, url, type, category, id, userId],
    () => res.json({ ok: 1 })
  );
});

// 获取所有分类
app.post('/getCategories', (req, res) => {
  const { userId } = req.body;
  db.all(`SELECT DISTINCT category FROM items WHERE userId=? AND category!=''`,
    [userId], (err, rows) => {
      res.json(rows.map(r => r.category));
    });
});

// 文件上传
app.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = 'http://localhost:3000/uploads/' + req.file.filename;
  res.json({ ok: 1, url: fileUrl });
});

app.listen(3000, () => console.log('服务器运行在 http://localhost:3000'));