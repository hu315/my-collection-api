const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// 初始化数据库（注意：Vercel 上 SQLite 无法持久化数据，仅用于临时测试）
const db = new sqlite3.Database('./data.db', (err) => {
  if (err) console.error('数据库连接失败:', err);
});

// 示例接口，保留你的注册/登录逻辑即可
app.post('/register', (req, res) => {
  res.json({ message: '注册接口已就绪' });
});

// 关键：监听 Vercel 分配的端口
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
});

// 导出 app，让 Vercel 识别为无服务器函数
module.exports = app;