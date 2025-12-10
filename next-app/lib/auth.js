const pool = require('./db');

async function getUserFromToken(token){
  if (!token) return null;
  const [rows] = await pool.query('SELECT s.user_id, u.username, u.display_name, u.pfp FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?', [token]);
  return rows && rows[0] ? { id: rows[0].user_id, username: rows[0].username, displayName: rows[0].display_name, pfp: rows[0].pfp } : null;
}

module.exports = { getUserFromToken };
