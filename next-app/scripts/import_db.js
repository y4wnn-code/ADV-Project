const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const pool = require('../lib/db');

async function main() {
  const dbPath = path.join(process.cwd(), '..', 'database.json');
  if (!fs.existsSync(dbPath)) {
    console.error('database.json not found at', dbPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(raw);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert users (skip if exists)
    const userIdMap = {}; // username -> id
    for (const u of data.users || []) {
      const username = u.username;
      const password = u.password || 'password';
      const hashed = await bcrypt.hash(password, 10);
      const pfp = u.pfp || '/default-pfp.png';
      // Check existing
      const [rows] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
      if (rows.length > 0) {
        userIdMap[username] = rows[0].id;
        continue;
      }
      const [res] = await conn.query(
        'INSERT INTO users (username, password, pfp, created_at) VALUES (?, ?, ?, ?)',
        [username, hashed, pfp, u.createdAt || new Date()]
      );
      userIdMap[username] = res.insertId;
    }

    // Insert posts
    const postIdMap = {}; // original id -> new id
    for (const p of data.posts || []) {
      const author = p.username;
      const user_id = userIdMap[author];
      if (!user_id) {
        console.warn('Skipping post with unknown user', author);
        continue;
      }
      // If post id numeric, attempt to insert with that id (use INSERT IGNORE pattern by checking existence)
      const requestedId = Number(p.id) || null;
      if (requestedId) {
        const [exist] = await conn.query('SELECT id FROM posts WHERE id = ?', [requestedId]);
        if (exist.length > 0) {
          postIdMap[p.id] = exist[0].id;
          continue;
        }
        const [res] = await conn.query(
          'INSERT INTO posts (id, user_id, title, year, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [requestedId, user_id, p.title || '', p.year || '', p.content || '', p.createdAt || new Date()]
        );
        postIdMap[p.id] = requestedId;
      } else {
        const [res] = await conn.query(
          'INSERT INTO posts (user_id, title, year, content, created_at) VALUES (?, ?, ?, ?, ?)',
          [user_id, p.title || '', p.year || '', p.content || '', p.createdAt || new Date()]
        );
        postIdMap[p.id] = res.insertId;
      }
    }

    // Insert reactions
    for (const p of data.posts || []) {
      const pid = postIdMap[p.id];
      if (!pid) continue;
      for (const r of p.reactions || []) {
        const username = r.username;
        const type = r.type === 'dislike' ? 'dislike' : 'like';
        const uid = userIdMap[username];
        if (!uid) {
          console.warn('Skipping reaction for unknown user', username);
          continue;
        }
        try {
          await conn.query(
            'INSERT INTO reactions (post_id, user_id, type, created_at) VALUES (?, ?, ?, ?)',
            [pid, uid, type, r.createdAt || new Date()]
          );
        } catch (err) {
          // ignore duplicates / constraint errors
          // console.warn('Could not insert reaction', err.message);
        }
      }
    }

    await conn.commit();
    console.log('Import complete. Users:', Object.keys(userIdMap).length, 'Posts:', Object.keys(postIdMap).length);
  } catch (err) {
    await conn.rollback();
    console.error('Import failed:', err);
    process.exit(1);
  } finally {
    conn.release();
    pool.end();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
