const pool = require('../../../lib/db');
const { getUserFromToken } = require('../../../lib/auth');

export default async function handler(req, res){
  if (req.method !== 'GET') return res.status(405).end();
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ','');
  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ success:false, error:'unauthenticated' });
  try{
    // fetch comments by others on this user's posts
    const [comments] = await pool.query(`
      SELECT c.id, c.post_id, c.user_id, u.username as from_user, c.content, c.created_at, p.title
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE p.user_id = ? AND c.user_id <> ?
      ORDER BY c.created_at DESC
      LIMIT 100
    `, [user.id, user.id]);

    // fetch reactions by others on this user's posts
    const [reactions] = await pool.query(`
      SELECT r.id, r.post_id, r.user_id, u.username as from_user, r.type, r.created_at, p.title
      FROM reactions r
      JOIN posts p ON r.post_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE p.user_id = ? AND r.user_id <> ?
      ORDER BY r.created_at DESC
      LIMIT 100
    `, [user.id, user.id]);

    return res.json({ success:true, comments, reactions });
  }catch(err){ console.error('notifications err', err); res.status(500).json({ success:false, error:'internal' }); }
}
