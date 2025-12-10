const bcrypt = require('bcryptjs');
const pool = require('../../../lib/db');

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password, displayName } = req.body || {};
  if (!username || !password) return res.status(400).json({ success:false, error:'username and password are required' });
  try{
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length) return res.status(400).json({ success:false, error:'username taken' });
    const hashed = await bcrypt.hash(password, 10);
    const [r] = await pool.query('INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)', [username, hashed, displayName||null]);
    const userId = r.insertId;
    res.json({ success:true, user: { id: userId, username } });
  }catch(err){
    console.error('register error', err);
    res.status(500).json({ success:false, error:'internal' });
  }
}
