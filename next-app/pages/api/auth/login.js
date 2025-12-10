const bcrypt = require('bcryptjs');
const pool = require('../../../lib/db');
const crypto = require('crypto');

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ success:false, error:'username and password required' });
  try{
    const [rows] = await pool.query('SELECT id, password, display_name, pfp FROM users WHERE username = ?', [username]);
    const user = rows && rows[0];
    if (!user) return res.status(400).json({ success:false, error:'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ success:false, error:'invalid credentials' });
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [user.id, token]);
    res.json({ success:true, token, user: { id: user.id, username, display_name: user.display_name, pfp: user.pfp } });
  }catch(err){
    console.error('login error', err);
    res.status(500).json({ success:false, error:'internal' });
  }
}
