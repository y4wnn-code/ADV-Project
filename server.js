const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3300;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.redirect('/dashboard.html');
});

app.use(express.static(path.join(__dirname, 'public')));

const DB = path.join(__dirname, 'database.json');
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ users: [], posts: [] }, null, 2));
let db = JSON.parse(fs.readFileSync(DB));
const recentReactActions = {};

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

function readDB(){ return JSON.parse(fs.readFileSync(DB)); }
function writeDB(data){ fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success:false });
  const db = readDB();
  if (db.users.find(u => u.username === username)) return res.status(400).json({ success:false });
  db.users.push({ username, password, pfp: '/default-pfp.png', createdAt: new Date().toISOString() });
  writeDB(db);
  res.json({ success:true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ success:false });
  res.json({ success:true, user });
});

app.post('/upload-pfp', upload.single('pfp'), (req, res) => {
  try {
    console.log('upload-pfp: incoming', { body: req.body, file: req.file && req.file.filename });
    const username = req.body.username;
    if (!req.file) return res.status(400).json({ success:false, error: 'missing file' });
    if (!username) return res.status(400).json({ success:false, error: 'missing username' });
    const db = readDB();
    const user = db.users.find(u => u.username === username);
    if (!user) return res.status(404).json({ success:false, error: 'user not found' });
    user.pfp = '/uploads/' + req.file.filename;
    writeDB(db);
    console.log('upload-pfp: success for', username, user.pfp);
    res.json({ success:true, pfp: user.pfp });
  } catch (err) {
    console.error('upload-pfp error', err && err.stack ? err.stack : err);
    const message = err && err.message ? err.message : 'internal server error';
    res.status(500).json({ success:false, error: message });
  }
});

app.get('/api/user/:username', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({});
  res.json(user);
});

app.post('/api/user/:username/bio', (req, res) => {
  const { username } = req.params;
  console.log('bio-save: POST /api/user/%s/bio bodyKeys=%s', username, Object.keys(req.body || {}).join(','));
  const { bio, requester } = req.body || {};
  if (!requester || requester !== username) return res.status(403).json({ success:false, error:'forbidden' });
  if (typeof bio !== 'string') return res.status(400).json({ success:false, error:'bio required' });
  if (bio.length > 60) return res.status(400).json({ success:false, error:'bio too long' });
  const db = readDB();
  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(404).json({ success:false, error:'no user' });
  user.bio = bio;
  writeDB(db);
  res.json({ success:true, bio });
});

app.post('/api/user/bio', (req, res) => {
  const { username, bio, requester } = req.body || {};
  console.log('bio-save: POST /api/user/bio username=%s bodyKeys=%s', username, Object.keys(req.body || {}).join(','));
  if (!username) return res.status(400).json({ success:false, error:'missing username' });
  if (!requester || requester !== username) return res.status(403).json({ success:false, error:'forbidden' });
  if (typeof bio !== 'string') return res.status(400).json({ success:false, error:'bio required' });
  if (bio.length > 60) return res.status(400).json({ success:false, error:'bio too long' });
  const db = readDB();
  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(404).json({ success:false, error:'no user' });
  user.bio = bio;
  writeDB(db);
  res.json({ success:true, bio });
});

app.get('/api/posts', (req, res) => {
  const db = readDB();
  res.json(db.posts || []);
});

app.post('/api/posts', (req, res) => {
  const { username, title, year, content } = req.body;
  if (!username || !title || !year || !content) return res.status(400).json({ success:false });
  const db = readDB();
  const post = { id: Date.now().toString(), username, title, year, content, createdAt: new Date().toISOString(), likes:0, dislikes:0, comments:[], reactions:[] };
  db.posts.unshift(post);
  writeDB(db);
  res.json({ success:true, post });
});

app.post('/api/posts/delete', (req, res) => {
  const { id, username } = req.body;
  const db = readDB();
  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ success:false });
  if (post.username !== username) return res.status(403).json({ success:false });
  db.posts = db.posts.filter(p => p.id !== id);
  writeDB(db);
  res.json({ success:true });
});

app.post('/api/posts/react', (req, res) => {
  const { id, type, username } = req.body;
  if (!username) return res.status(400).json({ success:false, error: 'missing username' });
  if (!['like','dislike'].includes(type)) return res.status(400).json({ success:false, error:'invalid type' });
  const db = readDB();
  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ success:false });

  try{
    const key = `${username}:${id}`;
    const now = Date.now();
    if (recentReactActions[key] && (now - recentReactActions[key]) < 700) {
      console.log('react: throttled', username, id);
      return res.status(429).json({ success:false, error:'too_fast' });
    }
    recentReactActions[key] = now;
    setTimeout(()=>{ try{ delete recentReactActions[key]; }catch(e){} }, 700);
  }catch(e){ }

  post.reactions = post.reactions || [];
  const reactionsByUser = {};
  post.reactions.forEach(r => { reactionsByUser[r.username] = r; });

  const existing = reactionsByUser[username];
  if (existing) {
    if (existing.type === type) {
      delete reactionsByUser[username];
    } else {
      reactionsByUser[username] = { username, type, createdAt: new Date().toISOString() };
    }
  } else {
    reactionsByUser[username] = { username, type, createdAt: new Date().toISOString() };
  }

  post.reactions = Object.keys(reactionsByUser).map(k => reactionsByUser[k]);
  post.likes = (post.reactions.filter(r => r.type === 'like')).length;
  post.dislikes = (post.reactions.filter(r => r.type === 'dislike')).length;

  writeDB(db);
  console.log('react: user=%s post=%s type=%s totalLikes=%d totalDislikes=%d', username, id, type, post.likes, post.dislikes);
  res.json({ success:true, post });
});

app.post('/api/posts/comment', (req, res) => {
  const { postId, username, content } = req.body;
  if (!postId || !username || !content) return res.status(400).json({ success:false });
  const db = readDB();
  const post = db.posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ success:false });
  const comment = { id: Date.now().toString(), username, content, createdAt: new Date().toISOString() };
  post.comments.push(comment);
  writeDB(db);
  res.json({ success:true, post });
});

app.post('/api/posts/comment/delete', (req, res) => {
  const { postId, commentId, username } = req.body;
  const db = readDB();
  const post = db.posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ success:false });
  const comment = post.comments.find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ success:false });
  if (comment.username !== username) return res.status(403).json({ success:false });
  post.comments = post.comments.filter(c => c.id !== commentId);
  writeDB(db);
  res.json({ success:true, post });
});

app.get('/api/posts/count/:username', (req, res) => {
  const db = readDB();
  const count = (db.posts || []).filter(p => p.username === req.params.username).length;
  res.json({ count });
});

app.get('/api/notifications/:username', (req, res) => {
  const db = readDB();
  const u = req.params.username;

  const posts = db.posts || [];
  const myPosts = posts.filter(p => p.username === u);
  const comments = [];
  const reactions = [];
  myPosts.forEach(p => {
    p.comments.forEach(c => { if (c.username !== u) comments.push({ postId: p.id, title: p.title, from: c.username, content: c.content, createdAt: c.createdAt }); });
    if (Array.isArray(p.reactions) && p.reactions.length) {
      p.reactions.forEach(r => { if (r.username !== u) reactions.push({ postId: p.id, title: p.title, from: r.username, type: r.type, createdAt: r.createdAt }); });
    } else {
      if (p.likes && p.likes > 0) reactions.push({ postId: p.id, title: p.title, type: 'like', count: p.likes });
      if (p.dislikes && p.dislikes > 0) reactions.push({ postId: p.id, title: p.title, type: 'dislike', count: p.dislikes });
    }
  });
  console.log('notifications: user=%s comments=%d reactions=%d', u, comments.length, reactions.length);
  res.json({ comments, reactions });
});

app.listen(PORT, () => { console.log('Express server listening on http://localhost:' + PORT); 
});
