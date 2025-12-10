const pool = require('../../../lib/db');
const { getUserFromToken } = require('../../../lib/auth');

export default async function handler(req, res){
  if (req.method === 'GET'){
    try{
      // support fetching only the authenticated user's posts: ?mine=1
      if (req.query && req.query.mine) {
        const token = req.headers.authorization && req.headers.authorization.replace('Bearer ','');
        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ success:false, error:'unauthenticated' });
        const [posts] = await pool.query(`
          SELECT p.id, p.title, p.year, p.content, p.created_at, u.username, u.display_name, u.pfp,
            (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type='like') as likes,
            (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type='dislike') as dislikes
          FROM posts p JOIN users u ON p.user_id = u.id
          WHERE p.user_id = ?
          ORDER BY p.created_at DESC
        `, [user.id]);
        const [comments] = await pool.query('SELECT c.id, c.post_id, c.user_id, u.username, c.content, c.created_at FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id IN (SELECT id FROM posts WHERE user_id = ?)', [user.id]);
        const map = {};
        for(const c of comments){ map[c.post_id] = map[c.post_id] || []; map[c.post_id].push(c); }
        return res.json(posts.map(p => ({ ...p, comments: map[p.id] || [] })));
      }
      // fetch posts with author and aggregated counts
      const [posts] = await pool.query(`
        SELECT p.id, p.title, p.year, p.content, p.created_at, u.username, u.display_name, u.pfp,
          (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type='like') as likes,
          (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type='dislike') as dislikes
        FROM posts p JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `);
      // fetch comments grouped per post
      const [comments] = await pool.query('SELECT c.id, c.post_id, c.user_id, u.username, c.content, c.created_at FROM comments c JOIN users u ON c.user_id = u.id');
      const map = {};
      for(const c of comments){ map[c.post_id] = map[c.post_id] || []; map[c.post_id].push(c); }
      const out = posts.map(p => ({ ...p, comments: map[p.id] || [] }));
      return res.json(out);
    }catch(err){ console.error('posts GET err', err); return res.status(500).end(); }
  }

  if (req.method === 'POST'){
    const token = req.headers.authorization && req.headers.authorization.replace('Bearer ','');
    const user = await getUserFromToken(token);
    if(!user) return res.status(401).json({ success:false, error:'unauthenticated' });
    const { title, year, content } = req.body || {};
    if (!title || !year || !content) return res.status(400).json({ success:false, error:'missing fields' });
    try{
      const [r] = await pool.query('INSERT INTO posts (user_id, title, year, content) VALUES (?, ?, ?, ?)', [user.id, title, year, content]);
      const id = r.insertId;
      const [rows] = await pool.query('SELECT p.*, u.username, u.display_name, u.pfp FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [id]);
      res.json({ success:true, post: rows[0] });
    }catch(err){ console.error('posts POST err', err); res.status(500).json({ success:false, error:'internal' }); }
  }

  return res.status(405).end();
}
