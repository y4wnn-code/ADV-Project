const pool = require('../../../lib/db');
const { getUserFromToken } = require('../../../lib/auth');

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).end();
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ','');
  const user = await getUserFromToken(token);
  if(!user) return res.status(401).json({ success:false, error:'unauthenticated' });
  const { postId, type } = req.body || {};
  if (!postId || !['like','dislike'].includes(type)) return res.status(400).json({ success:false, error:'missing or invalid fields' });
  try{
    // upsert reaction
    await pool.query('INSERT INTO reactions (post_id, user_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE type = ?', [postId, user.id, type, type]);
    // return counts
    const [[likes]] = await pool.query("SELECT COUNT(*) as c FROM reactions WHERE post_id = ? AND type='like'", [postId]);
    const [[dislikes]] = await pool.query("SELECT COUNT(*) as c FROM reactions WHERE post_id = ? AND type='dislike'", [postId]);
    res.json({ success:true, likes: likes.c, dislikes: dislikes.c });
  }catch(err){ console.error('react err', err); res.status(500).json({ success:false, error:'internal' }); }
}
