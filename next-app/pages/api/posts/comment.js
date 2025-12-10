const pool = require('../../../lib/db');
const { getUserFromToken } = require('../../../lib/auth');

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).end();
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ','');
  const user = await getUserFromToken(token);
  if(!user) return res.status(401).json({ success:false, error:'unauthenticated' });
  const { postId, content } = req.body || {};
  if (!postId || !content) return res.status(400).json({ success:false, error:'missing fields' });
  try{
    const [r] = await pool.query('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [postId, user.id, content]);
    const [rows] = await pool.query('SELECT c.id, c.post_id, c.user_id, u.username, c.content, c.created_at FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [r.insertId]);
    res.json({ success:true, comment: rows[0] });
  }catch(err){ console.error('comment err', err); res.status(500).json({ success:false, error:'internal' }); }
}
