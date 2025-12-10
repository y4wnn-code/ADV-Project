import nextConnect from 'next-connect';
import multer from 'multer';
const path = require('path');
const fs = require('fs');
const pool = require('../../../lib/db');
const { getUserFromToken } = require('../../../lib/auth');

const uploadDir = path.join(process.cwd(), 'next-app', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_'))
});

const upload = multer({ storage });

export const config = { api: { bodyParser: false } };

const handler = nextConnect();
handler.use(upload.single('pfp'));

handler.post(async (req, res) => {
  try{
    const token = (req.headers.authorization || '').replace('Bearer ','');
    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ success:false, error:'unauthenticated' });
    const file = req.file;
    if (!file) return res.status(400).json({ success:false, error: 'missing file' });
    const url = '/uploads/' + file.filename;
    await pool.query('UPDATE users SET pfp = ? WHERE id = ?', [url, user.id]);
    await pool.query('INSERT INTO media (user_id, filename, url) VALUES (?, ?, ?)', [user.id, file.originalname, url]);
    res.json({ success:true, url });
  }catch(err){
    // log stack and return a clearer message for debugging during development
    console.error('upload pfp err', err && err.stack ? err.stack : err);
    const message = err && err.message ? err.message : 'internal';
    res.status(500).json({ success:false, error: message });
  }
});

export default handler;
